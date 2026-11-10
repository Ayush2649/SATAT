import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserKey } from "@/lib/auth/userKey";
import { callTextWithFallback } from "@/lib/ai/groq";
import { buildOrbitContext } from "@/lib/orbit/contextEngine";
import { inferContextRequirements } from "@/lib/orbit/contextRequirement";
import { resolveTemporalReference } from "@/lib/orbit/temporalResolver";
import { serializeOrbitContext } from "@/lib/orbit/contextSerializer";
import { TEXT_FALLBACK, MAX_TOKENS } from "@/lib/ai/models";
import {
  classifyOrbitIntentDetailed,
  getSimpleConversationReply,
} from "@/lib/orbit/intentClassifier";
import {
  parseMutationIntent,
  parseMutationIntents,
  executeMutation,
  generateContextualSuggestions,
  ClarificationResult,
} from "@/lib/orbit/mutationEngine";
import type { OrbitEntityContext, OrbitActionExecuted, OrbitSuggestedAction } from "@/types/orbit";

function formatDetailedWorkoutSessions(workouts: any[]): string {
  if (!workouts || workouts.length === 0) {
    return "No workout sessions recorded in this period.";
  }
  return workouts.map((s: any) => {
    const title = s.summary || s.routineTitle || 'Workout';
    const durPart = s.durationMinutes > 0 ? `${s.durationMinutes}m` : '';
    const calPart = s.caloriesBurned ? `~${s.caloriesBurned} kcal` : '';
    const metaParts = [durPart, calPart].filter(Boolean).join(', ');
    const metaStr = metaParts ? ` (${metaParts})` : '';

    const exParts: string[] = [];
    if (Array.isArray(s.exercises)) {
      for (const e of s.exercises) {
        if (!e?.name) continue;
        let setStr = "";
        if (Array.isArray(e.sets) && e.sets.length > 0) {
          const first = e.sets[0];
          const allSame = e.sets.length > 1 && e.sets.every((st: any) =>
            st && typeof st === "object" &&
            st.reps === first.reps && st.weight === first.weight && st.unit === first.unit
          );
          if (allSame) {
            const wtPart = first.weight !== undefined && first.weight !== null ? `@${first.weight}${first.unit || 'kg'}` : '';
            setStr = `${e.sets.length}x${first.reps || 0}${wtPart}`;
          } else {
            setStr = e.sets.map((st: any) => {
              if (typeof st === "string") return st;
              if (!st) return "";
              const wt = st.weight !== undefined && st.weight !== null ? `@${st.weight}${st.unit || 'kg'}` : '';
              return `${st.reps || 0}${wt}`;
            }).filter(Boolean).join(', ');
          }
        }
        exParts.push(`${e.name}${setStr ? ` ${setStr}` : ''}`);
      }
    }

    if (Array.isArray(s.cardioLogs) && s.cardioLogs.length > 0) {
      for (const c of s.cardioLogs) {
        if (!c?.activity) continue;
        const details = [
          c.durationMinutes ? `${c.durationMinutes}m` : '',
          c.distanceKm ? `${c.distanceKm}km` : '',
          c.caloriesBurned ? `${c.caloriesBurned}kcal` : ''
        ].filter(Boolean).join(', ');
        exParts.push(`Cardio: ${c.activity}${details ? ` (${details})` : ''}`);
      }
    }

    return `${s.date || 'Undated'} | ${title}${metaStr}: ${exParts.length > 0 ? exParts.join(', ') : 'Completed session'}`;
  }).join('\n');
}

function formatDailyNutritionSummary(meals: any[]): string {
  if (!meals || meals.length === 0) {
    return "No meals logged in this period.";
  }
  const byDate: Record<string, { cal: number; p: number; c: number; f: number; names: string[] }> = {};
  for (const m of meals) {
    const d = m.date || "Unknown";
    if (!byDate[d]) byDate[d] = { cal: 0, p: 0, c: 0, f: 0, names: [] };
    byDate[d].cal += m.macros?.calories || 0;
    byDate[d].p += m.macros?.proteinG || 0;
    byDate[d].c += m.macros?.carbsG || 0;
    byDate[d].f += m.macros?.fatG || 0;
    if (m.name) byDate[d].names.push(m.name);
  }

  const sortedDates = Object.keys(byDate).sort().reverse();
  return sortedDates.map((d) => {
    const data = byDate[d];
    const mealCount = data.names.length;
    const namesStr = data.names.length > 0 ? data.names.join(', ') : 'logged meals';
    return `${d}: ${Math.round(data.cal)} kcal, ${Math.round(data.p)}g P, ${Math.round(data.c)}g C, ${Math.round(data.f)}g F [${mealCount} meal${mealCount > 1 ? 's' : ''}: ${namesStr}]`;
  }).join('\n');
}

async function callGeminiTextFallback(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || null;
  } catch (e: any) {
    console.warn("[aria] Gemini fallback failed:", e?.message);
    return null;
  }
}

function makeOrbitResponse(opts: {
  message: string;
  reply?: string;
  action_executed: OrbitActionExecuted | OrbitActionExecuted[] | null;
  actions_executed?: OrbitActionExecuted[];
  suggested_actions?: OrbitSuggestedAction[];
  activeContext?: OrbitEntityContext;
}) {
  const replyText = opts.reply ?? opts.message;
  return NextResponse.json({
    message: opts.message,
    reply: replyText,
    action_executed: opts.action_executed ?? null,
    ...(opts.actions_executed ? { actions_executed: opts.actions_executed } : {}),
    suggested_actions: opts.suggested_actions ?? [],
    activeContext: opts.activeContext,
  });
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const session = await getServerSession(authOptions);
  const tAuth = Date.now();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = getUserKey(session) || (session.user as any)?.id || session.user?.email || "";
  const userName = session.user?.name?.split(" ")[0] ?? "there";
  const reqBody = await req.json();
  const {
    message,
    messages,
    mode,
    clientDate: rawClientDate,
    activeContext: reqActiveContext,
    dietContext,
    workoutContext,
    taskContext,
  } = reqBody;

  const effectiveDate =
    typeof rawClientDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawClientDate)
      ? rawClientDate
      : undefined;

  // Determine required context based on user messages (never assistant responses)
  const rawUserMessages = (messages || []).filter((m: any) => m.role === "user");
  const userMessages =
    rawUserMessages.length > 0
      ? rawUserMessages
      : message
      ? [{ role: "user", content: message }]
      : [];
  const latestUserMessage = message || userMessages[userMessages.length - 1]?.content || "";

  // 1. Fast-path: Deterministic classification for simple greetings & pleasantries.
  const classifiedIntent = classifyOrbitIntentDetailed(latestUserMessage);
  const tIntent = Date.now();

  let currentActiveContext: OrbitEntityContext = {
    ...(reqActiveContext || {}),
  };

  const allUserText = userMessages.map((m: any) => m.content).join(" ");

  // Recover any dropped entities (e.g. meal slot, target exercise) from prior user turns
  if (!currentActiveContext.activeMealSlot) {
    for (let i = (messages || []).length - 1; i >= 0; i--) {
      if (messages[i]?.role !== "user") continue;
      const content = (messages[i]?.content || "").toLowerCase();
      if (/\bdinner\b/.test(content)) {
        currentActiveContext.activeMealSlot = "dinner";
        break;
      } else if (/\blunch\b/.test(content)) {
        currentActiveContext.activeMealSlot = "lunch";
        break;
      } else if (/\bbreakfast\b/.test(content)) {
        currentActiveContext.activeMealSlot = "breakfast";
        break;
      } else if (/\bsnack\b/.test(content)) {
        currentActiveContext.activeMealSlot = "snack";
        break;
      }
    }
  }

  if (!currentActiveContext.activeExerciseName) {
    for (let i = (messages || []).length - 1; i >= 0; i--) {
      if (messages[i]?.role !== "user") continue;
      const content = (messages[i]?.content || "").toLowerCase();
      const exMatch = content.match(
        /\b(incline dumbbell press|dumbbell press|bench press|barbell squat|squat|deadlift|bicep curl|lat pulldown)\b/i
      );
      if (exMatch) {
        currentActiveContext.activeExerciseName = exMatch[0].replace(/\b\w/g, (c: string) => c.toUpperCase());
        break;
      }
    }
  }

  if (classifiedIntent.intent === "SIMPLE_CONVERSATION") {
    const greetingType = classifiedIntent.greetingType ?? "general";
    const reply = getSimpleConversationReply(greetingType, userName);
    console.info(
      JSON.stringify({
        type: "aria_timing",
        intent: "SIMPLE_CONVERSATION",
        greetingType,
        authMs: tAuth - t0,
        intentMs: tIntent - tAuth,
        totalMs: Date.now() - t0,
      })
    );
    return makeOrbitResponse({
      message: reply,
      reply,
      action_executed: null,
      suggested_actions: [],
      activeContext: currentActiveContext,
    });
  }

  // ── Deterministic Mutation Execution Engine ──────────────────────────────────
  const parsedMutations = parseMutationIntents(
    latestUserMessage,
    currentActiveContext,
    allUserText,
    effectiveDate
  );
  const parsedMutation = parsedMutations[0] || null;
  const executedActions: OrbitActionExecuted[] = [];
  const executedNotes: string[] = [];
  const failedNotes: string[] = [];
  const pendingClarifications: ClarificationResult[] = [];

  if (parsedMutations.length > 0 && userId) {
    for (const mutation of parsedMutations) {
      if (mutation.type === "CLARIFICATION_NEEDED") {
        pendingClarifications.push(mutation as ClarificationResult);
        continue;
      }

      const mutResult = await executeMutation(
        userId,
        mutation as any,
        currentActiveContext,
        effectiveDate
      );
      if (mutResult.actionExecuted) {
        executedActions.push(mutResult.actionExecuted);
      }
      currentActiveContext = mutResult.updatedContext;

      if (mutResult.actionExecuted?.status === "success") {
        executedNotes.push(mutResult.executedNote);
      } else if (mutResult.actionExecuted?.status === "failed") {
        failedNotes.push(
          mutResult.executedNote ||
          `Unable to save your ${mutResult.actionExecuted.domain}: ${mutResult.actionExecuted.details?.error || "Database error"}.`
        );
      }
    }
  }

  // If clarification needed and no actions executed, return clarification immediately
  if (pendingClarifications.length > 0 && executedActions.length === 0) {
    const clar = pendingClarifications[0];
    return makeOrbitResponse({
      message: clar.clarificationMessage,
      reply: clar.clarificationMessage,
      action_executed: null,
      suggested_actions: clar.suggestedActions,
      activeContext: clar.updatedContext,
    });
  }

  const successfulActions = executedActions.filter((a) => a.status === "success");
  const failedActions = executedActions.filter((a) => a.status === "failed");

  // If all executed actions failed, return failure response immediately
  if (executedActions.length > 0 && successfulActions.length === 0) {
    const failMsg = failedNotes.join(" ") || "Unable to save your updates. Please try again.";
    const firstFailed = failedActions[0];
    return makeOrbitResponse({
      message: failMsg,
      reply: failMsg,
      action_executed: executedActions.length === 1 ? executedActions[0] : (executedActions as any),
      actions_executed: executedActions.length > 1 ? executedActions : undefined,
      suggested_actions: [
        { label: "Retry", prompt: `Retry saving the ${firstFailed?.domain || "update"}` },
      ],
      activeContext: currentActiveContext,
    });
  }

  const actionExecuted: OrbitActionExecuted | null = executedActions[0] || null;
  const executedNote = executedNotes.join(" | ");

  const primaryActionExecuted: OrbitActionExecuted | OrbitActionExecuted[] | null =
    executedActions.length > 0
      ? executedActions.length === 1
        ? executedActions[0]
        : executedActions
      : null;

  // 2. Infer requirements primarily from the latest user message
  const latestReq = inferContextRequirements(latestUserMessage);
  const allUserReq = inferContextRequirements(allUserText);

  // Merge inferred domains, add mode‑specific defaults, and resolve temporal scope
  const mergedDomains = new Set([...latestReq.domains, ...allUserReq.domains]);
  for (const act of executedActions) {
    if (act.domain === "workouts") mergedDomains.add("workouts");
    if (act.domain === "meals") {
      mergedDomains.add("meals");
      mergedDomains.add("nutrition");
    }
    if (act.domain === "tasks") mergedDomains.add("tasks");
    if (act.domain === "rituals") mergedDomains.add("habits");
    if (act.domain === "sprints") {
      mergedDomains.add("tasks");
      mergedDomains.add("habits");
    }
  }
  if (
    mode === "workout" ||
    parsedMutation?.domain === "workouts" ||
    parsedMutation?.type === "UPDATE_WORKOUT" ||
    parsedMutation?.type === "UPDATE_WORKOUT_SET" ||
    parsedMutation?.type === "START_WORKOUT" ||
    parsedMutation?.type === "ADD_EXERCISE" ||
    parsedMutation?.type === "DELETE_EXERCISE" ||
    parsedMutation?.type === "COMPLETE_WORKOUT"
  ) {
    mergedDomains.add("workouts");
  }
  if (
    mode === "diet" ||
    parsedMutation?.domain === "meals" ||
    parsedMutation?.type === "UPSERT_MEAL" ||
    parsedMutation?.type === "MODIFY_MEAL" ||
    parsedMutation?.type === "DELETE_MEAL"
  ) {
    mergedDomains.add("meals");
    mergedDomains.add("nutrition");
  }
  if (
    mode === "tasks" ||
    parsedMutation?.domain === "tasks" ||
    parsedMutation?.type === "MODIFY_PLAN" ||
    parsedMutation?.type === "CREATE_TASK" ||
    parsedMutation?.type === "RESCHEDULE_TASK" ||
    parsedMutation?.type === "COMPLETE_TASK" ||
    parsedMutation?.type === "DELETE_TASK"
  ) {
    mergedDomains.add("tasks");
  }
  if (parsedMutation?.domain === "rituals" || parsedMutation?.type === "LOG_RITUAL") {
    mergedDomains.add("habits");
  }
  if (parsedMutation?.domain === "sprints" || parsedMutation?.type === "UPDATE_SPRINT_PROGRESS") {
    mergedDomains.add("tasks");
    mergedDomains.add("habits");
  }

  // Strict Domain Pruning: Prevent fetching irrelevant categories
  const lowerLatest = latestUserMessage.toLowerCase();
  const hasWorkoutFocus = (
    mode === "workout" ||
    executedActions.some((a) => a.domain === "workouts") ||
    parsedMutation?.domain === "workouts" ||
    parsedMutation?.type === "UPDATE_WORKOUT" ||
    parsedMutation?.type === "UPDATE_WORKOUT_SET" ||
    /\b(workouts?|training|gym|exercises?|splits?|sets?|reps?|bench|squats?|deadlifts?|shoulders?|arms?|legs?|push|pull|cardio)\b/i.test(lowerLatest)
  );
  const hasDietFocus = (
    mode === "diet" ||
    executedActions.some((a) => a.domain === "meals") ||
    parsedMutation?.domain === "meals" ||
    parsedMutation?.type === "UPSERT_MEAL" ||
    parsedMutation?.type === "MODIFY_MEAL" ||
    parsedMutation?.type === "DELETE_MEAL" ||
    /\b(meals?|nutrition|diet|calories|protein|carbs?|fats?|food|eat|eating|ate|breakfast|lunch|dinner|snacks?|macro|macros|protein\s+gap)\b/i.test(lowerLatest)
  );
  const hasTaskFocus = (
    mode === "tasks" ||
    executedActions.some((a) => a.domain === "tasks") ||
    parsedMutation?.domain === "tasks" ||
    parsedMutation?.type === "MODIFY_PLAN" ||
    parsedMutation?.type === "CREATE_TASK" ||
    parsedMutation?.type === "RESCHEDULE_TASK" ||
    parsedMutation?.type === "COMPLETE_TASK" ||
    parsedMutation?.type === "DELETE_TASK" ||
    /\b(tasks?|todos?|projects?|deep\s*work|priorit(y|ies|ize)|focus\s*blocks?|planning|plans?|cadence)\b/i.test(lowerLatest)
  );
  const hasRitualFocus = (
    executedActions.some((a) => a.domain === "rituals") ||
    parsedMutation?.domain === "rituals" ||
    parsedMutation?.type === "LOG_RITUAL" ||
    /\b(water|hydration|steps?|walk|journal|reading|habits?|rituals?)\b/i.test(lowerLatest)
  );
  const hasSprintFocus = (
    executedActions.some((a) => a.domain === "sprints") ||
    parsedMutation?.domain === "sprints" ||
    parsedMutation?.type === "UPDATE_SPRINT_PROGRESS" ||
    /\b(sprint|placement|leetcode|dsa|neetcode|problems?|solved)\b/i.test(lowerLatest)
  );

  let finalDomains: any[];
  if (mode === "workout" || (hasWorkoutFocus && !hasDietFocus && !hasTaskFocus && !hasRitualFocus && !hasSprintFocus)) {
    finalDomains = Array.from(mergedDomains).filter((d) => ["workouts", "profile", "goals"].includes(d));
    if (!finalDomains.includes("workouts")) finalDomains.push("workouts");
  } else if (mode === "diet" || (hasDietFocus && !hasWorkoutFocus && !hasTaskFocus && !hasRitualFocus && !hasSprintFocus)) {
    finalDomains = Array.from(mergedDomains).filter((d) => ["nutrition", "meals", "profile", "goals"].includes(d));
    if (!finalDomains.includes("meals")) finalDomains.push("meals");
    if (!finalDomains.includes("nutrition")) finalDomains.push("nutrition");
  } else if (mode === "tasks" || (hasTaskFocus && !hasWorkoutFocus && !hasDietFocus && !hasRitualFocus && !hasSprintFocus)) {
    finalDomains = Array.from(mergedDomains).filter((d) => ["tasks", "profile"].includes(d));
    if (!finalDomains.includes("tasks")) finalDomains.push("tasks");
  } else if (hasRitualFocus && !hasWorkoutFocus && !hasDietFocus && !hasTaskFocus && !hasSprintFocus) {
    finalDomains = Array.from(mergedDomains).filter((d) => ["habits", "profile"].includes(d));
    if (!finalDomains.includes("habits")) finalDomains.push("habits");
  } else if (hasSprintFocus && !hasWorkoutFocus && !hasDietFocus) {
    finalDomains = Array.from(mergedDomains).filter((d) => ["tasks", "habits", "profile"].includes(d));
    if (!finalDomains.includes("tasks")) finalDomains.push("tasks");
  } else {
    finalDomains = Array.from(mergedDomains);
  }

  const requirements = {
    domains: finalDomains,
    temporalScope: latestReq.temporalScope ?? allUserReq.temporalScope,
  };
  const tTemporal = Date.now();

  // 3. Category context retrieval
  const tContextStart = Date.now();
  const orbitContext = await buildOrbitContext(requirements);
  const tContextEnd = Date.now();

  // 4. Assembly & serialization
  const tAssemblyStart = Date.now();
  const serializedContext = serializeOrbitContext(orbitContext);
  const contextJson = JSON.stringify(serializedContext);
  const tAssemblyEnd = Date.now();

  const rawTz = orbitContext?.preferences?.timezone || "Asia/Kolkata";
  let userTimezone = "Asia/Kolkata";
  try {
    new Intl.DateTimeFormat("en-IN", { timeZone: rawTz });
    userTimezone = rawTz;
  } catch {
    userTimezone = "Asia/Kolkata";
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: userTimezone,
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: userTimezone,
  });

  let system = `You are Orbit — the personal AI coach built into SATAT.
You are talking to ${userName}.
TODAY is ${dateStr}, ${timeStr} IST. Always use this when answering date/time questions.

You are deeply knowledgeable about:
- Strength training, progressive overload, exercise science, injury prevention
- Nutrition, Indian cuisine macros, macro tracking, meal planning, weight management
- Productivity, habits, task prioritization, time management, focus
- How fitness, nutrition, and productivity interconnect

Personality: You are direct, specific, encouraging, and practical — like a coach who actually knows the user's data.
Never give vague generic advice. Always reference the user's REAL data when available.
• If the requested information exists in the retrieved context, answer using that concrete data.
• If the information is not present, explicitly say that the record is unavailable (e.g., "I don't see a meal logged for yesterday night.").
• Do not fabricate meals, calories, workouts, tasks, habits, goals, or preferences. Do not mention Firebase, embeddings, RAG, or internal IDs.
Format: use **bold** for key points and - for bullet lists. Keep responses under 200 words unless the user asks for more detail.
You are deeply familiar with Indian food, Indian lifestyle, Indian portion sizes, and Indian fitness culture.
NEVER say you don't know today's date — you always know it.`;

  // Entity Continuity & State Modification Context
  system += `\n\n=== CONVERSATIONAL CONTINUITY STATE ===
Active Meal Slot: ${currentActiveContext.activeMealSlot || "None"}
Active Exercise: ${currentActiveContext.activeExerciseName || "None"}
Maintain continuity across turns. If the user refers to "dinner", "lunch", "it", "also add", or modifies sets, resolve the target entity from this state.`;

  if (executedActions.length > 0 && successfulActions.length > 0) {
    system += `\n\n=== ACTIONS JUST COMPLETED IN DATABASE ===
${executedActions.map((act, i) => `Action ${i + 1}: ${act.type} (${act.domain}) -> ${JSON.stringify(act.details)}`).join("\n")}
Notes: ${executedNote}
CRITICAL INSTRUCTION: You MUST strictly echo and acknowledge ONLY the actions and movements listed above (${executedNote}). NEVER mention, claim, or hallucinate an unrequested exercise (such as Bench Press) that was not executed in this turn!`;
  }

  if (classifiedIntent.intent === "HISTORICAL_ANALYSIS") {
    // 1. Resolve exact date range for historical period
    const temporalScope = requirements.temporalScope || "last7Days";
    const range = resolveTemporalReference(temporalScope, userTimezone, now);
    const startStr = range.start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: userTimezone });
    // range.end is exclusive midnight of the next day; calculate last included calendar day
    const lastIncludedDate = new Date(range.end.getTime() - 86400000);
    const endStr = lastIncludedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: userTimezone });

    // 2. Extract and pre-aggregate actual retrieved metrics from orbitContext
    const workouts = orbitContext?.workouts?.today ?? [];
    const meals = orbitContext?.meals?.today ?? [];
    const tasks = orbitContext?.tasks?.today ?? [];
    const habits = orbitContext?.habits?.today ?? [];
    const bodyWeight = orbitContext?.bodyWeightEntries ?? [];
    const goals = orbitContext?.macroGoals;

    // Workout stats
    const workoutCount = workouts.length;
    const totalWorkoutMinutes = workouts.reduce((acc: number, w: any) => acc + (w.durationMinutes || 0), 0);
    const workoutDates = Array.from(new Set(workouts.map((w: any) => w.date).filter(Boolean)));

    // Nutrition stats
    const mealCount = meals.length;
    const mealDates = Array.from(new Set(meals.map((m: any) => m.date).filter(Boolean)));
    const totalCaloriesLogged = meals.reduce((acc: number, m: any) => acc + (m.macros?.calories || 0), 0);
    const totalProteinLogged = meals.reduce((acc: number, m: any) => acc + (m.macros?.proteinG || 0), 0);
    const avgCaloriesPerLoggedDay = mealDates.length > 0 ? Math.round(totalCaloriesLogged / mealDates.length) : 0;
    const avgProteinPerLoggedDay = mealDates.length > 0 ? Math.round(totalProteinLogged / mealDates.length) : 0;

    // Task stats
    const completedTasks = tasks.filter((t: any) => t.status === "completed");
    const pendingTasks = tasks.filter((t: any) => t.status === "pending");

    // Body weight stats
    const latestWeight = bodyWeight[0]?.weightKg;
    const prevWeight = bodyWeight.length > 1 ? bodyWeight[1]?.weightKg : undefined;
    const weightDelta = (latestWeight !== undefined && prevWeight !== undefined) ? Number((latestWeight - prevWeight).toFixed(2)) : undefined;

    const categoryCount = (hasWorkoutFocus ? 1 : 0) + (hasDietFocus ? 1 : 0) + (hasTaskFocus ? 1 : 0);

    const isOverallWeeklyReview = (
      (!mode || mode === "all") &&
      categoryCount !== 1 &&
      (
        /^(weekly\s+review|review\s+my\s+week|my\s+week\s+review)$/i.test(lowerLatest.trim()) ||
        /\b(give\s+me\s+an\s+honest\s+assessment\s+of\s+my\s+weekly\s+consistency\s+and\s+momentum|honest\s+assessment\s+of\s+my\s+weekly\s+consistency|consistency\s+and\s+momentum|momentum\s+and\s+consistency)\b/i.test(lowerLatest) ||
        /\b(full\s+weekly\s+review|overall\s+weekly\s+review|weekly\s+review\s+across\s+all\s+domains|rate\s+my\s+overall\s+progress)\b/i.test(lowerLatest) ||
        (categoryCount >= 2 && /\b(review|summary|assessment|rate|score|momentum|consistency)\b/i.test(lowerLatest))
      )
    );

    const isCategorySpecific = !isOverallWeeklyReview;

    system += `\n\n[MODE: HISTORICAL PERFORMANCE & WEEKLY ANALYSIS]
You are conducting a performance and consistency review for ${userName}.
Analysis Period: ${startStr} – ${endStr}

=== VERIFIED RETRIEVED DATA FOR THIS PERIOD ===
• Workouts logged: ${workoutCount} session(s)${workoutCount > 0 ? ` (${totalWorkoutMinutes} min total on dates: ${workoutDates.join(', ')})` : ' (No workout sessions logged in this period)'}
• Meals logged: ${mealCount} meal(s) across ${mealDates.length} day(s)${mealCount > 0 ? ` (Logged days avg: ${avgCaloriesPerLoggedDay} kcal/day, ${avgProteinPerLoggedDay}g protein/day)` : ' (No meals logged in this period)'}
${goals ? `• Macro targets: ${goals.calories} kcal, ${goals.proteinG}g protein, ${goals.carbsG}g carbs, ${goals.fatG}g fat` : ''}
• Tasks: ${completedTasks.length} completed, ${pendingTasks.length} pending
• Body weight: ${latestWeight !== undefined ? `${latestWeight} kg${weightDelta !== undefined ? ` (${weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg since previous log)` : ''}` : 'No weigh-ins in this period'}
• Habits: ${habits.length > 0 ? `${habits.filter((h: any) => h.completed).length}/${habits.length} habits completed` : 'No daily habits tracked in this period'}

=== INSTRUCTIONS & FORMATTING REQUIREMENTS ===
1. Use SHORT paragraphs, concise bullets, and clean Markdown. Avoid fluff, filler text, or excessive blank lines.
2. Ground all numbers strictly in the verified data above. Never repeat user profile targets as measured results.
3. Distinguish clearly between "No records logged" vs "Zero adherence" vs "Incomplete tracking".
4. If records exist for only some categories, analyze the logged categories and state that the remaining categories were untracked.
5. If there is genuinely NO data across all categories, state so briefly and honestly in 2-3 sentences. Do NOT output a lengthy generic tutorial.`;

    if (!isCategorySpecific) {
      system += `\n\nFor this overall weekly assessment, strictly format your response using this structure:
### Weekly Review
**Period**: ${startStr} – ${endStr}

#### Overall Assessment
[Concise 2-3 sentence personalized summary of adherence and momentum based on actual logs]

#### Key Metrics
- **Workouts**: ${workoutCount} session(s) (${totalWorkoutMinutes} min total)
- **Nutrition**: ${mealCount > 0 ? `${mealCount} meals across ${mealDates.length} days (avg ${avgCaloriesPerLoggedDay} kcal, ${avgProteinPerLoggedDay}g P/day)` : 'No meals logged'}
- **Tasks**: ${completedTasks.length} completed, ${pendingTasks.length} pending
- **Body Weight**: ${latestWeight !== undefined ? `${latestWeight} kg` : 'Not logged'}

#### What Went Well
- [Specific evidence-backed observation from their actual logs]
- [Another evidence-backed strength, e.g. consistency or macro adherence]

#### What Needs Improvement
- [Specific gap or inconsistency supported by available data, or mention untracked areas]

#### Your Score
**X/10** — [Explain score: award points for completed workouts, nutrition adherence on logged days, and task completion. Deduct for missed tracking or gaps. If data is insufficient (<2 days of data across all categories), explicitly state that data is insufficient for a reliable score rather than guessing.]

#### Priorities for Next Week
1. [Actionable priority 1]
2. [Actionable priority 2]
3. [Actionable priority 3]`;
    } else {
      system += `\n\nThe user asked a category-specific question. Provide a direct, focused analysis for that category with concise bullets and clear data. Do NOT force the 6-part weekly report template.`;

      if (hasWorkoutFocus) {
        system += `\n\n=== DETAILED WORKOUT SESSIONS IN THIS PERIOD ===\n${formatDetailedWorkoutSessions(workouts)}`;
        system += `\n\n[INSTRUCTIONS FOR WORKOUT & STRUCTURE EVALUATION]
1. FOCUS: Focus 100% on workouts, training consistency, split balance, and exercise selection. Do NOT dump unrequested task counts or calorie/nutrition numbers unless asked.
2. DIRECT RATING: If the user asks for a rating or score (e.g. "rate me out of 10", "rate my workout structure", "rate my training"):
   - ALWAYS provide a clear, bold score right at the top of your response: e.g. **8.5 / 10 — [Concise Split Title or Rationale]**
   - Follow with a structured, data-grounded breakdown:
     • **Frequency & Consistency**: Evaluate the number of training sessions (${workoutCount} session(s) logged) and distribution across the rolling 7-day window (${startStr} – ${endStr}).
     • **Split Balance & Muscle Volume**: Evaluate movement patterns (Push, Pull, Legs, Arms, Core) and whether major muscle groups were hit with appropriate balance.
     • **Progressive Overload & Intensity**: Evaluate loads, rep schemes, and training duration.
     • **Actionable Next Steps / Tomorrow's Recommendation**: If the user asks what to do tomorrow, give a specific recommendation based on what was trained most recently.
3. Keep your tone encouraging, direct, and like a clinical strength coach.`;
      } else if (hasDietFocus) {
        system += `\n\n=== DAILY NUTRITION IN THIS PERIOD ===\n${formatDailyNutritionSummary(meals)}`;
      }
    }
  }

  if (mode === "workout" || (hasWorkoutFocus && classifiedIntent.intent !== "HISTORICAL_ANALYSIS")) {
    system += `\n\n[MODE: WORKOUT COACH]
Focus on exercise programming, form, sets/reps, progressive overload, muscle groups, recovery, and splits.`;

    if (orbitContext?.workouts) {
      const workouts = orbitContext.workouts.today;
      const profileWeight = orbitContext.bodyWeightEntries?.[0]?.weightKg;
      if (profileWeight) {
        system += `\n\n=== ${userName.toUpperCase()}'S PROFILE ===\nBody weight: ${profileWeight} kg`;
      }
      if (workouts.length > 0) {
        system += `\n\n=== RECENT WORKOUT HISTORY (${workouts.length} sessions) ===\n${formatDetailedWorkoutSessions(workouts)}`;
        system += `\n\nUse this data to give specific advice — reference their actual exercises, weights, sets, reps, and patterns.`;
      } else {
        system += `\n\n[No workout history yet — give general programming advice and encourage them to start logging.]`;
      }
    }
  }

  if (mode === "diet" || hasDietFocus) {
    const goals: any = orbitContext?.macroGoals || dietContext?.goals || {
      calories: 2000,
      proteinG: 135,
      carbsG: 220,
      fatG: 60,
      fiberG: 30,
    };
    const targetCalories = goals.calories > 0 ? goals.calories : 2000;
    const targetProtein = goals.proteinG > 0 ? goals.proteinG : 135;

    const todayMeals = (orbitContext?.meals?.today && orbitContext.meals.today.length > 0)
      ? orbitContext.meals.today
      : (dietContext?.meals || []);

    const totals = todayMeals.reduce(
      (acc: any, m: any) => ({
        calories: acc.calories + (m.macros?.calories ?? m.calories ?? 0),
        proteinG: acc.proteinG + (m.macros?.proteinG ?? m.proteinG ?? 0),
        carbsG: acc.carbsG + (m.macros?.carbsG ?? m.carbsG ?? 0),
        fatG: acc.fatG + (m.macros?.fatG ?? m.fatG ?? 0),
        fiberG: acc.fiberG + (m.macros?.fiberG ?? m.fiberG ?? 0),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
    );

    const remainingProtein = Math.max(0, targetProtein - totals.proteinG);
    const remainingCalories = Math.max(0, targetCalories - totals.calories);

    const mealLines = todayMeals.length > 0
      ? todayMeals.map((m: any) => `  • ${m.name}: ${m.macros?.calories ?? m.calories ?? 0} kcal | ${m.macros?.proteinG ?? m.proteinG ?? 0}g P | ${m.macros?.carbsG ?? m.carbsG ?? 0}g C | ${m.macros?.fatG ?? m.fatG ?? 0}g F`).join("\n")
      : "  (nothing logged yet today)";

    const recentMealsList = (orbitContext?.meals?.all || []).slice(0, 10);
    const recentMealNames = Array.from(new Set(recentMealsList.map((m: any) => m.name).filter(Boolean)));
    const pastWeekMealsStr = recentMealNames.length > 0
      ? recentMealNames.join(", ")
      : "No past-week meals logged yet.";

    system += `\n\n[MODE: NUTRITION COACH & PROTEIN GAP INTELLIGENCE]
=== ${userName.toUpperCase()}'S NUTRITION TARGETS & TODAY'S LOGS ===
Daily Goals:   ${targetCalories} kcal | ${targetProtein}g Protein | ${goals.carbsG || 220}g Carbs | ${goals.fatG || 60}g Fat
Logged Today:  ${totals.calories} kcal | ${totals.proteinG}g Protein | ${totals.carbsG}g Carbs | ${totals.fatG}g Fat (${todayMeals.length} meals logged)
${mealLines}
Remaining Gap: ${remainingCalories} kcal | ${remainingProtein}g Protein (${Math.round((totals.proteinG / targetProtein) * 100)}% of protein goal)
Recent Past-Week Meals: ${pastWeekMealsStr}

[INSTRUCTIONS FOR PROTEIN GAP & DIET QUESTIONS]
1. State the exact progress clearly: "You're at **${totals.proteinG}g / ${targetProtein}g protein** logged so far today (**${remainingProtein}g remaining**)."
2. If today's logged protein is 0g (or partial), DO NOT refuse with "I don't see any meals logged so I can't calculate your gap" and DO NOT ask the user what their target is! You already have their exact goal (${targetProtein}g Protein).
3. Immediately provide a practical 3-meal action plan (e.g., Breakfast, Lunch, Dinner, or Post-workout snack) referencing high-protein Indian/athletic staples ${recentMealNames.length > 0 ? "and their past-week meals " : ""}(e.g. Greek yogurt, paneer, eggs, chicken, soya chunks, whey, lentils) to hit the remaining ${remainingProtein}g protein gap today.
4. Keep the response encouraging, athletic, and directly actionable.`;
  }

  if (mode === "tasks" || hasTaskFocus) {
    system += `\n\n[MODE: PRODUCTIVITY & DEEP WORK CADENCE COACH]
Focus on task prioritization, habit building, focus strategies, breaking down goals, and overcoming procrastination.`;

    const firestoreAllTasks = orbitContext?.tasks?.all || [];
    const firestorePending = firestoreAllTasks.filter((t: any) => t.status === "pending");

    const clientPending = (taskContext?.pendingToday || []).map((t: any) => ({
      title: t.title,
      priority: t.priority,
      projectName: t.projectName,
      dueDate: t.dueDate,
      status: "pending",
    }));

    // Deduplicate tasks between Firestore and client state
    const combinedPendingMap = new Map<string, any>();
    firestorePending.forEach((t: any) => combinedPendingMap.set(t.title.toLowerCase().trim(), t));
    clientPending.forEach((t: any) => {
      const key = t.title.toLowerCase().trim();
      if (!combinedPendingMap.has(key)) {
        combinedPendingMap.set(key, t);
      }
    });
    const allPendingTasks = Array.from(combinedPendingMap.values());

    const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
    system += `\n\n=== ${userName.toUpperCase()}'S PENDING TASKS & WORKSPACES — ${todayDate} ===
Total Incomplete Tasks: ${allPendingTasks.length}
${allPendingTasks.length > 0
  ? allPendingTasks.map((t: any, i: number) => `  ${i + 1}. "${t.title}"${t.projectName ? ` [Project: ${t.projectName}]` : ""}${t.priority ? ` (${t.priority} priority)` : ""}${t.dueDate ? ` (Scheduled: ${t.dueDate})` : ""}`).join("\n")
  : "  (No pending tasks currently scheduled)"}

Daily Rituals Invariant:
  1. Circadian Morning Sunlight & Walk
  2. High-Protein Whole Food Breakfast
  3. 90-Minute Uninterrupted Deep Work Block
  4. Evening Screen Shutdown & Recovery

[TASK COACHING DIRECTIVES]
1. Never claim you don't see any pending tasks when tasks are listed above! Reference their actual tasks by title (e.g. ${allPendingTasks.length > 0 ? `"${allPendingTasks[0].title}"` : "their workspace"}).
2. Prioritize their pending tasks by urgency and impact. Recommend concrete 90-minute or 45-minute Deep Work focus blocks with scheduled breaks.
3. Keep advice pragmatic, athletic, and actionable.`;
  }

  if (!hasWorkoutFocus && !hasDietFocus && !hasTaskFocus && mode !== "workout" && mode !== "diet" && mode !== "tasks" && classifiedIntent.intent !== "HISTORICAL_ANALYSIS") {
    system += `\n\n[MODE: GENERAL]
The user has opened Orbit without selecting a specific mode. Give helpful, grounded advice across fitness, nutrition, and productivity. Suggest they type /workout, /diet, or /tasks for more focused coaching.`;
  }

  // 5. Chat Conversation History Truncation (last 4 messages, assistant replies capped at 500 chars)
  const rawMessages = Array.isArray(messages) ? messages : [];
  const recentMessages = rawMessages.slice(-4);
  let cleanedMessages = recentMessages.map((m: any) => {
    let content = typeof m.content === "string" ? m.content : "";
    if (m.role === "assistant" && content.length > 500) {
      content = content.slice(0, 500) + "... [truncated]";
    }
    return {
      role: m.role as "user" | "assistant",
      content,
    };
  });

  // 6. Hard Token Budget Guard (14,000 max prompt chars, context trim threshold 10,000)
  const MAX_PROMPT_CHARS = 14_000;
  const CONTEXT_TRIM_THRESHOLD = 10_000;

  if (system.length > CONTEXT_TRIM_THRESHOLD) {
    console.warn(`[aria] System context string exceeded ${CONTEXT_TRIM_THRESHOLD} chars (${system.length}). Trimming historical items.`);
    system = system.slice(0, CONTEXT_TRIM_THRESHOLD) + "\n\n[Earlier historical records trimmed for token budget]";
  }

  let totalChars = system.length + cleanedMessages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_PROMPT_CHARS) {
    console.warn(`[aria] Total prompt chars exceeded ${MAX_PROMPT_CHARS} (${totalChars}). Trimming older history.`);
    cleanedMessages = cleanedMessages.slice(-2);
    totalChars = system.length + cleanedMessages.reduce((sum, m) => sum + m.content.length, 0);
  }

  if (totalChars > MAX_PROMPT_CHARS) {
    const overflow = totalChars - MAX_PROMPT_CHARS;
    system = system.slice(0, Math.max(2000, system.length - overflow - 100)) + "\n\n[Context trimmed for token budget]";
  }

  const promptMessages = [
    { role: "system" as const, content: system },
    ...cleanedMessages,
  ];

  // 7. AI model invocation with automatic retry & fallback on token/rate limits
  const tAiStart = Date.now();
  try {
    const result = await callTextWithFallback(TEXT_FALLBACK, {
      messages: promptMessages,
      maxTokens: 1024,
      temperature: 0.65,
      feature: "aria",
    });
    const tAiEnd = Date.now();

    console.info(
      JSON.stringify({
        type: "aria_timing",
        intent: classifiedIntent.intent,
        temporalScope: requirements.temporalScope,
        domains: requirements.domains,
        payloadChars: system.length,
        timings: {
          authMs: tAuth - t0,
          intentMs: tIntent - tAuth,
          temporalMs: tTemporal - tIntent,
          contextFetchMs: tContextEnd - tContextStart,
          contextAssemblyMs: tAssemblyEnd - tAssemblyStart,
          aiGenerationMs: tAiEnd - tAiStart,
          totalMs: tAiEnd - t0,
        },
      })
    );

    let responseMessage = result.data;
    let responseActionExecuted = primaryActionExecuted;
    let responseSuggestedActions: OrbitSuggestedAction[] | undefined = undefined;

    // Check if model emitted JSON format
    try {
      const parsed = JSON.parse(result.data);
      if (parsed && typeof parsed === "object") {
        if (parsed.message) responseMessage = parsed.message;
        if (parsed.action_executed && !responseActionExecuted) {
          responseActionExecuted = parsed.action_executed;
        }
        if (Array.isArray(parsed.suggested_actions) && parsed.suggested_actions.length > 0) {
          responseSuggestedActions = parsed.suggested_actions;
        }
      }
    } catch {
      // Plain text response from model
    }

    // Contextual suggestion generation
    if (!responseSuggestedActions || responseSuggestedActions.length === 0) {
      responseSuggestedActions = generateContextualSuggestions({
        orbitContext,
        activeContext: currentActiveContext,
        latestUserMessage,
        actionExecuted: (Array.isArray(responseActionExecuted) ? responseActionExecuted[0] : responseActionExecuted) || undefined,
      });
    }

    return makeOrbitResponse({
      message: responseMessage,
      reply: responseMessage,
      action_executed: responseActionExecuted ?? null,
      actions_executed: executedActions.length > 1 ? executedActions : undefined,
      suggested_actions: responseSuggestedActions,
      activeContext: currentActiveContext,
    });
  } catch (err: any) {
    const isRateOrTokenError = (
      err?.code === "RATE_LIMITED" ||
      err?.status === 413 ||
      err?.status === 429 ||
      /request\s+too\s+large/i.test(err?.message || "") ||
      /rate_limit_exceeded/i.test(err?.message || "") ||
      /tokens?\s+per\s+minute/i.test(err?.message || "") ||
      /\bTPM\b/.test(err?.message || "")
    );

    if (isRateOrTokenError) {
      console.warn("[aria] Primary attempt hit token/rate limit. Retrying with ultra-trimmed context on fallback models...");
      try {
        const trimmedHistory = (cleanedMessages || []).slice(-2).map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: typeof m.content === "string" ? m.content.slice(0, 300) : "",
        }));

        const ultraCompactSystem = system.length > 2500
          ? system.slice(0, 2500) + "\n\n[Context truncated for token recovery. Provide direct coaching.]"
          : system;

        const fallbackChain = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
        const fallbackResult = await callTextWithFallback(fallbackChain, {
          messages: [
            { role: "system", content: ultraCompactSystem },
            ...trimmedHistory,
          ],
          maxTokens: 1024,
          temperature: 0.65,
          feature: "aria_fallback",
        });

        const firstAction = Array.isArray(primaryActionExecuted)
          ? primaryActionExecuted[0]
          : primaryActionExecuted;
        const fallbackSuggestions = generateContextualSuggestions({
          orbitContext,
          activeContext: currentActiveContext,
          latestUserMessage,
          actionExecuted: firstAction || undefined,
        });

        return makeOrbitResponse({
          message: fallbackResult.data,
          reply: fallbackResult.data,
          action_executed: primaryActionExecuted ?? null,
          actions_executed: executedActions.length > 1 ? executedActions : undefined,
          suggested_actions: fallbackSuggestions,
          activeContext: currentActiveContext,
        });
      } catch (retryErr: any) {
        console.warn("[aria] Groq fallback retry failed, checking Gemini fallback:", retryErr?.message);
        const geminiReply = await callGeminiTextFallback(
          `System: ${system.slice(0, 3000)}\n\nUser: ${latestUserMessage}`
        );
        if (geminiReply) {
          const firstAction = Array.isArray(primaryActionExecuted)
            ? primaryActionExecuted[0]
            : primaryActionExecuted;
          const geminiSuggestions = generateContextualSuggestions({
            orbitContext,
            activeContext: currentActiveContext,
            latestUserMessage,
            actionExecuted: firstAction || undefined,
          });

          return makeOrbitResponse({
            message: geminiReply,
            reply: geminiReply,
            action_executed: primaryActionExecuted ?? null,
            actions_executed: executedActions.length > 1 ? executedActions : undefined,
            suggested_actions: geminiSuggestions,
            activeContext: currentActiveContext,
          });
        }
      }
    }

    const tAiEnd = Date.now();
    console.error("[aria] AI error:", err?.code, err?.message);
    console.info(
      JSON.stringify({
        type: "aria_timing",
        intent: classifiedIntent.intent,
        temporalScope: requirements.temporalScope,
        domains: requirements.domains,
        status: "error",
        errorCode: err?.code ?? "UNKNOWN",
        timings: {
          contextFetchMs: tContextEnd - tContextStart,
          aiGenerationMs: tAiEnd - tAiStart,
          totalMs: tAiEnd - t0,
        },
      })
    );
    return NextResponse.json({ error: err.message || "AI response failed" }, { status: 500 });
  }
}

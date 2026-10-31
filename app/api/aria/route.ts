import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

function formatDetailedWorkoutSessions(workouts: any[]): string {
  if (!workouts || workouts.length === 0) {
    return "No workout sessions recorded in this period.";
  }
  return workouts.map((s: any, idx: number) => {
    let header = `[Session ${idx + 1} — ${s.date}] ${s.summary || s.routineTitle || 'Workout'}${s.durationMinutes > 0 ? ` (${s.durationMinutes} min)` : ''}`;
    const lines: string[] = [header];
    if (s.exercises && s.exercises.length > 0) {
      const exStr = s.exercises.map((e: any) => {
        let setsStr = "";
        if (Array.isArray(e.sets) && e.sets.length > 0) {
          setsStr = e.sets.map((set: any, sIdx: number) => {
            const weightPart = set.weight !== undefined && set.weight !== null ? `${set.weight}${set.unit || 'kg'}` : '';
            return `Set ${sIdx + 1}: ${set.reps || 0} reps${weightPart ? ` @ ${weightPart}` : ''}`;
          }).join(', ');
        }
        return `    • ${e.name}: ${setsStr || `${e.sets?.length || 0} sets`}`;
      }).join('\n');
      lines.push(`  Exercises:\n${exStr}`);
    }
    if (s.cardioLogs && s.cardioLogs.length > 0) {
      const cardioStr = s.cardioLogs.map((c: any) => `    • ${c.activity}: ${c.durationMinutes}min${c.distanceKm ? `, ${c.distanceKm}km` : ''}${c.caloriesBurned ? `, ${c.caloriesBurned}kcal` : ''}`).join('\n');
      lines.push(`  Cardio:\n${cardioStr}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const session = await getServerSession(authOptions);
  const tAuth = Date.now();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userName = session.user?.name?.split(" ")[0] ?? "there";
  const { messages, mode } = await req.json();

  // Determine required context based on user messages (never assistant responses)
  const userMessages = (messages || []).filter((m: any) => m.role === "user");
  const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";

  // 1. Fast-path: Deterministic classification for simple greetings & pleasantries.
  // Bypasses expensive historical Firestore context retrieval, returning in <5ms.
  const classifiedIntent = classifyOrbitIntentDetailed(latestUserMessage);
  const tIntent = Date.now();

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
    return NextResponse.json({ reply });
  }

  // 2. Infer requirements primarily from the latest user message
  const latestReq = inferContextRequirements(latestUserMessage);

  // For domain detection on follow-up questions (e.g. "what about protein?"),
  // inspect prior user messages without allowing assistant replies to pollute temporal keywords
  const allUserText = userMessages.map((m: any) => m.content).join(" ");
  const allUserReq = inferContextRequirements(allUserText);

  // Merge inferred domains, add mode‑specific defaults, and resolve temporal scope
  const mergedDomains = new Set([...latestReq.domains, ...allUserReq.domains]);
  if (mode === "workout") mergedDomains.add("workouts");
  if (mode === "diet") { mergedDomains.add("meals"); mergedDomains.add("nutrition"); }
  if (mode === "tasks") mergedDomains.add("tasks");

  const requirements = {
    domains: Array.from(mergedDomains),
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

    // Check if user is asking for overall weekly assessment vs domain-specific question
    const lowerLatest = latestUserMessage.toLowerCase();

    const hasWorkoutFocus = (
      mode === "workout" ||
      /\b(workouts?|training|gym|exercises?|splits?|sets?|reps?|bench|squats?|deadlifts?|shoulders?|arms?|legs?|push|pull|cardio)\b/i.test(lowerLatest)
    );
    const hasDietFocus = (
      mode === "diet" ||
      /\b(meals?|nutrition|diet|calories|protein|carbs?|fats?|food|breakfast|lunch|dinner)\b/i.test(lowerLatest)
    );
    const hasTaskFocus = (
      mode === "tasks" ||
      /\b(tasks?|todos?|projects?|deep\s+work|priorit(y|ies))\b/i.test(lowerLatest)
    );

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
${workouts.slice(0, 5).map((w: any, idx: number) => `  - Session ${idx + 1} (${w.date}): ${w.durationMinutes || 0}m, Exercises: ${(w.exercises || []).map((e: any) => e.name).join(', ') || 'General session'}`).join('\n')}
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
      }
    }
  }

  if (mode === "workout") {
    system += `\n\n[MODE: WORKOUT COACH]
Focus on exercise programming, form, sets/reps, progressive overload, muscle groups, recovery, and splits.`;

    // Workout mode – use orbitContext.workouts and bodyWeightEntries
    if (orbitContext?.workouts) {
      const workouts = orbitContext.workouts.today; // filtered list based on temporalScope
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

  else if (mode === "diet") {
    system += `\n\n[MODE: NUTRITION COACH]
Focus on macros, Indian meal recommendations, calorie targets, protein sources, and meal timing.`;

    if (orbitContext?.meals) {
      const date = new Date().toLocaleDateString('en-CA');
      const meals = orbitContext.meals.today;
      const goals: any = orbitContext.macroGoals ?? { calories:0, proteinG:0, carbsG:0, fatG:0, fiberG:0 };
      const totals: any = meals.reduce((acc: any, m: any) => ({
        calories: acc.calories + (m.macros?.calories ?? 0),
        proteinG: acc.proteinG + (m.macros?.proteinG ?? 0),
        carbsG: acc.carbsG + (m.macros?.carbsG ?? 0),
        fatG: acc.fatG + (m.macros?.fatG ?? 0),
        fiberG: acc.fiberG + (m.macros?.fiberG ?? 0),
      }), {calories:0,proteinG:0,carbsG:0,fatG:0,fiberG:0});
      const remaining = {
        calories: Math.max(0, goals.calories - totals.calories),
        proteinG: Math.max(0, goals.proteinG - totals.proteinG),
        carbsG:   Math.max(0, goals.carbsG   - totals.carbsG),
        fatG:     Math.max(0, goals.fatG     - totals.fatG),
      };
      const mealLines = meals.length > 0
        ? meals.map((m: any) => `  • ${m.name}: ${m.macros?.calories ?? 0} kcal | ${m.macros?.proteinG ?? 0}g P | ${m.macros?.carbsG ?? 0}g C | ${m.macros?.fatG ?? 0}g F${m.macros?.fiberG ? ` | ${m.macros?.fiberG}g fiber` : ""}`).join("\n")
        : "  (nothing logged yet today)";

      system += `\n\n=== ${userName.toUpperCase()}'S NUTRITION — ${date} ===
Meals logged:\n${mealLines}

Totals:    ${totals.calories} kcal | ${totals.proteinG}g P | ${totals.carbsG}g C | ${totals.fatG}g F
Goals:     ${goals.calories} kcal | ${goals.proteinG}g P | ${goals.carbsG}g C | ${goals.fatG}g F
Remaining: ${remaining.calories} kcal | ${remaining.proteinG}g P | ${remaining.carbsG}g C | ${remaining.fatG}g F

Progress: ${Math.round((totals.calories / goals.calories) * 100)}% of calorie goal, ${Math.round((totals.proteinG / goals.proteinG) * 100)}% of protein goal.

Always reference these exact numbers when answering diet questions. Give specific Indian meal suggestions that fit the remaining macros.`;
    }
  }

  else if (mode === "tasks") {
    system += `\n\n[MODE: PRODUCTIVITY COACH]
Focus on task prioritization, habit building, focus strategies, breaking down goals, and overcoming procrastination.`;

    if (orbitContext?.tasks) {
      const todayDate = new Date().toLocaleDateString('en-CA');
      const pendingToday = orbitContext.tasks.today.filter(t => t.status === 'pending');
      const completedToday = orbitContext.tasks.today.filter(t => t.status === 'completed');
      const overdue = orbitContext.tasks.today.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
      const totalPending = pendingToday.length + overdue.length;
      system += `\n\n=== ${userName.toUpperCase()}'S TASKS — ${todayDate} ===`;
      if (overdue.length > 0) {
        system += `\nOVERDUE (${overdue.length}): ` + overdue.map((t: any) =>
          `"${t.title}" (due ${t.dueDate}${t.priority ? `, ${t.priority} priority` : ""})`
        ).join(", ");
      }
      if (pendingToday.length > 0) {
        system += `\nDUE TODAY (${pendingToday.length}): ` + pendingToday.map((t: any) =>
          `"${t.title}"${t.priority ? ` [${t.priority}]` : ""}${t.projectName ? ` (${t.projectName})` : ""}`
        ).join(", ");
      } else {
        system += `\nNo tasks scheduled for today.`;
      }
      if (completedToday.length > 0) {
        system += `\nCOMPLETED TODAY (${completedToday.length}): ` + completedToday.map((t: any) => `"${t.title}"`).join(", ");
      }
      system += `\nTotal pending tasks: ${totalPending}\n\nReference their actual tasks when giving advice. Celebrate completed tasks. Help them prioritise what's overdue.`;
    }
  }

  else if (classifiedIntent.intent !== "HISTORICAL_ANALYSIS") {
    system += `\n\n[MODE: GENERAL]
The user has opened Orbit without selecting a specific mode. Give helpful, grounded advice across fitness, nutrition, and productivity. Suggest they type /workout, /diet, or /tasks for more focused coaching.`;
  }

  // 5. AI model invocation
  const tAiStart = Date.now();
  try {
    const result = await callTextWithFallback(TEXT_FALLBACK, {
      messages: [
        { role: "system", content: system },
        { role: "system", content: contextJson },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      maxTokens: MAX_TOKENS.aria,
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
        payloadChars: contextJson.length,
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

    return NextResponse.json({ reply: result.data });
  } catch (err: any) {
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

// lib/orbit/mutationEngine.ts
/**
 * SATAT Orbit Tool Calling, CRUD Mutation & Contextual Suggestion Engine
 *
 * Implements:
 * 1. upsert_diet_entry
 * 2. modify_diet_entry
 * 3. update_workout_session
 * 4. modify_plan_schedule
 * 5. Deterministic entity reference extraction & intent parsing
 * 6. Dual-layer contextual follow-up suggestion engine
 */

import { adminDb } from "@/lib/firebaseAdmin";
import type { MealEntry, MealMacros, WorkoutSession, Task } from "@/types";
import type { OrbitEntityContext, OrbitSuggestedAction, OrbitActionExecuted } from "@/types/orbit";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DietItemInput {
  name: string;
  portion?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
}

export interface UpsertDietParams {
  userId: string;
  date?: string; // YYYY-MM-DD
  mealType: string; // "breakfast" | "lunch" | "dinner" | "snack"
  items: DietItemInput[];
}

export interface ModifyDietParams {
  userId: string;
  entryId?: string; // specific doc ID, "latest", or slot name like "lunch"
  updates: {
    name?: string;
    macros?: Partial<MealMacros>;
    items?: DietItemInput[];
  };
}

export interface WorkoutSetInput {
  reps: number;
  weight?: number;
  unit?: "kg" | "lbs" | "bodyweight";
  completed?: boolean;
}

export interface UpdateWorkoutParams {
  userId: string;
  sessionId?: string; // specific doc ID or "latest" / "today"
  exerciseName?: string;
  exerciseId?: string;
  exerciseIndex?: number;
  setIndex?: number;
  sets: WorkoutSetInput[];
}

export interface ModifyPlanParams {
  userId: string;
  planId?: string;
  title?: string;
  dueDate?: string;
  status?: "pending" | "completed";
  priority?: "low" | "medium" | "high";
  updates?: Record<string, any>;
}

export interface ParsedMutation {
  type: "UPSERT_MEAL" | "MODIFY_MEAL" | "UPDATE_WORKOUT" | "MODIFY_PLAN";
  params: any;
}

// ── Macro Estimation Heuristics for Indian Food & Common Items ─────────────────

export function estimateMacrosForDish(rawName: string, portion?: string): MealMacros {
  const text = `${portion ?? ""} ${rawName}`.toLowerCase();

  // 1. Grams of Rice (e.g. "400g rice" -> 400 * 1.3 kcal/g = 520 kcal)
  const riceGramMatch = text.match(/(\d+)\s*g(?:rams?)?\s+(?:of\s+)?(?:white\s+|brown\s+|basmati\s+|steamed\s+)?rice/i);
  if (riceGramMatch) {
    const grams = parseFloat(riceGramMatch[1]) || 400;
    // 100g cooked white rice ~ 130 kcal, 2.7g protein, 28g carbs, 0.3g fat
    const factor = grams / 100;
    return {
      calories: Math.round(130 * factor),
      proteinG: Math.round(2.7 * factor),
      carbsG: Math.round(28 * factor),
      fatG: Math.round(0.3 * factor),
    };
  }

  // Generic rice without grams (assume 1 bowl / 150g ~ 195 kcal)
  if (/\brice\b/i.test(text) && !/\bcauliflower\b/i.test(text)) {
    return { calories: 195, proteinG: 4, carbsG: 42, fatG: 0.5 };
  }

  // 2. Chapatis / Rotis (e.g. "3 chapatis" -> 3 * 104 kcal = 312 kcal)
  const chapatiCountMatch = text.match(/(\d+)\s*(?:whole\s+wheat\s+)?(?:chapatis?|rotis?|phulkas?)/i);
  if (chapatiCountMatch) {
    const count = parseInt(chapatiCountMatch[1], 10) || 1;
    return {
      calories: Math.round(count * 104),
      proteinG: Math.round(count * 3.1),
      carbsG: Math.round(count * 18),
      fatG: Math.round(count * 2.5),
    };
  }
  if (/\b(chapati|roti|phulka)\b/i.test(text)) {
    return { calories: 104, proteinG: 3.1, carbsG: 18, fatG: 2.5 };
  }

  // 3. Salad (cucumber, tomato, onion, lettuce)
  if (/\bsalad\b/i.test(text)) {
    return { calories: 50, proteinG: 2, carbsG: 9, fatG: 0.5, fiberG: 3 };
  }

  // 4. Paneer dishes (e.g. "yellow paneer fried vegetables", "paneer curry", "100g paneer")
  if (/\bpaneer\b/i.test(text)) {
    const gramMatch = text.match(/(\d+)\s*g(?:rams?)?\s+paneer/i);
    const grams = gramMatch ? parseFloat(gramMatch[1]) : 150;
    const factor = grams / 100;
    return {
      calories: Math.round(265 * factor),
      proteinG: Math.round(18 * factor),
      carbsG: Math.round(6 * factor),
      fatG: Math.round(20 * factor),
    };
  }

  // 5. Dal / Lentils / Sambar
  if (/\b(dal|daal|sambar|lentils?)\b/i.test(text)) {
    return { calories: 150, proteinG: 9, carbsG: 22, fatG: 3, fiberG: 5 };
  }

  // 6. Chicken breast / curry
  if (/\bchicken\b/i.test(text)) {
    const gramMatch = text.match(/(\d+)\s*g(?:rams?)?\s+chicken/i);
    const grams = gramMatch ? parseFloat(gramMatch[1]) : 150;
    const factor = grams / 100;
    return {
      calories: Math.round(165 * factor),
      proteinG: Math.round(31 * factor),
      carbsG: 0,
      fatG: Math.round(3.6 * factor),
    };
  }

  // 7. Eggs (e.g. "2 boiled eggs", "3 eggs")
  const eggCountMatch = text.match(/(\d+)\s*(?:boiled\s+|fried\s+)?eggs?/i);
  if (eggCountMatch) {
    const count = parseInt(eggCountMatch[1], 10) || 1;
    return {
      calories: count * 74,
      proteinG: Math.round(count * 6.3),
      carbsG: Math.round(count * 0.4),
      fatG: count * 5,
    };
  }
  if (/\beggs?\b/i.test(text)) {
    return { calories: 74, proteinG: 6, carbsG: 0, fatG: 5 };
  }

  // 8. Protein shake / whey
  if (/\b(whey|protein\s+shake|scoop)\b/i.test(text)) {
    return { calories: 130, proteinG: 25, carbsG: 3, fatG: 1.5 };
  }

  // Default baseline for miscellaneous dishes/portions
  return { calories: 150, proteinG: 5, carbsG: 20, fatG: 5 };
}

// ── CRUD Handlers ─────────────────────────────────────────────────────────────

/**
 * 1. upsert_diet_entry(date, meal_type, items: [{name, portion, calories, protein, carbs, fats}])
 * Merges items and macros into existing meal for date and mealType, or creates a new entry.
 */
export async function upsert_diet_entry(params: UpsertDietParams): Promise<{
  mealId: string;
  isNew: boolean;
  meal: MealEntry;
  activeContext: OrbitEntityContext;
}> {
  const { userId, mealType } = params;
  if (!userId) throw new Error("Missing required userId for upsert_diet_entry");

  const todayStr = new Date().toLocaleDateString("en-CA");
  const targetDate = params.date || todayStr;
  const normalizedSlot = (mealType || "meal").toLowerCase().trim();

  // Calculate totals for incoming items
  let addedCalories = 0;
  let addedProtein = 0;
  let addedCarbs = 0;
  let addedFat = 0;
  let addedFiber = 0;

  const itemNames: string[] = [];

  for (const item of params.items) {
    itemNames.push(item.name);
    if (
      item.calories !== undefined &&
      item.protein !== undefined &&
      item.carbs !== undefined &&
      item.fats !== undefined
    ) {
      addedCalories += item.calories;
      addedProtein += item.protein;
      addedCarbs += item.carbs;
      addedFat += item.fats;
      if (item.fiber) addedFiber += item.fiber;
    } else {
      const estimated = estimateMacrosForDish(item.name, item.portion);
      addedCalories += item.calories ?? estimated.calories;
      addedProtein += item.protein ?? estimated.proteinG;
      addedCarbs += item.carbs ?? estimated.carbsG;
      addedFat += item.fats ?? estimated.fatG;
      if (item.fiber || estimated.fiberG) {
        addedFiber += item.fiber ?? (estimated.fiberG || 0);
      }
    }
  }

  // Query existing meals for user on target date
  const snap = await adminDb
    .collection("meals")
    .where("userId", "==", userId)
    .where("date", "==", targetDate)
    .get();

  const userMeals: MealEntry[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  // Look for existing meal matching the meal slot
  const existingMeal = userMeals.find((m) =>
    (m.name || "").toLowerCase().includes(normalizedSlot)
  );

  const slotTitle = normalizedSlot.charAt(0).toUpperCase() + normalizedSlot.slice(1);

  if (existingMeal) {
    // Append new items to existing meal name
    const updatedName = `${existingMeal.name}, ${itemNames.join(", ")}`;
    const updatedMacros: MealMacros = {
      calories: Math.round((existingMeal.macros?.calories || 0) + addedCalories),
      proteinG: Math.round((existingMeal.macros?.proteinG || 0) + addedProtein),
      carbsG: Math.round((existingMeal.macros?.carbsG || 0) + addedCarbs),
      fatG: Math.round((existingMeal.macros?.fatG || 0) + addedFat),
      fiberG: Math.round((existingMeal.macros?.fiberG || 0) + addedFiber),
    };

    await adminDb.collection("meals").doc(existingMeal.id).update({
      name: updatedName,
      macros: updatedMacros,
    });

    const updatedMeal: MealEntry = {
      ...existingMeal,
      name: updatedName,
      macros: updatedMacros,
    };

    return {
      mealId: existingMeal.id,
      isNew: false,
      meal: updatedMeal,
      activeContext: {
        activeMealSlot: normalizedSlot,
        activeMealId: existingMeal.id,
      },
    };
  } else {
    // Create new meal entry
    const newName = `${slotTitle}: ${itemNames.join(", ")}`;
    const newMacros: MealMacros = {
      calories: Math.round(addedCalories),
      proteinG: Math.round(addedProtein),
      carbsG: Math.round(addedCarbs),
      fatG: Math.round(addedFat),
      fiberG: Math.round(addedFiber),
    };

    const docData: Omit<MealEntry, "id"> = {
      userId,
      date: targetDate,
      name: newName,
      macros: newMacros,
      createdAt: Date.now(),
    };

    const docRef = await adminDb.collection("meals").add(docData);
    const createdMeal: MealEntry = { id: docRef.id, ...docData };

    return {
      mealId: docRef.id,
      isNew: true,
      meal: createdMeal,
      activeContext: {
        activeMealSlot: normalizedSlot,
        activeMealId: docRef.id,
      },
    };
  }
}

/**
 * 2. modify_diet_entry(entry_id, updates)
 */
export async function modify_diet_entry(params: ModifyDietParams): Promise<{
  mealId: string;
  status: "success";
  meal?: MealEntry;
}> {
  const { userId, entryId, updates } = params;
  if (!userId) throw new Error("Missing required userId for modify_diet_entry");

  let targetId = entryId;
  let existingData: any = null;

  if (!targetId || targetId === "latest" || ["breakfast", "lunch", "dinner", "snack"].includes(targetId)) {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const snap = await adminDb
      .collection("meals")
      .where("userId", "==", userId)
      .where("date", "==", todayStr)
      .get();

    const meals: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const slot = (targetId || "").toLowerCase();
    if (slot && ["breakfast", "lunch", "dinner", "snack"].includes(slot)) {
      const match = meals.find((m) => (m.name || "").toLowerCase().includes(slot));
      if (match) {
        targetId = match.id;
        existingData = match;
      }
    } else if (meals.length > 0) {
      const latest = meals.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      targetId = latest.id;
      existingData = latest;
    }
  }

  if (!targetId) {
    throw new Error("No existing meal entry found to modify");
  }

  const patch: Record<string, any> = {};
  if (updates.name) patch.name = updates.name;
  if (updates.macros) {
    patch.macros = {
      ...(existingData?.macros || {}),
      ...updates.macros,
    };
  }

  await adminDb.collection("meals").doc(targetId).update(patch);
  return { mealId: targetId, status: "success" };
}

/**
 * 3. update_workout_session(session_id, exercise_id, sets: [{reps, weight}])
 */
export async function update_workout_session(params: UpdateWorkoutParams): Promise<{
  sessionId: string;
  exerciseName: string;
  sets: WorkoutSetInput[];
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, exerciseName = "Workout Exercise", sets, exerciseIndex } = params;
  if (!userId) throw new Error("Missing required userId for update_workout_session");

  const todayStr = new Date().toLocaleDateString("en-CA");
  const snap = await adminDb
    .collection("workouts")
    .where("userId", "==", userId)
    .get();

  const sessions: any[] = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

  let session = params.sessionId && params.sessionId !== "latest" && params.sessionId !== "today"
    ? sessions.find((s) => s.id === params.sessionId)
    : sessions.find((s) => s.date === todayStr) || sessions[0];

  const normalizedExName = exerciseName.trim();
  const lowerExName = normalizedExName.toLowerCase();

  const formattedSets = sets.map((s, idx) => ({
    id: `set-${Date.now()}-${idx}`,
    reps: s.reps,
    weight: s.weight ?? 0,
    unit: s.unit ?? "kg",
    completed: s.completed ?? true,
  }));

  if (!session) {
    // Create new session for today
    const newSession = {
      userId,
      date: todayStr,
      exercises: [
        {
          id: `ex-${Date.now()}`,
          name: normalizedExName,
          sets: formattedSets,
        },
      ],
      durationMinutes: 45,
      createdAt: Date.now(),
    };
    const docRef = await adminDb.collection("workouts").add(newSession);
    return {
      sessionId: docRef.id,
      exerciseName: normalizedExName,
      sets,
      status: "success",
      activeContext: {
        activeWorkoutId: docRef.id,
        activeExerciseName: normalizedExName,
      },
    };
  }

  const exercises: any[] = session.exercises || [];
  let existingExIndex = -1;

  // 1. Ordinal index targeting (e.g. "second exercise" -> exerciseIndex: 1)
  if (typeof exerciseIndex === "number" && exerciseIndex >= 0 && exerciseIndex < exercises.length) {
    existingExIndex = exerciseIndex;
  } else {
    // 2. Exact match
    existingExIndex = exercises.findIndex(
      (e) => (e.name || "").trim().toLowerCase() === lowerExName
    );

    // 3. Substring match in either direction
    if (existingExIndex === -1 && lowerExName !== "workout exercise") {
      existingExIndex = exercises.findIndex((e) => {
        const n = (e.name || "").toLowerCase();
        return n.includes(lowerExName) || lowerExName.includes(n);
      });
    }

    // 4. Token overlap match (e.g. "dumbbell press" matches "Incline Dumbbell Press")
    if (existingExIndex === -1 && lowerExName !== "workout exercise") {
      const tokens = lowerExName.split(/\s+/).filter((t) => t.length > 2);
      if (tokens.length > 0) {
        existingExIndex = exercises.findIndex((e) => {
          const n = (e.name || "").toLowerCase();
          return tokens.every((token) => n.includes(token));
        });
      }
    }
  }

  let targetExName = normalizedExName;
  let finalSets: WorkoutSetInput[] = sets;

  if (existingExIndex !== -1) {
    targetExName = exercises[existingExIndex].name;
    const existingSets = exercises[existingExIndex].sets || [];
    const updatedSets = sets.map((s, idx) => {
      const prevSet = existingSets[idx] || existingSets[0];
      const resolvedWeight = s.weight && s.weight > 0 ? s.weight : (prevSet?.weight ?? 0);
      const resolvedUnit = s.unit || prevSet?.unit || "kg";
      return {
        id: `set-${Date.now()}-${idx}`,
        reps: s.reps,
        weight: resolvedWeight,
        unit: resolvedUnit,
        completed: s.completed ?? true,
      };
    });
    exercises[existingExIndex].sets = updatedSets;
    finalSets = updatedSets.map((s) => ({
      reps: s.reps,
      weight: s.weight,
      unit: s.unit as "kg" | "lbs" | "bodyweight",
      completed: s.completed,
    }));
  } else {
    exercises.push({
      id: `ex-${Date.now()}`,
      name: normalizedExName,
      sets: formattedSets,
    });
  }

  await adminDb.collection("workouts").doc(session.id).update({
    exercises,
  });

  return {
    sessionId: session.id,
    exerciseName: targetExName,
    sets: finalSets,
    status: "success",
    activeContext: {
      activeWorkoutId: session.id,
      activeExerciseName: targetExName,
    },
  };
}

/**
 * 4. modify_plan_schedule(plan_id, updates)
 */
export async function modify_plan_schedule(params: ModifyPlanParams): Promise<{
  taskId: string;
  status: "success";
}> {
  const { userId, planId, updates = {} } = params;
  if (!userId) throw new Error("Missing required userId for modify_plan_schedule");

  if (planId && planId !== "new") {
    await adminDb.collection("tasks").doc(planId).update(updates);
    return { taskId: planId, status: "success" };
  } else {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const docData = {
      userId,
      title: params.title || updates.title || "Scheduled Focus Block",
      status: params.status || updates.status || "pending",
      dueDate: params.dueDate || updates.dueDate || todayStr,
      priority: params.priority || updates.priority || "medium",
      createdAt: Date.now(),
      projectId: updates.projectId || "default",
      frequency: "daily",
    };
    const ref = await adminDb.collection("tasks").add(docData);
    return { taskId: ref.id, status: "success" };
  }
}

/**
 * Execute a parsed mutation intent and update the conversational entity context.
 */
export async function executeMutation(
  userId: string,
  mutationIntent: ParsedMutation,
  currentContext: OrbitEntityContext = {}
): Promise<{
  actionExecuted: OrbitActionExecuted;
  updatedContext: OrbitEntityContext;
  executedNote: string;
}> {
  let nextContext: OrbitEntityContext = { ...currentContext };
  try {
    if (mutationIntent.type === "UPSERT_MEAL") {
      const res = await upsert_diet_entry({
        userId,
        mealType: mutationIntent.params.mealType,
        items: mutationIntent.params.items,
      });
      nextContext = { ...nextContext, ...res.activeContext };
      const itemNames = (mutationIntent.params.items || []).map((i: any) => i.name).join(", ");
      const slot = mutationIntent.params.mealType;
      const note = res.isNew
        ? `Logged ${itemNames} to your ${slot}.`
        : `Added ${itemNames} to your ${slot}.`;

      return {
        actionExecuted: {
          type: "UPSERT_MEAL",
          status: "success",
          details: {
            mealId: res.mealId,
            isNew: res.isNew,
            name: res.meal.name,
            macros: res.meal.macros,
          },
        },
        updatedContext: nextContext,
        executedNote: note,
      };
    } else if (mutationIntent.type === "MODIFY_MEAL") {
      const res = await modify_diet_entry({
        userId,
        entryId: mutationIntent.params.entryId,
        updates: mutationIntent.params.updates,
      });
      return {
        actionExecuted: {
          type: "MODIFY_MEAL",
          status: "success",
          details: res,
        },
        updatedContext: nextContext,
        executedNote: `Updated ${mutationIntent.params.entryId || "meal"} log.`,
      };
    } else if (mutationIntent.type === "UPDATE_WORKOUT") {
      const res = await update_workout_session({
        userId,
        exerciseName: mutationIntent.params.exerciseName,
        exerciseIndex: mutationIntent.params.exerciseIndex,
        setIndex: mutationIntent.params.setIndex,
        sets: mutationIntent.params.sets,
      });
      nextContext = { ...nextContext, ...res.activeContext };
      const setsSummary = (res.sets || []).map((s: any) => `${s.reps} reps${s.weight ? ` @ ${s.weight}kg` : ""}`).join(", ");
      return {
        actionExecuted: {
          type: "UPDATE_WORKOUT",
          status: "success",
          details: {
            sessionId: res.sessionId,
            exerciseName: res.exerciseName,
            sets: res.sets,
          },
        },
        updatedContext: nextContext,
        executedNote: `Updated ${res.exerciseName} sets: ${setsSummary}.`,
      };
    } else if (mutationIntent.type === "MODIFY_PLAN") {
      const res = await modify_plan_schedule({
        userId,
        ...mutationIntent.params,
      });
      return {
        actionExecuted: {
          type: "MODIFY_PLAN",
          status: "success",
          details: res,
        },
        updatedContext: nextContext,
        executedNote: `Scheduled task: ${mutationIntent.params.title || "focus block"}.`,
      };
    }
    throw new Error(`Unsupported mutation type: ${(mutationIntent as any).type}`);
  } catch (err: any) {
    console.warn("[mutationEngine] Execution error:", err?.message);
    return {
      actionExecuted: {
        type: mutationIntent.type,
        status: "failed",
        details: { error: err?.message || "Execution failed" },
      },
      updatedContext: nextContext,
      executedNote: `Failed to execute: ${err?.message || "Execution failed"}`,
    };
  }
}

// ── Multi-Turn Intent & Entity Parser ──────────────────────────────────────────

/**
 * Deterministically detect state mutation intents from user messages
 * with entity reference continuity from activeContext and recent turns.
 */
export function parseMutationIntent(
  message: string,
  activeContext?: OrbitEntityContext,
  allUserText?: string
): ParsedMutation | null {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. DIET / MEAL UPSERT OR APPEND
  // Examples:
  // "Log 3 chapatis and salad for lunch"
  // "Add 400g rice to dinner"
  // "Actually, also add 400g rice and yellow paneer fried vegetables"
  // "Also add 400g of rice to my lunch log"
  const isMealMutation =
    /\b(log|add|track|append)\b/i.test(lower) &&
    /\b(rice|chapati|chapatis|roti|rotis|salad|paneer|dal|chicken|egg|eggs|meal|lunch|dinner|breakfast|snack)\b/i.test(lower);

  const isFollowUpAdd =
    /\b(also\s+add|actually,\s*also\s+add|add\s+another|include)\b/i.test(lower);

  if (isMealMutation || isFollowUpAdd) {
    // Resolve meal slot
    let mealType = "lunch";
    if (/\bbreakfast\b/i.test(lower)) mealType = "breakfast";
    else if (/\blunch\b/i.test(lower)) mealType = "lunch";
    else if (/\bdinner\b/i.test(lower)) mealType = "dinner";
    else if (/\bsnack\b/i.test(lower)) mealType = "snack";
    else if (activeContext?.activeMealSlot) {
      mealType = activeContext.activeMealSlot;
    } else if (allUserText) {
      const lowerAll = allUserText.toLowerCase();
      if (/\bdinner\b/i.test(lowerAll)) mealType = "dinner";
      else if (/\blunch\b/i.test(lowerAll)) mealType = "lunch";
      else if (/\bbreakfast\b/i.test(lowerAll)) mealType = "breakfast";
    }

    // Extract dish items
    // Strip common leading trigger phrases
    let cleaned = text
      .replace(/^(actually,?\s*)?(also\s+)?(add|log|track)\s+/i, "")
      .replace(/\s+(for|to|in)\s+(my\s+)?(lunch|dinner|breakfast|snack)(\s+log)?$/i, "")
      .trim();

    // Split on "and", "with", or comma
    const rawItems = cleaned
      .split(/,|\band\b|\bwith\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !/^(my|a|an|the|also|to)$/i.test(s));

    const items: DietItemInput[] = rawItems.length > 0
      ? rawItems.map((name) => ({ name }))
      : [{ name: cleaned || "Custom Meal" }];

    return {
      type: "UPSERT_MEAL",
      params: {
        mealType,
        items,
      },
    };
  }

  // 2. WORKOUT EXERCISE OR SETS UPDATE
  // Examples:
  // "Change the dumbbell press reps to 12"
  // "Set my incline dumbbell press to 10 reps at 24kg"
  // "Log 10 reps of incline dumbbell press at 24kg"
  // "Change that second exercise to 12 reps"
  let exerciseIndex: number | undefined = undefined;
  if (/\b(?:that\s+)?first\s+exercise\b|\b1st\s+exercise\b|\bexercise\s*#?1\b/i.test(text)) {
    exerciseIndex = 0;
  } else if (/\b(?:that\s+)?second\s+exercise\b|\b2nd\s+exercise\b|\bexercise\s*#?2\b/i.test(text)) {
    exerciseIndex = 1;
  } else if (/\b(?:that\s+)?third\s+exercise\b|\b3rd\s+exercise\b|\bexercise\s*#?3\b/i.test(text)) {
    exerciseIndex = 2;
  } else if (/\b(?:that\s+)?fourth\s+exercise\b|\b4th\s+exercise\b|\bexercise\s*#?4\b/i.test(text)) {
    exerciseIndex = 3;
  } else if (/\b(?:that\s+)?fifth\s+exercise\b|\b5th\s+exercise\b|\bexercise\s*#?5\b/i.test(text)) {
    exerciseIndex = 4;
  }

  const isWorkoutMutation =
    /\b(change|set|update|log|make)\b/i.test(lower) &&
    (/\b(reps?|sets?|weight|kg|lbs|dumbbell|press|squat|bench|deadlift|curl|pulldown|extension|exercise)\b/i.test(lower) ||
      exerciseIndex !== undefined);

  if (isWorkoutMutation) {
    // Extract exercise name
    let exerciseName = activeContext?.activeExerciseName || "Workout Exercise";

    const exPatterns = [
      /incline\s+dumbbell\s+press/i,
      /dumbbell\s+press/i,
      /bench\s+press/i,
      /incline\s+bench/i,
      /barbell\s+squats?/i,
      /deadlifts?/i,
      /bicep\s+curls?/i,
      /lat\s+pulldowns?/i,
      /leg\s+press/i,
    ];

    for (const pat of exPatterns) {
      const match = text.match(pat);
      if (match) {
        exerciseName = match[0].replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      }
    }

    // Extract reps: e.g. "to 12", "10 reps", "12 reps"
    let reps = 10;
    const repsMatch =
      text.match(/reps?\s+to\s+(\d+)/i) ||
      text.match(/(?:to\s+|set\s+to\s+)?(\d+)\s*reps?/i) ||
      text.match(/to\s+(\d+)\s*(?:reps?)?/i);
    if (repsMatch) {
      reps = parseInt(repsMatch[1], 10) || 10;
    }

    // Extract weight: e.g. "at 24kg", "with 24 kg", "24kg"
    let weight = 0;
    const weightMatch =
      text.match(/(?:at|with|@)\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)?/i) ||
      text.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]) || 0;
    }

    return {
      type: "UPDATE_WORKOUT",
      params: {
        exerciseName,
        exerciseIndex,
        sets: [{ reps, weight, unit: "kg", completed: true }],
      },
    };
  }

  // 3. TASK / SCHEDULE MUTATION
  // Examples:
  // "Schedule deep work session for 4pm"
  // "Mark task Complete weekly plan as completed"
  if (/\b(schedule|plan\s+a|mark\s+task)\b/i.test(lower)) {
    return {
      type: "MODIFY_PLAN",
      params: {
        title: text.replace(/^schedule\s+/i, "").trim() || "Deep Work Session",
        status: /\bcompleted\b/i.test(lower) ? "completed" : "pending",
      },
    };
  }

  return null;
}

// ── Contextual Follow-Up Suggestion Generator ──────────────────────────────────

export interface SuggestionContextInput {
  orbitContext?: any;
  activeContext?: OrbitEntityContext;
  latestUserMessage?: string;
  actionExecuted?: OrbitActionExecuted;
  goals?: { calories?: number; proteinG?: number; carbsG?: number; fatG?: number };
  totals?: { calories?: number; proteinG?: number; carbsG?: number; fatG?: number };
}

/**
 * Emits 2–3 concise, highly relevant next actions based on missing macro targets,
 * unfinished workout sets, or time-of-day execution.
 */
export function generateContextualSuggestions(input: SuggestionContextInput): OrbitSuggestedAction[] {
  const suggestions: OrbitSuggestedAction[] = [];
  const activeSlot = input.activeContext?.activeMealSlot || "lunch";
  const actionType = input.actionExecuted?.type;

  const goals = input.goals || input.orbitContext?.macroGoals || { calories: 2200, proteinG: 140 };
  const totals = input.totals || { calories: 0, proteinG: 0 };
  const remainingCalories = Math.max(0, (goals.calories || 2200) - (totals.calories || 0));
  const remainingProtein = Math.max(0, (goals.proteinG || 140) - (totals.proteinG || 0));

  // If a meal upsert or diet question just happened:
  if (actionType === "UPSERT_MEAL" || actionType === "MODIFY_MEAL" || /\b(meal|lunch|dinner|breakfast|macros?|protein)\b/i.test(input.latestUserMessage || "")) {
    // 1. Slot-specific follow up item
    if (activeSlot === "lunch") {
      suggestions.push({
        label: "Add 400g rice to lunch",
        prompt: "Also add 400g of rice to my lunch log",
      });
    } else if (activeSlot === "dinner") {
      suggestions.push({
        label: "Add paneer bhurji to dinner",
        prompt: "Also add 150g paneer bhurji to my dinner log",
      });
    } else {
      suggestions.push({
        label: "Add 2 boiled eggs",
        prompt: "Also add 2 boiled eggs to this meal",
      });
    }

    // 2. Remaining macros check
    suggestions.push({
      label: "View remaining macros",
      prompt: "How many calories and protein do I have left for today?",
    });

    // 3. Training integration
    suggestions.push({
      label: "Log evening push session",
      prompt: "Start my Push Day - Upper Body workout",
    });

    return suggestions.slice(0, 3);
  }

  // If a workout was updated or gym session discussed:
  if (actionType === "UPDATE_WORKOUT" || /\b(workout|bench|dumbbell|press|squat|sets?|reps?)\b/i.test(input.latestUserMessage || "")) {
    const ex = input.activeContext?.activeExerciseName || "exercise";
    suggestions.push({
      label: "Log next set",
      prompt: `Add another set to ${ex}`,
    });
    suggestions.push({
      label: "Post-workout meal idea",
      prompt: "Suggest a high-protein post-workout meal to hit my remaining macros",
    });
    suggestions.push({
      label: "Review exercise volume",
      prompt: "How does my volume today compare to my recent sessions?",
    });

    return suggestions.slice(0, 3);
  }

  // Default general coaching next steps based on time of day & remaining goals
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    suggestions.push({
      label: "Structure today's workout",
      prompt: "Help me structure today's workout based on my recent sessions.",
    });
    suggestions.push({
      label: "Log breakfast",
      prompt: "Log 3 whole eggs and 2 slices of whole wheat toast for breakfast",
    });
    suggestions.push({
      label: "Today's top priorities",
      prompt: "What tasks should I focus on first today?",
    });
  } else if (currentHour < 18) {
    suggestions.push({
      label: "Check afternoon macros",
      prompt: "How many calories and protein do I have left for today?",
    });
    suggestions.push({
      label: "Start workout session",
      prompt: "Start my Push Day - Upper Body workout",
    });
    suggestions.push({
      label: "Prioritize pending tasks",
      prompt: "Help me prioritize my pending tasks and plan deep work.",
    });
  } else {
    suggestions.push({
      label: "Log high-protein dinner",
      prompt: "Review my nutrition today and suggest a high-protein dinner idea.",
    });
    suggestions.push({
      label: "Daily consistency review",
      prompt: "Give me an honest assessment of my weekly consistency and momentum.",
    });
    suggestions.push({
      label: "View remaining macros",
      prompt: "How many calories and protein do I have left for today?",
    });
  }

  return suggestions.slice(0, 3);
}


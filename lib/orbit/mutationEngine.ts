// lib/orbit/mutationEngine.ts
/**
 * SATAT Universal Orbit Tool Calling, CRUD Mutation & Contextual Suggestion Engine
 * Across All Editable Domains:
 * 1. Workouts & Exercises (Training Studio)
 * 2. Tasks & Schedules (Execution Studio / Plans)
 * 3. Meals & Macros (Fuel Studio)
 * 4. Daily Non-Negotiable Rituals & Habits (Hydration, Steps, Journal)
 * 5. Sprints & Study Milestones (60-Day Placement Sprint / LeetCode Trackers)
 */

import { adminDb } from "@/lib/firebaseAdmin";
import type { MealEntry, MealMacros, WorkoutSession, Task } from "@/types";
import type {
  OrbitEntityContext,
  OrbitSuggestedAction,
  OrbitActionExecuted,
  OrbitActionType,
} from "@/types/orbit";

// ── Types & Parameter Schemas ─────────────────────────────────────────────────

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
  entryId?: string;
  date?: string;
  updates: {
    name?: string;
    macros?: Partial<MealMacros>;
    items?: DietItemInput[];
  };
}

export interface DeleteDietParams {
  userId: string;
  entryId?: string;
  mealType?: string;
  date?: string;
}

export interface WorkoutSetInput {
  setNumber?: number;
  reps: number;
  weight?: number;
  unit?: "kg" | "lbs" | "bodyweight" | "km" | "miles";
  completed?: boolean;
  durationSeconds?: number;
  distance?: number;
  distanceUnit?: string;
}

export interface StartWorkoutParams {
  userId: string;
  routineTitle: string;
  date?: string;
}

export interface UpdateWorkoutParams {
  userId: string;
  sessionId?: string;
  date?: string;
  exerciseName?: string;
  exerciseId?: string;
  exerciseIndex?: number;
  setIndex?: number;
  repDelta?: number;
  isAppendSet?: boolean;
  sets: WorkoutSetInput[];
}

export interface AddExerciseParams {
  userId: string;
  sessionId?: string;
  date?: string;
  exerciseName: string;
  movementType?: "strength" | "isometric" | "cardio" | "calisthenics";
  distance?: number;
  distanceUnit?: string;
  durationSeconds?: number;
  sets: WorkoutSetInput[];
}

export interface DeleteExerciseParams {
  userId: string;
  sessionId?: string;
  date?: string;
  exerciseName?: string;
  exerciseIndex?: number;
}

export interface CompleteWorkoutParams {
  userId: string;
  sessionId?: string;
  date?: string;
  durationMinutes?: number;
}

export interface CreateTaskParams {
  userId: string;
  title: string;
  durationMinutes?: number;
  scheduledTime?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
}

export interface RescheduleTaskParams {
  userId: string;
  taskId?: string;
  taskTitle?: string;
  scheduledTime: string;
  dueDate?: string;
}

export interface CompleteTaskParams {
  userId: string;
  taskId?: string;
  taskTitle?: string;
}

export interface DeleteTaskParams {
  userId: string;
  taskId?: string;
  taskTitle?: string;
  scheduledTime?: string;
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

export interface LogRitualParams {
  userId: string;
  ritualType: "hydration" | "steps" | "journal" | "hydration_and_steps";
  amountMl?: number;
  steps?: number;
  reflection?: string;
  date?: string;
}

export interface UpdateSprintParams {
  userId: string;
  platform?: string;
  problems?: string[];
  topic?: string;
  count?: number;
  sprintDay?: number;
  date?: string;
}

export interface ParsedMutation {
  type: OrbitActionType;
  domain: "meals" | "workouts" | "tasks" | "rituals" | "sprints";
  params: any;
}

export interface ClarificationResult {
  type: "CLARIFICATION_NEEDED";
  domain: "workouts" | "tasks" | "meals";
  missingParam: "sets" | "time" | "duration" | "exerciseName" | "title";
  clarificationMessage: string;
  suggestedActions: OrbitSuggestedAction[];
  updatedContext: OrbitEntityContext;
  params?: Record<string, any>;
}

export type ParseMutationResult = ParsedMutation | ClarificationResult | null;

// ── Time & String Helpers ─────────────────────────────────────────────────────

export function parseTimeString(timeStr: string): string {
  const clean = timeStr.trim().toLowerCase();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return "17:00";
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// ── Macro Estimation Heuristics for Indian Food & Common Items ─────────────────

export function estimateMacrosForDish(rawName: string, portion?: string): MealMacros {
  const text = `${portion ?? ""} ${rawName}`.toLowerCase();

  // 1. Grams of Rice (e.g. "400g rice" -> 400 * 1.3 kcal/g = 520 kcal)
  const riceGramMatch = text.match(/(\d+)\s*g(?:rams?)?\s+(?:of\s+)?(?:white\s+|brown\s+|basmati\s+|steamed\s+)?rice/i);
  if (riceGramMatch) {
    const grams = parseFloat(riceGramMatch[1]) || 400;
    const factor = grams / 100;
    return {
      calories: Math.round(130 * factor),
      proteinG: Math.round(2.7 * factor),
      carbsG: Math.round(28 * factor),
      fatG: Math.round(0.3 * factor),
    };
  }

  if (/\brice\b/i.test(text) && !/\bcauliflower\b/i.test(text)) {
    return { calories: 195, proteinG: 4, carbsG: 42, fatG: 0.5 };
  }

  // 2. Chapatis / Roti (e.g. "3 chapatis" -> ~104 kcal, 3g protein, 18g carbs, 2.5g fat each)
  const chapatiCountMatch = text.match(/(\d+)\s*(?:chapatis?|rotis?|phulkas?)/i);
  if (chapatiCountMatch) {
    const count = parseInt(chapatiCountMatch[1], 10) || 1;
    return {
      calories: Math.round(count * 104),
      proteinG: Math.round(count * 3.1),
      carbsG: Math.round(count * 18),
      fatG: Math.round(count * 2.3),
    };
  }

  if (/\b(chapati|roti|phulka)\b/i.test(text)) {
    return { calories: 104, proteinG: 3, carbsG: 18, fatG: 2.3 };
  }

  // 3. Salad (e.g. cucumber, tomato, onion mix ~ 50 kcal)
  if (/\bsalad\b/i.test(text) || /\bcucumber\b/i.test(text)) {
    return { calories: 50, proteinG: 2, carbsG: 9, fatG: 0.5, fiberG: 3 };
  }

  // 4. Eggs (e.g. "2 boiled eggs" -> 74 kcal, 6.3g protein each)
  const eggCountMatch = text.match(/(\d+)\s*(?:boiled\s+)?eggs?/i);
  if (eggCountMatch) {
    const count = parseInt(eggCountMatch[1], 10) || 1;
    return {
      calories: Math.round(count * 74),
      proteinG: Math.round(count * 6.3),
      carbsG: Math.round(count * 0.6),
      fatG: Math.round(count * 5.0),
    };
  }

  if (/\beggs?\b/i.test(text)) {
    return { calories: 74, proteinG: 6, carbsG: 1, fatG: 5 };
  }

  // 5. Paneer / Paneer Vegetables (e.g. "yellow paneer fried vegetables" ~ 320 kcal, 16g protein)
  if (/\bpaneer\b/i.test(text)) {
    return { calories: 320, proteinG: 16, carbsG: 12, fatG: 22 };
  }

  // 6. Dal / Lentils (e.g. "dal tadka", "yellow dal" ~ 180 kcal, 9g protein, 24g carbs, 5g fat)
  if (/\bdal\b/i.test(text) || /\blentils?\b/i.test(text)) {
    return { calories: 180, proteinG: 9, carbsG: 24, fatG: 5, fiberG: 4 };
  }

  // 7. Chicken Breast (e.g. "chicken breast", "grilled chicken" ~ 220 kcal, 38g protein, 0g carbs, 4g fat)
  if (/\bchicken\b/i.test(text)) {
    return { calories: 220, proteinG: 38, carbsG: 0, fatG: 4 };
  }

  // 8. Unsweetened Black/Green Tea & Black Coffee
  if (/\b(black|green|herbal|lemon|iced)\s*(tea|chai|coffee)\b/i.test(text)) {
    return { calories: 5, proteinG: 0, carbsG: 1, fatG: 0 };
  }

  // 9. Indian Chai / Milk Tea / Coffee
  if (/\b(tea|chai|coffee|latte|cappuccino|espresso)\b/i.test(text)) {
    return { calories: 65, proteinG: 2, carbsG: 9, fatG: 2 };
  }

  // 10. Yoghurt / Yogurt / Curd / Dahi / Raita
  if (/\b(curd|yoghurt|yogurt|dahi|raita)\b/i.test(text)) {
    return { calories: 100, proteinG: 4, carbsG: 6, fatG: 5 };
  }

  // 11. Potato Sabzi / Aloo / Vegetable Sabzi (only when not paneer-based)
  if (/\b(sabzi|sabji|potato|aloo|bhindi|gobi|matar|vegetables?)\b/i.test(text) && !/\bpaneer\b/i.test(text)) {
    return { calories: 150, proteinG: 3, carbsG: 22, fatG: 6, fiberG: 3 };
  }

  // 12. Banana(s)
  const bananaCountMatch = text.match(/(\d+)\s*bananas?\b/i);
  if (bananaCountMatch) {
    const count = parseInt(bananaCountMatch[1], 10) || 1;
    return {
      calories: Math.round(105 * count),
      proteinG: Math.round(1.3 * count),
      carbsG: Math.round(27 * count),
      fatG: Math.round(0.4 * count),
      fiberG: Math.round(3 * count),
    };
  }
  if (/\bbananas?\b/i.test(text)) {
    return { calories: 105, proteinG: 1, carbsG: 27, fatG: 0, fiberG: 3 };
  }

  // 13. Poha / Upma / Uttapam
  if (/\b(poha|upma|uttapam)\b/i.test(text)) {
    return { calories: 250, proteinG: 5, carbsG: 45, fatG: 5, fiberG: 3 };
  }

  // 14. Idli / Dosa
  const idliCountMatch = text.match(/(\d+)\s*idlis?\b/i);
  if (idliCountMatch) {
    const count = parseInt(idliCountMatch[1], 10) || 1;
    return {
      calories: Math.round(65 * count),
      proteinG: Math.round(2 * count),
      carbsG: Math.round(13 * count),
      fatG: Math.round(0.5 * count),
    };
  }
  if (/\b(dosa|idli)\b/i.test(text)) {
    return { calories: 180, proteinG: 5, carbsG: 32, fatG: 4 };
  }

  // 15. Whey / Protein Shake / Mass Gainer
  if (/\b(weight\s+gainer|mass\s+gainer)\b/i.test(text)) {
    return { calories: 380, proteinG: 25, carbsG: 62, fatG: 3 };
  }
  if (/\b(whey|protein\s+shake)\b/i.test(text)) {
    return { calories: 130, proteinG: 24, carbsG: 3, fatG: 2 };
  }

  // 16. Oats / Oatmeal / Porridge / Muesli
  if (/\b(oats?|oatmeal|porridge|muesli)\b/i.test(text)) {
    return { calories: 190, proteinG: 7, carbsG: 32, fatG: 4, fiberG: 5 };
  }

  // 17. Milk / Lassi / Buttermilk
  if (/\b(buttermilk|chaas)\b/i.test(text)) {
    return { calories: 45, proteinG: 2, carbsG: 4, fatG: 2 };
  }
  if (/\b(milk|lassi)\b/i.test(text)) {
    return { calories: 120, proteinG: 6, carbsG: 12, fatG: 5 };
  }

  // 18. Toast / Bread / Sandwich
  if (/\b(toast|bread|sandwich)\b/i.test(text)) {
    return { calories: 160, proteinG: 5, carbsG: 28, fatG: 3 };
  }

  // Default balanced dish estimate
  return { calories: 250, proteinG: 10, carbsG: 30, fatG: 8 };
}

// ── 1. Fuel Studio CRUD Handlers (Meals & Macros) ──────────────────────────────

export async function upsert_diet_entry(params: UpsertDietParams): Promise<{
  mealId: string;
  isNew: boolean;
  meal: MealEntry;
  activeContext: OrbitEntityContext;
}> {
  const { userId, date, mealType, items } = params;
  if (!userId) throw new Error("Missing required userId for upsert_diet_entry");

  const targetDate = date || new Date().toLocaleDateString("en-CA");
  const normalizedSlot = (mealType || "lunch").toLowerCase();

  let addedCalories = 0;
  let addedProtein = 0;
  let addedCarbs = 0;
  let addedFat = 0;
  let addedFiber = 0;

  const itemNames: string[] = [];

  for (const item of items) {
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

  const snap = await adminDb
    .collection("meals")
    .where("userId", "==", userId)
    .where("date", "==", targetDate)
    .get();

  const userMeals: MealEntry[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  const existingMeal = userMeals.find((m) =>
    (m.mealType || "").toLowerCase() === normalizedSlot ||
    (m.name || "").toLowerCase().includes(normalizedSlot)
  );

  const slotTitle = normalizedSlot.charAt(0).toUpperCase() + normalizedSlot.slice(1);

  if (existingMeal) {
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
      mealType: normalizedSlot,
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
    const newName = `${slotTitle}: ${itemNames.join(", ")}`;
    const newMacros: MealMacros = {
      calories: Math.round(addedCalories),
      proteinG: Math.round(addedProtein),
      carbsG: Math.round(addedCarbs),
      fatG: Math.round(addedFat),
      fiberG: Math.round(addedFiber),
    };

    const docData: any = {
      userId,
      date: targetDate,
      name: newName,
      mealType: normalizedSlot,
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
    const todayStr = params.date || new Date().toLocaleDateString("en-CA");
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

export async function delete_diet_entry(params: DeleteDietParams): Promise<{
  mealId: string;
  status: "success";
}> {
  const { userId, entryId, mealType, date } = params;
  if (!userId) throw new Error("Missing required userId for delete_diet_entry");

  let targetId = entryId;
  if (!targetId && mealType) {
    const targetDate = date || new Date().toLocaleDateString("en-CA");
    const snap = await adminDb
      .collection("meals")
      .where("userId", "==", userId)
      .where("date", "==", targetDate)
      .get();

    const match = snap.docs.find((d) =>
      ((d.data() as any).name || "").toLowerCase().includes(mealType.toLowerCase())
    );
    if (match) targetId = match.id;
  }

  if (!targetId) {
    throw new Error("Meal entry not found to delete");
  }

  await adminDb.collection("meals").doc(targetId).delete?.();
  return { mealId: targetId, status: "success" };
}

// ── 2. Training Studio CRUD Handlers (Workouts & Exercises) ───────────────────

export async function start_workout_session(params: StartWorkoutParams): Promise<{
  sessionId: string;
  routineTitle: string;
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, routineTitle } = params;
  if (!userId) throw new Error("Missing required userId for start_workout_session");

  const todayStr = params.date || new Date().toLocaleDateString("en-CA");
  const snap = await adminDb
    .collection("workouts")
    .where("userId", "==", userId)
    .where("date", "==", todayStr)
    .get();

  let sessionDoc = snap.docs[0];
  let sessionId = sessionDoc?.id;

  if (sessionId) {
    const patch = {
      title: routineTitle,
      name: routineTitle,
      routineTitle,
      summary: routineTitle,
      status: "in-progress",
      updatedAt: new Date().toISOString(),
    };
    const ref = adminDb.collection("workouts").doc(sessionId);
    if (typeof ref.set === "function") {
      await ref.set(patch, { merge: true });
    } else {
      await ref.update(patch);
    }
  } else {
    const newSession = {
      userId,
      date: todayStr,
      title: routineTitle,
      name: routineTitle,
      routineTitle,
      summary: routineTitle,
      status: "in-progress",
      movements: [],
      exercises: [],
      duration: 45,
      durationMinutes: 45,
      createdAt: Date.now(),
      updatedAt: new Date().toISOString(),
    };
    const ref = await adminDb.collection("workouts").add(newSession);
    sessionId = ref.id;
  }

  return {
    sessionId,
    routineTitle,
    status: "success",
    activeContext: {
      activeWorkoutId: sessionId,
      activeWorkoutName: routineTitle,
    },
  };
}

export async function update_workout_session(params: UpdateWorkoutParams): Promise<{
  sessionId: string;
  exerciseName: string;
  sets: WorkoutSetInput[];
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, exerciseName = "Workout Exercise", sets, exerciseIndex, repDelta, isAppendSet } = params;
  if (!userId) throw new Error("Missing required userId for update_workout_session");

  const todayStr = params.date || new Date().toLocaleDateString("en-CA");
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

  const isIsometric =
    sets.some((s) => s.durationSeconds && s.durationSeconds > 0) ||
    /\b(plank|side\s+plank|wall\s+sit|dead\s+hang|l-sit|hollow\s+body|hold)\b/i.test(normalizedExName);

  const dur = sets.find((s) => s.durationSeconds)?.durationSeconds || 45;

  const formattedSets = sets.map((s, idx) => ({
    id: `set-${Date.now()}-${idx}`,
    reps: s.reps,
    weight: s.weight ?? 0,
    unit: s.unit ?? (isIsometric ? ("bodyweight" as const) : ("kg" as const)),
    completed: s.completed ?? true,
    ...(s.durationSeconds ? { durationSeconds: s.durationSeconds } : {}),
  }));

  const movement = isIsometric
    ? {
        id: `movement-${Date.now()}`,
        name: normalizedExName,
        type: "isometric",
        duration: dur,
        durationUnit: "seconds",
        sets: [
          {
            setNumber: 1,
            reps: 1,
            duration: dur,
            durationSeconds: dur,
            weight: 0,
            completed: true,
          },
        ],
        completed: true,
      }
    : {
        id: `movement-${Date.now()}`,
        name: normalizedExName,
        type: "strength",
        sets: sets.map((s, idx) => ({
          setNumber: idx + 1,
          reps: s.reps,
          weight: s.weight ?? 0,
          unit: s.unit || "kg",
          completed: s.completed ?? true,
        })),
        completed: true,
      };

  const newExercise = isIsometric
    ? {
        id: `ex-${Date.now()}`,
        name: normalizedExName,
        type: "isometric",
        duration: dur,
        durationUnit: "seconds",
        sets: formattedSets,
      }
    : {
        id: `ex-${Date.now()}`,
        name: normalizedExName,
        type: "strength",
        sets: formattedSets,
      };

  if (!session) {
    const newSession = {
      userId,
      date: todayStr,
      title: "Daily Workout",
      name: "Daily Workout",
      routineTitle: "Daily Workout",
      status: "in-progress",
      duration: 45,
      durationMinutes: 45,
      movements: [movement],
      exercises: [newExercise],
      createdAt: Date.now(),
      updatedAt: new Date().toISOString(),
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
        activeExerciseIndex: 0,
      },
    };
  }

  const exercises: any[] = session.exercises || [];
  const movements: any[] = session.movements || [];
  let existingExIndex = -1;

  if (typeof exerciseIndex === "number" && exerciseIndex >= 0 && exerciseIndex < exercises.length) {
    existingExIndex = exerciseIndex;
  } else {
    existingExIndex = exercises.findIndex(
      (e) => (e.name || "").trim().toLowerCase() === lowerExName
    );

    if (existingExIndex === -1 && lowerExName !== "workout exercise") {
      existingExIndex = exercises.findIndex((e) => {
        const n = (e.name || "").toLowerCase();
        return n.includes(lowerExName) || lowerExName.includes(n);
      });
    }

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

  // If no exercise matched but exercises exist and this is a rep increment or un-named follow-up
  if (existingExIndex === -1 && exercises.length > 0 && (repDelta || lowerExName === "workout exercise")) {
    existingExIndex = 0; // target the active/first exercise
  }

  let targetExName = normalizedExName;
  let finalSets: WorkoutSetInput[] = sets;

  if (existingExIndex !== -1) {
    targetExName = exercises[existingExIndex].name;
    const existingSets = exercises[existingExIndex].sets || [];

    if (repDelta && existingSets.length > 0) {
      // Multi-turn rep increment: "Add 2 more reps"
      const prevSet = existingSets[0];
      const newReps = (prevSet.reps || 10) + repDelta;
      const updatedSets = [
        {
          id: prevSet.id || `set-${Date.now()}`,
          reps: newReps,
          weight: prevSet.weight ?? 0,
          unit: prevSet.unit || "kg",
          completed: true,
        },
      ];
      exercises[existingExIndex].sets = updatedSets;
      finalSets = updatedSets.map((s) => ({
        reps: s.reps,
        weight: s.weight,
        unit: s.unit as any,
        completed: s.completed,
      }));
    } else if (isAppendSet) {
      // Append set: "Add a 4th set of 8 reps with 26kg"
      const newSetObj = {
        id: `set-${Date.now()}-${existingSets.length}`,
        reps: sets[0]?.reps || 10,
        weight: sets[0]?.weight ?? (existingSets[0]?.weight ?? 0),
        unit: sets[0]?.unit || (existingSets[0]?.unit ?? "kg"),
        completed: true,
      };
      exercises[existingExIndex].sets = [...existingSets, newSetObj];
      finalSets = exercises[existingExIndex].sets.map((s: any) => ({
        reps: s.reps,
        weight: s.weight,
        unit: s.unit,
        completed: s.completed,
      }));
    } else {
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
          ...(s.durationSeconds ? { durationSeconds: s.durationSeconds } : {}),
        };
      });
      exercises[existingExIndex].sets = updatedSets;
      finalSets = updatedSets.map((s) => ({
        reps: s.reps,
        weight: s.weight,
        unit: s.unit as "kg" | "lbs" | "bodyweight",
        completed: s.completed,
        ...(s.durationSeconds ? { durationSeconds: s.durationSeconds } : {}),
      }));
    }

    // Sync corresponding movement
    const movementSets = finalSets.map((s, idx) => ({
      setNumber: idx + 1,
      reps: s.reps,
      weight: s.weight ?? 0,
      unit: s.unit || "kg",
      completed: s.completed ?? true,
      ...(s.durationSeconds ? { duration: s.durationSeconds, durationSeconds: s.durationSeconds } : {}),
    }));

    let mIdx = movements.findIndex((m: any) => (m.name || "").trim().toLowerCase() === lowerExName);
    if (mIdx === -1 && existingExIndex < movements.length) mIdx = existingExIndex;
    if (mIdx !== -1) {
      movements[mIdx].sets = movementSets;
    } else {
      movements.push({
        id: `movement-${Date.now()}`,
        name: targetExName,
        type: isIsometric ? "isometric" : "strength",
        sets: movementSets,
        completed: true,
      });
    }
  } else {
    exercises.push(newExercise);
    movements.push(movement);
  }

  const updatedSessionData: any = {
    exercises,
    movements,
    status: session.status || "in-progress",
    title: session.title || session.name || session.routineTitle || "Daily Workout",
    name: session.name || session.title || session.routineTitle || "Daily Workout",
    duration: session.duration || session.durationMinutes || 45,
    durationMinutes: session.durationMinutes || session.duration || 45,
    updatedAt: new Date().toISOString(),
  };

  const docRef = adminDb.collection("workouts").doc(session.id);
  if (typeof docRef.set === "function") {
    await docRef.set(updatedSessionData, { merge: true });
  } else {
    await docRef.update(updatedSessionData);
  }

  return {
    sessionId: session.id,
    exerciseName: targetExName,
    sets: finalSets,
    status: "success",
    activeContext: {
      activeWorkoutId: session.id,
      activeExerciseName: targetExName,
      activeExerciseIndex: existingExIndex !== -1 ? existingExIndex : exercises.length - 1,
    },
  };
}

export async function add_exercise_to_workout(params: AddExerciseParams): Promise<{
  sessionId: string;
  exerciseName: string;
  sets: WorkoutSetInput[];
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, exerciseName, sets, movementType, distance, distanceUnit } = params;
  if (!userId) throw new Error("Missing required userId for add_exercise_to_workout");

  const todayStr = params.date || new Date().toLocaleDateString("en-CA");
  const snap = await adminDb
    .collection("workouts")
    .where("userId", "==", userId)
    .where("date", "==", todayStr)
    .get();

  let session = snap.docs[0] ? { id: snap.docs[0].id, ...(snap.docs[0].data() as any) } : null;

  const normalizedExName = exerciseName.trim();
  const isIsometric =
    movementType === "isometric" ||
    sets.some((s) => s.durationSeconds && s.durationSeconds > 0) ||
    /\b(plank|side\s+plank|wall\s+sit|dead\s+hang|l-sit|hollow\s+body|hold)\b/i.test(normalizedExName);

  const isCardio =
    movementType === "cardio" ||
    distance !== undefined ||
    sets.some((s) => s.distance !== undefined) ||
    /\b(running|run|jogging|jog|cycling|cycle|biking|bike|treadmill|rowing|swimming|walking)\b/i.test(normalizedExName);

  const isCalisthenics =
    movementType === "calisthenics" ||
    /\b(skipping|skip\s*rope|jump\s*rope|pull\s*ups?|chin\s*ups?|push\s*ups?|dips?|crunches|burpees|jumping\s*jacks?)\b/i.test(normalizedExName);

  const dur = sets.find((s) => s.durationSeconds)?.durationSeconds || (params.durationSeconds ? params.durationSeconds : 45);

  let movement: any;
  let newExercise: any;
  let newCardioLog: any = null;

  if (isCardio) {
    const dist = distance ?? sets.find((s) => s.distance !== undefined)?.distance ?? 2.5;
    const distUnit = distanceUnit ?? sets.find((s) => s.distanceUnit)?.distanceUnit ?? "km";
    const cardioDurMinutes = Math.round(dur / 60) || 20;

    movement = {
      id: `movement-${Date.now()}`,
      name: normalizedExName,
      type: "cardio",
      distance: dist,
      distanceUnit: distUnit,
      duration: dur,
      durationUnit: "seconds",
      sets: sets.map((s, idx) => ({
        setNumber: idx + 1,
        reps: s.reps ?? 1,
        distance: s.distance ?? dist,
        distanceUnit: s.distanceUnit ?? distUnit,
        weight: 0,
        unit: distUnit,
        completed: true,
      })),
      completed: true,
    };

    newExercise = {
      id: `ex-${Date.now()}`,
      name: normalizedExName,
      type: "cardio",
      distance: dist,
      distanceUnit: distUnit,
      sets: sets.map((s, idx) => ({
        id: `set-${Date.now()}-${idx}`,
        reps: s.reps ?? 1,
        distance: s.distance ?? dist,
        distanceUnit: s.distanceUnit ?? distUnit,
        weight: 0,
        unit: distUnit as any,
        completed: true,
      })),
    };

    const cardioActivity = (normalizedExName.toLowerCase().includes("run") ? "running" :
      normalizedExName.toLowerCase().includes("cycl") || normalizedExName.toLowerCase().includes("bik") ? "cycling" :
      normalizedExName.toLowerCase().includes("swim") ? "swimming" :
      normalizedExName.toLowerCase().includes("walk") ? "walking" :
      normalizedExName.toLowerCase().includes("row") ? "rowing" : "running");

    newCardioLog = {
      id: `cardio-${Date.now()}`,
      activity: cardioActivity,
      durationMinutes: cardioDurMinutes,
      distanceKm: distUnit === "miles" ? Math.round(dist * 1.609 * 10) / 10 : dist,
      caloriesBurned: Math.round(dist * 60),
    };
  } else if (isCalisthenics) {
    const formattedSets = sets.map((s, idx) => ({
      id: `set-${Date.now()}-${idx}`,
      reps: s.reps ?? 15,
      weight: 0,
      unit: "bodyweight" as const,
      completed: s.completed ?? true,
    }));

    movement = {
      id: `movement-${Date.now()}`,
      name: normalizedExName,
      type: "calisthenics",
      sets: sets.map((s, idx) => ({
        setNumber: idx + 1,
        reps: s.reps ?? 15,
        weight: 0,
        unit: "bodyweight",
        completed: true,
      })),
      completed: true,
    };

    newExercise = {
      id: `ex-${Date.now()}`,
      name: normalizedExName,
      type: "calisthenics",
      sets: formattedSets,
    };
  } else if (isIsometric) {
    movement = {
      id: `movement-${Date.now()}`,
      name: normalizedExName,
      type: "isometric",
      duration: dur,
      durationUnit: "seconds",
      sets: [
        {
          setNumber: 1,
          reps: 1,
          duration: dur,
          durationSeconds: dur,
          weight: 0,
          completed: true,
        },
      ],
      completed: true,
    };

    newExercise = {
      id: `ex-${Date.now()}`,
      name: normalizedExName,
      type: "isometric",
      duration: dur,
      durationUnit: "seconds",
      sets: [
        {
          id: `set-${Date.now()}-0`,
          reps: 1,
          weight: 0,
          unit: "bodyweight" as const,
          completed: true,
          durationSeconds: dur,
        },
      ],
    };
  } else {
    const formattedSets = sets.map((s, idx) => ({
      id: `set-${Date.now()}-${idx}`,
      reps: s.reps ?? 10,
      weight: s.weight ?? 0,
      unit: s.unit ?? "kg",
      completed: s.completed ?? true,
      ...(s.durationSeconds ? { durationSeconds: s.durationSeconds } : {}),
    }));

    movement = {
      id: `movement-${Date.now()}`,
      name: normalizedExName,
      type: "strength",
      sets: sets.map((s, idx) => ({
        setNumber: idx + 1,
        reps: s.reps ?? 10,
        weight: s.weight ?? 0,
        unit: s.unit || "kg",
        completed: s.completed ?? true,
      })),
      completed: true,
    };

    newExercise = {
      id: `ex-${Date.now()}`,
      name: normalizedExName,
      type: "strength",
      sets: formattedSets,
    };
  }

  if (!session) {
    const newSession: any = {
      userId,
      date: todayStr,
      title: "Daily Workout",
      name: "Daily Workout",
      routineTitle: "Daily Workout",
      status: "in-progress",
      duration: 45,
      durationMinutes: 45,
      movements: [movement],
      exercises: [newExercise],
      cardioLogs: newCardioLog ? [newCardioLog] : [],
      createdAt: Date.now(),
      updatedAt: new Date().toISOString(),
    };
    const ref = await adminDb.collection("workouts").add(newSession);
    return {
      sessionId: ref.id,
      exerciseName: normalizedExName,
      sets,
      status: "success",
      activeContext: {
        activeWorkoutId: ref.id,
        activeExerciseName: normalizedExName,
        activeExerciseIndex: 0,
      },
    };
  }

  const existingExercises = session.exercises || [];
  const existingMovements = session.movements || [];
  const existingCardioLogs = session.cardioLogs || [];

  const exercises = [...existingExercises, newExercise];
  const movements = [...existingMovements, movement];
  const cardioLogs = newCardioLog ? [...existingCardioLogs, newCardioLog] : existingCardioLogs;

  const updatedSessionData: any = {
    exercises,
    movements,
    cardioLogs,
    status: session.status || "in-progress",
    title: session.title || session.name || session.routineTitle || "Daily Workout",
    name: session.name || session.title || session.routineTitle || "Daily Workout",
    duration: session.duration || session.durationMinutes || 45,
    durationMinutes: session.durationMinutes || session.duration || 45,
    updatedAt: new Date().toISOString(),
  };

  const docRef = adminDb.collection("workouts").doc(session.id);
  if (typeof docRef.set === "function") {
    await docRef.set(updatedSessionData, { merge: true });
  } else {
    await docRef.update(updatedSessionData);
  }

  return {
    sessionId: session.id,
    exerciseName: normalizedExName,
    sets,
    status: "success",
    activeContext: {
      activeWorkoutId: session.id,
      activeExerciseName: normalizedExName,
      activeExerciseIndex: exercises.length - 1,
    },
  };
}

export async function delete_exercise_from_workout(params: DeleteExerciseParams): Promise<{
  sessionId: string;
  exerciseName?: string;
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, exerciseName } = params;
  const todayStr = params.date || new Date().toLocaleDateString("en-CA");
  const snap = await adminDb
    .collection("workouts")
    .where("userId", "==", userId)
    .where("date", "==", todayStr)
    .get();

  const sessionDoc = snap.docs[0];
  if (!sessionDoc) throw new Error("No active workout session found to remove exercise");

  const session = sessionDoc.data() as any;
  const exercises: any[] = session.exercises || [];
  const movements: any[] = session.movements || [];
  const lower = (exerciseName || "").toLowerCase();

  const filteredExercises = exercises.filter((e) => !(e.name || "").toLowerCase().includes(lower));
  const filteredMovements = movements.filter((m) => !(m.name || "").toLowerCase().includes(lower));
  await adminDb.collection("workouts").doc(sessionDoc.id).update({
    exercises: filteredExercises,
    movements: filteredMovements,
    updatedAt: new Date().toISOString(),
  });

  return {
    sessionId: sessionDoc.id,
    exerciseName,
    status: "success",
    activeContext: {
      activeWorkoutId: sessionDoc.id,
    },
  };
}

export async function complete_workout_session(params: CompleteWorkoutParams): Promise<{
  sessionId: string;
  status: "success";
}> {
  const { userId, sessionId } = params;
  const todayStr = params.date || new Date().toLocaleDateString("en-CA");

  const snap = await adminDb
    .collection("workouts")
    .where("userId", "==", userId)
    .where("date", "==", todayStr)
    .get();

  const targetId = sessionId || snap.docs[0]?.id;
  if (!targetId) throw new Error("No active workout session found to complete");

  await adminDb.collection("workouts").doc(targetId).update({
    completed: true,
    completedAt: Date.now(),
    durationMinutes: params.durationMinutes || 45,
  });

  return { sessionId: targetId, status: "success" };
}

// ── 3. Execution Studio CRUD Handlers (Tasks & Schedules) ─────────────────────

export async function create_task_entry(params: CreateTaskParams): Promise<{
  taskId: string;
  title: string;
  durationMinutes: number;
  scheduledTime: string;
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, title, durationMinutes = 25, scheduledTime = "17:00", priority = "medium" } = params;
  if (!userId) throw new Error("Missing required userId for create_task_entry");

  const todayStr = params.dueDate || new Date().toLocaleDateString("en-CA");
  const docData = {
    userId,
    title,
    durationMinutes,
    scheduledTime,
    dueDate: todayStr,
    status: "pending",
    priority,
    createdAt: Date.now(),
    projectId: "default",
    frequency: "daily",
  };

  const ref = await adminDb.collection("tasks").add(docData);

  return {
    taskId: ref.id,
    title,
    durationMinutes,
    scheduledTime,
    status: "success",
    activeContext: {
      activeTaskId: ref.id,
      activeTaskTitle: title,
    },
  };
}

export async function reschedule_task_entry(params: RescheduleTaskParams): Promise<{
  taskId: string;
  title: string;
  scheduledTime: string;
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, taskId, taskTitle, scheduledTime } = params;
  if (!userId) throw new Error("Missing required userId for reschedule_task_entry");

  let resolvedId = taskId;
  let targetTitle = taskTitle || "Task";

  if (!resolvedId) {
    const snap = await adminDb
      .collection("tasks")
      .where("userId", "==", userId)
      .get();

    const tasks: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (taskTitle) {
      const lower = taskTitle.toLowerCase();
      const match = tasks.find((t) => (t.title || "").toLowerCase().includes(lower));
      if (match) {
        resolvedId = match.id;
        targetTitle = match.title;
      }
    } else if (tasks.length > 0) {
      const latest = tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      resolvedId = latest.id;
      targetTitle = latest.title;
    }
  }

  if (!resolvedId) {
    throw new Error("No task found to reschedule");
  }

  await adminDb.collection("tasks").doc(resolvedId).update({
    scheduledTime,
    updatedAt: Date.now(),
  });

  return {
    taskId: resolvedId,
    title: targetTitle,
    scheduledTime,
    status: "success",
    activeContext: {
      activeTaskId: resolvedId,
      activeTaskTitle: targetTitle,
    },
  };
}

export async function complete_task_entry(params: CompleteTaskParams): Promise<{
  taskId: string;
  title: string;
  status: "success";
}> {
  const { userId, taskId, taskTitle } = params;
  let resolvedId = taskId;
  let targetTitle = taskTitle || "Task";

  if (!resolvedId) {
    const snap = await adminDb.collection("tasks").where("userId", "==", userId).get();
    const tasks: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (taskTitle) {
      const match = tasks.find((t) => (t.title || "").toLowerCase().includes(taskTitle.toLowerCase()));
      if (match) {
        resolvedId = match.id;
        targetTitle = match.title;
      }
    } else if (tasks.length > 0) {
      resolvedId = tasks[0].id;
      targetTitle = tasks[0].title;
    }
  }

  if (!resolvedId) throw new Error("No task found to complete");

  await adminDb.collection("tasks").doc(resolvedId).update({
    status: "completed",
    completedAt: Date.now(),
  });

  return { taskId: resolvedId, title: targetTitle, status: "success" };
}

export async function delete_task_entry(params: DeleteTaskParams): Promise<{
  taskId: string;
  title: string;
  status: "success";
}> {
  const { userId, taskId, taskTitle, scheduledTime } = params;
  let resolvedId = taskId;
  let targetTitle = taskTitle || "Task";

  if (!resolvedId) {
    const snap = await adminDb.collection("tasks").where("userId", "==", userId).get();
    const tasks: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (taskTitle) {
      const match = tasks.find((t) => (t.title || "").toLowerCase().includes(taskTitle.toLowerCase()));
      if (match) {
        resolvedId = match.id;
        targetTitle = match.title;
      }
    } else if (scheduledTime) {
      const match = tasks.find((t) => t.scheduledTime === scheduledTime);
      if (match) {
        resolvedId = match.id;
        targetTitle = match.title;
      }
    } else if (tasks.length > 0) {
      resolvedId = tasks[0].id;
      targetTitle = tasks[0].title;
    }
  }

  if (!resolvedId) throw new Error("No task found to delete");

  await adminDb.collection("tasks").doc(resolvedId).delete?.();
  return { taskId: resolvedId, title: targetTitle, status: "success" };
}

export async function modify_plan_schedule(params: ModifyPlanParams): Promise<{
  taskId: string;
  status: "success";
}> {
  const { userId, planId, updates = {} } = params;
  if (!userId) throw new Error("Missing required userId for modify_plan_schedule");

  if (planId && planId !== "new") {
    await adminDb.collection("tasks").doc(planId).set(updates, { merge: true });
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

// ── 4. Daily Rituals & Bento Habits CRUD Handlers ─────────────────────────────

export async function log_ritual_entry(params: LogRitualParams): Promise<{
  ritualType: string;
  amountMl?: number;
  steps?: number;
  reflection?: string;
  currentTotalMl?: number;
  currentTotalSteps?: number;
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, ritualType, amountMl, steps, reflection, date } = params;
  if (!userId) throw new Error("Missing required userId for log_ritual_entry");

  const todayStr = date || new Date().toLocaleDateString("en-CA");

  const snap = await adminDb
    .collection("habits")
    .where("userId", "==", userId)
    .where("date", "==", todayStr)
    .get();

  const existingDoc = snap.docs[0];
  const existing = existingDoc ? (existingDoc.data() as any) : {};

  const updatedWater = (existing.waterMl || 0) + (amountMl || 0);
  const updatedSteps = steps !== undefined ? (existing.steps || 0) + steps : existing.steps;
  const updatedReflection = reflection || existing.reflection;

  const docData = {
    userId,
    date: todayStr,
    waterMl: updatedWater,
    steps: updatedSteps || 0,
    reflection: updatedReflection || "",
    updatedAt: Date.now(),
  };

  if (existingDoc) {
    await adminDb.collection("habits").doc(existingDoc.id).update(docData);
  } else {
    await adminDb.collection("habits").add(docData);
  }

  const activeHabitType =
    ritualType === "hydration_and_steps"
      ? "hydration"
      : (ritualType as "hydration" | "steps" | "journal");

  return {
    ritualType,
    amountMl,
    steps,
    reflection,
    currentTotalMl: updatedWater,
    currentTotalSteps: updatedSteps,
    status: "success",
    activeContext: {
      activeHabitType,
    },
  };
}

// ── 5. Sprints & Study Milestones CRUD Handlers ───────────────────────────────

export async function update_sprint_entry(params: UpdateSprintParams): Promise<{
  sprintId: string;
  platform: string;
  problems: string[];
  topic: string;
  count: number;
  status: "success";
  activeContext: OrbitEntityContext;
}> {
  const { userId, platform = "LeetCode", problems = [], topic = "dsa", count = 1, sprintDay = 1 } = params;
  if (!userId) throw new Error("Missing required userId for update_sprint_entry");

  const todayStr = params.date || new Date().toLocaleDateString("en-CA");
  const docData = {
    userId,
    date: todayStr,
    platform,
    problems,
    topic,
    count: problems.length > 0 ? problems.length : count,
    sprintDay,
    createdAt: Date.now(),
  };

  const ref = await adminDb.collection("sprints").add(docData);

  return {
    sprintId: ref.id,
    platform,
    problems,
    topic,
    count: docData.count,
    status: "success",
    activeContext: {
      activeSprintId: ref.id,
      activeSprintDay: sprintDay,
    },
  };
}

// ── Universal Mutation Dispatcher ─────────────────────────────────────────────

export async function executeMutation(
  userId: string,
  mutationIntent: ParsedMutation,
  currentContext: OrbitEntityContext = {},
  clientDate?: string
): Promise<{
  actionExecuted: OrbitActionExecuted;
  updatedContext: OrbitEntityContext;
  executedNote: string;
}> {
  const effectiveDate = clientDate || new Date().toLocaleDateString("en-CA");
  let nextContext: OrbitEntityContext = {
    ...currentContext,
    awaitingParam: undefined,
  };
  try {
    switch (mutationIntent.type) {
      // ── Meals
      case "UPSERT_MEAL": {
        const res = await upsert_diet_entry({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          mealType: mutationIntent.params.mealType,
          items: mutationIntent.params.items,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        const itemNames = (mutationIntent.params.items || []).map((i: any) => i.name).join(", ");
        const slot = mutationIntent.params.mealType;
        const note = res.isNew ? `Logged ${itemNames} to your ${slot}.` : `Added ${itemNames} to your ${slot}.`;

        return {
          actionExecuted: {
            type: "UPSERT_MEAL",
            status: "success",
            domain: "meals",
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
      }

      case "MODIFY_MEAL": {
        const res = await modify_diet_entry({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          entryId: mutationIntent.params.entryId,
          updates: mutationIntent.params.updates,
        });
        return {
          actionExecuted: {
            type: "MODIFY_MEAL",
            status: "success",
            domain: "meals",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Updated ${mutationIntent.params.entryId || "meal"} log.`,
        };
      }

      case "DELETE_MEAL": {
        const res = await delete_diet_entry({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          ...mutationIntent.params,
        });
        return {
          actionExecuted: {
            type: "DELETE_MEAL",
            status: "success",
            domain: "meals",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Removed ${mutationIntent.params.mealType || "meal"} entry.`,
        };
      }

      // ── Workouts
      case "START_WORKOUT": {
        const res = await start_workout_session({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          routineTitle: mutationIntent.params.routineTitle,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        return {
          actionExecuted: {
            type: "START_WORKOUT",
            status: "success",
            domain: "workouts",
            details: {
              sessionId: res.sessionId,
              routineTitle: res.routineTitle,
            },
          },
          updatedContext: nextContext,
          executedNote: `Started workout session: ${res.routineTitle}. Let's crush it!`,
        };
      }

      case "UPDATE_WORKOUT":
      case "UPDATE_WORKOUT_SET": {
        const res = await update_workout_session({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          exerciseName: mutationIntent.params.exerciseName,
          exerciseIndex: mutationIntent.params.exerciseIndex,
          setIndex: mutationIntent.params.setIndex,
          repDelta: mutationIntent.params.repDelta,
          isAppendSet: mutationIntent.params.isAppendSet,
          sets: mutationIntent.params.sets,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        const setsSummary = (res.sets || []).map((s: any) => `${s.reps} reps${s.weight ? ` @ ${s.weight}kg` : ""}`).join(", ");
        return {
          actionExecuted: {
            type: mutationIntent.type,
            status: "success",
            domain: "workouts",
            details: {
              sessionId: res.sessionId,
              exerciseName: res.exerciseName,
              sets: res.sets,
            },
          },
          updatedContext: nextContext,
          executedNote: `Updated ${res.exerciseName} sets: ${setsSummary}.`,
        };
      }

      case "ADD_EXERCISE": {
        const res = await add_exercise_to_workout({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          exerciseName: mutationIntent.params.exerciseName,
          sets: mutationIntent.params.sets,
          movementType: (mutationIntent.params as any).movementType,
          distance: (mutationIntent.params as any).distance,
          distanceUnit: (mutationIntent.params as any).distanceUnit,
          durationSeconds: (mutationIntent.params as any).durationSeconds,
        });
        nextContext = { ...nextContext, ...res.activeContext };

        let note = `Added ${res.exerciseName} (${res.sets[0]?.durationSeconds ? `${res.sets[0].durationSeconds}s` : `${res.sets.length} sets`}) to your workout.`;
        if ((mutationIntent.params as any).movementType === "cardio" && (mutationIntent.params as any).distance) {
          note = `Logged ${res.exerciseName} (${(mutationIntent.params as any).distance} ${(mutationIntent.params as any).distanceUnit || "km"}) to training.`;
        } else if ((mutationIntent.params as any).movementType === "calisthenics") {
          const setsCount = res.sets.length;
          const reps = res.sets[0]?.reps || 15;
          note = `Logged ${res.exerciseName} (${setsCount} sets × ${reps} reps, Bodyweight) to training.`;
        }

        return {
          actionExecuted: {
            type: "ADD_EXERCISE",
            status: "success",
            domain: "workouts",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: note,
        };
      }

      case "DELETE_EXERCISE": {
        const res = await delete_exercise_from_workout({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          exerciseName: mutationIntent.params.exerciseName,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        return {
          actionExecuted: {
            type: "DELETE_EXERCISE",
            status: "success",
            domain: "workouts",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Removed ${mutationIntent.params.exerciseName || "exercise"} from workout.`,
        };
      }

      case "COMPLETE_WORKOUT": {
        const res = await complete_workout_session({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          durationMinutes: mutationIntent.params.durationMinutes,
        });
        return {
          actionExecuted: {
            type: "COMPLETE_WORKOUT",
            status: "success",
            domain: "workouts",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Workout finished and logged to your daily streak!`,
        };
      }

      // ── Tasks & Schedules
      case "CREATE_TASK": {
        const resolvedDueDate = mutationIntent.params.dueDate || effectiveDate;
        const res = await create_task_entry({
          userId,
          title: mutationIntent.params.title,
          durationMinutes: mutationIntent.params.durationMinutes,
          scheduledTime: mutationIntent.params.scheduledTime,
          dueDate: resolvedDueDate,
          priority: mutationIntent.params.priority,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        return {
          actionExecuted: {
            type: "CREATE_TASK",
            status: "success",
            domain: "tasks",
            details: {
              taskId: res.taskId,
              title: res.title,
              durationMinutes: res.durationMinutes,
              scheduledTime: res.scheduledTime,
              priority: mutationIntent.params.priority || "medium",
              dueDate: resolvedDueDate,
            },
          },
          updatedContext: nextContext,
          executedNote: `Scheduled ${res.title} (${res.durationMinutes}m) at ${res.scheduledTime}.`,
        };
      }

      case "RESCHEDULE_TASK": {
        const res = await reschedule_task_entry({
          userId,
          taskId: mutationIntent.params.taskId || nextContext.activeTaskId,
          taskTitle: mutationIntent.params.taskTitle || nextContext.activeTaskTitle,
          scheduledTime: mutationIntent.params.scheduledTime,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        return {
          actionExecuted: {
            type: "RESCHEDULE_TASK",
            status: "success",
            domain: "tasks",
            details: {
              taskId: res.taskId,
              title: res.title,
              scheduledTime: res.scheduledTime,
            },
          },
          updatedContext: nextContext,
          executedNote: `Rescheduled ${res.title} to ${res.scheduledTime}.`,
        };
      }

      case "COMPLETE_TASK": {
        const res = await complete_task_entry({
          userId,
          taskId: mutationIntent.params.taskId || nextContext.activeTaskId,
          taskTitle: mutationIntent.params.taskTitle || nextContext.activeTaskTitle,
        });
        return {
          actionExecuted: {
            type: "COMPLETE_TASK",
            status: "success",
            domain: "tasks",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Checked off ${res.title}!`,
        };
      }

      case "DELETE_TASK": {
        const res = await delete_task_entry({
          userId,
          taskId: mutationIntent.params.taskId || nextContext.activeTaskId,
          taskTitle: mutationIntent.params.taskTitle || nextContext.activeTaskTitle,
          scheduledTime: mutationIntent.params.scheduledTime,
        });
        return {
          actionExecuted: {
            type: "DELETE_TASK",
            status: "success",
            domain: "tasks",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Removed task: ${res.title}.`,
        };
      }

      case "MODIFY_PLAN": {
        const res = await modify_plan_schedule({
          userId,
          dueDate: mutationIntent.params.dueDate || effectiveDate,
          ...mutationIntent.params,
        });
        return {
          actionExecuted: {
            type: "MODIFY_PLAN",
            status: "success",
            domain: "tasks",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Scheduled focus task: ${mutationIntent.params.title || "Focus block"}.`,
        };
      }

      // ── Daily Rituals & Habits
      case "LOG_RITUAL": {
        const res = await log_ritual_entry({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          ritualType: mutationIntent.params.ritualType,
          amountMl: mutationIntent.params.amountMl,
          steps: mutationIntent.params.steps,
          reflection: mutationIntent.params.reflection,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        let note = "Logged daily ritual.";
        if (res.ritualType === "hydration") note = `Logged ${res.amountMl}ml of water (Total: ${res.currentTotalMl}ml).`;
        else if (res.ritualType === "steps") note = `Logged ${res.steps?.toLocaleString()} steps (Total: ${res.currentTotalSteps?.toLocaleString()}).`;
        else if (res.ritualType === "hydration_and_steps") note = `Logged ${res.amountMl}ml water and ${res.steps?.toLocaleString()} steps.`;
        else if (res.ritualType === "journal") note = "Saved evening reflection to daily journal.";

        return {
          actionExecuted: {
            type: "LOG_RITUAL",
            status: "success",
            domain: "rituals",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: note,
        };
      }

      // ── Sprints & Study Milestones
      case "UPDATE_SPRINT_PROGRESS": {
        const res = await update_sprint_entry({
          userId,
          date: mutationIntent.params.date || effectiveDate,
          ...mutationIntent.params,
        });
        nextContext = { ...nextContext, ...res.activeContext };
        const probStr = res.problems.length > 0 ? res.problems.join(", ") : `${res.count} problems`;
        return {
          actionExecuted: {
            type: "UPDATE_SPRINT_PROGRESS",
            status: "success",
            domain: "sprints",
            details: res,
          },
          updatedContext: nextContext,
          executedNote: `Logged ${probStr} on ${res.platform} (${res.topic}). Placement sprint streak updated!`,
        };
      }

      default:
        throw new Error(`Unsupported mutation type: ${(mutationIntent as any).type}`);
    }
  } catch (err: any) {
    console.warn("[mutationEngine] Execution error:", err?.message);
    const domain = mutationIntent.domain || "tasks";
    const domainLabel =
      domain === "workouts"
        ? "workout session"
        : domain === "tasks"
        ? "task"
        : domain === "meals"
        ? "meal log"
        : "entry";

    const errorMsg = err?.message || "Execution failed";
    return {
      actionExecuted: {
        type: mutationIntent.type,
        status: "failed",
        domain,
        details: { error: errorMsg },
      },
      updatedContext: nextContext,
      executedNote: `Unable to save your ${domainLabel}: ${errorMsg}. Please try again.`,
    };
  }
}

// ── Multi-Turn Intent & Entity Parser ──────────────────────────────────────────

const FOOD_KEYWORD_REGEX =
  /\b(rice|chapatis?|rotis?|phulkas?|salad|cucumber|paneer|dal|lentils?|chicken|eggs?|bananas?|fruit|curry|meal|lunch|dinner|breakfast|snack|yoghurt|yogurt|curd|dahi|raita|tea|chai|coffee|latte|potato|aloo|sabzi|sabji|bhindi|gobi|vegetables|dosa|idli|uttapam|vada|sambar|poha|upma|parathas?|puri|naan|biryani|khichdi|pulao|chole|rajma|oats?|oatmeal|porridge|muesli|shake|whey|milk|lassi|buttermilk|bread|toast|sandwich|omelette|bhurji|tofu|soya|fish|mutton|apple|mango|berries|sprouts|soup|maggi|pasta|noodles)\b/i;

/**
 * Splits compound user prompts into distinct command segments
 * based on punctuation, transitional keywords ("also", "and also"),
 * and conjunctions ("and") introducing new domains/actions.
 */
export function splitCompoundPrompt(message: string): string[] {
  const trimmed = message.trim();
  if (!trimmed) return [];

  // Strip pure standalone generic meal preambles ("log today's meal") to prevent phantom empty logs
  if (
    /^(?:please\s+)?(?:log|add|save|record|track)\s+(?:all\s+)?(?:today's\s+|my\s+)?(?:meals?|food|diet|nutrition)[.!]?$/i.test(
      trimmed
    )
  ) {
    return [];
  }

  // Strip leading generic meal intro preamble when followed by explicit meal slot segments
  const normalized = trimmed
    .replace(
      /^(?:please\s+)?(?:log|add|save|record|track)\s+(?:all\s+)?(?:today's\s+|my\s+)?(?:meals?|food|diet|nutrition)\s*(?:[:,]\s*|\s+)(?=(?:in|for|to)?\s*(?:my\s+)?(?:breakfast|lunch|dinner|snack)\b)/i,
      ""
    )
    .trim();

  if (!normalized) return [];

  if (/[;\n]/.test(normalized)) {
    return normalized
      .split(/[;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const COMPOUND_BOUNDARY_REGEX =
    /(?:;\s*|\n+|\s+(?:also|and\s+also|furthermore|additionally)\s+|\s*,\s*and\s+|\s*,\s*(?=(?:add|log|schedule|plan|start|in\s+(?:training|workout|breakfast|lunch|dinner|snack)|for\s+(?:training|workout|breakfast|lunch|dinner|snack)|(?:breakfast|lunch|dinner|snack)(?:\s*[:-]|\s+(?!and\b|or\b|was\b|is\b|for\b|at\b)[a-z0-9])|today's\s+plan|plank|running|run\b|jogging|cycling|bike|skipping|pull\s*ups?|push\s*ups?|dips?))|\s+and\s+(?=(?:add|schedule|log|start|create|today's\s+plan|in\s+(?:training|workout|breakfast|lunch|dinner|snack)|for\s+(?:training|workout|breakfast|lunch|dinner|snack)|running|run\b|jogging|cycling|bike|skipping|pull\s*ups?|push\s*ups?|dips?|plank))|(?<=(?:in|for)\s+(?:breakfast|lunch|dinner|snack))\s*,?\s*and\s+)/i;

  return normalized
    .split(COMPOUND_BOUNDARY_REGEX)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Deterministically detect state mutation intent for a single command segment
 * across all 5 editable domains with entity reference continuity.
 */
export function parseSingleMutationIntent(
  message: string,
  activeContext?: OrbitEntityContext,
  allUserText?: string,
  referenceDate?: string
): (ParsedMutation | ClarificationResult) | null {
  const text = message.trim();
  const lower = text.toLowerCase();

  // ── 0. CONVERSATIONAL CLARIFICATION FOLLOW-UP RESOLUTION ─────────────────────
  if (activeContext?.awaitingParam === "sets" && activeContext?.activeExerciseName) {
    const hasSetsOrRepsAnswer =
      /\b\d+\s*(?:reps?|sets?|kg|lbs|@)\b/i.test(lower) ||
      /\b\d+\s+at\s+\d+/i.test(lower) ||
      /^\d+$/i.test(text);

    if (hasSetsOrRepsAnswer) {
      const exName = activeContext.activeExerciseName;
      let reps = 10;
      const repsMatch =
        text.match(/(\d+)\s*reps?/i) ||
        text.match(/^(\d+)\s*(?:at|with|@)/i) ||
        text.match(/reps?\s+to\s+(\d+)/i) ||
        text.match(/^(\d+)$/);
      if (repsMatch) reps = parseInt(repsMatch[1], 10);

      let weight = 0;
      const weightMatch =
        text.match(/(?:at|with|@)\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)?/i) ||
        text.match(/(\d+(?:\.\d+)?)\s*kg/i);
      if (weightMatch) weight = parseFloat(weightMatch[1]);

      let setsCount = 1;
      const setCountMatch = text.match(/(\d+)\s*sets?/i);
      if (setCountMatch) setsCount = parseInt(setCountMatch[1], 10);

      const sets: WorkoutSetInput[] = Array.from({ length: setsCount }, () => ({
        reps,
        weight,
        unit: "kg",
        completed: true,
      }));

      return {
        type: "UPDATE_WORKOUT_SET",
        domain: "workouts",
        params: {
          exerciseName: exName,
          exerciseIndex: activeContext.activeExerciseIndex,
          sets,
        },
      };
    }
  }

  if (activeContext?.awaitingParam === "time" && activeContext?.activeTaskTitle) {
    const hasTimeAnswer =
      (/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(lower) ||
        /\b\d{1,2}:\d{2}\b/.test(lower) ||
        /\b(?:at|for|by)\s+\d{1,2}\b/i.test(lower) ||
        /^\s*\d{1,2}\s*$/i.test(lower) ||
        /\b(morning|afternoon|evening)\b/i.test(lower)) &&
      !FOOD_KEYWORD_REGEX.test(lower) &&
      !/\b(reps?|sets?|kg|lbs|km)\b/i.test(lower);

    if (hasTimeAnswer) {
      const title = activeContext.activeTaskTitle;
      let duration = 25;
      const durMatch = text.match(/(\d+)\s*(?:min|minute)/i);
      if (durMatch) duration = parseInt(durMatch[1], 10);

      let scheduledTime = "17:00";
      const timeMatch =
        text.match(/(?:at|for|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i) ||
        text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      if (timeMatch) scheduledTime = parseTimeString(timeMatch[1]);

      return {
        type: "CREATE_TASK",
        domain: "tasks",
        params: {
          title,
          durationMinutes: duration,
          scheduledTime,
        },
      };
    }
  }

  // ── 1. DAILY RITUALS & BENTO HABITS (Hydration, Steps, Journal) ──────────────
  const isHydrationAndSteps =
    /\b(\d+[\d,]*)\s*(?:ml|l|liters?)\b/i.test(lower) &&
    /\b(\d+[\d,]*)\s*steps\b/i.test(lower);

  if (isHydrationAndSteps) {
    const waterMatch = lower.match(/(\d+[\d,]*)\s*(?:ml|l|liters?)/i);
    const stepsMatch = lower.match(/(\d+[\d,]*)\s*steps/i);
    const waterVal = waterMatch ? parseInt(waterMatch[1].replace(/,/g, ""), 10) : 1000;
    const stepsVal = stepsMatch ? parseInt(stepsMatch[1].replace(/,/g, ""), 10) : 8000;

    return {
      type: "LOG_RITUAL",
      domain: "rituals",
      params: {
        ritualType: "hydration_and_steps",
        amountMl: waterVal,
        steps: stepsVal,
      },
    };
  }

  const isHydration =
    /\b(log|drank|drink|hydrat\w*)\b/i.test(lower) &&
    /\b(\d+[\d,]*\s*(?:ml|l|liters?|glasses?)|water)\b/i.test(lower) &&
    !/\b(tea|chai|coffee|milk|shake|lassi|buttermilk|smoothie)\b/i.test(lower);

  if (isHydration) {
    let amountMl = 500;
    const mlMatch = lower.match(/(\d+[\d,]*)\s*ml/i);
    const glassMatch = lower.match(/(\d+)\s*glass(?:es)?/i);
    const literMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|litres)/i);

    if (mlMatch) amountMl = parseInt(mlMatch[1].replace(/,/g, ""), 10);
    else if (glassMatch) amountMl = parseInt(glassMatch[1], 10) * 250;
    else if (literMatch) amountMl = Math.round(parseFloat(literMatch[1]) * 1000);

    return {
      type: "LOG_RITUAL",
      domain: "rituals",
      params: {
        ritualType: "hydration",
        amountMl,
      },
    };
  }

  const isSteps =
    /\b(\d+[\d,]*)\s*steps\b/i.test(lower) &&
    /\b(log|walked|taken|steps?)\b/i.test(lower);

  if (isSteps) {
    const match = lower.match(/(\d+[\d,]*)\s*steps/i);
    const steps = match ? parseInt(match[1].replace(/,/g, ""), 10) : 5000;
    return {
      type: "LOG_RITUAL",
      domain: "rituals",
      params: {
        ritualType: "steps",
        steps,
      },
    };
  }

  const isJournal =
    /\b(save\s+evening\s+reflection|evening\s+reflection|evening\s+journal|journal\s+reflection)\b/i.test(lower);

  if (isJournal) {
    const reflection = text.replace(/^(save\s+)?(evening\s+)?(reflection|journal)\s*:\s*/i, "").trim();
    return {
      type: "LOG_RITUAL",
      domain: "rituals",
      params: {
        ritualType: "journal",
        reflection: reflection || "Reflected on daily wins and momentum.",
      },
    };
  }

  // ── 2. SPRINTS & STUDY MILESTONES (Placement Sprint / LeetCode) ─────────────
  const isSprintProgress =
    /\b(solved|completed)\b.*\b(leetcode|codeforces|hackerrank|placement|dsa|algorithm)\b/i.test(lower) ||
    /\bon\s+leetcode\b/i.test(lower);

  if (isSprintProgress) {
    let problems: string[] = [];
    const probMatch = text.match(/solved\s+([a-zA-Z0-9\s,]+?)\s+(?:on\s+leetcode|using\b)/i);
    if (probMatch) {
      problems = probMatch[1]
        .split(/,|\band\b/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 2);
    } else {
      problems = ["Algorithm Problem"];
    }

    let topic = "dsa";
    const topicMatch = text.match(/using\s+([a-zA-Z\s]+)$/i);
    if (topicMatch) topic = topicMatch[1].trim();

    return {
      type: "UPDATE_SPRINT_PROGRESS",
      domain: "sprints",
      params: {
        platform: "LeetCode",
        problems,
        topic,
        count: problems.length,
      },
    };
  }

  // ── 3. TASKS & SCHEDULES (Execution Studio) ─────────────────────────────────
  const isRescheduleTask =
    /\b(move|reschedule|shift|push)\b/i.test(lower) &&
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\b\d{1,2}\s*(?:am|pm))\b/i.test(lower) &&
    !FOOD_KEYWORD_REGEX.test(lower) &&
    !/\b(workout|exercise)\b/i.test(lower);

  if (isRescheduleTask) {
    const timeMatch = text.match(/(?:to\s+|at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    const scheduledTime = timeMatch ? parseTimeString(timeMatch[1]) : "18:00";

    let taskTitle = activeContext?.activeTaskTitle;
    const titleMatch = text.match(/(?:move|reschedule|shift)\s+(?:that\s+|the\s+)?([a-zA-Z\s]+?)\s+(?:to\s+|at\s+)?\d/i);
    if (titleMatch) taskTitle = titleMatch[1].trim();

    return {
      type: "RESCHEDULE_TASK",
      domain: "tasks",
      params: {
        taskId: activeContext?.activeTaskId,
        taskTitle,
        scheduledTime,
      },
    };
  }

  const isCompleteTask =
    /\b(mark|check\s+off|complete)\b/i.test(lower) &&
    /\b(task|sprint|coding\s+sprint|session|focus\s+block)\b/i.test(lower) &&
    !/\b(workout|push\s+day|exercise)\b/i.test(lower);

  if (isCompleteTask) {
    let taskTitle = activeContext?.activeTaskTitle;
    const titleMatch = text.match(/(?:mark|check\s+off|complete)\s+(?:the\s+|that\s+)?([a-zA-Z0-9\s-]+?)(?:\s+(?:as\s+completed|as\s+done|task))?$/i);
    if (titleMatch) taskTitle = titleMatch[1].trim();

    return {
      type: "COMPLETE_TASK",
      domain: "tasks",
      params: {
        taskId: activeContext?.activeTaskId,
        taskTitle,
      },
    };
  }

  const isDeleteTask =
    /\b(remove|delete)\b/i.test(lower) &&
    /\b(task|sprint|\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+task)\b/i.test(lower) &&
    !/\b(workout|exercise|meal|food)\b/i.test(lower);

  if (isDeleteTask) {
    const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+task/i);
    const scheduledTime = timeMatch ? parseTimeString(timeMatch[1]) : undefined;

    return {
      type: "DELETE_TASK",
      domain: "tasks",
      params: {
        taskId: activeContext?.activeTaskId,
        taskTitle: activeContext?.activeTaskTitle,
        scheduledTime,
      },
    };
  }

  // Create Task / Today's Plan
  const hasExplicitTaskDomainWord =
    /\b(today's\s+plan|today's\s+schedule|coding\s+sprint|placement\s+sprint|sprint|focus\s+block|deep\s+work|task)\b/i.test(lower);

  const isCreateTask =
    (/\b(add|schedule|create|plan\s+a|plan)\b/i.test(lower) &&
     /\b(today's\s+plan|in\s+today's\s+plan|to\s+today's\s+plan|min\s+coding\s+sprint|coding\s+sprint|placement\s+sprint|sprint|focus\s+block|deep\s+work|task|session\s+at|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|plan\s+for|high\s+priority\s+for)\b/i.test(lower) &&
     !/\b(workout|push\s+day|exercise|chapatis?|rice|meal|lunch|dinner|breakfast|food)\b/i.test(lower) &&
     !(FOOD_KEYWORD_REGEX.test(lower) && !hasExplicitTaskDomainWord)) ||
    /\b(today's\s+plan|add\s+(?:to\s+)?today's\s+plan|in\s+today's\s+plan)\b/i.test(lower);

  if (isCreateTask) {
    let priority: "low" | "medium" | "high" = "medium";
    if (/\bhigh\s*priority\b|\bpriority\s*:?\s*high\b|\burgent\b/i.test(lower)) {
      priority = "high";
    } else if (/\blow\s*priority\b|\bpriority\s*:?\s*low\b/i.test(lower)) {
      priority = "low";
    }

    let dueDate = referenceDate || new Date().toLocaleDateString("en-CA");
    if (/\btomorrow\b/i.test(lower)) {
      const baseMs = referenceDate ? new Date(`${referenceDate}T12:00:00`).getTime() : Date.now();
      dueDate = new Date(baseMs + 86400000).toLocaleDateString("en-CA");
    }

    let duration = 25;
    const durMatch = text.match(/(\d+)\s*(?:min|minute)/i);
    if (durMatch) duration = parseInt(durMatch[1], 10);

    const timeMatch =
      text.match(/(?:at|for|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i) ||
      text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);

    const isTodayPlan = /\b(today's\s+plan|to\s+today's\s+plan|in\s+today's\s+plan|today's\s+schedule)\b/i.test(lower);

    let title = text
      .replace(/^(?:and\s+)?(?:also\s+)?(?:add\s+|schedule\s+|create\s+|plan\s+a\s+|plan\s+)?(?:a\s+)?(?:to\s+|in\s+)?(?:today's\s+plan|today's\s+schedule|plan|task)\s*(?:for\s+)?/i, "")
      .replace(/(?:for\s+|with\s+)?(?:high|medium|low)\s+priority\s*(?:for\s+)?/i, "")
      .replace(/\b\d+\s*min(?:ute)?s?\s*/i, "")
      .replace(/\s+(?:to\s+(?:today's|my)\s+schedule|to\s+today)$/i, "")
      .replace(/\s+(?:at|for|by)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?$/i, "")
      .replace(/^(?:for\s+|to\s+)/i, "")
      .trim();

    if (/^sending\b/i.test(title)) {
      title = title.replace(/^sending\b/i, "Send");
    } else if (title) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    if (!title) title = "Coding sprint";

    if (!timeMatch && !isTodayPlan) {
      const cleanTitle = (title || "placement sprint").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        type: "CLARIFICATION_NEEDED",
        domain: "tasks",
        missingParam: "time",
        clarificationMessage: `What time would you like to schedule the ${cleanTitle} for?`,
        suggestedActions: [
          { label: "Schedule for 5:00 PM", prompt: "Schedule for 5:00 PM" },
          { label: "25 min block", prompt: "25 min block at 4:00 PM" },
          { label: "Add to Morning rituals", prompt: "Schedule for 9:00 AM" },
        ],
        updatedContext: {
          ...(activeContext || {}),
          activeTaskTitle: cleanTitle,
          awaitingParam: "time",
        },
      };
    }

    const scheduledTime = timeMatch ? parseTimeString(timeMatch[1]) : "10:00";

    return {
      type: "CREATE_TASK",
      domain: "tasks",
      params: {
        title: title || "Scheduled Focus Block",
        durationMinutes: duration,
        scheduledTime,
        dueDate,
        priority,
      },
    };
  }

  // ── 4. WORKOUT & TRAINING STUDIO ────────────────────────────────────────────

  // A. Start Workout
  const isStartWorkout =
    /\b(start|begin)\s+(push\s+day|pull\s+day|leg\s+day|workout|upper\s+body|lower\s+body|[a-zA-Z0-9\s-]+day)\b/i.test(lower);

  if (isStartWorkout) {
    const title = text.replace(/^(start|begin)\s+/i, "").trim() || "Push Day";
    return {
      type: "START_WORKOUT",
      domain: "workouts",
      params: {
        routineTitle: title,
      },
    };
  }

  // B. Complete Workout
  const isCompleteWorkout =
    /\b(finish|end|complete)\s+(workout|session|training)\b/i.test(lower);

  if (isCompleteWorkout) {
    return {
      type: "COMPLETE_WORKOUT",
      domain: "workouts",
      params: {
        durationMinutes: 45,
      },
    };
  }

  // C.1 Timed / Isometric Exercise: "Plank for 45 seconds", "add in training for plank for 45 seconds", "wall sit for 60s"
  const isTimedExercise =
    (/\b(in\s+training|in\s+workout|for\s+training|to\s+workout|training\s+for)\b/i.test(lower) ||
     /\b(plank|side\s+plank|wall\s+sit|dead\s+hang|l-sit|hollow\s+body|hold)\b/i.test(lower)) &&
    /\b(\d+)\s*(?:seconds?|secs?|s\b|minutes?|mins?|m\b)/i.test(lower);

  if (isTimedExercise) {
    const durMatch = text.match(/(\d+)\s*(seconds?|secs?|s\b|minutes?|mins?|m\b)/i);
    let durationSeconds = 45;
    if (durMatch) {
      const val = parseInt(durMatch[1], 10);
      const unit = durMatch[2].toLowerCase();
      durationSeconds = unit.startsWith("m") ? val * 60 : val;
    }

    let exName = "Plank";
    const nameMatch = text.match(/(?:(?:also\s+)?add\s+)?(?:in\s+training\s+for|in\s+workout\s+for|for\s+training\s+for|to\s+workout\s+for|training\s+for\s+)?([a-zA-Z\s]+?)\s+(?:for\s+)?\d+\s*(?:seconds?|secs?|s\b|minutes?|mins?|m\b)/i);
    if (nameMatch && nameMatch[1].trim()) {
      let raw = nameMatch[1].trim();
      raw = raw.replace(/^(?:also\s+)?(?:add\s+)?(?:in\s+|for\s+|to\s+)?(?:training|workout)?\s*(?:for\s+)?/i, "").trim();
      if (raw) exName = raw.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const sets: WorkoutSetInput[] = [
      {
        reps: 1,
        durationSeconds,
        weight: 0,
        unit: "bodyweight",
        completed: true,
      },
    ];

    return {
      type: "ADD_EXERCISE",
      domain: "workouts",
      params: {
        exerciseName: exName,
        sets,
      },
    };
  }

  // C.2 Add Exercise (sets & reps): "Add Lateral Raises 3 sets of 15 reps at 10kg"
  const isAddExercise =
    /\badd\s+([a-zA-Z\s]+?)\s+(\d+)\s+sets?\s+(?:of\s+)?(\d+)\s*reps?/i.test(lower);

  if (isAddExercise) {
    const match = text.match(/\badd\s+([a-zA-Z\s]+?)\s+(\d+)\s+sets?\s+(?:of\s+)?(\d+)\s*reps?(?:\s*(?:at|with|@)\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)?)?/i);
    const exName = match ? match[1].trim() : "Exercise";
    const setsCount = match ? parseInt(match[2], 10) : 3;
    const reps = match ? parseInt(match[3], 10) : 10;
    const weight = match && match[4] ? parseFloat(match[4]) : 10;

    const sets: WorkoutSetInput[] = Array.from({ length: setsCount }, () => ({
      reps,
      weight,
      unit: "kg",
      completed: true,
    }));

    return {
      type: "ADD_EXERCISE",
      domain: "workouts",
      params: {
        exerciseName: exName,
        sets,
      },
    };
  }

  // C.3 Cardio Movements (Running, Cycling, Treadmill, etc.)
  const isCardioMovement =
    /\b(running|run|jogging|jog|cycling|cycle|biking|bike|treadmill|rowing|swimming|walking|elliptical|stairmaster)\b/i.test(lower) &&
    !/\b(meal|breakfast|lunch|dinner|snack|food)\b/i.test(lower);

  if (isCardioMovement) {
    let exName = "Running";
    if (/\b(running|run|jogging|jog)\b/i.test(lower)) exName = "Running";
    else if (/\b(cycling|cycle|biking|bike)\b/i.test(lower)) exName = "Cycling";
    else if (/\btreadmill\b/i.test(lower)) exName = "Treadmill";
    else if (/\b(rowing|row)\b/i.test(lower)) exName = "Rowing";
    else if (/\b(swimming|swim)\b/i.test(lower)) exName = "Swimming";
    else if (/\b(walking|walk)\b/i.test(lower)) exName = "Walking";
    else if (/\belliptical\b/i.test(lower)) exName = "Elliptical";
    else if (/\bstairmaster\b/i.test(lower)) exName = "Stairmaster";

    let distance: number | undefined = undefined;
    let distanceUnit: string = "km";
    const distMatch = text.match(/(\d+(?:\.\d+)?)\s*(km|kms|kilometers?|miles?|mi|meters?|m)\b/i);
    if (distMatch) {
      distance = parseFloat(distMatch[1]);
      const rawUnit = distMatch[2].toLowerCase();
      if (rawUnit.startsWith("mi") && !rawUnit.startsWith("min")) {
        distanceUnit = "miles";
      } else {
        distanceUnit = "km";
      }
    }

    let durationSeconds: number | undefined = undefined;
    const durMatch = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)\b/i);
    if (durMatch) {
      const val = parseFloat(durMatch[1]);
      const unit = durMatch[2].toLowerCase();
      durationSeconds = unit.startsWith("h") ? Math.round(val * 3600) : unit.startsWith("m") ? Math.round(val * 60) : Math.round(val);
    }

    return {
      type: "ADD_EXERCISE",
      domain: "workouts",
      params: {
        exerciseName: exName,
        movementType: "cardio",
        distance,
        distanceUnit,
        durationSeconds,
        sets: [
          {
            setNumber: 1,
            reps: 1,
            distance,
            distanceUnit,
            durationSeconds,
            weight: 0,
            unit: "km",
            completed: true,
          },
        ],
      },
    };
  }

  // C.4 Calisthenics / Bodyweight Movements (Skipping, Pull Ups, Push Ups, Dips, etc.)
  const isCalisthenicsMovement =
    /\b(skipping|skip\s*rope|jump\s*rope|pull\s*ups?|chin\s*ups?|push\s*ups?|dips?|crunches|sit\s*ups?|burpees|jumping\s*jacks?)\b/i.test(lower) &&
    !/\b(meal|breakfast|lunch|dinner|snack|food)\b/i.test(lower);

  if (isCalisthenicsMovement) {
    let exName = "Skipping";
    if (/\b(skipping|skip\s*rope|jump\s*rope)\b/i.test(lower)) exName = "Skipping";
    else if (/\bpull\s*ups?\b/i.test(lower)) exName = "Pull Ups";
    else if (/\bchin\s*ups?\b/i.test(lower)) exName = "Chin Ups";
    else if (/\bpush\s*ups?\b/i.test(lower)) exName = "Push Ups";
    else if (/\bdips?\b/i.test(lower)) exName = "Dips";
    else if (/\bcrunches\b/i.test(lower)) exName = "Crunches";
    else if (/\bsit\s*ups?\b/i.test(lower)) exName = "Sit Ups";
    else if (/\bburpees\b/i.test(lower)) exName = "Burpees";
    else if (/\bjumping\s*jacks?\b/i.test(lower)) exName = "Jumping Jacks";

    let setsCount = 3;
    let reps = 15;

    const repsThenSetsMatch = text.match(/(\d+)\s*reps?\s*(?:in\s+|for\s+|,?\s*)?(\d+)\s*sets?/i);
    const setsThenRepsMatch = text.match(/(\d+)\s*sets?\s*(?:of\s+|,\s*|\s+)?(\d+)\s*reps?/i);

    if (repsThenSetsMatch) {
      reps = parseInt(repsThenSetsMatch[1], 10);
      setsCount = parseInt(repsThenSetsMatch[2], 10);
    } else if (setsThenRepsMatch) {
      setsCount = parseInt(setsThenRepsMatch[1], 10);
      reps = parseInt(setsThenRepsMatch[2], 10);
    } else {
      const singleRepsMatch = text.match(/(\d+)\s*reps?/i);
      const singleSetsMatch = text.match(/(\d+)\s*sets?/i);
      if (singleRepsMatch) reps = parseInt(singleRepsMatch[1], 10);
      if (singleSetsMatch) setsCount = parseInt(singleSetsMatch[1], 10);
    }

    const sets: WorkoutSetInput[] = Array.from({ length: setsCount }, (_, i) => ({
      setNumber: i + 1,
      reps,
      weight: 0,
      unit: "bodyweight",
      completed: true,
    }));

    return {
      type: "ADD_EXERCISE",
      domain: "workouts",
      params: {
        exerciseName: exName,
        movementType: "calisthenics",
        sets,
      },
    };
  }

  // D. Delete Exercise
  const isDeleteExercise =
    /\b(remove|delete)\s+([a-zA-Z\s]+?)\s+(?:from\s+(?:this\s+)?workout)\b/i.test(lower);

  if (isDeleteExercise) {
    const match = text.match(/\b(remove|delete)\s+([a-zA-Z\s]+?)\s+(?:from\s+(?:this\s+)?workout)\b/i);
    const exName = match ? match[2].trim() : "";
    return {
      type: "DELETE_EXERCISE",
      domain: "workouts",
      params: {
        exerciseName: exName,
      },
    };
  }

  // E. Rep Delta Multi-Turn Update
  const isRepDelta =
    /\badd\s+(\d+)\s+more\s+reps?\b/i.test(lower) ||
    /\b(\d+)\s+more\s+reps?\b/i.test(lower);

  if (isRepDelta) {
    const deltaMatch = lower.match(/(\d+)\s+more\s+reps?/i);
    const repDelta = deltaMatch ? parseInt(deltaMatch[1], 10) : 2;

    return {
      type: "UPDATE_WORKOUT_SET",
      domain: "workouts",
      params: {
        exerciseName: activeContext?.activeExerciseName || "Workout Exercise",
        exerciseIndex: activeContext?.activeExerciseIndex ?? 0,
        repDelta,
        sets: [{ reps: 10 + repDelta, unit: "kg", completed: true }],
      },
    };
  }

  // F. Ordinal Exercise Targeting & Set Updates
  let exerciseIndex: number | undefined = undefined;
  if (/\b(?:that\s+)?first\s+exercise\b|\b1st\s+exercise\b|\bexercise\s*#?1\b/i.test(text)) {
    exerciseIndex = 0;
  } else if (/\b(?:that\s+)?second\s+exercise\b|\b2nd\s+exercise\b|\bexercise\s*#?2\b/i.test(text)) {
    exerciseIndex = 1;
  } else if (/\b(?:that\s+)?third\s+exercise\b|\b3rd\s+exercise\b|\bexercise\s*#?3\b/i.test(text)) {
    exerciseIndex = 2;
  } else if (/\b(?:that\s+)?fourth\s+exercise\b|\b4th\s+exercise\b|\bexercise\s*#?4\b/i.test(text)) {
    exerciseIndex = 3;
  }

  const isAppendSet = /\badd\s+(?:a\s+)?(?:\d+(?:th|st|nd|rd)\s+)?set\b/i.test(lower);

  const isWorkoutMutation =
    /\b(change|set|update|log|make|add)\b/i.test(lower) &&
    !FOOD_KEYWORD_REGEX.test(lower) &&
    (/\b(reps?|sets?|weight|kg|lbs|dumbbell|press|squat|bench|deadlift|curl|pulldown|extension|exercise)\b/i.test(lower) ||
      exerciseIndex !== undefined);

  if (isWorkoutMutation) {
    let exerciseName = activeContext?.activeExerciseName || "Workout Exercise";

    const exPatterns = [
      /incline\s+dumbbell\s+press/i,
      /dumbbell\s+press/i,
      /bench\s+press/i,
      /flat\s+bench\s+press/i,
      /flat\s+bench/i,
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

    let reps = 10;
    const repsMatch =
      text.match(/reps?\s+to\s+(\d+)/i) ||
      text.match(/(?:to\s+|set\s+to\s+)?(\d+)\s*reps?/i) ||
      text.match(/of\s+(\d+)\s*reps?/i) ||
      text.match(/to\s+(\d+)\s*(?:reps?)?/i);
    if (repsMatch) {
      reps = parseInt(repsMatch[1], 10) || 10;
    }

    let weight = 0;
    const weightMatch =
      text.match(/(?:at|with|@)\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)?/i) ||
      text.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]) || 0;
    }

    if (!repsMatch && !weightMatch && !isAppendSet && exerciseIndex === undefined) {
      return {
        type: "CLARIFICATION_NEEDED",
        domain: "workouts",
        missingParam: "sets",
        clarificationMessage: `I've noted the ${exerciseName}. How many reps and what weight did you complete?`,
        suggestedActions: [
          { label: "10 reps @ 24kg", prompt: "10 reps at 24kg" },
          { label: "12 reps @ 20kg", prompt: "12 reps at 20kg" },
          { label: "3 sets of 10", prompt: "3 sets of 10 reps" },
        ],
        updatedContext: {
          ...(activeContext || {}),
          activeExerciseName: exerciseName,
          awaitingParam: "sets",
        },
      };
    }

    return {
      type: "UPDATE_WORKOUT_SET",
      domain: "workouts",
      params: {
        exerciseName,
        exerciseIndex,
        isAppendSet,
        sets: [{ reps, weight, unit: "kg", completed: true }],
      },
    };
  }

  // ── 5. DIET / MEAL UPSERT OR APPEND (Fuel Studio) ───────────────────────────
  const isDeleteMeal =
    /\b(delete|remove)\b/i.test(lower) &&
    /\b(breakfast|lunch|dinner|snack|meal)\b/i.test(lower) &&
    !/\b(exercise|workout|task)\b/i.test(lower);

  if (isDeleteMeal) {
    let mealType = "lunch";
    if (/\bbreakfast\b/i.test(lower)) mealType = "breakfast";
    else if (/\bdinner\b/i.test(lower)) mealType = "dinner";
    else if (/\bsnack\b/i.test(lower)) mealType = "snack";

    return {
      type: "DELETE_MEAL",
      domain: "meals",
      params: {
        mealType,
        entryId: activeContext?.activeMealId,
      },
    };
  }

  const isQuestionQuery =
    /^(?:what|how|when|where|which|who|why|did|do|does|is|are|was|were|have|has|can|could|should|would|show|list|tell|check|review|calculate|analyze|analyse)\b/i.test(
      lower
    ) ||
    (/\?$/.test(text) && !/^(?:add|log|track|save|record)\b/i.test(lower));

  const hasExplicitMealSlotRef =
    /^(?:(?:in|for|to)\s+)?(?:my\s+)?(?:breakfast|lunch|dinner|snack)\s*[:\-]\s*\S/i.test(lower) ||
    /\b(?:in|for|to)\s+(?:my\s+)?(?:breakfast|lunch|dinner|snack)\b/i.test(lower);

  const isMealMutation =
    !isQuestionQuery &&
    (/\b(log|add|track|append|record|save|ate|eat|had|have)\b/i.test(lower) ||
      hasExplicitMealSlotRef) &&
    FOOD_KEYWORD_REGEX.test(lower);

  const isFollowUpAdd =
    !isQuestionQuery &&
    /\b(also\s+add|actually,\s*also\s+add|add\s+another|include)\b/i.test(lower);

  if (isMealMutation || isFollowUpAdd) {
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

    let cleaned = text
      .replace(/^(?:actually,?\s*)?(?:also\s+)?(?:i\s+)?(?:add|log|track|append|record|save|ate|eat|had|have)\s+/i, "")
      .replace(/^(?:today's\s+meals?|my\s+meals?|meals?|food|diet)\s*(?:[:,]\s*)?/i, "")
      .replace(/^(?:(?:in|for|to)\s+)?(?:my\s+)?(?:breakfast|lunch|dinner|snack)\s*(?:[:,-]\s*|\s+(?=[^,]))/i, "")
      .replace(/^(?:today's\s+meals?|my\s+meals?)\s*(?:[:,-]\s*)?/i, "")
      .replace(/\s+(?:for|to|in)\s+(?:my\s+)?(?:lunch|dinner|breakfast|snack)(?:\s+log)?$/i, "")
      .replace(/\s+(?:at|around)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)$/i, "")
      .trim();

    const rawItems = cleaned
      .split(/,|\band\b|\bwith\b/i)
      .map((s) =>
        s
          .replace(/(?:\btoday's\s+meals?\b|\b(?:in|for|to)\s+(?:breakfast|lunch|dinner|snack)\b|\b(?:add|also)\b)/gi, "")
          .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
          .trim()
      )
      .filter((s) => s.length > 1 && !/^(my|a|an|the|also|to|in|for|meal|meals|food)$/i.test(s));

    if (rawItems.length === 0) {
      return null;
    }

    const items: DietItemInput[] = rawItems.map((name) => ({ name }));

    return {
      type: "UPSERT_MEAL",
      domain: "meals",
      params: {
        mealType,
        items,
      },
    };
  }

  return null;
}

/**
 * Deterministically detect multiple state mutation intents across all 5 editable domains
 * with compound sentence segmentation and entity reference continuity.
 */
export function parseMutationIntents(
  message: string,
  activeContext?: OrbitEntityContext,
  allUserText?: string,
  referenceDate?: string
): (ParsedMutation | ClarificationResult)[] {
  const segments = splitCompoundPrompt(message);
  if (segments.length === 0) return [];

  const results: (ParsedMutation | ClarificationResult)[] = [];
  let currentContext = { ...(activeContext || {}) };

  for (const segment of segments) {
    const parsed = parseSingleMutationIntent(segment, currentContext, allUserText, referenceDate);
    if (parsed) {
      results.push(parsed);
      if (parsed.type === "UPSERT_MEAL" || parsed.type === "MODIFY_MEAL") {
        currentContext.activeMealSlot = (parsed.params as any)?.mealType || currentContext.activeMealSlot;
      } else if (parsed.type === "UPDATE_WORKOUT_SET" || parsed.type === "ADD_EXERCISE") {
        currentContext.activeExerciseName = (parsed.params as any)?.exerciseName || currentContext.activeExerciseName;
      } else if (parsed.type === "CREATE_TASK" || parsed.type === "RESCHEDULE_TASK") {
        currentContext.activeTaskTitle = (parsed.params as any)?.title || (parsed.params as any)?.taskTitle || currentContext.activeTaskTitle;
      }
    }
  }

  return results;
}

/**
 * Deterministically detect state mutation intent (single intent or first of multi-intent batch)
 * maintaining full backwards compatibility.
 */
export function parseMutationIntent(
  message: string,
  activeContext?: OrbitEntityContext,
  allUserText?: string
): (ParsedMutation | ClarificationResult) | null {
  const intents = parseMutationIntents(message, activeContext, allUserText);
  return intents.length > 0 ? intents[0] : null;
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
 * Emits 2–3 predictive chips based on the resulting action_executed domain and unfinished daily goals
 */
export function generateContextualSuggestions(input: SuggestionContextInput): OrbitSuggestedAction[] {
  const suggestions: OrbitSuggestedAction[] = [];
  const domain = input.actionExecuted?.domain;
  const actionType = input.actionExecuted?.type;
  const activeExercise = input.activeContext?.activeExerciseName || "Incline Press";
  const activeTask = input.activeContext?.activeTaskTitle || "coding sprint";

  // A. Tasks domain
  if (domain === "tasks" || actionType === "CREATE_TASK" || actionType === "RESCHEDULE_TASK") {
    suggestions.push({
      label: "Start 25 min focus timer",
      prompt: `Start my ${activeTask} focus timer`,
    });
    suggestions.push({
      label: "View today's schedule",
      prompt: "Show my scheduled tasks for today",
    });
    suggestions.push({
      label: "Mark task completed",
      prompt: `Check off the ${activeTask} task`,
    });
    return suggestions.slice(0, 3);
  }

  // B. Workouts domain
  if (domain === "workouts" || actionType === "START_WORKOUT" || actionType === "UPDATE_WORKOUT" || actionType === "UPDATE_WORKOUT_SET" || actionType === "ADD_EXERCISE") {
    suggestions.push({
      label: `Log next set for ${activeExercise}`,
      prompt: "Add 2 more reps",
    });
    suggestions.push({
      label: "Move to next exercise",
      prompt: "What is my next exercise in this workout?",
    });
    suggestions.push({
      label: "Finish workout",
      prompt: "Finish workout",
    });
    return suggestions.slice(0, 3);
  }

  // C. Daily Rituals & Habits domain
  if (domain === "rituals" || actionType === "LOG_RITUAL") {
    suggestions.push({
      label: "Check off daily hydration",
      prompt: "Log 500ml of water",
    });
    suggestions.push({
      label: "Log remaining steps",
      prompt: "Log 8000 steps",
    });
    suggestions.push({
      label: "Save evening reflection",
      prompt: "Save evening reflection: finished 3 algorithm questions today",
    });
    return suggestions.slice(0, 3);
  }

  // D. Sprints & Study Milestones domain
  if (domain === "sprints" || actionType === "UPDATE_SPRINT_PROGRESS") {
    suggestions.push({
      label: "Next LeetCode problem",
      prompt: "What LeetCode problem should I solve next for the placement sprint?",
    });
    suggestions.push({
      label: "View 60-day placement sprint",
      prompt: "Show my placement sprint progress",
    });
    suggestions.push({
      label: "Schedule coding block",
      prompt: "Add 25 min coding sprint at 5 PM",
    });
    return suggestions.slice(0, 3);
  }

  // E. Meals & Fuel Studio domain (default / fallback)
  const activeSlot = input.activeContext?.activeMealSlot || "lunch";
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

  suggestions.push({
    label: "View remaining protein macros",
    prompt: "How many calories and protein do I have left for today?",
  });

  suggestions.push({
    label: "Log 500ml water",
    prompt: "Log 500ml of water",
  });

  return suggestions.slice(0, 3);
}

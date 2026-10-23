// lib/orbit/contextSerializer.ts
/**
 * Serialize OrbitContext into a concise, structured object for LLM consumption.
 * Only includes the fields required for coaching and omits raw database internals.
 */
import type { OrbitContext } from '@/types';

/** Compute aggregated nutrition totals from an array of MealEntry. */
function computeNutritionTotals(meals: any[]) {
  const totals = {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  };
  for (const m of meals) {
    if (!m?.macros) continue;
    const { calories, proteinG, carbsG, fatG, fiberG } = m.macros;
    totals.calories += calories ?? 0;
    totals.proteinG += proteinG ?? 0;
    totals.carbsG += carbsG ?? 0;
    totals.fatG += fatG ?? 0;
    totals.fiberG += fiberG ?? 0;
  }
  return totals;
}

/** Sanitize a meal to essential fields for token efficiency */
function sanitizeMeal(m: any) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    date: m.date,
    macros: {
      calories: m.macros?.calories ?? 0,
      proteinG: m.macros?.proteinG ?? 0,
      carbsG: m.macros?.carbsG ?? 0,
      fatG: m.macros?.fatG ?? 0,
      ...(m.macros?.fiberG !== undefined ? { fiberG: m.macros.fiberG } : {}),
    },
  };
}

/** Sanitize a workout session to essential fields for token efficiency */
function sanitizeWorkout(w: any) {
  if (!w) return null;
  return {
    id: w.id,
    date: w.date,
    durationMinutes: w.durationMinutes || 0,
    exercises: (w.exercises || []).map((e: any) => ({
      name: e.name,
      sets: Array.isArray(e.sets)
        ? e.sets.map((s: any) => {
            if (typeof s === "string") return s;
            const wt = s.weight !== undefined ? `x${s.weight}${s.unit || 'kg'}` : '';
            return `${s.reps}${wt}`;
          }).join(', ')
        : (e.sets || []),
    })),
    ...(w.cardioLogs?.length
      ? {
          cardio: w.cardioLogs.map(
            (c: any) => `${c.activity} ${c.durationMinutes}m${c.distanceKm ? ` ${c.distanceKm}km` : ''}`
          ),
        }
      : {}),
    ...(w.summary ? { summary: w.summary.slice(0, 120) } : {}),
  };
}

/** Sanitize a task to essential fields */
function sanitizeTask(t: any) {
  if (!t) return null;
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    ...(t.dueDate ? { dueDate: t.dueDate } : {}),
    ...(t.priority ? { priority: t.priority } : {}),
  };
}

/** Sanitize a habit to essential fields */
function sanitizeHabit(h: any) {
  if (!h) return null;
  return {
    id: h.id,
    name: h.name,
    date: h.date,
    ...(h.completed !== undefined ? { completed: h.completed } : {}),
  };
}

/** Build a minimal, token-efficient context object from the full OrbitContext. */
export function serializeOrbitContext(context: OrbitContext | null) {
  if (!context) {
    return null;
  }
  const todayDate = new Date().toLocaleDateString('en-CA');
  const allMeals = (context.meals?.today ?? []).map(sanitizeMeal).filter(Boolean);
  const allWorkouts = (context.workouts?.today ?? []).map(sanitizeWorkout).filter(Boolean);
  const allTasks = (context.tasks?.today ?? []).map(sanitizeTask).filter(Boolean);
  const allHabits = (context.habits?.today ?? []).map(sanitizeHabit).filter(Boolean);
  const historicalBodyWeight = (context.bodyWeightEntries ?? [])
    .slice(0, 5)
    .map((b: any) => ({
      date: b.date,
      weightKg: b.weightKg,
    }));

  // Deduplicate: todayX contains only records matching today to avoid doubling payload size
  const todayMeals = allMeals.filter((m: any) => m.date === todayDate);
  const todayWorkout = allWorkouts.filter((w: any) => w.date === todayDate);
  const todayTasks = allTasks.filter((t: any) => t.dueDate === todayDate || t.status === 'pending');
  const recentMeals = (context.meals?.recent ?? []).slice(0, 3).map(sanitizeMeal).filter(Boolean);
  const nutritionTotals = computeNutritionTotals(context.meals?.today ?? []);

  return {
    profile: context.profile ? { weightKg: context.bodyWeightEntries?.[0]?.weightKg } : null,
    macroGoals: context.macroGoals ?? null,
    preferences: context.preferences ?? null,
    todayMeals,
    recentMeals,
    nutritionTotals,
    todayTasks,
    todayWorkout,
    // Historical records based on the temporal filter applied in the engine.
    historical: {
      meals: allMeals,
      workouts: allWorkouts,
      tasks: allTasks,
      habits: allHabits,
      bodyWeight: historicalBodyWeight,
    },
  };
}

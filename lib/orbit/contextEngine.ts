// lib/orbit/contextEngine.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserKey } from '@/lib/auth/userKey';
import type { OrbitContext } from '@/types';
import { resolveTemporalReference } from './temporalResolver';
import { getUserProfile, getUserMacroGoals, getUserPreferences } from '@/lib/domain/user';
import {
  getAllMeals,
  getAllTasks,
  getWorkoutSessions,
  getBodyWeightEntries,
  getAllHabits,
} from './serverContext';
import type { ContextRequirements } from './contextRequirement';

/**
 * Build a set of YYYY-MM-DD date strings for the given UTC date range.
 * Using UTC timeZone formatting prevents double timezone shifting and off-by-one errors.
 */
function dateSetInRange(start: Date, end: Date): Set<string> {
  const set = new Set<string>();
  const dayMs = 86400000;
  for (let d = start.getTime(); d < end.getTime(); d += dayMs) {
    const dateStr = new Date(d).toLocaleDateString('en-CA', { timeZone: 'UTC' });
    set.add(dateStr);
  }
  return set;
}

/**
 * Build a read‑only OrbitContext for the authenticated user.
 * Aggregates data from authorized server domain services without performing any writes.
 * Verifies session and guarantees per-user ownership scoping.
 * Isolates category errors so one failed category does not destroy the remaining analysis.
 */
export async function buildOrbitContext(requirements?: ContextRequirements): Promise<OrbitContext | null> {
  const session = await getServerSession(authOptions);
  const userId = getUserKey(session);
  if (!userId) return null;

  const req: ContextRequirements = requirements ?? {
    domains: [
      "profile",
      "goals",
      "preferences",
      "meals",
      "nutrition",
      "workouts",
      "tasks",
      "habits",
      "dailyPlan",
    ],
  };

  const results: Partial<OrbitContext> = {};
  const fetches: Promise<any>[] = [];

  const userPreferences = await getUserPreferences(userId).catch(() => null);
  const userTimezone = userPreferences?.timezone || "Asia/Kolkata";
  results.preferences = userPreferences ?? undefined;

  // Profile & body weight
  if (req.domains.includes("profile")) {
    fetches.push(
      getUserProfile(userId)
        .then((p) => {
          results.profile = p ?? undefined;
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch profile:", err?.message);
          results.profile = undefined;
        })
    );

    fetches.push(
      getBodyWeightEntries(userId)
        .then((bw) => {
          results.bodyWeightEntries = bw ?? [];
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch body weight:", err?.message);
          results.bodyWeightEntries = [];
        })
    );
  }

  // Goals
  if (req.domains.includes("goals")) {
    fetches.push(
      getUserMacroGoals(userId)
        .then((g) => {
          results.macroGoals = g ?? undefined;
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch macro goals:", err?.message);
          results.macroGoals = undefined;
        })
    );
  }

  // Preferences
  if (req.domains.includes("preferences")) {
    fetches.push(
      getUserPreferences(userId)
        .then((p) => {
          results.preferences = p ?? undefined;
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch preferences:", err?.message);
          results.preferences = undefined;
        })
    );
  }

  // Meals (and nutrition) – apply temporal filter
  if (req.domains.includes("meals") || req.domains.includes("nutrition")) {
    fetches.push(
      getAllMeals(userId)
        .then((all) => {
          const meals = all ?? [];
          const today = new Date().toLocaleDateString("en-CA");
          let filtered: any[] = [];
          if (req.temporalScope === "recent") {
            filtered = meals.slice(-5).reverse();
          } else if (req.temporalScope && req.temporalScope !== "none") {
            const range = resolveTemporalReference(req.temporalScope, userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = meals.filter((m) => dateSet.has(m.date));
          } else if (req.temporalScope === "none") {
            filtered = meals;
          } else {
            const range = resolveTemporalReference("today", userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = meals.filter((m) => dateSet.has(m.date) || m.date === today);
          }
          results.meals = { all: meals, today: filtered, recent: meals.slice(-5).reverse() } as any;
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch meals:", err?.message);
          results.meals = { all: [], today: [], recent: [] } as any;
        })
    );
  }

  // Workouts
  if (req.domains.includes("workouts")) {
    fetches.push(
      getWorkoutSessions(userId)
        .then((all) => {
          const workouts = all ?? [];
          const today = new Date().toLocaleDateString("en-CA");
          let filtered: any[] = [];
          if (req.temporalScope === "recent") {
            filtered = workouts.slice(-5).reverse();
          } else if (req.temporalScope && req.temporalScope !== "none") {
            const range = resolveTemporalReference(req.temporalScope, userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = workouts.filter((w) => dateSet.has(w.date));
          } else if (req.temporalScope === "none") {
            filtered = workouts;
          } else {
            const range = resolveTemporalReference("today", userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = workouts.filter((w) => dateSet.has(w.date) || w.date === today);
          }
          results.workouts = { all: workouts, today: filtered } as any;
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch workouts:", err?.message);
          results.workouts = { all: [], today: [] } as any;
        })
    );
  }

  // Tasks
  if (req.domains.includes("tasks")) {
    fetches.push(
      getAllTasks(userId)
        .then((all) => {
          const tasks = all ?? [];
          const today = new Date().toLocaleDateString("en-CA");
          let filtered: any[] = [];
          if (req.temporalScope === "recent") {
            filtered = tasks.slice(-5).reverse();
          } else if (req.temporalScope && req.temporalScope !== "none") {
            const range = resolveTemporalReference(req.temporalScope, userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = tasks.filter((t) => {
              // Tasks due in the temporal window
              if (t.dueDate && dateSet.has(t.dueDate)) return true;
              // Today tasks
              if (t.dueDate === today) return true;
              // Keep pending and overdue tasks even if their due date is prior to the window start
              if (t.status === "pending" && (!t.dueDate || new Date(t.dueDate) < range.start)) {
                return true;
              }
              // Tasks completed within the temporal window
              if (t.completedAt) {
                const compDate = new Date(t.completedAt).toLocaleDateString("en-CA", { timeZone: "UTC" });
                if (dateSet.has(compDate) || compDate === today) return true;
              }
              return false;
            });
          } else if (req.temporalScope === "none") {
            filtered = tasks;
          } else {
            const range = resolveTemporalReference("today", userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = tasks.filter((t) => {
              if (!t.dueDate) return true;
              if (dateSet.has(t.dueDate) || t.dueDate === today) return true;
              if (t.status === "pending" && new Date(t.dueDate) < range.start) return true;
              if (t.completedAt) {
                const compDate = new Date(t.completedAt).toLocaleDateString("en-CA", { timeZone: "UTC" });
                if (dateSet.has(compDate) || compDate === today) return true;
              }
              return false;
            });
          }
          results.tasks = { all: tasks, today: filtered } as any;
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch tasks:", err?.message);
          results.tasks = { all: [], today: [] } as any;
        })
    );
  }

  // Habits
  if (req.domains.includes("habits")) {
    fetches.push(
      getAllHabits(userId)
        .then((all) => {
          const habits = all ?? [];
          const today = new Date().toLocaleDateString("en-CA");
          let filtered: any[] = [];
          if (req.temporalScope === "recent") {
            filtered = habits.slice(-5).reverse();
          } else if (req.temporalScope && req.temporalScope !== "none") {
            const range = resolveTemporalReference(req.temporalScope, userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = habits.filter((h) => dateSet.has(h.date));
          } else if (req.temporalScope === "none") {
            filtered = habits;
          } else {
            const range = resolveTemporalReference("today", userTimezone, new Date());
            const dateSet = dateSetInRange(range.start, range.end);
            filtered = habits.filter((h) => dateSet.has(h.date) || h.date === today);
          }
          results.habits = { all: habits, today: filtered } as any;
        })
        .catch((err) => {
          console.warn("[contextEngine] Failed to fetch habits:", err?.message);
          results.habits = { all: [], today: [] } as any;
        })
    );
  }

  await Promise.all(fetches);
  return results as OrbitContext;
}

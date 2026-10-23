// lib/orbit/serverContext.ts
import { adminDb } from '@/lib/firebaseAdmin';
import type { MealEntry, WorkoutSession, Task, BodyWeightEntry } from '@/types';

/**
 * Server-side Firestore queries for Orbit historical context.
 *
 * All operations execute within authorized server contexts (e.g. Next.js API routes),
 * using the Firebase Admin SDK to access Firestore securely.
 *
 * Security and Ownership Invariants:
 * 1. Every query strictly requires and validates a non-empty `userId`.
 * 2. All queries are strictly scoped by `.where('userId', '==', userId)`.
 * 3. Cross-user access is completely prevented.
 * 4. Missing or empty collections return an empty array gracefully.
 */

export async function fetchUserMeals(userId: string): Promise<MealEntry[]> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) return [];
  const snap = await adminDb
    .collection('meals')
    .where('userId', '==', userId.trim())
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MealEntry));
}

export async function fetchUserWorkouts(userId: string): Promise<WorkoutSession[]> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) return [];
  const snap = await adminDb
    .collection('workouts')
    .where('userId', '==', userId.trim())
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as WorkoutSession))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) return [];
  const snap = await adminDb
    .collection('tasks')
    .where('userId', '==', userId.trim())
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Task))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function fetchUserBodyWeight(userId: string): Promise<BodyWeightEntry[]> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) return [];
  const snap = await adminDb
    .collection('bodyweight')
    .where('userId', '==', userId.trim())
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as BodyWeightEntry))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function fetchUserHabits(userId: string): Promise<any[]> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) return [];
  const snap = await adminDb
    .collection('habits')
    .where('userId', '==', userId.trim())
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Aliases matching existing domain interface names
export {
  fetchUserMeals as getAllMeals,
  fetchUserWorkouts as getWorkoutSessions,
  fetchUserTasks as getAllTasks,
  fetchUserBodyWeight as getBodyWeightEntries,
  fetchUserHabits as getAllHabits,
};


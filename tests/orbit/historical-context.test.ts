import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildOrbitContext } from '@/lib/orbit/contextEngine';
import { serializeOrbitContext } from '@/lib/orbit/contextSerializer';
import * as firestore from '@/lib/firestore';
import * as domainUser from '@/lib/domain/user';
import * as nextAuth from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/firestore', () => ({
  getAllMeals: vi.fn(),
  getAllTasks: vi.fn(),
  getWorkoutSessions: vi.fn(),
  getAllHabits: vi.fn(),
  getBodyWeightEntries: vi.fn(),
}));

vi.mock('@/lib/domain/user', () => ({
  getUserProfile: vi.fn(),
  getUserMacroGoals: vi.fn(),
  getUserPreferences: vi.fn(),
}));

describe('Orbit Historical Context Serialization', () => {
  const mockUserId = 'test-user-456';
  const todayStr = new Date().toLocaleDateString('en-CA');
  const pastStr = new Date(Date.now() - 86400000 * 5).toLocaleDateString('en-CA'); // 5 days ago

  beforeEach(() => {
    vi.clearAllMocks();
    (nextAuth.getServerSession as any).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Tester' },
    });
    (domainUser.getUserProfile as any).mockResolvedValue({ id: mockUserId });
    (domainUser.getUserMacroGoals as any).mockResolvedValue({ calories: 2000, proteinG: 150 });
    (domainUser.getUserPreferences as any).mockResolvedValue({ timezone: 'Asia/Kolkata' });
    (firestore.getBodyWeightEntries as any).mockResolvedValue([]);
    (firestore.getWorkoutSessions as any).mockResolvedValue([]);
    (firestore.getAllHabits as any).mockResolvedValue([]);
  });

  it('includes today‑filtered meals, workouts, tasks, and habits under a `historical` key', async () => {
    const mockMeals = [
      { id: 'm1', name: 'Today Meal', date: todayStr, macros: { calories: 300, proteinG: 20, carbsG: 30, fatG: 10 } },
      { id: 'm2', name: 'Past Meal', date: pastStr, macros: { calories: 500, proteinG: 30, carbsG: 60, fatG: 15 } },
    ];
    const mockWorkouts = [
      { id: 'w1', date: todayStr, durationMinutes: 45, exercises: [] },
    ];
    const mockTasks = [
      { id: 't1', title: 'Today Task', dueDate: todayStr, status: 'pending' },
    ];
    const mockHabits = [
      { id: 'h1', name: 'Today Habit', date: todayStr },
    ];

    (firestore.getAllMeals as any).mockResolvedValue(mockMeals);
    (firestore.getWorkoutSessions as any).mockResolvedValue(mockWorkouts);
    (firestore.getAllTasks as any).mockResolvedValue(mockTasks);
    (firestore.getAllHabits as any).mockResolvedValue(mockHabits);

    const context = await buildOrbitContext({ domains: ['meals', 'workouts', 'tasks', 'habits'] });
    const serialized = serializeOrbitContext(context);
expect(serialized).not.toBeNull();
expect(serialized!.historical.meals).toEqual(context?.meals?.today ?? []);
expect(serialized!.historical.workouts).toEqual(context?.workouts?.today ?? []);
expect(serialized!.historical.tasks).toEqual(context?.tasks?.today ?? []);
expect(serialized!.historical.habits).toEqual(context?.habits?.today ?? []);
  });
});

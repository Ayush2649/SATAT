import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildOrbitContext } from '@/lib/orbit/contextEngine';
import { serializeOrbitContext } from '@/lib/orbit/contextSerializer';
import * as serverContext from '@/lib/orbit/serverContext';
import * as domainUser from '@/lib/domain/user';
import * as nextAuth from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/orbit/serverContext', () => ({
  getAllMeals: vi.fn(),
  getAllTasks: vi.fn(),
  getWorkoutSessions: vi.fn(),
  getAllHabits: vi.fn(),
  getBodyWeightEntries: vi.fn(),
  fetchUserMeals: vi.fn(),
  fetchUserWorkouts: vi.fn(),
  fetchUserTasks: vi.fn(),
  fetchUserBodyWeight: vi.fn(),
  fetchUserHabits: vi.fn(),
}));

vi.mock('@/lib/domain/user', () => ({
  getUserProfile: vi.fn(),
  getUserMacroGoals: vi.fn(),
  getUserPreferences: vi.fn(),
}));

describe('Orbit Historical Context Integration & Security', () => {
  const mockUserIdA = 'test-user-alpha';
  const mockUserIdB = 'test-user-beta';
  const todayStr = new Date().toLocaleDateString('en-CA');
  const pastStr = new Date(Date.now() - 86400000 * 5).toLocaleDateString('en-CA'); // 5 days ago

  beforeEach(() => {
    vi.clearAllMocks();
    (nextAuth.getServerSession as any).mockResolvedValue({
      user: { id: mockUserIdA, email: 'alpha@example.com', name: 'Alpha Tester' },
    });
    (domainUser.getUserProfile as any).mockResolvedValue({ id: mockUserIdA });
    (domainUser.getUserMacroGoals as any).mockResolvedValue({ calories: 2000, proteinG: 150 });
    (domainUser.getUserPreferences as any).mockResolvedValue({ timezone: 'Asia/Kolkata' });
    (serverContext.getBodyWeightEntries as any).mockResolvedValue([]);
    (serverContext.getWorkoutSessions as any).mockResolvedValue([]);
    (serverContext.getAllHabits as any).mockResolvedValue([]);
    (serverContext.getAllMeals as any).mockResolvedValue([]);
    (serverContext.getAllTasks as any).mockResolvedValue([]);
  });

  describe('Historical Context Serialization', () => {
    it('includes today-filtered meals, workouts, tasks, and habits under a historical key', async () => {
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

      (serverContext.getAllMeals as any).mockResolvedValue(mockMeals);
      (serverContext.getWorkoutSessions as any).mockResolvedValue(mockWorkouts);
      (serverContext.getAllTasks as any).mockResolvedValue(mockTasks);
      (serverContext.getAllHabits as any).mockResolvedValue(mockHabits);

      const context = await buildOrbitContext({ domains: ['meals', 'workouts', 'tasks', 'habits'] });
      const serialized = serializeOrbitContext(context);

      expect(serialized).not.toBeNull();
      expect(serialized!.historical.meals).toEqual(context?.meals?.today ?? []);
      expect(serialized!.historical.workouts).toEqual(context?.workouts?.today ?? []);
      expect(serialized!.historical.tasks).toEqual(context?.tasks?.today ?? []);
      expect(serialized!.historical.habits).toEqual(context?.habits?.today ?? []);
    });

    it('provides bodyWeightEntries where index 0 is the newest weigh-in for latest weight selection', async () => {
      const mockWeights = [
        { id: 'bw-new', userId: mockUserIdA, weightKg: 82.5, createdAt: 2000 },
        { id: 'bw-old', userId: mockUserIdA, weightKg: 75.0, createdAt: 1000 },
      ];
      (serverContext.getBodyWeightEntries as any).mockResolvedValue(mockWeights);

      const context = await buildOrbitContext({ domains: ['profile'] });
      expect(context?.bodyWeightEntries).toBeDefined();
      expect(context?.bodyWeightEntries?.[0].weightKg).toBe(82.5);
    });
  });

  describe('Authentication & Identity Validation', () => {
    it('rejects unauthenticated requests by returning null when session is null', async () => {
      (nextAuth.getServerSession as any).mockResolvedValue(null);

      const context = await buildOrbitContext({ domains: ['meals', 'workouts'] });
      expect(context).toBeNull();

      // No server queries should have fired
      expect(serverContext.getAllMeals).not.toHaveBeenCalled();
      expect(serverContext.getWorkoutSessions).not.toHaveBeenCalled();
    });

    it('rejects requests when session user has neither id nor email', async () => {
      (nextAuth.getServerSession as any).mockResolvedValue({
        user: {},
      });

      const context = await buildOrbitContext({ domains: ['tasks'] });
      expect(context).toBeNull();
      expect(serverContext.getAllTasks).not.toHaveBeenCalled();
    });

    it('correctly passes authenticated user identity to server context queries', async () => {
      (serverContext.getAllMeals as any).mockResolvedValue([]);
      (serverContext.getAllTasks as any).mockResolvedValue([]);

      await buildOrbitContext({ domains: ['meals', 'tasks'] });

      expect(serverContext.getAllMeals).toHaveBeenCalledWith(mockUserIdA);
      expect(serverContext.getAllTasks).toHaveBeenCalledWith(mockUserIdA);
    });

    it('falls back to session email when user id is not present', async () => {
      const emailOnlyUser = 'user-by-email@example.com';
      (nextAuth.getServerSession as any).mockResolvedValue({
        user: { email: emailOnlyUser },
      });

      await buildOrbitContext({ domains: ['meals'] });
      expect(serverContext.getAllMeals).toHaveBeenCalledWith(emailOnlyUser);
    });
  });

  describe('Cross-User Data Isolation', () => {
    it('does not allow User A to query or receive User B records', async () => {
      // User A is logged in
      (nextAuth.getServerSession as any).mockResolvedValue({
        user: { id: mockUserIdA, email: 'alpha@example.com' },
      });

      // Mock server context only returning records matching the passed userId
      (serverContext.getAllMeals as any).mockImplementation(async (uid: string) => {
        if (uid === mockUserIdA) {
          return [{ id: 'meal_a', userId: mockUserIdA, name: 'Alpha Meal', date: todayStr }];
        }
        return [{ id: 'meal_b', userId: mockUserIdB, name: 'Beta Secret Meal', date: todayStr }];
      });

      const context = await buildOrbitContext({ domains: ['meals'] });
      expect(context).not.toBeNull();
      expect(serverContext.getAllMeals).toHaveBeenCalledWith(mockUserIdA);
      expect(serverContext.getAllMeals).not.toHaveBeenCalledWith(mockUserIdB);

      const mealNames = context?.meals?.all?.map((m: any) => m.name);
      expect(mealNames).toContain('Alpha Meal');
      expect(mealNames).not.toContain('Beta Secret Meal');
    });
  });

  describe('Graceful Degradation with Missing or Empty Data', () => {
    it('handles completely empty collections without crashing or fabricating records', async () => {
      (domainUser.getUserProfile as any).mockResolvedValue(null);
      (domainUser.getUserMacroGoals as any).mockResolvedValue(null);
      (domainUser.getUserPreferences as any).mockResolvedValue(null);
      (serverContext.getAllMeals as any).mockResolvedValue([]);
      (serverContext.getAllTasks as any).mockResolvedValue([]);
      (serverContext.getWorkoutSessions as any).mockResolvedValue([]);
      (serverContext.getBodyWeightEntries as any).mockResolvedValue([]);
      (serverContext.getAllHabits as any).mockResolvedValue([]);

      const context = await buildOrbitContext();
      expect(context).not.toBeNull();
      expect(context?.profile).toBeUndefined();
      expect(context?.macroGoals).toBeUndefined();
      expect(context?.meals?.all).toEqual([]);
      expect(context?.meals?.today).toEqual([]);
      expect(context?.workouts?.all).toEqual([]);
      expect(context?.workouts?.today).toEqual([]);
      expect(context?.tasks?.all).toEqual([]);
      expect(context?.tasks?.today).toEqual([]);
      expect(context?.habits?.all).toEqual([]);
      expect(context?.habits?.today).toEqual([]);

      const serialized = serializeOrbitContext(context);
      expect(serialized).not.toBeNull();
      expect(serialized!.profile).toBeNull();
      expect(serialized!.macroGoals).toBeNull();
      expect(serialized!.todayMeals).toEqual([]);
      expect(serialized!.todayTasks).toEqual([]);
      expect(serialized!.todayWorkout).toEqual([]);
      expect(serialized!.historical.meals).toEqual([]);
      expect(serialized!.historical.workouts).toEqual([]);
      expect(serialized!.historical.tasks).toEqual([]);
      expect(serialized!.historical.habits).toEqual([]);
      expect(serialized!.nutritionTotals.calories).toBe(0);
    });

    it('returns null when serializeOrbitContext receives null', () => {
      expect(serializeOrbitContext(null)).toBeNull();
    });

    it('isolates category errors so one failed category does not destroy other available categories', async () => {
      // Simulate meals service failing with an unexpected database error
      (serverContext.getAllMeals as any).mockRejectedValueOnce(new Error("Firestore connection timeout"));
      // Workouts and tasks succeed
      const mockWorkouts = [{ id: 'w1', date: todayStr, durationMinutes: 60, exercises: [] }];
      const mockTasks = [{ id: 't1', title: 'Critical Task', dueDate: todayStr, status: 'pending' }];
      (serverContext.getWorkoutSessions as any).mockResolvedValueOnce(mockWorkouts);
      (serverContext.getAllTasks as any).mockResolvedValueOnce(mockTasks);

      const context = await buildOrbitContext({ domains: ['meals', 'workouts', 'tasks'] });

      // Entire context build does not reject
      expect(context).not.toBeNull();
      // Failed meals category degraded gracefully to empty
      expect(context?.meals?.all).toEqual([]);
      expect(context?.meals?.today).toEqual([]);
      // Successful categories remained intact and usable
      expect(context?.workouts?.today.length).toBe(1);
      expect(context?.workouts?.today[0].id).toBe('w1');
      expect(context?.tasks?.today.length).toBe(1);
      expect(context?.tasks?.today[0].id).toBe('t1');
    });
  });

  describe('Rolling Seven-Day Window & Temporal Boundary Accuracy', () => {
    it('accurately includes records in the 7-day window and excludes records beyond day 7', async () => {
      const now = Date.now();
      const dayMs = 86400000;
      const d0 = new Date(now).toLocaleDateString('en-CA'); // today
      const d3 = new Date(now - 3 * dayMs).toLocaleDateString('en-CA'); // 3 days ago (in window)
      const d6 = new Date(now - 6 * dayMs).toLocaleDateString('en-CA'); // 6 days ago (in window)
      const d7 = new Date(now - 7 * dayMs).toLocaleDateString('en-CA'); // 7 days ago (outside window)
      const d10 = new Date(now - 10 * dayMs).toLocaleDateString('en-CA'); // 10 days ago (outside window)

      const mockWorkouts = [
        { id: 'w-today', date: d0, durationMinutes: 45, exercises: [] },
        { id: 'w-3days', date: d3, durationMinutes: 50, exercises: [] },
        { id: 'w-6days', date: d6, durationMinutes: 30, exercises: [] },
        { id: 'w-7days', date: d7, durationMinutes: 40, exercises: [] },
        { id: 'w-10days', date: d10, durationMinutes: 60, exercises: [] },
      ];
      (serverContext.getWorkoutSessions as any).mockResolvedValue(mockWorkouts);

      const context = await buildOrbitContext({
        domains: ['workouts'],
        temporalScope: 'last7Days',
      });

      expect(context?.workouts).toBeDefined();
      const includedIds = context!.workouts.today.map((w: any) => w.id);
      expect(includedIds).toContain('w-today');
      expect(includedIds).toContain('w-3days');
      expect(includedIds).toContain('w-6days');
      expect(includedIds).not.toContain('w-7days');
      expect(includedIds).not.toContain('w-10days');
      expect(includedIds.length).toBe(3);
    });

    it('does not exclude overdue pending tasks even if due before the seven-day period', async () => {
      const dayMs = 86400000;
      const today = new Date().toLocaleDateString('en-CA');
      const inWindowDate = new Date(Date.now() - 2 * dayMs).toLocaleDateString('en-CA');
      const wayOverdueDate = new Date(Date.now() - 20 * dayMs).toLocaleDateString('en-CA'); // 20 days ago

      const mockTasks = [
        { id: 't-in-window', title: 'Task in window', dueDate: inWindowDate, status: 'completed' },
        { id: 't-overdue', title: 'Overdue Project Report', dueDate: wayOverdueDate, status: 'pending' },
        { id: 't-in-progress-old', title: 'Ongoing Initiative', dueDate: wayOverdueDate, status: 'pending' },
        { id: 't-old-completed', title: 'Ancient completed task', dueDate: wayOverdueDate, status: 'completed' },
      ];
      (serverContext.getAllTasks as any).mockResolvedValue(mockTasks);

      const context = await buildOrbitContext({
        domains: ['tasks'],
        temporalScope: 'last7Days',
      });

      expect(context?.tasks).toBeDefined();
      const taskIds = context!.tasks.today.map((t: any) => t.id);

      // Tasks within the 7-day window are included
      expect(taskIds).toContain('t-in-window');
      // CRITICAL: Overdue and in_progress tasks prior to the window MUST be included
      expect(taskIds).toContain('t-overdue');
      expect(taskIds).toContain('t-in-progress-old');
      // Completed tasks outside the window must NOT be included
      expect(taskIds).not.toContain('t-old-completed');
    });

    it('retrieves yesterday meal history when requested with yesterday temporal scope', async () => {
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
      const mockMeals = [
        { id: 'm-today', name: 'Today Breakfast', date: todayStr, macros: { calories: 400, proteinG: 25 } },
        { id: 'm-yesterday', name: 'Yesterday Dinner', date: yesterday, macros: { calories: 650, proteinG: 40 } },
      ];
      (serverContext.getAllMeals as any).mockResolvedValue(mockMeals);

      const context = await buildOrbitContext({
        domains: ['meals', 'nutrition'],
        temporalScope: 'yesterday',
      });

      expect(context?.meals).toBeDefined();
      const mealIds = context!.meals.today.map((m: any) => m.id);
      expect(mealIds).toContain('m-yesterday');
      expect(mealIds).not.toContain('m-today');
      expect(mealIds.length).toBe(1);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchUserMeals,
  fetchUserWorkouts,
  fetchUserTasks,
  fetchUserBodyWeight,
  fetchUserHabits,
} from '@/lib/orbit/serverContext';
import { adminDb } from '@/lib/firebaseAdmin';

vi.mock('@/lib/firebaseAdmin', () => {
  const mockGet = vi.fn();
  const mockWhere = vi.fn();
  const mockCollection = vi.fn();

  return {
    adminDb: {
      collection: mockCollection,
    },
    default: {
      firestore: () => ({ collection: mockCollection }),
    },
  };
});

describe('Orbit serverContext - Firestore Admin Access & Security', () => {
  const mockUserId = 'user_secure_123';
  let mockGet: any;
  let mockWhere: any;
  let mockCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet = vi.fn();
    mockWhere = vi.fn().mockReturnValue({ get: mockGet });
    mockCollection = vi.fn().mockReturnValue({ where: mockWhere });
    (adminDb.collection as any) = mockCollection;
  });

  describe('fetchUserMeals', () => {
    it('returns empty array when userId is empty or invalid', async () => {
      expect(await fetchUserMeals('')).toEqual([]);
      expect(await fetchUserMeals('   ')).toEqual([]);
      expect(await fetchUserMeals(null as any)).toEqual([]);
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('queries meals collection scoped strictly to userId', async () => {
      const mockDocs = [
        { id: 'm1', data: () => ({ userId: mockUserId, name: 'Biryani', date: '2026-10-22' }) },
      ];
      mockGet.mockResolvedValue({ docs: mockDocs });

      const meals = await fetchUserMeals(mockUserId);
      expect(mockCollection).toHaveBeenCalledWith('meals');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUserId);
      expect(meals).toEqual([
        { id: 'm1', userId: mockUserId, name: 'Biryani', date: '2026-10-22' },
      ]);
    });
  });

  describe('fetchUserWorkouts', () => {
    it('returns empty array when userId is empty or invalid', async () => {
      expect(await fetchUserWorkouts('')).toEqual([]);
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('queries workouts collection scoped strictly to userId and sorts by createdAt desc', async () => {
      const mockDocs = [
        { id: 'w1', data: () => ({ userId: mockUserId, createdAt: 1000, durationMinutes: 30 }) },
        { id: 'w2', data: () => ({ userId: mockUserId, createdAt: 2000, durationMinutes: 45 }) },
      ];
      mockGet.mockResolvedValue({ docs: mockDocs });

      const workouts = await fetchUserWorkouts(mockUserId);
      expect(mockCollection).toHaveBeenCalledWith('workouts');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUserId);
      // w2 (createdAt: 2000) should come before w1 (createdAt: 1000)
      expect(workouts[0].id).toBe('w2');
      expect(workouts[1].id).toBe('w1');
    });
  });

  describe('fetchUserTasks', () => {
    it('returns empty array when userId is empty or invalid', async () => {
      expect(await fetchUserTasks('')).toEqual([]);
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('queries tasks collection scoped strictly to userId and sorts by createdAt desc', async () => {
      const mockDocs = [
        { id: 't1', data: () => ({ userId: mockUserId, createdAt: 500, title: 'Task 1' }) },
        { id: 't2', data: () => ({ userId: mockUserId, createdAt: 1500, title: 'Task 2' }) },
      ];
      mockGet.mockResolvedValue({ docs: mockDocs });

      const tasks = await fetchUserTasks(mockUserId);
      expect(mockCollection).toHaveBeenCalledWith('tasks');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUserId);
      expect(tasks[0].id).toBe('t2');
      expect(tasks[1].id).toBe('t1');
    });
  });

  describe('fetchUserBodyWeight', () => {
    it('returns empty array when userId is empty or invalid', async () => {
      expect(await fetchUserBodyWeight('')).toEqual([]);
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('queries bodyweight collection scoped strictly to userId and sorts by createdAt desc', async () => {
      const mockDocs = [
        { id: 'bw1', data: () => ({ userId: mockUserId, createdAt: 100, weightKg: 70 }) },
        { id: 'bw2', data: () => ({ userId: mockUserId, createdAt: 300, weightKg: 69.5 }) },
      ];
      mockGet.mockResolvedValue({ docs: mockDocs });

      const bw = await fetchUserBodyWeight(mockUserId);
      expect(mockCollection).toHaveBeenCalledWith('bodyweight');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUserId);
      expect(bw[0].id).toBe('bw2');
      expect(bw[1].id).toBe('bw1');
    });
  });

  describe('fetchUserHabits', () => {
    it('returns empty array when userId is empty or invalid', async () => {
      expect(await fetchUserHabits('')).toEqual([]);
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('queries habits collection scoped strictly to userId', async () => {
      const mockDocs = [
        { id: 'h1', data: () => ({ userId: mockUserId, name: 'Drink water' }) },
      ];
      mockGet.mockResolvedValue({ docs: mockDocs });

      const habits = await fetchUserHabits(mockUserId);
      expect(mockCollection).toHaveBeenCalledWith('habits');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUserId);
      expect(habits).toEqual([
        { id: 'h1', userId: mockUserId, name: 'Drink water' },
      ]);
    });
  });
});


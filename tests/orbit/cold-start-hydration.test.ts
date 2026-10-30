import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWorkoutContext,
  getTaskContext,
  getDietContext,
  resetOrbitContext,
} from "@/lib/orbitContext";
import { inferContextRequirements } from "@/lib/orbit/contextRequirement";
import { buildOrbitContext } from "@/lib/orbit/contextEngine";
import { serializeOrbitContext } from "@/lib/orbit/contextSerializer";
import * as serverContext from "@/lib/orbit/serverContext";
import * as domainUser from "@/lib/domain/user";
import * as nextAuth from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/orbit/serverContext", () => ({
  getAllTasks: vi.fn(),
  getAllMeals: vi.fn(),
  getWorkoutSessions: vi.fn(),
  getAllHabits: vi.fn(),
  getBodyWeightEntries: vi.fn(),
}));

vi.mock("@/lib/domain/user", () => ({
  getUserProfile: vi.fn(),
  getUserMacroGoals: vi.fn(),
  getUserPreferences: vi.fn(),
}));

describe("ARGON-04: Orbit Cold-Start Context Hydration Verification", () => {
  const mockUserId = "user_cold_start_test";
  const todayStr = new Date().toLocaleDateString("en-CA");

  beforeEach(() => {
    vi.clearAllMocks();
    resetOrbitContext();

    (nextAuth.getServerSession as any).mockResolvedValue({
      user: { id: mockUserId, email: "coldstart@example.com", name: "ColdStartUser" },
    });
    (domainUser.getUserProfile as any).mockResolvedValue({ id: mockUserId, name: "ColdStartUser" });
    (domainUser.getUserMacroGoals as any).mockResolvedValue({ calories: 2400, proteinG: 160, carbsG: 220, fatG: 70 });
    (domainUser.getUserPreferences as any).mockResolvedValue({ timezone: "Asia/Kolkata" });

    (serverContext.getAllTasks as any).mockResolvedValue([]);
    (serverContext.getAllMeals as any).mockResolvedValue([]);
    (serverContext.getWorkoutSessions as any).mockResolvedValue([]);
    (serverContext.getAllHabits as any).mockResolvedValue([]);
    (serverContext.getBodyWeightEntries as any).mockResolvedValue([]);
  });

  it("1. Baseline: In-memory client slices in orbitContext.ts are uninitialized (null) on cold start", () => {
    // Before visiting /dashboard/tasks, /dashboard/workout, or /dashboard/diet,
    // module-level store slices are null
    expect(getWorkoutContext()).toBeNull();
    expect(getTaskContext()).toBeNull();
    expect(getDietContext()).toBeNull();
  });

  it("2. Cold-Start Tasks: Direct visit to Orbit resolves today's pending tasks from server Firestore", async () => {
    // Verify client store is uninitialized
    expect(getTaskContext()).toBeNull();

    const mockTasks = [
      { id: "task-1", title: "Complete Q3 Security Audit", dueDate: todayStr, status: "pending", priority: "high", userId: mockUserId },
      { id: "task-2", title: "Review PR #42", dueDate: todayStr, status: "completed", completedAt: Date.now(), userId: mockUserId },
    ];
    (serverContext.getAllTasks as any).mockResolvedValue(mockTasks);

    // User asks Orbit about pending tasks on a fresh load
    const userQuery = "What tasks do I have pending today?";
    const req = inferContextRequirements(userQuery);
    expect(req.domains).toContain("tasks");

    // Server-side context retrieval must query Firestore via Admin SDK
    const context = await buildOrbitContext(req);
    expect(serverContext.getAllTasks).toHaveBeenCalledWith(mockUserId);
    expect(context?.tasks).toBeDefined();
    expect(context?.tasks.today).toHaveLength(2);
    expect(context?.tasks.today[0].title).toBe("Complete Q3 Security Audit");
    expect(context?.tasks.today[0].status).toBe("pending");
  });

  it("3. Cold-Start Workouts: Direct visit to Orbit resolves today's workouts and body weight from server Firestore", async () => {
    // Verify client store is uninitialized
    expect(getWorkoutContext()).toBeNull();

    const mockSessions = [
      {
        id: "session-1",
        date: todayStr,
        durationMinutes: 55,
        userId: mockUserId,
        exercises: [{ name: "Barbell Squats", sets: [{ reps: 5, weight: 120, unit: "kg" }] }],
        cardioLogs: [],
        summary: "Leg power session",
      },
    ];
    const mockWeightEntries = [
      { id: "bw-1", userId: mockUserId, date: todayStr, weightKg: 81.5, createdAt: Date.now() },
    ];

    (serverContext.getWorkoutSessions as any).mockResolvedValue(mockSessions);
    (serverContext.getBodyWeightEntries as any).mockResolvedValue(mockWeightEntries);

    const userQuery = "What was my last workout?";
    const req = inferContextRequirements(userQuery);
    expect(req.domains).toContain("workouts");

    const context = await buildOrbitContext({
      domains: [...req.domains, "profile"],
      temporalScope: req.temporalScope,
    });

    expect(serverContext.getWorkoutSessions).toHaveBeenCalledWith(mockUserId);
    expect(serverContext.getBodyWeightEntries).toHaveBeenCalledWith(mockUserId);
    expect(context?.workouts).toBeDefined();
    expect(context?.workouts.today).toHaveLength(1);
    expect(context?.workouts.today[0].exercises[0].name).toBe("Barbell Squats");
    expect(context?.bodyWeightEntries).toHaveLength(1);
    expect(context?.bodyWeightEntries[0].weightKg).toBe(81.5);
  });

  it("4. Cold-Start Diet: Direct visit to Orbit resolves today's meals and macro goals from server Firestore", async () => {
    // Verify client store is uninitialized
    expect(getDietContext()).toBeNull();

    const mockMeals = [
      {
        id: "meal-1",
        name: "Oats with Whey & Berries",
        date: todayStr,
        userId: mockUserId,
        macros: { calories: 480, proteinG: 40, carbsG: 60, fatG: 8 },
      },
    ];
    (serverContext.getAllMeals as any).mockResolvedValue(mockMeals);

    const userQuery = "What did I eat today and what are my protein targets?";
    const req = inferContextRequirements(userQuery);
    expect(req.domains).toContain("meals");
    expect(req.domains).toContain("nutrition");

    const context = await buildOrbitContext(req);
    expect(serverContext.getAllMeals).toHaveBeenCalledWith(mockUserId);
    expect(context?.meals).toBeDefined();
    expect(context?.meals.today).toHaveLength(1);
    expect(context?.meals.today[0].name).toBe("Oats with Whey & Berries");
    expect(context?.macroGoals).toBeDefined();
    expect(context?.macroGoals?.proteinG).toBe(160);
  });

  it("5. Cold-Start Serialization: Full serialized payload contains real data ready for LLM inference", async () => {
    // All client slices remain null
    expect(getWorkoutContext()).toBeNull();
    expect(getTaskContext()).toBeNull();
    expect(getDietContext()).toBeNull();

    (serverContext.getAllMeals as any).mockResolvedValue([
      { id: "m-1", name: "Chicken Rice", date: todayStr, macros: { calories: 650, proteinG: 50, carbsG: 70, fatG: 12 } },
    ]);
    (serverContext.getWorkoutSessions as any).mockResolvedValue([
      { id: "w-1", date: todayStr, durationMinutes: 45, exercises: [{ name: "Bench Press", sets: [{ reps: 8, weight: 85, unit: "kg" }] }] },
    ]);
    (serverContext.getAllTasks as any).mockResolvedValue([
      { id: "t-1", title: "Ship Batch 1 Remediation", dueDate: todayStr, status: "pending" },
    ]);
    (serverContext.getBodyWeightEntries as any).mockResolvedValue([
      { date: todayStr, weightKg: 78.0 },
    ]);

    const context = await buildOrbitContext();
    expect(context).not.toBeNull();

    const serialized = serializeOrbitContext(context);
    expect(serialized).not.toBeNull();
    expect(serialized!.todayMeals).toHaveLength(1);
    expect(serialized!.todayMeals[0]?.name).toBe("Chicken Rice");
    expect(serialized!.todayWorkout).toHaveLength(1);
    expect(serialized!.todayWorkout[0]?.exercises[0].name).toBe("Bench Press");
    expect(serialized!.todayTasks).toHaveLength(1);
    expect(serialized!.todayTasks[0]?.title).toBe("Ship Batch 1 Remediation");
    expect(serialized!.profile?.weightKg).toBe(78.0);
  });
});

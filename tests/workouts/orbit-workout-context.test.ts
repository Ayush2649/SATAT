import { describe, it, expect, beforeEach } from "vitest";
import {
  setWorkoutContext,
  getWorkoutContext,
  type WorkoutContextData,
} from "@/lib/orbitContext";

describe("BUG-02: Orbit Workout Context Asynchronous Race Condition & Preservation", () => {
  beforeEach(() => {
    // Reset store before each test
    setWorkoutContext({
      bodyWeightKg: undefined,
      recentSessions: [],
    });
  });

  const mockSessions = [
    {
      date: "2026-10-25",
      durationMinutes: 45,
      exercises: [
        { name: "Bench Press", sets: 3, topWeight: 80, unit: "kg" },
      ],
      cardio: [],
      summary: "Upper body push session",
    },
    {
      date: "2026-10-24",
      durationMinutes: 50,
      exercises: [
        { name: "Squats", sets: 4, topWeight: 100, unit: "kg" },
      ],
      cardio: [],
      summary: "Leg day",
    },
  ];

  it("Scenario A: Sessions load first, then body weight loads — recentSessions must NOT be erased", async () => {
    // 1. Sessions resolve first
    const current1 = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: current1?.bodyWeightKg ?? undefined,
      recentSessions: mockSessions,
    });

    expect(getWorkoutContext()?.recentSessions).toHaveLength(2);
    expect(getWorkoutContext()?.bodyWeightKg).toBeUndefined();

    // 2. Body weight resolves afterwards
    const weightEntryKg = 75.5;
    const current2 = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: weightEntryKg,
      recentSessions: current2?.recentSessions ?? [],
    });

    // Verify recentSessions are preserved and bodyWeight is set
    const finalContext = getWorkoutContext();
    expect(finalContext?.bodyWeightKg).toBe(75.5);
    expect(finalContext?.recentSessions).toHaveLength(2);
    expect(finalContext?.recentSessions[0].exercises[0].name).toBe("Bench Press");
    expect(finalContext?.recentSessions[1].exercises[0].name).toBe("Squats");
  });

  it("Scenario B: Body weight loads first, then sessions load — bodyWeightKg must NOT be erased", async () => {
    // 1. Body weight resolves first
    const weightEntryKg = 82.0;
    const current1 = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: weightEntryKg,
      recentSessions: current1?.recentSessions ?? [],
    });

    expect(getWorkoutContext()?.bodyWeightKg).toBe(82.0);
    expect(getWorkoutContext()?.recentSessions).toEqual([]);

    // 2. Sessions resolve afterwards
    const current2 = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: current2?.bodyWeightKg ?? undefined,
      recentSessions: mockSessions,
    });

    // Verify both body weight and sessions are retained
    const finalContext = getWorkoutContext();
    expect(finalContext?.bodyWeightKg).toBe(82.0);
    expect(finalContext?.recentSessions).toHaveLength(2);
  });

  it("Scenario C: Empty history (sessions = []) with valid body weight", async () => {
    // Sessions resolve as empty
    const current1 = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: current1?.bodyWeightKg ?? undefined,
      recentSessions: [],
    });

    // Body weight resolves
    const current2 = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: 70.0,
      recentSessions: current2?.recentSessions ?? [],
    });

    const finalContext = getWorkoutContext();
    expect(finalContext?.bodyWeightKg).toBe(70.0);
    expect(finalContext?.recentSessions).toEqual([]);
  });

  it("Scenario D: Empty body weight history (no entries) with valid sessions", async () => {
    // Sessions resolve
    const current1 = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: current1?.bodyWeightKg ?? undefined,
      recentSessions: mockSessions,
    });

    // Body weight resolves as empty (no entries to set)
    // context remains with undefined bodyWeightKg and intact recentSessions
    const finalContext = getWorkoutContext();
    expect(finalContext?.bodyWeightKg).toBeUndefined();
    expect(finalContext?.recentSessions).toHaveLength(2);
  });

  it("Scenario E: Logging a new body weight updates bodyWeightKg and retains existing sessions", async () => {
    // Initial context loaded with sessions
    setWorkoutContext({
      bodyWeightKg: 74.0,
      recentSessions: mockSessions,
    });

    // User logs new body weight of 73.5 kg
    const newWeight = 73.5;
    const current = getWorkoutContext();
    setWorkoutContext({
      bodyWeightKg: newWeight,
      recentSessions: current?.recentSessions ?? [],
    });

    const finalContext = getWorkoutContext();
    expect(finalContext?.bodyWeightKg).toBe(73.5);
    expect(finalContext?.recentSessions).toHaveLength(2);
    expect(finalContext?.recentSessions[0].date).toBe("2026-10-25");
  });
});

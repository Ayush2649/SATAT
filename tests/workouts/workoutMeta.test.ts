import { describe, it, expect } from "vitest";
import {
  inferWorkoutSplitMeta,
  extractOrComputeWorkoutCalories,
  parseCoachReport,
} from "@/lib/workouts/workoutMeta";
import type { WorkoutSession } from "@/types";

describe("Workout Split & Calorie Meta (§Sprint 4.4)", () => {
  it("infers Push Day metadata from push exercises", () => {
    const meta = inferWorkoutSplitMeta({
      exercises: [
        { name: "Bench Press", sets: [{ id: "1", reps: 8, weight: 60, unit: "kg", completed: true }] },
        { name: "Incline DB Press", sets: [{ id: "2", reps: 10, weight: 30, unit: "kg", completed: true }] },
        { name: "Lateral Raises", sets: [{ id: "3", reps: 15, weight: 10, unit: "kg", completed: true }] },
        { name: "Tricep Pushdown", sets: [{ id: "4", reps: 12, weight: 25, unit: "kg", completed: true }] },
      ],
    });

    expect(meta.title).toBe("Push Day — Upper Body");
    expect(meta.category).toBe("Push / Pull");
    expect(meta.muscles).toContain("Chest");
    expect(meta.muscles).toContain("Shoulders");
    expect(meta.muscles).toContain("Triceps");
  });

  it("infers Lower Body metadata from squat and hinge exercises", () => {
    const meta = inferWorkoutSplitMeta({
      exercises: [
        { name: "Barbell Squat", sets: [{ id: "1", reps: 6, weight: 80, unit: "kg", completed: true }] },
        { name: "Romanian Deadlift", sets: [{ id: "2", reps: 10, weight: 70, unit: "kg", completed: true }] },
        { name: "Leg Press", sets: [{ id: "3", reps: 12, weight: 120, unit: "kg", completed: true }] },
      ],
    });

    expect(meta.title).toBe("Lower Body — Quads & Hinge");
    expect(meta.category).toBe("Lower Body");
    expect(meta.muscles).toContain("Quads");
    expect(meta.muscles).toContain("Hamstrings");
  });

  it("infers Cardio metadata when only cardio is logged", () => {
    const meta = inferWorkoutSplitMeta({
      exercises: [],
      cardioLogs: [
        { id: "c1", activity: "running", durationMinutes: 30, distanceKm: 5, caloriesBurned: 294 },
      ],
    });

    expect(meta.category).toBe("Cardio");
    expect(meta.title).toContain("Running & Aerobic Flow");
  });

  it("extracts calories burned from explicit property or coachReport regex", () => {
    const sessionWithProp = {
      id: "w1",
      userId: "u1",
      date: "2026-10-26",
      exercises: [],
      durationMinutes: 45,
      createdAt: Date.now(),
      caloriesBurned: 420,
    } as any;
    expect(extractOrComputeWorkoutCalories(sessionWithProp)).toBe(420);

    const sessionWithSummary = {
      id: "w2",
      userId: "u1",
      date: "2026-10-26",
      exercises: [],
      durationMinutes: 45,
      createdAt: Date.now(),
      summary: "Great job! Estimated energy expenditure: 385 kcal burned.",
    } as any;
    expect(extractOrComputeWorkoutCalories(sessionWithSummary)).toBe(385);
  });

  it("dynamically computes realistic physiological burn when no explicit calories or summary regex exists", () => {
    const sessionWithoutCal = {
      id: "w3",
      userId: "u1",
      date: "2026-10-26",
      exercises: [
        { id: "e1", name: "Squats", sets: [{ id: "s1", reps: 8, weight: 80, unit: "kg", completed: true }, { id: "s2", reps: 8, weight: 80, unit: "kg", completed: true }] },
      ],
      durationMinutes: 45,
      createdAt: Date.now(),
    } as WorkoutSession;

    const cals = extractOrComputeWorkoutCalories(sessionWithoutCal);
    expect(cals).toBeGreaterThan(250);
    expect(cals).toBeLessThan(800);
    expect(cals).not.toBe(0);
  });

  it("parses AI coach report into 3 clean structured sub-cards without markdown asterisks", () => {
    const rawReport = `
1. **Overall Performance** – Strong execution today with high intensity.
2. **What You Did Well** – Maintained progressive overload on the bench press.
3. **Intensity Level** – High — peak heart rate sustained.
4. **Areas to Improve** – Slow down the eccentric tempo on lateral raises.
5. **Next Session Tip** – Aim for +2.5kg on squats.
    `;

    const parsed = parseCoachReport(rawReport);
    expect(parsed.volumeHighlight).not.toContain("**");
    expect(parsed.loadProgression).not.toContain("**");
    expect(parsed.nextSessionTip).not.toContain("**");
    expect(parsed.volumeHighlight).toContain("progressive overload");
    expect(parsed.loadProgression).toContain("eccentric tempo");
    expect(parsed.nextSessionTip).toContain("+2.5kg on squats");
  });
});


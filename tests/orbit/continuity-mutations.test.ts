import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { formatMealTimeAndCategory } from "@/lib/diet/dishMatcher";

// ── In-Memory Firestore Mock for Admin DB ─────────────────────────────────────

const mockMealStore = new Map<string, any>();
const mockWorkoutStore = new Map<string, any>();
const mockTaskStore = new Map<string, any>();
const mockHabitStore = new Map<string, any>();
const mockSprintStore = new Map<string, any>();

function createMockCollection(store: Map<string, any>) {
  return {
    add: vi.fn(async (data: any) => {
      const id = `doc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const docData = { ...data, id };
      store.set(id, docData);
      return { id };
    }),
    doc: vi.fn((id: string) => ({
      get: vi.fn(async () => ({
        id,
        exists: store.has(id),
        data: () => store.get(id),
      })),
      update: vi.fn(async (patch: any) => {
        const existing = store.get(id) || {};
        store.set(id, { ...existing, ...patch });
      }),
      set: vi.fn(async (data: any, options?: { merge?: boolean }) => {
        const existing = store.get(id) || {};
        store.set(id, options?.merge ? { ...existing, ...data } : { ...data, id });
      }),
      delete: vi.fn(async () => {
        store.delete(id);
      }),
    })),
    where: vi.fn((field: string, op: string, val: any) => {
      let filters: Array<{ field: string; val: any }> = [{ field, val }];
      const queryObj: any = {
        where: vi.fn((f: string, o: string, v: any) => {
          filters.push({ field: f, val: v });
          return queryObj;
        }),
        get: vi.fn(async () => {
          const docs = Array.from(store.values()).filter((item) =>
            filters.every((flt) => item[flt.field] === flt.val)
          );
          return {
            docs: docs.map((d) => ({
              id: d.id,
              data: () => d,
            })),
          };
        }),
      };
      return queryObj;
    }),
    get: vi.fn(async () => ({
      docs: Array.from(store.values()).map((d) => ({
        id: d.id,
        data: () => d,
      })),
    })),
  };
}

const mockMealsCol = createMockCollection(mockMealStore);
const mockWorkoutsCol = createMockCollection(mockWorkoutStore);
const mockTasksCol = createMockCollection(mockTaskStore);
const mockHabitsCol = createMockCollection(mockHabitStore);
const mockSprintsCol = createMockCollection(mockSprintStore);

vi.mock("@/lib/firebaseAdmin", () => ({
  adminDb: {
    collection: vi.fn((colName: string) => {
      if (colName === "meals") return mockMealsCol;
      if (colName === "workouts") return mockWorkoutsCol;
      if (colName === "tasks") return mockTasksCol;
      if (colName === "habits") return mockHabitsCol;
      if (colName === "sprints") return mockSprintsCol;
      return createMockCollection(new Map());
    }),
  },
  default: {
    firestore: () => ({
      collection: (colName: string) => {
        if (colName === "meals") return mockMealsCol;
        if (colName === "workouts") return mockWorkoutsCol;
        if (colName === "tasks") return mockTasksCol;
      if (colName === "habits") return mockHabitsCol;
      if (colName === "sprints") return mockSprintsCol;
      return createMockCollection(new Map());
      },
    }),
  },
}));

// Mock NextAuth
const mockUserId = "usr_athlete_456";
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Mock Orbit Context Engine
const { mockCallTextWithFallback, mockBuildOrbitContext } = vi.hoisted(() => ({
  mockCallTextWithFallback: vi.fn(),
  mockBuildOrbitContext: vi.fn(),
}));

vi.mock("@/lib/ai/groq", () => ({
  callTextWithFallback: mockCallTextWithFallback,
}));

vi.mock("@/lib/orbit/contextEngine", () => ({
  buildOrbitContext: mockBuildOrbitContext,
}));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/aria/route";
import {
  estimateMacrosForDish,
  parseMutationIntent,
  generateContextualSuggestions,
} from "@/lib/orbit/mutationEngine";

describe("Orbit Context Continuity, State Mutation & Suggestion Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMealStore.clear();
    mockWorkoutStore.clear();
    mockTaskStore.clear();
    mockHabitStore.clear();
    mockSprintStore.clear();

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: mockUserId, name: "Prateek", email: "prateek@satat.fit" },
    } as any);

    mockBuildOrbitContext.mockResolvedValue({
      profile: { id: "p1" },
      macroGoals: { calories: 2400, proteinG: 150, carbsG: 260, fatG: 65 },
      preferences: { timezone: "Asia/Kolkata" },
      meals: { all: [], today: [], recent: [] },
      workouts: { all: [], today: [] },
      tasks: { all: [], today: [] },
      habits: { all: [], today: [] },
      bodyWeightEntries: [],
    } as any);

    mockCallTextWithFallback.mockResolvedValue({
      data: "Acknowledged and logged. Keep up the great consistency!",
    });
  });

  // ── 1. Macro Estimation Unit Tests ───────────────────────────────────────────
  describe("Macro Estimation Engine (estimateMacrosForDish)", () => {
    it("estimates 400g cooked rice accurately (~520 kcal, 11g protein, 112g carbs)", () => {
      const macros = estimateMacrosForDish("400g rice");
      expect(macros.calories).toBe(520);
      expect(macros.proteinG).toBe(11);
      expect(macros.carbsG).toBe(112);
    });

    it("estimates 3 chapatis accurately (~312 kcal, 9g protein, 54g carbs)", () => {
      const macros = estimateMacrosForDish("3 chapatis");
      expect(macros.calories).toBe(312);
      expect(macros.proteinG).toBe(9);
      expect(macros.carbsG).toBe(54);
    });

    it("estimates salad accurately (~50 kcal, 2g protein)", () => {
      const macros = estimateMacrosForDish("salad");
      expect(macros.calories).toBe(50);
      expect(macros.proteinG).toBe(2);
      expect(macros.carbsG).toBe(9);
    });

    it("estimates 2 boiled eggs accurately (~148 kcal, 13g protein)", () => {
      const macros = estimateMacrosForDish("2 boiled eggs");
      expect(macros.calories).toBe(148);
      expect(macros.proteinG).toBe(13);
    });
  });

  // ── 2. Mutation Intent Parser Unit Tests ─────────────────────────────────────
  describe("Mutation Intent Parser (parseMutationIntent)", () => {
    it("parses explicit meal upsert: 'Log 3 chapatis and salad for lunch'", () => {
      const parsed = parseMutationIntent("Log 3 chapatis and salad for lunch");
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe("UPSERT_MEAL");
      expect(parsed?.params.mealType).toBe("lunch");
      expect(parsed?.params.items.length).toBeGreaterThanOrEqual(2);
    });

    it("parses follow-up add using activeContext: 'Actually, also add 400g rice and yellow paneer fried vegetables'", () => {
      const parsed = parseMutationIntent(
        "Actually, also add 400g rice and yellow paneer fried vegetables",
        { activeMealSlot: "lunch" }
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe("UPSERT_MEAL");
      expect(parsed?.params.mealType).toBe("lunch");
      expect(parsed?.params.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.stringContaining("400g rice") }),
          expect.objectContaining({ name: expect.stringContaining("yellow paneer fried vegetables") }),
        ])
      );
    });

    it("parses workout set modification: 'Set my incline dumbbell press to 10 reps at 24kg'", () => {
      const parsed = parseMutationIntent("Set my incline dumbbell press to 10 reps at 24kg");
      expect(parsed).not.toBeNull();
      expect(["UPDATE_WORKOUT", "UPDATE_WORKOUT_SET"]).toContain(parsed?.type);
      expect(parsed?.params.exerciseName).toMatch(/Incline Dumbbell Press/i);
      expect(parsed?.params.sets[0]).toEqual(
        expect.objectContaining({ reps: 10, weight: 24, unit: "kg" })
      );
    });

    it("resolves workout exercise from activeContext: 'Change the dumbbell press reps to 12'", () => {
      const parsed = parseMutationIntent("Change the dumbbell press reps to 12", {
        activeExerciseName: "Dumbbell Press",
      });
      expect(parsed).not.toBeNull();
      expect(["UPDATE_WORKOUT", "UPDATE_WORKOUT_SET"]).toContain(parsed?.type);
      expect(parsed?.params.exerciseName).toMatch(/Dumbbell Press/i);
      expect(parsed?.params.sets[0].reps).toBe(12);
    });
  });

  // ── 3. Multi-Turn Diet Mutation End-to-End Test ─────────────────────────────
  describe("Multi-Turn Diet Mutation & Entity Reference Continuity", () => {
    it("maintains meal slot 'lunch' and appends items on Turn 2 without dropping entity references", async () => {
      // ── TURN 1: 'Log 3 chapatis and salad for lunch' ──
      const req1 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Log 3 chapatis and salad for lunch" }],
          mode: "diet",
        }),
      });

      const res1 = await POST(req1);
      expect(res1.status).toBe(200);

      const body1 = await res1.json();

      // Verify Turn 1 response structure
      expect(body1.action_executed).toEqual(
        expect.objectContaining({
          type: "UPSERT_MEAL",
          status: "success",
          details: expect.objectContaining({ isNew: true }),
        })
      );
      expect(body1.activeContext).toEqual(
        expect.objectContaining({
          activeMealSlot: "lunch",
          activeMealId: expect.any(String),
        })
      );

      // Verify Firestore meals collection now has 1 lunch document
      expect(mockMealStore.size).toBe(1);
      const firstMeal = Array.from(mockMealStore.values())[0];
      expect(firstMeal.name).toContain("Lunch");
      expect(firstMeal.name).toContain("3 chapatis");
      expect(firstMeal.name).toContain("salad");
      expect(firstMeal.macros.calories).toBeGreaterThan(300);

      // Verify suggested actions emitted
      expect(body1.suggested_actions).toBeDefined();
      expect(body1.suggested_actions.length).toBeGreaterThanOrEqual(2);
      expect(body1.suggested_actions.length).toBeLessThanOrEqual(3);
      expect(body1.suggested_actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: expect.any(String), prompt: expect.any(String) }),
        ])
      );

      // ── TURN 2: 'Actually, also add 400g rice and yellow paneer fried vegetables' ──
      const req2 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Log 3 chapatis and salad for lunch" },
            { role: "assistant", content: body1.reply },
            { role: "user", content: "Actually, also add 400g rice and yellow paneer fried vegetables" },
          ],
          activeContext: body1.activeContext,
          mode: "diet",
        }),
      });

      const res2 = await POST(req2);
      expect(res2.status).toBe(200);

      const body2 = await res2.json();

      // Verify Turn 2 preserved 'lunch' slot and mutated existing meal (isNew: false)
      expect(body2.activeContext.activeMealSlot).toBe("lunch");
      expect(body2.action_executed).toEqual(
        expect.objectContaining({
          type: "UPSERT_MEAL",
          status: "success",
          details: expect.objectContaining({
            isNew: false,
            mealId: firstMeal.id,
          }),
        })
      );

      // Verify meal in Firestore was modified (still 1 meal doc, with appended items & higher macros)
      expect(mockMealStore.size).toBe(1);
      const updatedMeal = mockMealStore.get(firstMeal.id);
      expect(updatedMeal.name).toContain("3 chapatis");
      expect(updatedMeal.name).toContain("400g rice");
      expect(updatedMeal.name).toContain("yellow paneer fried vegetables");
      expect(updatedMeal.macros.calories).toBeGreaterThan(firstMeal.macros.calories);
      expect(updatedMeal.macros.proteinG).toBeGreaterThan(firstMeal.macros.proteinG);

      // Verify suggestions generated for Turn 2
      expect(body2.suggested_actions.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 4. Workout Modification End-to-End Test ────────────────────────────────
  describe("Workout Modification & Exercise Resolution", () => {
    it("resolves target exercise and updates workout sets accurately", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Set my incline dumbbell press to 10 reps at 24kg" },
          ],
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();

      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: expect.stringMatching(/UPDATE_WORKOUT(_SET)?/),
          status: "success",
          details: expect.objectContaining({
            exerciseName: expect.stringMatching(/Incline Dumbbell Press/i),
            sets: [
              expect.objectContaining({ reps: 10, weight: 24, unit: "kg" }),
            ],
          }),
        })
      );

      expect(body.activeContext).toEqual(
        expect.objectContaining({
          activeExerciseName: expect.stringMatching(/Incline Dumbbell Press/i),
          activeWorkoutId: expect.any(String),
        })
      );

      // Verify Firestore workouts collection has the updated workout session
      expect(mockWorkoutStore.size).toBe(1);
      const session = Array.from(mockWorkoutStore.values())[0];
      expect(session.exercises).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringMatching(/Incline Dumbbell Press/i),
            sets: expect.arrayContaining([
              expect.objectContaining({ reps: 10, weight: 24 }),
            ]),
          }),
        ])
      );

      // Verify follow-up action suggestions for workout
      expect(body.suggested_actions).toBeDefined();
      expect(body.suggested_actions.length).toBeGreaterThanOrEqual(2);
      expect(body.suggested_actions.length).toBeLessThanOrEqual(3);
    });
  });

  // ── 5. Dual-Layer Response Schema Guarantee ────────────────────────────────
  describe("Dual-Layer Response Schema Guarantee", () => {
    it("guarantees message, action_executed, and suggested_actions dual-layer structure", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Add 400g rice to dinner" }],
          mode: "diet",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();

      expect(body).toHaveProperty("message");
      expect(typeof body.message).toBe("string");
      expect(body).toHaveProperty("reply");
      expect(body).toHaveProperty("action_executed");
      expect(body.action_executed.type).toBe("UPSERT_MEAL");
      expect(body.action_executed.status).toBe("success");

      expect(body).toHaveProperty("suggested_actions");
      expect(Array.isArray(body.suggested_actions)).toBe(true);
      expect(body.suggested_actions.length).toBeGreaterThanOrEqual(2);
      expect(body.suggested_actions[0]).toHaveProperty("label");
      expect(body.suggested_actions[0]).toHaveProperty("prompt");
    });

    it("returns action_executed: null when no mutation occurs in conversational query", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "What is my recommended daily calorie intake?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty("message");
      expect(body).toHaveProperty("reply");
      expect(body.action_executed).toBeNull();
      expect(Array.isArray(body.suggested_actions)).toBe(true);
    });

    it("ensures simple conversation fast-path responses adhere to dual-layer response contract", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello Orbit" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty("message");
      expect(body).toHaveProperty("reply");
      expect(body.reply).toContain("Hey Prateek!");
      expect(body.action_executed).toBeNull();
      expect(body.suggested_actions).toEqual([]);
    });

    it("returns accurate failure information with status 'failed' when mutation throws an error", async () => {
      // Force Firestore meals add to reject
      mockMealsCol.add.mockRejectedValueOnce(new Error("Firestore database connection timeout"));

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Log 2 bananas for snack" }],
          mode: "diet",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "UPSERT_MEAL",
          status: "failed",
          details: expect.objectContaining({
            error: expect.stringContaining("Firestore database connection timeout"),
          }),
        })
      );
      expect(body).toHaveProperty("reply");
      expect(body.suggested_actions).toBeDefined();
    });

    it("preserves historical analysis behavior and returns dual-layer contract", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "How was my workout this week?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(mockBuildOrbitContext).toHaveBeenCalledWith(
        expect.objectContaining({
          domains: ["workouts"],
          temporalScope: "thisWeek",
        })
      );
      expect(body.action_executed).toBeNull();
      expect(body).toHaveProperty("reply");
      expect(body.suggested_actions.length).toBeGreaterThan(0);
    });
  });

  // ── 6. Exercise Partial Name Resolution & Unrelated Sets Preservation ──────
  describe("Workout Exercise Resolution & Unrelated Sets Preservation", () => {
    it("resolves exercise through partial name and preserves unrelated exercise sets intact", async () => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const existingSession = {
        id: "w-existing-123",
        userId: mockUserId,
        date: todayStr,
        exercises: [
          {
            id: "ex-squat",
            name: "Barbell Back Squat",
            sets: [{ reps: 5, weight: 120, unit: "kg" }],
          },
          {
            id: "ex-press",
            name: "Incline Dumbbell Press",
            sets: [{ reps: 8, weight: 20, unit: "kg" }],
          },
        ],
        durationMinutes: 60,
        createdAt: Date.now(),
      };
      mockWorkoutStore.set(existingSession.id, existingSession);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Change the dumbbell press reps to 12" }],
          activeContext: { activeExerciseName: "Incline Dumbbell Press" },
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: expect.stringMatching(/UPDATE_WORKOUT(_SET)?/),
          status: "success",
          details: expect.objectContaining({
            exerciseName: "Incline Dumbbell Press",
            sets: [expect.objectContaining({ reps: 12 })],
          }),
        })
      );

      // Verify in store:
      const updatedSession = mockWorkoutStore.get(existingSession.id);
      expect(updatedSession.exercises).toHaveLength(2);

      // Barbell Back Squat must be completely untouched
      const squat = updatedSession.exercises.find((e: any) => e.name === "Barbell Back Squat");
      expect(squat).toBeDefined();
      expect(squat.sets).toEqual([{ reps: 5, weight: 120, unit: "kg" }]);

      // Incline Dumbbell Press must have updated sets
      const press = updatedSession.exercises.find((e: any) => e.name === "Incline Dumbbell Press");
      expect(press).toBeDefined();
      expect(press.sets[0].reps).toBe(12);
    });

    it("resolves ordinal exercise reference ('that second exercise') and preserves weight", async () => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const existingSession = {
        id: "w-ordinal-session",
        userId: mockUserId,
        date: todayStr,
        exercises: [
          {
            id: "ex-1",
            name: "Barbell Back Squat",
            sets: [{ reps: 5, weight: 120, unit: "kg" }],
          },
          {
            id: "ex-2",
            name: "Incline Dumbbell Press",
            sets: [{ reps: 10, weight: 24, unit: "kg" }],
          },
        ],
        durationMinutes: 45,
        createdAt: Date.now(),
      };
      mockWorkoutStore.set(existingSession.id, existingSession);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Change that second exercise to 12 reps" }],
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: expect.stringMatching(/UPDATE_WORKOUT(_SET)?/),
          status: "success",
          details: expect.objectContaining({
            exerciseName: "Incline Dumbbell Press",
            sets: [expect.objectContaining({ reps: 12, weight: 24 })],
          }),
        })
      );

      expect(body.activeContext).toEqual(
        expect.objectContaining({
          activeExerciseName: "Incline Dumbbell Press",
          activeWorkoutId: existingSession.id,
        })
      );

      const updatedSession = mockWorkoutStore.get(existingSession.id);
      expect(updatedSession.exercises[0].name).toBe("Barbell Back Squat");
      expect(updatedSession.exercises[0].sets[0].reps).toBe(5);
      expect(updatedSession.exercises[1].name).toBe("Incline Dumbbell Press");
      expect(updatedSession.exercises[1].sets[0].reps).toBe(12);
      expect(updatedSession.exercises[1].sets[0].weight).toBe(24);
    });
  });

  // ── 7. Universal Mutation Domain: Tasks & Schedules ─────────────────────────
  describe("Task Scheduling & Rescheduling Continuity", () => {
    it("creates a task and reschedules it in Turn 2 preserving entity continuity", async () => {
      // Turn 1: "Add 25 min coding sprint at 5 PM"
      const req1 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Add 25 min coding sprint at 5 PM" }],
          mode: "tasks",
        }),
      });

      const res1 = await POST(req1);
      expect(res1.status).toBe(200);

      const body1 = await res1.json();
      expect(body1.action_executed).toEqual(
        expect.objectContaining({
          type: "CREATE_TASK",
          status: "success",
          domain: "tasks",
          details: expect.objectContaining({
            durationMinutes: 25,
            scheduledTime: "17:00",
          }),
        })
      );
      expect(body1.activeContext).toEqual(
        expect.objectContaining({
          activeTaskId: expect.any(String),
        })
      );

      // Verify Firestore tasks collection has the created task
      expect(mockTaskStore.size).toBe(1);
      const createdTask = Array.from(mockTaskStore.values())[0];
      expect(createdTask.scheduledTime).toBe("17:00");
      expect(createdTask.durationMinutes).toBe(25);

      // Turn 2: "Move that sprint to 6 PM"
      const req2 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Add 25 min coding sprint at 5 PM" },
            { role: "assistant", content: body1.reply },
            { role: "user", content: "Move that sprint to 6 PM" },
          ],
          activeContext: body1.activeContext,
          mode: "tasks",
        }),
      });

      const res2 = await POST(req2);
      expect(res2.status).toBe(200);

      const body2 = await res2.json();
      expect(body2.action_executed).toEqual(
        expect.objectContaining({
          type: "RESCHEDULE_TASK",
          status: "success",
          domain: "tasks",
          details: expect.objectContaining({
            scheduledTime: "18:00",
          }),
        })
      );

      const updatedTask = mockTaskStore.get(createdTask.id);
      expect(updatedTask.scheduledTime).toBe("18:00");
    });
  });

  // ── 8. Universal Mutation Domain: Workout Lifecycle & Set Increment ─────────
  describe("Workout Lifecycle & Multi-Turn Rep Delta Continuity", () => {
    it("handles start workout, setting set 1, and adding 2 more reps preserving weight", async () => {
      // Turn 1: "Start Push Day"
      const req1 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Start Push Day" }],
          mode: "workout",
        }),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(200);
      const body1 = await res1.json();
      expect(body1.action_executed).toEqual(
        expect.objectContaining({
          type: "START_WORKOUT",
          status: "success",
          domain: "workouts",
          details: expect.objectContaining({
            routineTitle: expect.stringMatching(/Push Day/i),
          }),
        })
      );
      expect(body1.activeContext.activeWorkoutId).toBeDefined();

      // Turn 2: "Set first exercise to 10 reps at 20kg"
      const req2 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Start Push Day" },
            { role: "assistant", content: body1.reply },
            { role: "user", content: "Set first exercise to 10 reps at 20kg" },
          ],
          activeContext: body1.activeContext,
          mode: "workout",
        }),
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      expect(body2.action_executed).toEqual(
        expect.objectContaining({
          type: expect.stringMatching(/UPDATE_WORKOUT(_SET)?/),
          status: "success",
          domain: "workouts",
          details: expect.objectContaining({
            sets: [expect.objectContaining({ reps: 10, weight: 20 })],
          }),
        })
      );

      // Turn 3: "Add 2 more reps"
      const req3 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Start Push Day" },
            { role: "assistant", content: body1.reply },
            { role: "user", content: "Set first exercise to 10 reps at 20kg" },
            { role: "assistant", content: body2.reply },
            { role: "user", content: "Add 2 more reps" },
          ],
          activeContext: body2.activeContext,
          mode: "workout",
        }),
      });
      const res3 = await POST(req3);
      expect(res3.status).toBe(200);
      const body3 = await res3.json();
      expect(body3.action_executed).toEqual(
        expect.objectContaining({
          type: expect.stringMatching(/UPDATE_WORKOUT(_SET)?/),
          status: "success",
          domain: "workouts",
          details: expect.objectContaining({
            sets: [expect.objectContaining({ reps: 12, weight: 20 })],
          }),
        })
      );
    });
  });

  // ── 9. Universal Mutation Domain: Daily Rituals & Bento Habits ──────────────
  describe("Daily Rituals & Habits Mutation", () => {
    it("logs combined hydration and steps", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Log 1000ml water and 8000 steps" }],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "LOG_RITUAL",
          status: "success",
          domain: "rituals",
          details: expect.objectContaining({
            currentTotalMl: 1000,
            currentTotalSteps: 8000,
          }),
        })
      );
      expect(mockHabitStore.size).toBe(1);
    });
  });

  // ── 10. Universal Mutation Domain: Placement Sprint & DSA ────────────────────
  describe("Sprints & Study Milestones Mutation", () => {
    it("logs solved LeetCode problems to sprint progress", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Solved Group Anagrams and Valid Balloons on LeetCode using hash map",
            },
          ],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "UPDATE_SPRINT_PROGRESS",
          status: "success",
          domain: "sprints",
          details: expect.objectContaining({
            platform: "LeetCode",
            problems: expect.arrayContaining(["Group Anagrams", "Valid Balloons"]),
            topic: "hash map",
          }),
        })
      );
      expect(mockSprintStore.size).toBe(1);
    });
  });

  // ── 11. Conversational Clarification & Zero Silent Failure ──────────────────
  describe("Conversational Clarification Prompts & Silent Failure Remediation", () => {
    it("incomplete workout set triggers clarification without executing mutation", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Add dumbbell press to my workout" }],
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      // Assert: action_executed is null
      expect(body.action_executed).toBeNull();

      // Assert: message asks for reps/weight
      expect(body.message).toMatch(/how many reps and what weight/i);
      expect(body.message).toMatch(/dumbbell press/i);

      // Assert: suggested_actions contains set options
      expect(body.suggested_actions).toBeDefined();
      expect(body.suggested_actions.length).toBeGreaterThanOrEqual(2);
      expect(body.suggested_actions.some((a: any) => /10 reps/i.test(a.label))).toBe(true);

      // Assert: activeContext retains exercise name and awaitingParam
      expect(body.activeContext).toEqual(
        expect.objectContaining({
          activeExerciseName: expect.stringMatching(/Dumbbell Press/i),
          awaitingParam: "sets",
        })
      );

      // Database must have NO workouts created
      expect(mockWorkoutStore.size).toBe(0);
    });

    it("follow-up resolves pending slot, combines active context, and writes to DB with success", async () => {
      // Turn 1: Clarification prompt
      const req1 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Add dumbbell press to my workout" }],
          mode: "workout",
        }),
      });
      const res1 = await POST(req1);
      const body1 = await res1.json();
      expect(body1.action_executed).toBeNull();
      expect(body1.activeContext.awaitingParam).toBe("sets");

      // Turn 2: Follow-up response with sets
      const req2 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Add dumbbell press to my workout" },
            { role: "assistant", content: body1.reply },
            { role: "user", content: "10 reps at 24kg" },
          ],
          activeContext: body1.activeContext,
          mode: "workout",
        }),
      });

      const res2 = await POST(req2);
      expect(res2.status).toBe(200);

      const body2 = await res2.json();
      // Assert: writes to DB and returns status: "success"
      expect(body2.action_executed).toEqual(
        expect.objectContaining({
          type: "UPDATE_WORKOUT_SET",
          status: "success",
          domain: "workouts",
          details: expect.objectContaining({
            exerciseName: expect.stringMatching(/Dumbbell Press/i),
            sets: [expect.objectContaining({ reps: 10, weight: 24, unit: "kg" })],
          }),
        })
      );

      // Verify Firestore has the created session with Dumbbell Press
      expect(mockWorkoutStore.size).toBe(1);
      const session = Array.from(mockWorkoutStore.values())[0];
      expect(session.exercises).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringMatching(/Dumbbell Press/i),
            sets: expect.arrayContaining([
              expect.objectContaining({ reps: 10, weight: 24 }),
            ]),
          }),
        ])
      );
    });

    it("plan missing scheduled time triggers clarification without creating task", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Schedule a placement sprint" }],
          mode: "tasks",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      // Assert: action_executed is null
      expect(body.action_executed).toBeNull();

      // Assert: message asks for scheduled time or duration
      expect(body.message).toMatch(/what time would you like to schedule/i);
      expect(body.suggested_actions.length).toBeGreaterThanOrEqual(2);
      expect(body.suggested_actions.some((a: any) => /5:00 PM/i.test(a.label))).toBe(true);

      expect(body.activeContext).toEqual(
        expect.objectContaining({
          activeTaskTitle: expect.stringMatching(/Placement Sprint/i),
          awaitingParam: "time",
        })
      );

      // Database has no task created
      expect(mockTaskStore.size).toBe(0);
    });

    it("explicitly returns 'Unable to save' and status 'failed' when Firestore write fails", async () => {
      // Force Firestore workouts collection add to reject
      mockWorkoutsCol.add.mockRejectedValueOnce(new Error("Network connection lost or permission denied"));

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Set my incline dumbbell press to 10 reps at 24kg" }],
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      // Assert: response explicitly says "Unable to save"
      expect(body.message).toMatch(/unable to save/i);
      expect(body.reply).toMatch(/unable to save/i);
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "UPDATE_WORKOUT_SET",
          status: "failed",
          domain: "workouts",
          details: expect.objectContaining({
            error: expect.stringContaining("Network connection lost or permission denied"),
          }),
        })
      );
    });
  });

  describe("Multi-Intent Batching, Timed Exercise Mutations, & Task Persistence", () => {
    it("executes 4 distinct domain operations in a single compound multi-intent prompt without dropping or collapsing entries", async () => {
      const compoundPrompt =
        "add tea and chapati in breakfast, and yoghurt and potato sabzi and chapati in lunch also add in training for plank for 45 seconds and add today's plan for high priority for sending acceptance mail";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: compoundPrompt }],
          mode: "all",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();

      // 1. Verify response action_executed / actions_executed
      const actions = Array.isArray(body.action_executed)
        ? body.action_executed
        : body.actions_executed || [body.action_executed];

      expect(actions.length).toBe(4);
      expect(actions.every((a: any) => a.status === "success")).toBe(true);

      const domains = actions.map((a: any) => a.domain);
      expect(domains).toEqual(["meals", "meals", "workouts", "tasks"]);

      // 2. Verify meals store: exactly 2 distinct meal documents (breakfast and lunch)
      const meals = Array.from(mockMealStore.values());
      expect(meals.length).toBe(2);

      const breakfastMeal = meals.find((m) => m.mealType === "breakfast");
      expect(breakfastMeal).toBeDefined();
      expect(breakfastMeal.name).toContain("tea");
      expect(breakfastMeal.name).toContain("chapati");

      const lunchMeal = meals.find((m) => m.mealType === "lunch");
      expect(lunchMeal).toBeDefined();
      expect(lunchMeal.name).toContain("yoghurt");
      expect(lunchMeal.name).toContain("potato sabzi");
      expect(lunchMeal.name).toContain("chapati");

      // 3. Verify workouts store: 1 workout session containing Plank with durationSeconds: 45
      const workouts = Array.from(mockWorkoutStore.values());
      expect(workouts.length).toBe(1);
      const session = workouts[0];
      expect(session.exercises).toBeDefined();
      const plankEx = session.exercises.find((e: any) => /plank/i.test(e.name));
      expect(plankEx).toBeDefined();
      expect(plankEx.sets[0].durationSeconds).toBe(45);
      expect(plankEx.sets[0].completed).toBe(true);

      // 4. Verify tasks store: 1 task with high priority and today's due date
      const todayStr = new Date().toLocaleDateString("en-CA");
      const tasks = Array.from(mockTaskStore.values());
      expect(tasks.length).toBe(1);
      const mailTask = tasks[0];
      expect(mailTask.title).toBe("Send acceptance mail");
      expect(mailTask.priority).toBe("high");
      expect(mailTask.status).toBe("pending");
      expect(mailTask.dueDate).toBe(todayStr);
    });

    it("auto-creates workout session and appends timed movement (Plank 45s) when no active session exists", async () => {
      mockWorkoutStore.clear();
      const prompt = "also add in training for plank for 45 seconds";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "ADD_EXERCISE",
          status: "success",
          domain: "workouts",
        })
      );

      const workouts = Array.from(mockWorkoutStore.values());
      expect(workouts.length).toBe(1);
      const session = workouts[0];

      // Session UI schema validation
      expect(session.status).toBe("in-progress");
      expect(session.title).toBe("Daily Workout");
      expect(session.durationMinutes || session.duration).toBe(45);
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();

      // Movements schema validation (UI Training Studio)
      expect(session.movements).toBeDefined();
      expect(session.movements.length).toBe(1);
      const movement = session.movements[0];
      expect(movement.name).toBe("Plank");
      expect(movement.type).toBe("isometric");
      expect(movement.duration).toBe(45);
      expect(movement.durationUnit).toBe("seconds");
      expect(movement.completed).toBe(true);
      expect(movement.sets).toEqual([
        expect.objectContaining({
          setNumber: 1,
          reps: 1,
          duration: 45,
          durationSeconds: 45,
          weight: 0,
          completed: true,
        }),
      ]);

      // Exercises schema validation
      expect(session.exercises).toBeDefined();
      expect(session.exercises.length).toBe(1);
      const ex = session.exercises[0];
      expect(ex.name).toBe("Plank");
      expect(ex.type).toBe("isometric");
      expect(ex.duration).toBe(45);
      expect(ex.durationUnit).toBe("seconds");
      expect(ex.sets[0].durationSeconds).toBe(45);
      expect(ex.sets[0].completed).toBe(true);
    });

    it("updates existing workout movements when session already exists", async () => {
      mockWorkoutStore.clear();
      const existingId = "workout-session-today";
      const todayStr = new Date().toLocaleDateString("en-CA");

      mockWorkoutStore.set(existingId, {
        id: existingId,
        userId: mockUserId,
        date: todayStr,
        title: "Daily Workout",
        name: "Daily Workout",
        status: "in-progress",
        duration: 45,
        durationMinutes: 45,
        movements: [
          {
            id: "m-bench",
            name: "Bench Press",
            type: "strength",
            sets: [
              { setNumber: 1, reps: 10, weight: 60, unit: "kg", completed: true },
              { setNumber: 2, reps: 10, weight: 60, unit: "kg", completed: true },
            ],
            completed: true,
          },
        ],
        exercises: [
          {
            id: "ex-bench",
            name: "Bench Press",
            type: "strength",
            sets: [
              { id: "s-1", reps: 10, weight: 60, unit: "kg", completed: true },
              { id: "s-2", reps: 10, weight: 60, unit: "kg", completed: true },
            ],
          },
        ],
        createdAt: Date.now() - 3600000,
      });

      const prompt = "also add in training for plank for 45 seconds";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "ADD_EXERCISE",
          status: "success",
          domain: "workouts",
        })
      );

      const workouts = Array.from(mockWorkoutStore.values());
      expect(workouts.length).toBe(1);
      const session = workouts[0];
      expect(session.id).toBe(existingId);
      expect(session.status).toBe("in-progress");
      expect(session.updatedAt).toBeDefined();

      // Both Bench Press and Plank exist in movements
      expect(session.movements.length).toBe(2);
      expect(session.movements[0].name).toBe("Bench Press");
      expect(session.movements[1].name).toBe("Plank");
      expect(session.movements[1].type).toBe("isometric");
      expect(session.movements[1].duration).toBe(45);

      // Both Bench Press and Plank exist in exercises
      expect(session.exercises.length).toBe(2);
      expect(session.exercises[0].name).toBe("Bench Press");
      expect(session.exercises[1].name).toBe("Plank");
      expect(session.exercises[1].sets[0].durationSeconds).toBe(45);
    });

    it("creates task matching Execution Studio TaskBoard filter schema", async () => {
      const prompt = "add today's plan for high priority for sending acceptance mail";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "tasks",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "CREATE_TASK",
          status: "success",
          domain: "tasks",
          details: expect.objectContaining({
            title: "Send acceptance mail",
            priority: "high",
          }),
        })
      );

      const todayStr = new Date().toLocaleDateString("en-CA");
      const tasks = Array.from(mockTaskStore.values());
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe("Send acceptance mail");
      expect(tasks[0].priority).toBe("high");
      expect(tasks[0].dueDate).toBe(todayStr);
      expect(tasks[0].status).toBe("pending");
    });

    it("correctly parses cardio (running 2.5km) and calisthenics (skipping 30 reps 3 sets) without hallucinating bench press", async () => {
      const prompt = "add running 2.5 km and skipping 30 reps 3 sets in training";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "workout",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      const actions = body.actions_executed || (body.action_executed ? [body.action_executed] : []);
      expect(actions.length).toBe(2);

      const runningAction = actions.find((a: any) =>
        (a.details?.exerciseName || "").toLowerCase().includes("run")
      );
      const skippingAction = actions.find((a: any) =>
        (a.details?.exerciseName || "").toLowerCase().includes("skip")
      );

      expect(runningAction).toBeDefined();
      expect(runningAction.type).toBe("ADD_EXERCISE");
      expect(runningAction.status).toBe("success");

      expect(skippingAction).toBeDefined();
      expect(skippingAction.type).toBe("ADD_EXERCISE");
      expect(skippingAction.status).toBe("success");

      // Verify Firestore workout store has both movements and NO Bench Press
      const workouts = Array.from(mockWorkoutStore.values());
      expect(workouts.length).toBe(1);
      const session = workouts[0];

      expect(session.movements.length).toBe(2);
      expect(session.movements[0].name).toBe("Running");
      expect(session.movements[0].type).toBe("cardio");
      expect(session.movements[0].distance).toBe(2.5);

      expect(session.movements[1].name).toBe("Skipping");
      expect(session.movements[1].type).toBe("calisthenics");
      expect(session.movements[1].sets.length).toBe(3);
      expect(session.movements[1].sets[0].reps).toBe(30);

      // Verify exercises array for Training Studio UI
      expect(session.exercises.length).toBe(2);
      expect(session.exercises[0].name).toBe("Running");
      expect(session.exercises[1].name).toBe("Skipping");

      // Verify Bench Press is NOT anywhere
      const sessionJson = JSON.stringify(session).toLowerCase();
      expect(sessionJson).not.toContain("bench press");
      const bodyJson = JSON.stringify(body).toLowerCase();
      expect(bodyJson).not.toContain("bench press");
    });

    it("sanitizes food item names, stripping conversational phrases and respecting explicit meal slot", async () => {
      const prompt = "in breakfast tea and chapati, in lunch dal and rice";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "diet",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const meals = Array.from(mockMealStore.values());
      expect(meals.length).toBe(2);

      const breakfastMeal = meals.find((m) => m.mealType === "breakfast" || (m.name || "").toLowerCase().includes("breakfast"));
      const lunchMeal = meals.find((m) => m.mealType === "lunch" || (m.name || "").toLowerCase().includes("lunch"));

      expect(breakfastMeal).toBeDefined();
      expect(breakfastMeal.name.toLowerCase()).toContain("tea");
      expect(breakfastMeal.name.toLowerCase()).toContain("chapati");
      expect(breakfastMeal.name.toLowerCase()).not.toContain("in breakfast");

      expect(lunchMeal).toBeDefined();
      expect(lunchMeal.name.toLowerCase()).toContain("dal");
      expect(lunchMeal.name.toLowerCase()).toContain("rice");
      expect(lunchMeal.name.toLowerCase()).not.toContain("in lunch");

      // Verify categoryLabel is NOT overridden by clock time (test evening timestamp: 8:17 PM)
      const eveningTimestamp = new Date("2026-11-09T20:17:00").getTime();
      const breakfastCategory = formatMealTimeAndCategory(eveningTimestamp, breakfastMeal.mealType, breakfastMeal.name);
      expect(breakfastCategory.categoryLabel).toBe("BREAKFAST");

      const lunchCategory = formatMealTimeAndCategory(eveningTimestamp, lunchMeal.mealType, lunchMeal.name);
      expect(lunchCategory.categoryLabel).toBe("LUNCH");
    });

    it("strips generic meal preamble in compound prompt without creating phantom 'Custom Meal' entries", async () => {
      const prompt = "log today's meal, in breakfast tea and chapati, in lunch dal and rice";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "diet",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      const actions = Array.isArray(body.action_executed)
        ? body.action_executed
        : body.actions_executed || [body.action_executed];

      expect(actions.length).toBe(2);
      expect(actions.every((a: any) => a.status === "success" && a.type === "UPSERT_MEAL")).toBe(true);

      const meals = Array.from(mockMealStore.values());
      expect(meals.length).toBe(2);

      const serializedMeals = JSON.stringify(meals).toLowerCase();
      expect(serializedMeals).not.toContain("custom meal");
      expect(serializedMeals).not.toContain("today's meal");

      const breakfastMeal = meals.find((m) => m.mealType === "breakfast");
      expect(breakfastMeal).toBeDefined();
      expect(breakfastMeal.name).toBe("Breakfast: tea, chapati");
      // Realistic calories for tea (65) + chapati (104) = 169 kcal
      expect(breakfastMeal.macros.calories).toBe(169);

      const lunchMeal = meals.find((m) => m.mealType === "lunch");
      expect(lunchMeal).toBeDefined();
      expect(lunchMeal.name).toBe("Lunch: dal, rice");
    });

    it("supports shorthand multi-slot meal syntax ('breakfast: ..., lunch: ...')", async () => {
      const prompt = "breakfast: tea and chapati, lunch: dal and rice";

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "all",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const meals = Array.from(mockMealStore.values());
      expect(meals.length).toBe(2);

      const breakfastMeal = meals.find((m) => m.mealType === "breakfast");
      const lunchMeal = meals.find((m) => m.mealType === "lunch");
      expect(breakfastMeal?.name).toBe("Breakfast: tea, chapati");
      expect(lunchMeal?.name).toBe("Lunch: dal, rice");
    });

    it("disambiguates timed food logs ('add 2 bananas at 4 PM') as meals rather than tasks", async () => {
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "add 2 bananas at 4 PM" }],
          mode: "all",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.action_executed).toEqual(
        expect.objectContaining({
          type: "UPSERT_MEAL",
          status: "success",
          domain: "meals",
        })
      );
      expect(mockTaskStore.size).toBe(0);
      expect(mockMealStore.size).toBe(1);

      const loggedMeal = Array.from(mockMealStore.values())[0];
      expect(loggedMeal.name.toLowerCase()).toContain("2 bananas");
      expect(loggedMeal.macros.calories).toBe(210);
    });

    it("does not log phantom meals for standalone preambles or nutrition questions", async () => {
      const req1 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "log today's meal" }],
          mode: "diet",
        }),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(200);
      const body1 = await res1.json();
      expect(body1.action_executed).toBeNull();
      expect(mockMealStore.size).toBe(0);

      const req2 = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "What did I eat for lunch?" }],
          mode: "diet",
        }),
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      expect(body2.action_executed).toBeNull();
      expect(mockMealStore.size).toBe(0);
    });

    it("persists meals under explicit clientDate to prevent UTC/local timezone drift", async () => {
      const clientDate = "2026-11-15";
      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Log 2 boiled eggs for breakfast" }],
          mode: "diet",
          clientDate,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const meals = Array.from(mockMealStore.values());
      expect(meals.length).toBe(1);
      expect(meals[0].date).toBe(clientDate);
      expect(meals[0].mealType).toBe("breakfast");
    });
  });
});

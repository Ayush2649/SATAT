import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── In-Memory Firestore Mock for Admin DB ─────────────────────────────────────

const mockMealStore = new Map<string, any>();
const mockWorkoutStore = new Map<string, any>();
const mockTaskStore = new Map<string, any>();

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

vi.mock("@/lib/firebaseAdmin", () => ({
  adminDb: {
    collection: vi.fn((colName: string) => {
      if (colName === "meals") return mockMealsCol;
      if (colName === "workouts") return mockWorkoutsCol;
      if (colName === "tasks") return mockTasksCol;
      return createMockCollection(new Map());
    }),
  },
  default: {
    firestore: () => ({
      collection: (colName: string) => {
        if (colName === "meals") return mockMealsCol;
        if (colName === "workouts") return mockWorkoutsCol;
        if (colName === "tasks") return mockTasksCol;
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
      expect(parsed?.type).toBe("UPDATE_WORKOUT");
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
      expect(parsed?.type).toBe("UPDATE_WORKOUT");
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
          type: "UPDATE_WORKOUT",
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
  });
});


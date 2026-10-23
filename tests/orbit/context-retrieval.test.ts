import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("Orbit Context Retrieval & Temporal Scope Fixes", () => {
  const mockUserId = "test-user-123";
  const todayStr = new Date().toLocaleDateString("en-CA");
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterdayDate.toLocaleDateString("en-CA");

  beforeEach(() => {
    vi.clearAllMocks();
    (nextAuth.getServerSession as any).mockResolvedValue({
      user: { id: mockUserId, email: "test@example.com", name: "Tester" },
    });
    (domainUser.getUserProfile as any).mockResolvedValue({ id: mockUserId });
    (domainUser.getUserMacroGoals as any).mockResolvedValue({ calories: 2000, proteinG: 150 });
    (domainUser.getUserPreferences as any).mockResolvedValue({ timezone: "Asia/Kolkata" });
    (serverContext.getBodyWeightEntries as any).mockResolvedValue([]);
    (serverContext.getWorkoutSessions as any).mockResolvedValue([]);
    (serverContext.getAllHabits as any).mockResolvedValue([]);
  });

  it('1. "What did I eat?" retrieves the appropriate existing meal records on the first request', async () => {
    const mockMeals = [
      { id: "m1", name: "Eggs & Toast", date: todayStr, macros: { calories: 350, proteinG: 20, carbsG: 30, fatG: 12 } },
      { id: "m2", name: "Dal Rice", date: yesterdayStr, macros: { calories: 500, proteinG: 15, carbsG: 80, fatG: 10 } },
    ];
    (serverContext.getAllMeals as any).mockResolvedValue(mockMeals);

    // Initial query with no temporal scope keyword
    const req = inferContextRequirements("What did I eat?");
    expect(req.domains).toContain("meals");
    expect(req.temporalScope).toBeUndefined();

    // buildOrbitContext should retrieve today's meal by default, not return empty array
    const context = await buildOrbitContext(req);
    expect(context?.meals).toBeDefined();
    expect(context?.meals.today.length).toBe(1);
    expect(context?.meals.today[0].name).toBe("Eggs & Toast");
  });

  it('2. "What tasks do I have?" retrieves the appropriate task records on the first request', async () => {
    const mockTasks = [
      { id: "t1", title: "Review Pull Request", dueDate: todayStr, status: "pending", priority: "high" },
      { id: "t2", title: "Completed Yesterday", dueDate: yesterdayStr, status: "completed" },
    ];
    (serverContext.getAllTasks as any).mockResolvedValue(mockTasks);

    const req = inferContextRequirements("What tasks do I have?");
    expect(req.domains).toContain("tasks");
    expect(req.temporalScope).toBeUndefined();

    const context = await buildOrbitContext(req);
    expect(context?.tasks).toBeDefined();
    expect(context?.tasks.today.length).toBe(1);
    expect(context?.tasks.today[0].title).toBe("Review Pull Request");
  });

  it("3. A query with no explicit temporal scope does not accidentally produce an empty context merely because the temporal scope is undefined", async () => {
    const mockMeals = [
      { id: "m-today", name: "Paneer Bowl", date: todayStr, macros: { calories: 450, proteinG: 25, carbsG: 20, fatG: 22 } },
    ];
    const mockTasks = [
      { id: "t-today", title: "Daily Workout", dueDate: todayStr, status: "pending" },
    ];
    (serverContext.getAllMeals as any).mockResolvedValue(mockMeals);
    (serverContext.getAllTasks as any).mockResolvedValue(mockTasks);

    // Explicitly pass undefined temporalScope
    const context = await buildOrbitContext({
      domains: ["meals", "tasks"],
      temporalScope: undefined,
    });

    expect(context?.meals.today.length).toBeGreaterThan(0);
    expect(context?.tasks.today.length).toBeGreaterThan(0);
    expect(context?.meals.today[0].name).toBe("Paneer Bowl");
    expect(context?.tasks.today[0].title).toBe("Daily Workout");
  });

  it("4. An assistant response containing 'today' cannot change the temporal requirements of an identical repeated user question", () => {
    const userQuestion = "What tasks do I have?";

    // Turn 1
    const turn1Messages = [{ role: "user", content: userQuestion }];
    const turn1UserMessages = turn1Messages.filter(m => m.role === "user");
    const turn1Latest = turn1UserMessages[turn1UserMessages.length - 1]?.content || "";
    const turn1LatestReq = inferContextRequirements(turn1Latest);
    const turn1AllUserReq = inferContextRequirements(turn1UserMessages.map(m => m.content).join(" "));
    const turn1FinalTemporalScope = turn1LatestReq.temporalScope ?? turn1AllUserReq.temporalScope;

    expect(turn1FinalTemporalScope).toBeUndefined();

    // Assistant response containing "today"
    const assistantResponse = "You don't have any tasks scheduled for today. Would you like to plan your day?";

    // Turn 2 (identical repeated question with assistant response in history)
    const turn2Messages = [
      ...turn1Messages,
      { role: "assistant", content: assistantResponse },
      { role: "user", content: userQuestion },
    ];

    // Using the fixed user-only requirements inference:
    const turn2UserMessages = turn2Messages.filter(m => m.role === "user");
    const turn2Latest = turn2UserMessages[turn2UserMessages.length - 1]?.content || "";
    const turn2LatestReq = inferContextRequirements(turn2Latest);
    const turn2AllUserReq = inferContextRequirements(turn2UserMessages.map(m => m.content).join(" "));
    const turn2FinalTemporalScope = turn2LatestReq.temporalScope ?? turn2AllUserReq.temporalScope;

    // Must remain undefined and NOT be poisoned into "today" by the assistant's previous reply
    expect(turn2FinalTemporalScope).toBeUndefined();
    expect(turn2FinalTemporalScope).toEqual(turn1FinalTemporalScope);
  });

  it("5. Explicit questions about today and yesterday still retrieve the correct records", async () => {
    const mockMeals = [
      { id: "m-today", name: "Breakfast Today", date: todayStr, macros: { calories: 300, proteinG: 15, carbsG: 30, fatG: 10 } },
      { id: "m-yesterday", name: "Dinner Yesterday", date: yesterdayStr, macros: { calories: 600, proteinG: 35, carbsG: 50, fatG: 18 } },
    ];
    (serverContext.getAllMeals as any).mockResolvedValue(mockMeals);

    // Query 1: Explicit today
    const reqToday = inferContextRequirements("What did I eat today?");
    expect(reqToday.temporalScope).toBe("today");
    const contextToday = await buildOrbitContext(reqToday);
    expect(contextToday?.meals.today.map(m => m.name)).toEqual(["Breakfast Today"]);

    // Query 2: Explicit yesterday
    const reqYesterday = inferContextRequirements("What did I eat yesterday?");
    expect(reqYesterday.temporalScope).toBe("yesterday");
    const contextYesterday = await buildOrbitContext(reqYesterday);
    expect(contextYesterday?.meals.today.map(m => m.name)).toEqual(["Dinner Yesterday"]);
  });

  it("6. Follow-up questions such as 'How much protein did it have?' continue working", () => {
    const conversation = [
      { role: "user", content: "What did I eat yesterday?" },
      { role: "assistant", content: "Yesterday you logged Dal Khichdi and Curd." },
      { role: "user", content: "How much protein did it have?" },
    ];

    const userMessages = conversation.filter(m => m.role === "user");
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";
    const latestReq = inferContextRequirements(latestUserMessage);

    const allUserText = userMessages.map(m => m.content).join(" ");
    const allUserReq = inferContextRequirements(allUserText);

    const mergedRequirements = {
      domains: Array.from(new Set([...latestReq.domains, ...allUserReq.domains])),
      temporalScope: latestReq.temporalScope ?? allUserReq.temporalScope,
    };

    // Should detect protein from latest message, while retaining "meals" and "yesterday" from conversation
    expect(mergedRequirements.domains).toContain("nutrition");
    expect(mergedRequirements.domains).toContain("meals");
    expect(mergedRequirements.temporalScope).toBe("yesterday");
  });

  it("7. Missing records are still reported honestly, without fabricated data", async () => {
    // Empty Firestore collections
    (serverContext.getAllMeals as any).mockResolvedValue([]);
    (serverContext.getAllTasks as any).mockResolvedValue([]);

    const req = inferContextRequirements("What did I eat and what tasks do I have?");
    const context = await buildOrbitContext(req);

    // Truly empty results must return empty array, not mock or fabricated items
    expect(context?.meals.today).toEqual([]);
    expect(context?.meals.all).toEqual([]);
    expect(context?.tasks.today).toEqual([]);
    expect(context?.tasks.all).toEqual([]);
  });

  it("8. Demand-driven inference: 'Summarize my workouts from the last seven days' targets only workouts", () => {
    const req = inferContextRequirements("Summarize my workouts from the last seven days.");
    expect(req.domains).toContain("workouts");
    expect(req.domains).not.toContain("meals");
    expect(req.domains).not.toContain("tasks");
    expect(req.domains).not.toContain("habits");
    expect(req.temporalScope).toBe("last7Days");
  });

  it("9. Demand-driven inference: 'Analyze my meals from the last seven days' targets only meals and nutrition", () => {
    const req = inferContextRequirements("Analyze my meals from the last seven days.");
    expect(req.domains).toContain("meals");
    expect(req.domains).toContain("nutrition");
    expect(req.domains).not.toContain("workouts");
    expect(req.domains).not.toContain("tasks");
    expect(req.domains).not.toContain("habits");
    expect(req.temporalScope).toBe("last7Days");
  });

  it("10. Demand-driven inference: 'How was my workout this week?' targets only workouts and profile", () => {
    const req = inferContextRequirements("How was my workout this week?");
    expect(req.domains).toContain("workouts");
    expect(req.domains).not.toContain("meals");
    expect(req.domains).not.toContain("tasks");
    expect(req.temporalScope).toBe("thisWeek");
  });

  it("11. Compact serialization does not duplicate historical records into todayX and strips bloat", () => {
    const days = ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21"];
    const pastMeals = days.flatMap((d, i) => [
      { id: `m-${i}-1`, name: `Breakfast ${d}`, date: d, macros: { calories: 400, proteinG: 20, carbsG: 40, fatG: 10 }, photoUrl: "https://bucket/photo.jpg", rawOcr: "eggs milk toast" },
      { id: `m-${i}-2`, name: `Lunch ${d}`, date: d, macros: { calories: 700, proteinG: 40, carbsG: 60, fatG: 20 }, photoUrl: "https://bucket/photo.jpg", rawOcr: "chicken rice curry" },
      { id: `m-${i}-3`, name: `Dinner ${d}`, date: d, macros: { calories: 600, proteinG: 30, carbsG: 50, fatG: 18 }, photoUrl: "https://bucket/photo.jpg", rawOcr: "dal roti salad" },
    ]);
    const todayMeal = {
      id: "m-today",
      name: "Today Lunch",
      date: todayStr,
      macros: { calories: 650, proteinG: 35, carbsG: 55, fatG: 15 },
      photoUrl: "https://bucket/photo.jpg",
    };

    const mockContext: any = {
      profile: { id: "p1", heightCm: 178 },
      macroGoals: { calories: 2200, proteinG: 160 },
      preferences: { timezone: "Asia/Kolkata" },
      meals: {
        today: [...pastMeals, todayMeal],
        all: [...pastMeals, todayMeal],
        recent: [todayMeal],
      },
      workouts: {
        today: [
          {
            id: "w1",
            date: "2026-10-18",
            durationMinutes: 50,
            exercises: [{ name: "Bench Press", sets: [{ reps: 10, weight: 80, unit: "kg" }] }],
            summary: "Good chest push session",
          },
        ],
        all: [],
      },
      tasks: { today: [], all: [] },
      habits: { today: [], all: [] },
      bodyWeightEntries: [{ weightKg: 78.5, date: todayStr }],
    };

    const serialized = serializeOrbitContext(mockContext);
    expect(serialized).not.toBeNull();
    if (!serialized) throw new Error("Expected serialized context");

    // todayMeals must ONLY contain today's meal, not the 18 past meals
    expect(serialized!.todayMeals.length).toBe(1);
    expect(serialized.todayMeals[0]?.name).toBe("Today Lunch");

    // historical.meals contains all meals, but without heavy photoUrl or rawOcr bloat
    expect(serialized!.historical.meals.length).toBe(19);
    expect((serialized!.historical.meals[0] as any).photoUrl).toBeUndefined();
    expect((serialized!.historical.meals[0] as any).rawOcr).toBeUndefined();

    // Workouts have compacted sets
    expect(serialized.historical.workouts[0]?.exercises[0]?.sets).toBe("10x80kg");

    // Historical body weight is preserved for trend analysis
    expect(serialized.historical.bodyWeight).toBeDefined();
    expect(serialized.historical.bodyWeight[0]?.weightKg).toBe(78.5);

    // Check payload size is compact
    const jsonStr = JSON.stringify(serialized);
    expect(jsonStr.length).toBeLessThan(4000);
  });
  it("12. Comprehensive review: 'Give me an honest assessment of my weekly consistency and momentum' retrieves all 7 domains", () => {
    const req = inferContextRequirements("Give me an honest assessment of my weekly consistency and momentum.");
    expect(req.domains).toEqual(
      expect.arrayContaining(["workouts", "meals", "nutrition", "tasks", "habits", "profile", "goals"])
    );
    expect(req.temporalScope).toBe("last7Days");
  });

  it("13. Comprehensive rating: 'Rate my overall progress out of 10 based on my workouts, nutrition, habits, and tasks' retrieves all 7 domains", () => {
    const req = inferContextRequirements("Rate my overall progress out of 10 based on my workouts, nutrition, habits, and tasks.");
    expect(req.domains).toEqual(
      expect.arrayContaining(["workouts", "meals", "nutrition", "tasks", "habits", "profile", "goals"])
    );
    expect(req.temporalScope).toBe("last7Days");
  });

  it("14. Category consistency: 'How consistent was I with my meals?' retrieves meals, nutrition, and goals over last 7 days", () => {
    const req = inferContextRequirements("How consistent was I with my meals?");
    expect(req.domains).toContain("meals");
    expect(req.domains).toContain("nutrition");
    expect(req.domains).toContain("goals");
    expect(req.domains).not.toContain("workouts");
    expect(req.domains).not.toContain("tasks");
    expect(req.temporalScope).toBe("last7Days");
  });

  it("15. Task inquiry: 'How many tasks did I complete this week?' targets only tasks over thisWeek", () => {
    const req = inferContextRequirements("How many tasks did I complete this week?");
    expect(req.domains).toContain("tasks");
    expect(req.domains).not.toContain("workouts");
    expect(req.domains).not.toContain("meals");
    expect(req.temporalScope).toBe("thisWeek");
  });
});

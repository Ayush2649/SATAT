import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const { mockCallTextWithFallback, mockBuildOrbitContext } = vi.hoisted(() => ({
  mockCallTextWithFallback: vi.fn(),
  mockBuildOrbitContext: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/ai/groq", () => ({
  callTextWithFallback: mockCallTextWithFallback,
}));

vi.mock("@/lib/orbit/contextEngine", () => ({
  buildOrbitContext: mockBuildOrbitContext,
}));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/aria/route";
import type { OrbitContext } from "@/types";

describe("/api/aria Route Authentication & Integration", () => {
  const mockUserId = "user_aria_test_123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockCallTextWithFallback.mockResolvedValue({ data: "Orbit AI coach response" });
    mockBuildOrbitContext.mockResolvedValue({
      profile: undefined,
      macroGoals: undefined,
      preferences: { timezone: "Asia/Kolkata" },
      meals: { all: [], today: [], recent: [] },
      workouts: { all: [], today: [] },
      tasks: { all: [], today: [] },
      habits: { all: [], today: [] },
      bodyWeightEntries: [],
    } as unknown as OrbitContext);
  });

  describe("Authentication Gate", () => {
    it("returns 401 Unauthorized when no session exists", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "What workouts did I do?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: "Unauthorized" });

      // Verifies engine and AI provider are never called for unauthenticated requests
      expect(mockBuildOrbitContext).not.toHaveBeenCalled();
      expect(mockCallTextWithFallback).not.toHaveBeenCalled();
    });

    it("returns 200 with AI reply when session is valid and authenticated for substantive query", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Ayush", email: "ayush@example.com" },
      } as any);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "What workouts did I do?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ reply: "Orbit AI coach response" });
      expect(mockBuildOrbitContext).toHaveBeenCalledTimes(1);
      expect(mockCallTextWithFallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Fast-Path Conversational Intent (Phase 2 & Phase 5)", () => {
    it.each([
      ["Hello Orbit", "Hey Ayush!"],
      ["Hi", "Hey Ayush!"],
      ["Good morning", "Good morning, Ayush!"],
      ["Thanks so much", "You're very welcome, Ayush!"],
      ["How are you doing?", "I'm doing great, Ayush"],
      ["Bye for now", "Take care, Ayush!"],
    ])('returns fast deterministic response for "%s" without querying Firestore context', async (msg, expectedSnippet) => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Ayush Sharma", email: "ayush@example.com" },
      } as any);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: msg }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.reply).toContain(expectedSnippet);

      // CRITICAL: verify zero database retrieval and zero LLM calls for simple conversation
      expect(mockBuildOrbitContext).not.toHaveBeenCalled();
      expect(mockCallTextWithFallback).not.toHaveBeenCalled();
    });

    it("does not bypass historical context retrieval when a greeting precedes a substantive question", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Ayush", email: "ayush@example.com" },
      } as any);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hi, how was my workout this week?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Must invoke context building and model call for substantive analysis
      expect(mockBuildOrbitContext).toHaveBeenCalledTimes(1);
      expect(mockCallTextWithFallback).toHaveBeenCalledTimes(1);
      expect(mockBuildOrbitContext).toHaveBeenCalledWith(
        expect.objectContaining({
          domains: expect.arrayContaining(["workouts"]),
          temporalScope: "thisWeek",
        })
      );
    });

    it("triggers historical context retrieval across core categories for weekly review requests", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Ayush", email: "ayush@example.com" },
      } as any);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Rate my progress out of 10" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(mockBuildOrbitContext).toHaveBeenCalledWith(
        expect.objectContaining({
          domains: expect.arrayContaining(["workouts", "meals", "nutrition", "tasks", "habits"]),
          temporalScope: "last7Days",
        })
      );
    });
  });

  describe("Identity Spoofing Prevention", () => {
    it("ignores client-supplied userId in request body and enforces session identity", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Legitimate User", email: "legit@example.com" },
      } as any);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          userId: "attacker_spoofed_user_999",
          messages: [{ role: "user", content: "Show me my meals" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify that buildOrbitContext only receives inferred requirements, never client-provided userId
      expect(mockBuildOrbitContext).toHaveBeenCalledWith(
        expect.objectContaining({
          domains: expect.arrayContaining(["meals"]),
        })
      );
      // Ensure the attacker's supplied userId was not passed as an argument
      expect(mockBuildOrbitContext).not.toHaveBeenCalledWith(
        expect.stringContaining("attacker_spoofed_user_999")
      );
    });
  });

  describe("Regression: Latest Body Weight Selection in Workout Mode (Task 1)", () => {
    it("selects the newest bodyweight entry (index 0) rather than the oldest (slice(-1))", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Athlete", email: "athlete@example.com" },
      } as any);

      // Multiple entries sorted descending by createdAt (newest first)
      mockBuildOrbitContext.mockResolvedValueOnce({
        workouts: { all: [], today: [{ date: "2026-10-22", durationMinutes: 45, exercises: [] }] },
        bodyWeightEntries: [
          { id: "bw-newest", userId: mockUserId, weightKg: 82.5, date: "2026-10-22", createdAt: 2000 },
          { id: "bw-middle", userId: mockUserId, weightKg: 80.0, date: "2026-10-15", createdAt: 1500 },
          { id: "bw-oldest", userId: mockUserId, weightKg: 75.0, date: "2026-10-01", createdAt: 1000 },
        ],
      } as unknown as OrbitContext);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          mode: "workout",
          messages: [{ role: "user", content: "How is my workout?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify system prompt received by AI provider contains newest weight (82.5 kg) and not oldest (75.0 kg)
      const callArgs = mockCallTextWithFallback.mock.calls[0];
      const payload = callArgs[1];
      const systemMessage = payload.messages.find((m: any) => m.role === "system");

      expect(systemMessage.content).toContain("Body weight: 82.5 kg");
      expect(systemMessage.content).not.toContain("Body weight: 75 kg");
      expect(systemMessage.content).not.toContain("Body weight: 75.0 kg");
    });

    it("handles an empty bodyWeightEntries array gracefully without crashing", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Athlete", email: "athlete@example.com" },
      } as any);

      mockBuildOrbitContext.mockResolvedValueOnce({
        workouts: { all: [], today: [{ date: "2026-10-22", durationMinutes: 30, exercises: [] }] },
        bodyWeightEntries: [],
      } as unknown as OrbitContext);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          mode: "workout",
          messages: [{ role: "user", content: "Rate my session" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const callArgs = mockCallTextWithFallback.mock.calls[0];
      const payload = callArgs[1];
      const systemMessage = payload.messages.find((m: any) => m.role === "system");

      // No bodyweight header injected when empty
      expect(systemMessage.content).not.toContain("Body weight:");
    });
  });

  describe("Error Handling", () => {
    it("returns 500 when AI service throws an error", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "User", email: "user@example.com" },
      } as any);

      mockCallTextWithFallback.mockRejectedValueOnce(new Error("AI Provider Down"));

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Help me" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("AI Provider Down");
    });
  });
  describe("Weekly Consistency & Momentum Assessment (Priority 3 & 4)", () => {
    it("retrieves all 7 domains and injects the 6-part Weekly Review structure for 'Give me an honest assessment of my weekly consistency and momentum'", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Ayush", email: "ayush@example.com" },
      } as any);

      mockBuildOrbitContext.mockResolvedValueOnce({
        profile: { id: "p1" },
        macroGoals: { calories: 2565, proteinG: 135, carbsG: 347, fatG: 71 },
        preferences: { timezone: "Asia/Kolkata" },
        workouts: {
          all: [],
          today: [
            { date: "2026-10-19", durationMinutes: 43, exercises: [{ name: "Incline Press" }] },
            { date: "2026-10-22", durationMinutes: 30, exercises: [{ name: "Barbell Squat" }] },
          ],
        },
        meals: {
          all: [],
          today: [
            { date: "2026-10-22", name: "Paneer Curry", macros: { calories: 840, proteinG: 23, carbsG: 30, fatG: 15 } },
          ],
          recent: [],
        },
        tasks: {
          all: [],
          today: [
            { id: "t1", title: "Complete Weekly Plan", status: "completed" },
            { id: "t2", title: "Schedule Physio", status: "pending" },
          ],
        },
        habits: { all: [], today: [] },
        bodyWeightEntries: [
          { date: "2026-10-19", weightKg: 76.35 },
          { date: "2026-10-13", weightKg: 75.5 },
        ],
      } as unknown as OrbitContext);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Give me an honest assessment of my weekly consistency and momentum." }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify all 7 domains are retrieved
      expect(mockBuildOrbitContext).toHaveBeenCalledWith(
        expect.objectContaining({
          domains: expect.arrayContaining(["workouts", "meals", "nutrition", "tasks", "habits", "profile", "goals"]),
          temporalScope: "last7Days",
        })
      );

      // Verify system prompt contains verified metrics and 6-part weekly report template
      const callArgs = mockCallTextWithFallback.mock.calls[0];
      const payload = callArgs[1];
      const systemMessage = payload.messages.find((m: any) => m.role === "system");

      expect(systemMessage.content).toContain("### Weekly Review");
      expect(systemMessage.content).toContain("**Period**:");
      expect(systemMessage.content).toContain("#### Overall Assessment");
      expect(systemMessage.content).toContain("#### Key Metrics");
      expect(systemMessage.content).toContain("#### What Went Well");
      expect(systemMessage.content).toContain("#### What Needs Improvement");
      expect(systemMessage.content).toContain("#### Your Score");
      expect(systemMessage.content).toContain("#### Priorities for Next Week");

      // Verify verified data contains exact stats
      expect(systemMessage.content).toContain("Workouts logged: 2 session(s)");
      expect(systemMessage.content).toContain("73 min total");
      expect(systemMessage.content).toContain("Meals logged: 1 meal(s)");
      expect(systemMessage.content).toContain("Tasks: 1 completed, 1 pending");
      expect(systemMessage.content).toContain("Body weight: 76.35 kg (+0.85 kg since previous log)");
    });

    it("category-specific question avoids forcing the 6-part weekly report template", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Ayush", email: "ayush@example.com" },
      } as any);

      mockBuildOrbitContext.mockResolvedValueOnce({
        workouts: {
          all: [],
          today: [{ date: "2026-10-19", durationMinutes: 43, exercises: [] }],
        },
      } as unknown as OrbitContext);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "How was my workout this week?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Category-specific: only workouts domain
      expect(mockBuildOrbitContext).toHaveBeenCalledWith(
        expect.objectContaining({
          domains: ["workouts"],
          temporalScope: "thisWeek",
        })
      );

      const callArgs = mockCallTextWithFallback.mock.calls[0];
      const payload = callArgs[1];
      const systemMessage = payload.messages.find((m: any) => m.role === "system");

      // Must NOT force the 6-part weekly report template
      expect(systemMessage.content).toContain("Do NOT force the 6-part weekly report template");
    });
    it("handles 'Analyze my workout from last week and rate me out of 10 on my workout structure and everything' by using rolling 7-day workouts, avoiding canned 6-part weekly template, and providing workout structure rating instructions", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: mockUserId, name: "Ayush", email: "ayush@example.com" },
      } as any);

      const mockWorkouts = [
        {
          id: "w-push",
          date: "2026-10-26",
          summary: "Upper Body Push",
          durationMinutes: 45,
          exercises: [{ name: "Barbell Bench Press", sets: [{ reps: 8, weight: 80, unit: "kg" }] }],
        },
        {
          id: "w-pull",
          date: "2026-10-27",
          summary: "Pull & Back",
          durationMinutes: 50,
          exercises: [{ name: "Lat Pulldown", sets: [{ reps: 10, weight: 65, unit: "kg" }] }],
        },
        {
          id: "w-legs",
          date: "2026-10-29",
          summary: "Lower Body",
          durationMinutes: 55,
          exercises: [{ name: "Barbell Squats", sets: [{ reps: 6, weight: 110, unit: "kg" }] }],
        },
        {
          id: "w-arms",
          date: "2026-10-30",
          summary: "Upper Body Arms/Shoulders",
          durationMinutes: 40,
          exercises: [{ name: "Overhead Dumbbell Press", sets: [{ reps: 10, weight: 22, unit: "kg" }] }],
        },
        {
          id: "w-core",
          date: "2026-10-31",
          summary: "Core & Abs",
          durationMinutes: 30,
          exercises: [{ name: "Hanging Leg Raises", sets: [{ reps: 15, weight: 0, unit: "bodyweight" }] }],
        },
      ];

      mockBuildOrbitContext.mockResolvedValueOnce({
        profile: { id: "p1" },
        workouts: {
          all: mockWorkouts,
          today: mockWorkouts,
        },
      } as unknown as OrbitContext);

      const req = new NextRequest("http://localhost/api/aria", {
        method: "POST",
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: "Analyze my workout from last week and rate me out of 10 on my workout structure and everything",
          }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify targeted domain is workouts
      expect(mockBuildOrbitContext).toHaveBeenCalledWith(
        expect.objectContaining({
          domains: expect.arrayContaining(["workouts"]),
          temporalScope: "lastWeek",
        })
      );

      const callArgs = mockCallTextWithFallback.mock.calls[0];
      const payload = callArgs[1];
      const systemMessage = payload.messages.find((m: any) => m.role === "system");

      // Must NOT force the canned 6-part weekly report template
      expect(systemMessage.content).toContain("Do NOT force the 6-part weekly report template");
      expect(systemMessage.content).not.toContain("### Weekly Review");

      // Must include detailed workout sessions with exercises and sets
      expect(systemMessage.content).toContain("=== DETAILED WORKOUT SESSIONS IN THIS PERIOD ===");
      expect(systemMessage.content).toContain("Upper Body Push");
      expect(systemMessage.content).toContain("Barbell Bench Press");
      expect(systemMessage.content).toContain("Pull & Back");
      expect(systemMessage.content).toContain("Lower Body");
      expect(systemMessage.content).toContain("Upper Body Arms/Shoulders");
      expect(systemMessage.content).toContain("Core & Abs");

      // Must instruct direct rating evaluation
      expect(systemMessage.content).toContain("[INSTRUCTIONS FOR WORKOUT & STRUCTURE EVALUATION]");
      expect(systemMessage.content).toContain("ALWAYS provide a clear, bold score right at the top");
      expect(systemMessage.content).toContain("Split Balance & Muscle Volume");
      expect(systemMessage.content).toContain("Frequency & Consistency");
      expect(systemMessage.content).toContain("Progressive Overload & Intensity");
    });
  });
});

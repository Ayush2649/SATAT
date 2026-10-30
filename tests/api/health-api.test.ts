import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getToken } from "@/app/api/health/token/route";
import { POST as ingestHealth } from "@/app/api/health/ingest/route";
import * as nextAuth from "next-auth";
import { adminDb } from "@/lib/firebaseAdmin";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/firebaseAdmin", () => {
  const mockSet = vi.fn().mockResolvedValue({});
  const mockDelete = vi.fn().mockResolvedValue({});
  const mockAdd = vi.fn().mockResolvedValue({ id: "new_doc_id" });
  const mockGet = vi.fn();
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockDoc = vi.fn();
  const mockCollection = vi.fn();

  return {
    adminDb: {
      collection: mockCollection,
    },
  };
});

describe("ARGON-03: Health Sync API Routes Security & Verification", () => {
  const mockUserId = "user_health_test_123";
  let mockCollection: any;
  let mockDoc: any;
  let mockWhere: any;
  let mockLimit: any;
  let mockGet: any;
  let mockSet: any;
  let mockAdd: any;
  let mockDelete: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSet = vi.fn().mockResolvedValue({});
    mockDelete = vi.fn().mockResolvedValue({});
    mockAdd = vi.fn().mockResolvedValue({ id: "new_doc_id" });
    mockGet = vi.fn();
    mockLimit = vi.fn().mockReturnValue({ get: mockGet });
    mockWhere = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: mockLimit, get: mockGet }), limit: mockLimit, get: mockGet });
    mockDoc = vi.fn().mockReturnValue({
      get: mockGet,
      set: mockSet,
      delete: mockDelete,
    });
    mockCollection = vi.fn().mockReturnValue({
      doc: mockDoc,
      where: mockWhere,
      add: mockAdd,
      get: mockGet,
    });

    (adminDb.collection as any) = mockCollection;
  });

  describe("GET /api/health/token", () => {
    it("1. Rejects unauthenticated request with 401 and no-store headers", async () => {
      (nextAuth.getServerSession as any).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/health/token");
      const res = await getToken(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(res.headers.get("Pragma")).toBe("no-cache");
    });

    it("2. Returns existing token if present and regenerate is not requested", async () => {
      (nextAuth.getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, email: "user@example.com" },
      });

      mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: "existing_token_abc_123" }],
      });

      const req = new NextRequest("http://localhost:3000/api/health/token");
      const res = await getToken(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBe("existing_token_abc_123");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("3. Generates new token when none exists and stores it in healthTokens", async () => {
      (nextAuth.getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, email: "user@example.com" },
      });

      mockGet.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      const req = new NextRequest("http://localhost:3000/api/health/token");
      const res = await getToken(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.token).toBe("string");
      expect(data.token.length).toBe(64); // 32 random bytes hex
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        })
      );
    });

    it("4. Deletes previous token and issues a new one when regenerate=1 is requested", async () => {
      (nextAuth.getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, email: "user@example.com" },
      });

      const existingDocRef = { delete: mockDelete };
      mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: "old_token_xyz", ref: existingDocRef }],
      });

      const req = new NextRequest("http://localhost:3000/api/health/token?regenerate=1");
      const res = await getToken(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(existingDocRef.delete).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        })
      );
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });
  });

  describe("POST /api/health/ingest", () => {
    it("5. Rejects request without token with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/health/ingest", {
        method: "POST",
        body: JSON.stringify({ steps: 5000 }),
      });
      const res = await ingestHealth(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Missing token");
    });

    it("6. Rejects request with non-existent token with 401", async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      const req = new NextRequest("http://localhost:3000/api/health/ingest?token=invalid_token", {
        method: "POST",
        body: JSON.stringify({ steps: 5000 }),
      });
      const res = await ingestHealth(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid token");
    });

    it("7. Ingests workouts, bodyweight, and steps strictly scoped to token owner (IDOR Protection)", async () => {
      // Token belongs to mockUserId
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: mockUserId }),
      });
      // Duplicate checks: workouts empty, bodyweight empty
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      // Attacker attempts to pass another userId in body
      const attackerPayload = {
        userId: "victim_user_999",
        bodyWeightKg: 75.5,
        steps: 8500,
        workouts: [
          { type: "running", durationMin: 30, distanceKm: 5.2, calories: 350 },
        ],
      };

      const req = new NextRequest("http://localhost:3000/api/health/ingest", {
        method: "POST",
        headers: {
          authorization: "Bearer valid_token_123",
          "content-type": "application/json",
        },
        body: JSON.stringify(attackerPayload),
      });

      const res = await ingestHealth(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.workouts).toBe(1);
      expect(data.bodyWeight).toBe(1);
      expect(data.steps).toBe(1);

      // Verify that all database writes use mockUserId (from token), NOT victim_user_999
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId, // Must be token owner
          durationMinutes: 30,
        })
      );
    });

    it("8. Rejects invalid JSON with 400", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: mockUserId }),
      });

      const req = new NextRequest("http://localhost:3000/api/health/ingest?token=valid_token", {
        method: "POST",
        body: "invalid-json{",
      });
      const res = await ingestHealth(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON body");
    });

    it("9. Enforces bounds on workouts and numerical inputs", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: mockUserId }),
      });
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      // Out-of-bounds weight (e.g., 900kg) and negative steps
      const payload = {
        bodyWeightKg: 999, // Exceeds 500kg limit
        steps: -50,       // Negative steps
        workouts: [
          { type: "cycling", durationMin: 2000 }, // Duration capped at 1440
        ],
      };

      const req = new NextRequest("http://localhost:3000/api/health/ingest?token=valid_token", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await ingestHealth(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      // Out of bounds values should not count as saved
      expect(data.bodyWeight).toBe(0);
      expect(data.steps).toBe(0);
      expect(data.workouts).toBe(1);

      // Ingested workout has duration capped at 1440 min
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          durationMinutes: 1440,
        })
      );
    });
  });
});

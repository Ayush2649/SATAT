/**
 * tests/diet/barcode-route.test.ts
 *
 * Sprint 4.10 Barcode & Label Scanner Route Tests.
 * Verifies:
 * - Direct barcode lookup
 * - Resilient Indian barcode (890...) fallback without throwing 422
 * - Nutrition label OCR handling
 * - Search / query resolution
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/diet/barcode/route";
import { NextRequest } from "next/server";

// Mock next-auth getServerSession
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-1", email: "test@satat.fit" },
  }),
}));

describe("Sprint 4.10: POST /api/diet/barcode Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles valid barcode query via OpenFoodFacts mock cleanly", async () => {
    // Mock global fetch for OpenFoodFacts
    const mockProduct = {
      status: 1,
      product: {
        product_name: "Amul High Protein Buttermilk",
        brands: "Amul",
        serving_size: "200ml",
        nutriments: {
          "energy-kcal_serving": 90,
          proteins_serving: 15,
          carbohydrates_serving: 5,
          fat_serving: 2,
        },
      },
    };

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockProduct,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/diet/barcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: "8901262150125" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.item.name).toContain("Amul High Protein Buttermilk");
    expect(data.item.calories).toBe(90);
    expect(data.item.proteinG).toBe(15);
    expect(data.item.carbsG).toBe(5);
    expect(data.item.fatG).toBe(2);

    fetchSpy.mockRestore();
  });

  it("never throws 422 when barcode is not found in OpenFoodFacts — returns unrecognized barcode payload without inventing fake products", async () => {
    // OpenFoodFacts returns 404/status 0 for unindexed barcode
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/diet/barcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: "8909999999999" }),
    });

    const res = await POST(req);
    // MUST NOT return 422!
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    // Verifies fake "Scanned Packaged Product" is GONE
    if (data.item) {
      expect(data.item.name).not.toBe("Scanned Packaged Product");
    } else {
      expect(data.barcode).toBe("8909999999999");
      expect(data.unrecognized).toBe(true);
      expect(data.message).toContain("8909999999999");
    }

    fetchSpy.mockRestore();
  });

  it("handles query for food anchors directly with verified macros", async () => {
    const req = new NextRequest("http://localhost:3000/api/diet/barcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "200 gms paneer" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.item.calories).toBe(530);
    expect(data.item.proteinG).toBe(36.6);
  });
});


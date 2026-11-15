/** Live production-route smoke evaluation. Photos have no weighed ground truth;
 * report recognition, review state and latency, never calorie MAPE as accuracy. */
import { afterAll, expect, test, vi } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn(async () => ({ user: { id: "scan-evaluation" } })) }));
import { POST } from "../app/api/analyze-meal/route";

const fixtures = [
  ["04_masala_dosa_sambar.jpg", "dosa"],
  ["07_samosa_chutney.jpg", "samosa"],
  ["10_eggs_avocado_toast.jpg", "toast|avocado|egg"],
  ["14_edge_black_coffee_only.jpg", "coffee"],
  ["15_edge_non_food_laptop_desk.jpg", "no food"],
];
const results: unknown[] = [];
for (const [file, expected] of fixtures) {
  test(`production scan: ${file}`, async () => {
    const imageBase64 = readFileSync(path.resolve("scripts/photos/edge-cases", file)).toString("base64");
    const started = Date.now();
    const response = await POST(new NextRequest("http://localhost/api/analyze-meal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
    }));
    const data = await response.json();
    const recognitionMatch = new RegExp(expected, "i").test(data.name || "");
    results.push({ file, recognitionMatch, status: response.status, latencyMs: Date.now() - started, ...data });
    expect(response.status).toBe(200);
    expect(recognitionMatch).toBe(true);
    expect(Number.isFinite(data.calories)).toBe(true);
    if (expected === "no food") expect(data.noFoodDetected).toBe(true);
    if (expected === "coffee") expect(data.calories).toBeLessThanOrEqual(15);
  });
}
afterAll(() => {
  mkdirSync("artifacts/scan-evaluation", { recursive: true });
  const label = (process.env.SCAN_EVAL_LABEL || "latest").replace(/[^a-z0-9-]/gi, "");
  writeFileSync(`artifacts/scan-evaluation/${label}.json`, JSON.stringify({
    generatedAt: new Date().toISOString(),
    limitation: "Reference photos have no weighed portions or recipes. Recognition/guardrail smoke tests only; calorie values are estimates, not measured accuracy.",
    results,
  }, null, 2));
});

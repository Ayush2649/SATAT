/** Live production-route smoke evaluation. Photos have no weighed ground truth;
 * report recognition, review state and latency, never calorie MAPE as accuracy. */
import { afterAll, expect, test, vi } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn(async () => ({ user: { id: "scan-evaluation" } })) }));
import { POST } from "../app/api/analyze-meal/route";

const fixtures: [string, string][] = [
  ["04_masala_dosa_sambar.jpg", "dosa"],
  ["07_samosa_chutney.jpg", "samosa"],
  ["10_eggs_avocado_toast.jpg", "toast|avocado|egg"],
  ["14_edge_black_coffee_only.jpg", "coffee"],
  ["15_edge_non_food_laptop_desk.jpg", "no food"],
];
import { evaluateMeal, type MealReference } from "../lib/nutrition/scan-evaluation";
const references: MealReference[] = process.env.SCAN_EVAL_MANIFEST ? JSON.parse(readFileSync(process.env.SCAN_EVAL_MANIFEST, "utf8")) : [];
const profiles = (process.env.SCAN_EVAL_PROFILES || "deepseek:high").split(",").map(value => {
  const [provider, detail] = value.split(":");
  if (!["deepseek", "gemini"].includes(provider) || !["low", "high"].includes(detail)) throw new Error("Use profiles deepseek:low,deepseek:high,gemini:high");
  return { provider, detail };
});
const results: unknown[] = [];
const cases: [string, string][] = references.length ? references.map(reference => [reference.file, ".*"]) : fixtures;
for (const profile of profiles) for (const [file, expected] of cases) {
  const hasKey = Boolean(profile.provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.DEEPSEEK_API_KEY);
  test.skipIf(!hasKey)(`${profile.provider}:${profile.detail} production scan: ${file}`, async () => {
    process.env.MEAL_VISION_PROVIDER = profile.provider;
    process.env.DEEPSEEK_IMAGE_DETAIL = profile.detail;
    process.env.MEAL_SCAN_MAX_DIMENSION = profile.detail === "low" ? "768" : "1536";
    const imageBase64 = readFileSync(path.isAbsolute(file) ? file : path.resolve(process.env.SCAN_EVAL_PHOTO_DIR || "scripts/photos/edge-cases", file)).toString("base64");
    const started = Date.now();
    const response = await POST(new NextRequest("http://localhost/api/analyze-meal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
    }));
    const data = await response.json();
    const recognitionMatch = new RegExp(expected, "i").test(data.name || "");
    const reference = references.find(item => item.file === file);
    results.push({ file, profile, recognitionMatch, status: response.status, latencyMs: Date.now() - started, ...data, metrics: reference ? evaluateMeal(reference, data) : null });
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
    limitation: "Calorie accuracy is reported only for supplied measured references with provenance. Default photos are recognition/guardrail smoke tests, not measured nutrition accuracy.",
    skippedProfiles: profiles.filter(profile => !(profile.provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.DEEPSEEK_API_KEY)),
    results,
  }, null, 2));
});

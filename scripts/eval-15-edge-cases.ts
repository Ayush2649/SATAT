#!/usr/bin/env ts-node
/**
 * scripts/eval-15-edge-cases.ts
 *
 * Automated 15-Photo Multi-Cuisine & Edge-Case Stress Benchmark.
 * Runs each test image in scripts/photos/edge-cases/ through the full
 * production /api/analyze-meal pipeline:
 *   1. Sharp preprocessing (768x768, #ffffff, jpeg 75)
 *   2. Gemini Vision Provider (analyzeMealWithGemini)
 *   3. Non-Food & Low-Calorie beverage guardrails
 *   4. Deterministic Food Routing (routeFoodItems)
 *   5. AI Estimation Fallback (estimateNutritionBatch)
 *   6. Macro Composition Calculation (calculateMealNutrition)
 *
 * Flags:
 *   --force   Re-run all 15 images even if results are cached
 *   --filter=<name> Run only images matching the substring
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

// ── Environment Loading ───────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = (match[2] || "").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

import { getMealVisionProvider } from "../lib/ai/providers";
import { routeFoodItems } from "../lib/ai/nutrition/router";
import { estimateNutritionBatch, mergeRoutedNutrition } from "../lib/ai/nutrition/aiEstimator";
import { calculateMealNutrition, InputFoodItem } from "../lib/ai/nutrition/calculator";
import { parsePortionFromText, cleanDishName } from "../lib/ai/providers/common";

const EDGE_CASES_DIR = path.resolve(process.cwd(), "scripts/photos/edge-cases");
const RESULTS_FILE = path.join(EDGE_CASES_DIR, "benchmark-results.json");

export interface EdgeCaseSpec {
  file: string;
  expectedDish: string;
  minKcal: number;
  maxKcal: number;
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  isLowCalGuardrail?: boolean;
  isNonFoodGuardrail?: boolean;
}

export const EDGE_CASES: EdgeCaseSpec[] = [
  {
    file: "01_north_indian_thali.jpg",
    expectedDish: "North Indian Thali / Curry + Rice + Naan/Roti",
    minKcal: 550,
    maxKcal: 680,
    targetKcal: 615,
    targetProteinG: 18,
    targetCarbsG: 78,
    targetFatG: 22,
  },
  {
    file: "02_paneer_tikka_masala.jpg",
    expectedDish: "Paneer Tikka Masala / Butter Paneer + Naan",
    minKcal: 520,
    maxKcal: 640,
    targetKcal: 580,
    targetProteinG: 22,
    targetCarbsG: 48,
    targetFatG: 28,
  },
  {
    file: "03_chicken_biryani.jpg",
    expectedDish: "Chicken / Egg Biryani",
    minKcal: 420,
    maxKcal: 520,
    targetKcal: 470,
    targetProteinG: 26,
    targetCarbsG: 52,
    targetFatG: 14,
  },
  {
    file: "04_masala_dosa_sambar.jpg",
    expectedDish: "Masala Dosa with Sambar & Chutney",
    minKcal: 320,
    maxKcal: 440,
    targetKcal: 380,
    targetProteinG: 8,
    targetCarbsG: 52,
    targetFatG: 12,
  },
  {
    file: "05_idli_vada_sambar.jpg",
    expectedDish: "Idli / Vada with Sambar & Chutney",
    minKcal: 260,
    maxKcal: 340,
    targetKcal: 300,
    targetProteinG: 9,
    targetCarbsG: 48,
    targetFatG: 6,
  },
  {
    file: "06_chole_bhature.jpg",
    expectedDish: "Chole Bhature",
    minKcal: 580,
    maxKcal: 720,
    targetKcal: 650,
    targetProteinG: 16,
    targetCarbsG: 74,
    targetFatG: 26,
  },
  {
    file: "07_samosa_chutney.jpg",
    expectedDish: "Samosa with Chutney",
    minKcal: 380,
    maxKcal: 520,
    targetKcal: 450,
    targetProteinG: 8,
    targetCarbsG: 54,
    targetFatG: 22,
  },
  {
    file: "08_oats_berries_chia_bowl.jpg",
    expectedDish: "Oatmeal / Porridge / Smoothie Bowl with Berries",
    minKcal: 310,
    maxKcal: 390,
    targetKcal: 350,
    targetProteinG: 12,
    targetCarbsG: 52,
    targetFatG: 8,
  },
  {
    file: "09_grilled_chicken_quinoa_bowl.jpg",
    expectedDish: "Protein Salad / Buddha Bowl (Tofu/Eggs/Edamame/Greens)",
    minKcal: 410,
    maxKcal: 490,
    targetKcal: 450,
    targetProteinG: 28,
    targetCarbsG: 34,
    targetFatG: 20,
  },
  {
    file: "10_eggs_avocado_toast.jpg",
    expectedDish: "Avocado Toast with Eggs",
    minKcal: 380,
    maxKcal: 460,
    targetKcal: 420,
    targetProteinG: 18,
    targetCarbsG: 32,
    targetFatG: 22,
  },
  {
    file: "11_salmon_rice_broccoli.jpg",
    expectedDish: "Grilled Salmon / Fish with Vegetables",
    minKcal: 340,
    maxKcal: 430,
    targetKcal: 385,
    targetProteinG: 34,
    targetCarbsG: 12,
    targetFatG: 20,
  },
  {
    file: "12_pasta_arrabbiata.jpg",
    expectedDish: "Tomato Basil Pasta / Arrabbiata",
    minKcal: 380,
    maxKcal: 480,
    targetKcal: 430,
    targetProteinG: 13,
    targetCarbsG: 68,
    targetFatG: 9,
  },
  {
    file: "13_protein_shake_banana.jpg",
    expectedDish: "Berry / Banana Protein Smoothie",
    minKcal: 220,
    maxKcal: 320,
    targetKcal: 270,
    targetProteinG: 8,
    targetCarbsG: 42,
    targetFatG: 4,
  },
  {
    file: "14_edge_black_coffee_only.jpg",
    expectedDish: "Black Coffee / Espresso",
    minKcal: 0,
    maxKcal: 35,
    targetKcal: 10,
    targetProteinG: 0.5,
    targetCarbsG: 1,
    targetFatG: 0,
    isLowCalGuardrail: true,
  },
  {
    file: "15_edge_non_food_laptop_desk.jpg",
    expectedDish: "No Food Detected / 0 kcal",
    minKcal: 0,
    maxKcal: 0,
    targetKcal: 0,
    targetProteinG: 0,
    targetCarbsG: 0,
    targetFatG: 0,
    isNonFoodGuardrail: true,
  },
];

export interface BenchmarkResultRecord {
  file: string;
  expectedDish: string;
  predictedDish: string;
  predictedCalories: number;
  predictedProtein: number;
  predictedCarbs: number;
  predictedFat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  minKcal: number;
  maxKcal: number;
  inRange: boolean;
  calorieDiff: number;
  calorieApe: number;
  noFoodDetected: boolean;
  visibleItems: string[];
  latencyMs: number;
  notes: string;
}

async function runProductionPipeline(
  imagePath: string,
  providerOverride?: string,
  userKey = "benchmark-runner"
): Promise<{
  dishName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  noFoodDetected: boolean;
  visibleItems: string[];
  latencyMs: number;
  notes: string;
}> {
  const t0 = performance.now();
  const rawBuf = fs.readFileSync(imagePath);

  // 1. Sharp downscaling
  const resizedBuf = await sharp(rawBuf)
    .resize(768, 768, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 75 })
    .toBuffer();

  const base64 = resizedBuf.toString("base64");
  const mimeType = "image/jpeg";

  // 2. Vision Provider
  const provider = getMealVisionProvider(providerOverride);
  const visionResult = await provider.analyzeMeal({
    base64,
    mimeType,
    userKey,
  });

  // 3. Non-Food check
  const isNonFood =
    visionResult.candidates.some((c: any) => /no food|not food|non-food|no edible/i.test(c.name)) ||
    (visionResult.foods.length === 0 && visionResult.visibleItems.length === 0);

  if (isNonFood) {
    return {
      dishName: "No Food Detected",
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      noFoodDetected: true,
      visibleItems: [],
      latencyMs: Math.round(performance.now() - t0),
      notes: visionResult.notes,
    };
  }

  // 4. Primary Candidate
  const primaryCandidate = visionResult.candidates[0] || { name: "Meal", confidence: "medium" };

  // 5. Foods preparation
  const nutritionFoods: InputFoodItem[] =
    visionResult.foods && visionResult.foods.length > 0
      ? [...visionResult.foods]
      : visionResult.visibleItems.map((item: string) => {
          const portion = parsePortionFromText(item);
          const name =
            cleanDishName(
              item
                .replace(
                  /(?:~|approx\.?|about)?\s*\d+(?:\.\d+)?\s*(?:(?:-|to)\s*\d+(?:\.\d+)?\s*)?(?:g|grams?|ml|milliliters?|katori|bowl|plate|cup|glass|piece|pieces|slice|slices|tbsp|tsp|serving|servings)\b/gi,
                  ""
                )
                .replace(/[()]/g, "")
                .trim()
            ) || cleanDishName(item);
          return {
            name,
            quantity: portion?.quantity ?? 1,
            unit: portion?.unit ?? "serving",
          };
        });

  // 6. Routing & Estimation
  const routed = routeFoodItems(nutritionFoods);
  const estimatedMap =
    routed.aiEligible.length > 0
      ? await estimateNutritionBatch(routed.aiEligible, { userKey })
      : new Map();

  const finalFoods = mergeRoutedNutrition(routed, estimatedMap);

  // 7. Nutrition Calculation
  const calculated = calculateMealNutrition(finalFoods, primaryCandidate.name);

  return {
    dishName: primaryCandidate.name,
    calories: calculated.calories,
    proteinG: calculated.proteinG,
    carbsG: calculated.carbsG,
    fatG: calculated.fatG,
    noFoodDetected: false,
    visibleItems: visionResult.visibleItems,
    latencyMs: Math.round(performance.now() - t0),
    notes: visionResult.notes,
  };
}

async function main() {
  console.log("=======================================================================");
  console.log("  SPRINT 9.3: 15-PHOTO MULTI-CUISINE & EDGE-CASE BENCHMARK HARNESS     ");
  console.log("=======================================================================\n");

  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const filterArg = args.find((a) => a.startsWith("--filter="))?.split("=")[1];
  const providerArg = args.find((a) => a.startsWith("--provider="))?.split("=")[1];
  const pauseMs = (providerArg || process.env.MEAL_VISION_PROVIDER || "").toLowerCase().includes("gemini")
    ? 13_000
    : 2_000;

  let cachedResults: Record<string, BenchmarkResultRecord> = {};
  if (!force && fs.existsSync(RESULTS_FILE)) {
    try {
      cachedResults = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
      console.log(`Loaded ${Object.keys(cachedResults).length} cached results from ${path.basename(RESULTS_FILE)}`);
    } catch {}
  }

  const specsToRun = EDGE_CASES.filter((spec) => {
    if (filterArg && !spec.file.toLowerCase().includes(filterArg.toLowerCase())) {
      return false;
    }
    return true;
  });

  const finalRecords: BenchmarkResultRecord[] = [];

  for (let i = 0; i < specsToRun.length; i++) {
    const spec = specsToRun[i];
    const imagePath = path.join(EDGE_CASES_DIR, spec.file);

    if (!fs.existsSync(imagePath)) {
      console.error(`[ERROR] Image not found: ${imagePath}`);
      continue;
    }

    if (!force && cachedResults[spec.file]) {
      console.log(`[Photo ${i + 1}/${specsToRun.length}] (CACHED) ${spec.file} -> ${cachedResults[spec.file].predictedDish} (${cachedResults[spec.file].predictedCalories} kcal)`);
      finalRecords.push(cachedResults[spec.file]);
      continue;
    }

    console.log(`[Photo ${i + 1}/${specsToRun.length}] Processing: ${spec.file}...`);
    try {
      const output = await runProductionPipeline(imagePath, providerArg);

      const inRange = spec.isNonFoodGuardrail
        ? output.noFoodDetected || output.calories === 0
        : output.calories >= spec.minKcal && output.calories <= spec.maxKcal;

      const calorieDiff = output.calories - spec.targetKcal;
      const calorieApe =
        spec.targetKcal === 0
          ? output.calories === 0
            ? 0
            : 100
          : (Math.abs(calorieDiff) / spec.targetKcal) * 100;

      const record: BenchmarkResultRecord = {
        file: spec.file,
        expectedDish: spec.expectedDish,
        predictedDish: output.dishName,
        predictedCalories: output.calories,
        predictedProtein: output.proteinG,
        predictedCarbs: output.carbsG,
        predictedFat: output.fatG,
        targetCalories: spec.targetKcal,
        targetProtein: spec.targetProteinG,
        targetCarbs: spec.targetCarbsG,
        targetFat: spec.targetFatG,
        minKcal: spec.minKcal,
        maxKcal: spec.maxKcal,
        inRange,
        calorieDiff,
        calorieApe: Math.round(calorieApe * 10) / 10,
        noFoodDetected: output.noFoodDetected,
        visibleItems: output.visibleItems,
        latencyMs: output.latencyMs,
        notes: output.notes,
      };

      console.log(`  -> Predicted: ${output.dishName} | ${output.calories} kcal [Target: ${spec.targetKcal} kcal, Range: ${spec.minKcal}-${spec.maxKcal}]`);
      console.log(`  -> Macros: ${output.proteinG}P / ${output.carbsG}C / ${output.fatG}F (Target: ${spec.targetProteinG}P / ${spec.targetCarbsG}C / ${spec.targetFatG}F)`);
      console.log(`  -> In Range: ${inRange ? "PASS (OK)" : "FAIL (OUT OF RANGE)"} | Diff: ${calorieDiff >= 0 ? "+" : ""}${calorieDiff} kcal (${record.calorieApe}%)`);
      console.log(`  -> Items: ${output.visibleItems.join(", ")}`);
      console.log(`  -> Latency: ${output.latencyMs} ms\n`);

      finalRecords.push(record);
      cachedResults[spec.file] = record;
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(cachedResults, null, 2), "utf-8");

      // Rate limit pause if more images remain and this was an active network call
      if (i < specsToRun.length - 1) {
        console.log(`  [Pacing] Waiting ${pauseMs / 1000}s between calls...`);
        await new Promise((r) => setTimeout(r, pauseMs));
      }
    } catch (err: any) {
      console.error(`  [ERROR] Failed to process ${spec.file}:`, err.message || err);
    }
  }

  // ── SCORECARD REPORT ────────────────────────────────────────────────────────
  console.log("\n=======================================================================");
  console.log("             SPRINT 9.3 BENCHMARK EVALUATION SCORECARD                 ");
  console.log("=======================================================================\n");

  let passedCount = 0;
  let totalApe = 0;
  let totalMae = 0;

  console.log("| # | Test Image | Predicted Dish | Pred kcal | Target (Range) | Macros (P/C/F) | Status | Diff / APE |");
  console.log("|---|------------|----------------|-----------|----------------|----------------|--------|------------|");

  finalRecords.forEach((r, idx) => {
    if (r.inRange) passedCount++;
    totalApe += r.calorieApe;
    totalMae += Math.abs(r.calorieDiff);

    const statusStr = r.inRange ? "PASS" : "FAIL";
    const rangeStr = r.file.includes("non_food") ? "0 kcal" : `${r.targetCalories} (${r.minKcal}-${r.maxKcal})`;
    const diffStr = `${r.calorieDiff >= 0 ? "+" : ""}${r.calorieDiff} kcal (${r.calorieApe}%)`;

    console.log(
      `| ${(idx + 1).toString().padStart(2, "0")} | ${r.file} | ${r.predictedDish.slice(0, 20)} | ${r.predictedCalories} | ${rangeStr} | ${r.predictedProtein}P/${r.predictedCarbs}C/${r.predictedFat}F | ${statusStr} | ${diffStr} |`
    );
  });

  const accuracyPct = Math.round((passedCount / finalRecords.length) * 1000) / 10;
  const meanApe = Math.round((totalApe / finalRecords.length) * 10) / 10;
  const meanMae = Math.round((totalMae / finalRecords.length) * 10) / 10;

  console.log("\n--- AGGREGATE PERFORMANCE METRICS ---");
  console.log(`Total Evaluated:      ${finalRecords.length} images`);
  console.log(`Passed in Range:      ${passedCount} / ${finalRecords.length} (${accuracyPct}%)`);
  console.log(`Mean Calorie APE:     ${meanApe}%`);
  console.log(`Mean Calorie MAE:     ${meanMae} kcal`);

  // Guardrail checks
  const coffeeResult = finalRecords.find((r) => r.file.includes("coffee"));
  const nonFoodResult = finalRecords.find((r) => r.file.includes("non_food"));

  console.log("\n--- GUARDRAILS VERIFICATION ---");
  console.log(
    `Guardrail #14 (Black Coffee <= 35 kcal): ${
      coffeeResult && coffeeResult.predictedCalories <= 35
        ? `PASS (${coffeeResult.predictedCalories} kcal)`
        : `FAIL (${coffeeResult?.predictedCalories} kcal)`
    }`
  );
  console.log(
    `Guardrail #15 (Non-Food Desk = 0 kcal):  ${
      nonFoodResult && (nonFoodResult.noFoodDetected || nonFoodResult.predictedCalories === 0)
        ? `PASS (${nonFoodResult.predictedCalories} kcal, noFoodDetected: ${nonFoodResult.noFoodDetected})`
        : `FAIL (${nonFoodResult?.predictedCalories} kcal)`
    }`
  );
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});

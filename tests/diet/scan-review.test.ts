import { describe, expect, it } from "vitest";
import { buildScanInventory, restoreScanDraft, componentGrams, componentsFromScan, exactScanFood, recipeNutrition, reconcileScanInventory, referenceRecipe, replaceComponent, summarizeComponents, UNKNOWN_MICROS } from "@/lib/nutrition/scan-review";
import { parsePortionFromText } from "@/lib/ai/providers/common";
import { calculateMealNutrition, resolveFoodItem } from "@/lib/ai/nutrition/calculator";
const scan = () => componentsFromScan([{ name: "Steamed Rice", quantity: 200, unit: "g", grams: 200, calories: 260, proteinG: 5.4, carbsG: 57.4, fatG: .6, source: "canonical" }, { name: "Paneer Bhurji", quantity: 100, unit: "g", grams: 100, calories: 193, proteinG: 13.3, carbsG: 3.3, fatG: 14.7, source: "canonical" }]);
describe("Component corrections and explicit uncertainty", () => {
  it("corrects rice to 400g without multiplying paneer or asking AI", () => {
    const rows = scan(); rows[0] = { ...rows[0], amount: "400", portionSource: "user" };
    expect(summarizeComponents(rows).totals.calories).toBe(713);
    expect(rows[1].amount).toBe("100");
  });
  it("requires a check for every recognized component", () => {
    const rows = scan(); expect(summarizeComponents(rows).reviewed).toBe(false);
    rows[0].confirmed = true; expect(summarizeComponents(rows).reviewed).toBe(false);
    rows[1].confirmed = true; expect(summarizeComponents(rows).reviewed).toBe(true);
  });
  it.each(["", "-1", "Infinity", "NaN", "10001"])("rejects invalid amount %s", amount => {
    const rows = scan(); rows[0].amount = amount;
    expect(summarizeComponents(rows).complete).toBe(false);
  });
  it("keeps a missing food as an incomplete subtotal", () => {
    const rows = [...scan(), { ...scan()[0], id: "missing", name: "Unknown side", per100g: null }];
    expect(summarizeComponents(rows)).toMatchObject({ complete: false, unresolved: 1, totals: { calories: 453 } });
  });
  it("does not relabel an egg recipe as a boiled egg", () => {
    expect(exactScanFood("Scrambled Egg Masala")).toBeUndefined();
    expect(resolveFoodItem("Scrambled Egg Masala")).toBeNull();
    expect(resolveFoodItem("Fried fish curry")).toBeNull();
    expect(exactScanFood("boiled egg")?.id).toBe("egg_whole");
  });
  it("never treats a butter-based recipe as pure butter while preserving exact ingredient and recipe matches", () => {
    expect(resolveFoodItem("Butter Chicken")).toBeNull();
    expect(resolveFoodItem("Butter Chicken Curry")?.id).not.toBe("butter");
    expect(resolveFoodItem("Butter Naan")?.id).toBe("naan_butter");
    expect(resolveFoodItem("Paneer Butter Masala")?.id).toBe("paneer_butter_masala");
    expect(resolveFoodItem("Salted Butter")?.id).toBe("butter");
  });
  it("keeps hydrated oats and unsupported prepared rice recipes separate from dry oats and plain rice", () => {
    expect(resolveFoodItem("Oatmeal Bowl")).toBeNull();
    expect(exactScanFood("Oatmeal")).toBeUndefined();
    expect(resolveFoodItem("Oats porridge")).toBeNull();
    expect(resolveFoodItem("Rolled Oats (Dry)")?.id).toBe("oats_rolled");
    expect(resolveFoodItem("Curd Rice")).toBeNull();
    expect(resolveFoodItem("Steamed Rice")?.id).toBe("rice_steamed");
  });
  it("replacement discards old nutrients and clears confirmation", () => {
    const row = replaceComponent({ ...scan()[0], confirmed: true }, "Unrecognized banana preparation");
    expect(row.per100g).toBeNull(); expect(row.confirmed).toBe(false); expect(row.portionSource).toBe("user");
  });
  it("keeps a possible missing dal uncounted until the user adds it", () => {
    const inventory = buildScanInventory([{ name: "Steamed Rice", quantity: 200, unit: "g" }], ["Steamed rice ~200g", "Dal ~120g"], parsePortionFromText);
    expect(inventory.foods).toHaveLength(1);
    expect(inventory.suggestions).toEqual([expect.objectContaining({ name: "dal", quantity: 120, unit: "g" })]);
    expect(calculateMealNutrition(inventory.foods).calories).toBe(260);
  });
  it("does not duplicate a counted samosa label", () => {
    expect(reconcileScanInventory([{ name: "Samosa", quantity: 4, unit: "piece" }], ["4 samosas ~300g"], parsePortionFromText)).toHaveLength(1);
  });
  it("scales source-backed nutrients and preserves missing micronutrients as null", () => {
    const rows = scan(); rows[0].micros = { ...UNKNOWN_MICROS, ironMg: 1 }; rows[0].nutrientSource = "Food label";
    expect(summarizeComponents(rows).micronutrients.ironMg).toBeNull();
    rows[1].micros = { ...UNKNOWN_MICROS, ironMg: 2 }; rows[1].nutrientSource = "Recipe source";
    expect(summarizeComponents(rows).micronutrients.ironMg).toBe(4);
    expect(summarizeComponents(rows).micronutrients.vitaminCMg).toBeNull();
  });
  it("does not accept micronutrients without a source", () => {
    const rows = scan(); rows.forEach(row => { row.micros = { ...UNKNOWN_MICROS, ironMg: 1 }; });
    expect(summarizeComponents(rows).micronutrients.ironMg).toBeNull();
  });
  it("recipe math uses supplied cooking yield and oil rather than a home-cooking discount", () => {
    const recipe = referenceRecipe("Raw Banana Sabzi")!;
    expect(recipe).toBeDefined(); recipe.yieldGrams = "100";
    expect(recipeNutrition(recipe)?.calories).toBe(167);
    recipe.ingredients[1].grams = "10";
    expect(recipeNutrition(recipe)?.calories).toBe(212);
    recipe.yieldGrams = "200";
    expect(recipeNutrition(recipe)?.calories).toBe(106);
  });
  it("rejects incomplete recipe ingredients and yield", () => {
    const recipe = referenceRecipe("Paneer Bhurji")!;
    recipe.ingredients[0].per100g = { ...recipe.ingredients[0].per100g, calories: NaN };
    expect(recipeNutrition(recipe)).toBeNull();
    recipe.yieldGrams = ""; expect(recipeNutrition(recipe)).toBeNull();
  });
  it("requires a reference conversion for non-gram unknown foods", () => {
    expect(componentGrams({ ...scan()[0], name: "Unknown", unit: "bowl", amount: "1" })).toBeNull();
  });
});

const duplicateFixture = [
  { name: "Steamed Rice", quantity: 180, unit: "g" },
  { name: "Dal Fry", quantity: 150, unit: "g" },
  { name: "Plain Roti", quantity: 70, unit: "g" },
  { name: "Bhindi Masala", quantity: 70, unit: "g" },
];
const descriptiveLabels = ["Steamed rice ~180g", "yellow dal with tomato ~150g", "two whole wheat roti ~90g", "bhindi okra sabzi ~70g"];
describe("Single counted scan inventory regression", () => {
  it("does not turn four physical foods into seven through alternate descriptions", () => {
    const result = buildScanInventory(duplicateFixture, descriptiveLabels, parsePortionFromText);
    expect(result.foods).toHaveLength(4);
    expect(result.suggestions).toEqual([]);
    expect(calculateMealNutrition(result.foods)).toMatchObject({ calories: 629, proteinG: 21, carbsG: 122, fatG: 8 });
    expect(result.reviewNotes["scan-2"]).toContain("90g");
    expect(result.foods[2].quantity).toBe(70);
  });
  it("requires review of uncertain canonical identities instead of trusting the database match", () => {
    const result = buildScanInventory([{ name: "Plain Roti", quantity: 70, unit: "g", confidence: .4 }], [], parsePortionFromText);
    expect(result.reviewNotes["scan-0"]).toContain("unclear");
    expect(result.foods).toHaveLength(1);
  });
  it("keeps two genuinely separate bowls and their different quantities", () => {
    const result = buildScanInventory([{ name: "Dal Fry", quantity: 100, unit: "g" }, { name: "Dal Fry", quantity: 180, unit: "g" }], ["Dal fry ~280g"], parsePortionFromText);
    expect(result.foods.map(food => food.quantity)).toEqual([100, 180]);
    expect(new Set(result.foods.map(food => food.componentId)).size).toBe(2);
    expect(Object.keys(result.reviewNotes)).toHaveLength(2);
    expect(calculateMealNutrition(result.foods).calories).toBe(calculateMealNutrition([{ name: "Dal Fry", quantity: 280, unit: "g" }]).calories);
  });
  it("does not count display labels when structured inventory is absent", () => {
    const result = buildScanInventory([], ["Paneer bhurji ~100g", "Scrambled egg ~100g"], parsePortionFromText);
    expect(calculateMealNutrition(result.foods).calories).toBe(0);
    expect(result.suggestions).toHaveLength(2);
  });
  it("never collapses explicitly added food into an existing serving", () => {
    const result = buildScanInventory([...duplicateFixture, { name: "Plain Roti", quantity: 35, unit: "g" }], descriptiveLabels, parsePortionFromText);
    expect(result.foods).toHaveLength(5);
    expect(calculateMealNutrition(result.foods).calories).toBeGreaterThan(629);
  });
  it("carries serving IDs through calculation and component editing", () => {
    const result = buildScanInventory(duplicateFixture, descriptiveLabels, parsePortionFromText);
    const calculated = calculateMealNutrition(result.foods);
    expect(componentsFromScan(calculated.items).map(row => row.id)).toEqual(result.foods.map(food => food.componentId));
  });
  it("marks legacy photo drafts for review without discarding user corrections or servings", () => {
    const rows = [...scan(), { ...scan()[0], id: "user-added", amount: "400", portionSource: "user" as const }];
    const restored = restoreScanDraft(rows, 1);
    expect(restored).toHaveLength(3);
    expect(restored[0].reviewNote).toBeTruthy();
    expect(restored[2]).toEqual(rows[2]);
    expect(restoreScanDraft(rows, 2)).toEqual(rows);
  });
});

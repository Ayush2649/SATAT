import { describe, expect, it } from "vitest";
import { componentGrams, componentsFromScan, exactScanFood, recipeNutrition, reconcileScanInventory, referenceRecipe, replaceComponent, summarizeComponents, UNKNOWN_MICROS } from "@/lib/nutrition/scan-review";
import { parsePortionFromText } from "@/lib/ai/providers/common";
import { resolveFoodItem } from "@/lib/ai/nutrition/calculator";
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
  it("replacement discards old nutrients and clears confirmation", () => {
    const row = replaceComponent({ ...scan()[0], confirmed: true }, "Unrecognized banana preparation");
    expect(row.per100g).toBeNull(); expect(row.confirmed).toBe(false); expect(row.portionSource).toBe("user");
  });
  it("reconciles an omitted dal label even with a nonempty structured inventory", () => {
    const rows = reconcileScanInventory([{ name: "Steamed Rice", quantity: 200, unit: "g" }], ["Steamed rice ~200g", "Dal ~120g"], parsePortionFromText);
    expect(rows).toHaveLength(2); expect(rows[1]).toMatchObject({ name: "dal", quantity: 120, unit: "g" });
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

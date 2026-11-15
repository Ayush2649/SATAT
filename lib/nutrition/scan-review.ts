import { INDIAN_FOOD_DATABASE, type FoodCompositionItem } from "@/lib/ai/nutrition/database";
import { normalizeQuantityToGrams } from "@/lib/ai/nutrition/calculator";

export type NutrientKey = "vitaminAMcg" | "vitaminCMg" | "calciumMg" | "ironMg" | "potassiumMg";
export type Micros = Record<NutrientKey, number | null>;
export type Nutrition = { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG?: number };
export const UNKNOWN_MICROS: Micros = { vitaminAMcg: null, vitaminCMg: null, calciumMg: null, ironMg: null, potassiumMg: null };
export interface ScanComponent {
  id: string; name: string; amount: string; unit: string;
  per100g: Nutrition | null; micros: Micros; source: string; sourceUrl?: string;
  confirmed: boolean; portionSource: "photo" | "user"; gramsPerUnit?: number;
  recipe?: RecipeDraft;
  nutrientSource?: string;
}
export interface RecipeDraft { ingredients: { name: string; grams: string; per100g: Nutrition; source: string }[]; yieldGrams: string }

const clean = (name: string) => name.toLowerCase().replace(/^other:\s*/i, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
/** Exact food/alias only: matching a generic word must not erase preparation. */
export function exactScanFood(name: string): FoodCompositionItem | undefined {
  const key = clean(name);
  return INDIAN_FOOD_DATABASE.find(food => [food.name, ...food.aliases].some(alias => clean(alias) === key));
}
const oil: Nutrition = { calories: 900, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 };
const validNutrition = (value: Nutrition) => [value.calories, value.proteinG, value.carbsG, value.fatG].every(number => typeof number === "number" && Number.isFinite(number) && number >= 0) && (value.fiberG === undefined || Number.isFinite(value.fiberG) && value.fiberG >= 0);
const plantain: Nutrition = { calories: 122, proteinG: 1.3, carbsG: 31.89, fatG: 0.37, fiberG: 2.3 };
export const PLANTAIN_SOURCE = "https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg09.pdf";
export const RECIPE_NAMES = ["Paneer Bhurji", "Dal with added oil", "Raw Banana Sabzi (plantain reference)"];

export function referenceRecipe(name: string): RecipeDraft | undefined {
  const key = clean(name);
  const ingredient = (foodName: string, grams: string) => ({ name: foodName, grams, per100g: exactScanFood(foodName)!.per100g, source: "SATAT reference estimate; check your ingredient label" });
  const addedOil = { name: "Added oil", grams: "5", per100g: oil, source: "Fat energy calculation: 9 kcal/g" };
  if (key === "paneer bhurji") return { ingredients: [ingredient("Fresh Paneer (Raw)", "100"), { ...addedOil }], yieldGrams: "105" };
  if (key === "dal with added oil") return { ingredients: [ingredient("Toor Dal", "150"), { ...addedOil }], yieldGrams: "155" };
  if (["raw banana sabzi", "raw banana sabzi plantain reference", "plantain sabzi", "kacche kele ki sabzi"].includes(key)) return {
    ingredients: [{ name: "Raw plantain (proxy; confirm variety)", grams: "100", per100g: plantain, source: "USDA SR28 NDB 09277; plantain is a proxy for cooking banana" }, { ...addedOil }], yieldGrams: "105",
  };
}

export function recipeNutrition(recipe: RecipeDraft): Nutrition | null {
  const yieldG = Number(recipe.yieldGrams);
  if (!recipe.yieldGrams.trim() || !Number.isFinite(yieldG) || yieldG <= 0 || !recipe.ingredients.length) return null;
  const total: Nutrition = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  for (const ingredient of recipe.ingredients) {
    const grams = Number(ingredient.grams);
    if (!ingredient.grams.trim() || !Number.isFinite(grams) || grams < 0 || !validNutrition(ingredient.per100g)) return null;
    for (const key of Object.keys(total) as (keyof Nutrition)[]) total[key] = (total[key] || 0) + (ingredient.per100g[key] || 0) * grams / yieldG;
  }
  return total;
}

export function replaceComponent(row: ScanComponent, name: string): ScanComponent {
  const food = exactScanFood(name);
  const recipe = referenceRecipe(name);
  return { ...row, name, per100g: recipe ? recipeNutrition(recipe) : food?.per100g || null,
    micros: { ...UNKNOWN_MICROS }, recipe,
    source: recipe ? "Editable reference recipe · ingredients and cooked yield need checking" : food ? "SATAT reference estimate · photo identity is unverified" : "Nutrition unavailable · choose a reference or enter per-100g values",
    sourceUrl: recipe?.ingredients.some(item => item.name.startsWith("Raw plantain")) ? PLANTAIN_SOURCE : undefined,
    gramsPerUnit: food?.gramsPerDefaultUnit, confirmed: false, portionSource: "user" };
}

export function componentsFromScan(foods: any[]): ScanComponent[] {
  return foods.filter(item => item.source !== "component").map((food, index) => {
    const grams = typeof food.grams === "number" && food.grams > 0 ? food.grams : null;
    const known = [food.calories, food.proteinG, food.carbsG, food.fatG].every(value => typeof value === "number" && Number.isFinite(value) && value >= 0) && grams != null;
    const matched = exactScanFood(food.name);
    return { id: `scan-${index}`, name: food.name, amount: String(grams ?? food.quantity ?? ""), unit: grams ? "g" : food.unit || "g",
      per100g: known ? { calories: food.calories * 100 / grams, proteinG: food.proteinG * 100 / grams, carbsG: food.carbsG * 100 / grams, fatG: food.fatG * 100 / grams, fiberG: (food.fiberG || 0) * 100 / grams } : null,
      micros: { ...UNKNOWN_MICROS }, source: food.source === "ai_estimate" ? "AI nutrition estimate · unverified" : "SATAT reference estimate · photo identity is unverified",
      confirmed: false, portionSource: "photo", gramsPerUnit: matched?.gramsPerDefaultUnit,
    };
  });
}

export function componentGrams(row: ScanComponent): number | null {
  const amount = Number(row.amount);
  if (!row.amount.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 10000) return null;
  if (["g", "ml"].includes(row.unit)) return amount;
  const matched = exactScanFood(row.name);
  return matched ? normalizeQuantityToGrams(matched, amount, row.unit) : null;
}
export function summarizeComponents(rows: ScanComponent[]) {
  const totals: Nutrition = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  const micronutrients = { ...UNKNOWN_MICROS };
  let unresolved = 0;
  for (const row of rows) {
    const grams = componentGrams(row);
    if (!row.name.trim() || grams === null || !row.per100g || !validNutrition(row.per100g)) { unresolved++; continue; }
    for (const key of Object.keys(totals) as (keyof Nutrition)[]) totals[key] = (totals[key] || 0) + (row.per100g[key] || 0) * grams / 100;
  }
  for (const key of Object.keys(micronutrients) as NutrientKey[]) {
    // A missing nutrient in any component means the whole-meal value is unknown.
    if (rows.length && !unresolved && rows.every(row => row.nutrientSource?.trim() && row.micros[key] !== null && Number.isFinite(row.micros[key]) && row.micros[key]! >= 0)) micronutrients[key] = rows.reduce((sum, row) => sum + row.micros[key]! * componentGrams(row)! / 100, 0);
  }
  const rounded = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value)])) as Nutrition;
  return { totals: rounded, micronutrients, unresolved, complete: rows.length > 0 && unresolved === 0, reviewed: rows.length > 0 && rows.every(row => row.confirmed) };
}

/** Reconcile visual labels with component inventory, rather than ignoring labels when foods exists. */
export function reconcileScanInventory<T extends { name: string; quantity?: number; unit?: string; confidence?: number }>(foods: T[], labels: string[], parse: (text: string) => { quantity: number; unit: string } | null) {
  const result: (T | { name: string; quantity: number; unit: string; confidence: number })[] = [...foods];
  const strip = (text: string) => clean(text.replace(/(?:~|approx\.?|about)?\s*\d+(?:\.\d+)?\s*(?:-|to)?\s*\d*(?:\.\d+)?\s*(?:grams?|g|ml|pieces?|bowls?|katori|cups?|servings?)\b/gi, "")).replace(/^\d+\s+/, "").replace(/\b(?:with|and|of|in|a|the|approx|each|small|bowl|katori|pieces)\b/g, "").replace(/\b(samosas|rotis|chapatis|dosas|idlis)\b/g, word => word.slice(0, -1)).replace(/\s+/g, " ").trim();
  for (const label of labels) {
    if (/home[- ]cooked|low oil|garnish|tableware/i.test(label)) continue;
    const name = strip(label);
    if (!name) continue;
    const reference = exactScanFood(name);
    const found = result.some(food => {
      const other = strip(food.name);
      if (other === name || (reference && reference.id === exactScanFood(other)?.id)) return true;
      const tokens = name.split(/\s+/).filter(Boolean), others = other.split(/\s+/).filter(Boolean);
      return tokens.length > 1 && others.length > 1 && tokens.filter(token => others.includes(token)).length / Math.max(tokens.length, others.length) >= 0.65;
    });
    if (!found) { const portion = parse(label); result.push({ name, quantity: portion?.quantity || 1, unit: portion?.unit || "serving", confidence: 0.45 }); }
  }
  return result;
}

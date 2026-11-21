import { INDIAN_FOOD_DATABASE, type FoodCompositionItem } from "@/lib/ai/nutrition/database";
import { normalizeQuantityToGrams, resolveFoodItem, supportsFoodUnit } from "@/lib/ai/nutrition/calculator";

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
  reviewNote?: string;
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
    return { id: food.componentId || `scan-${index}`, name: food.name, amount: String(grams ?? food.quantity ?? ""), unit: grams ? "g" : food.unit || "g",
      per100g: known ? { calories: food.calories * 100 / grams, proteinG: food.proteinG * 100 / grams, carbsG: food.carbsG * 100 / grams, fatG: food.fatG * 100 / grams, fiberG: (food.fiberG || 0) * 100 / grams } : matched?.per100g || null,
      micros: { ...UNKNOWN_MICROS }, source: food.source === "ai_estimate" ? "AI nutrition estimate · unverified" : "SATAT reference estimate · photo identity is unverified",
      reviewNote: food.reviewNote, confirmed: false, portionSource: "photo", gramsPerUnit: matched?.gramsPerDefaultUnit,
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

export interface ScanSuggestion { id: string; name: string; quantity: number; unit: string; label: string }
type InventoryFood = { name: string; quantity?: number; unit?: string; confidence?: number; componentId?: string };
const stripLabel = (text: string) => clean(text.replace(/(?:~|approx\.?|about)?\s*\d+(?:\.\d+)?\s*(?:-|to)?\s*\d*(?:\.\d+)?\s*(?:grams?|g|ml|pieces?|bowls?|katori|cups?|servings?)\b/gi, ""))
  .replace(/^(?:\d+|one|two|three|four)\s+/, "").replace(/\b(?:with|and|of|in|a|the|approx|each|small|bowl|katori|pieces)\b/g, "")
  .replace(/\b(samosas|rotis|chapatis|dosas|idlis)\b/g, word => word.slice(0, -1)).replace(/\s+/g, " ").trim();
/** Used only to associate annotations, never to merge two physical servings. */
const annotationFamily = (name: string) => {
  const key = stripLabel(name);
  const exact = exactScanFood(key) || resolveFoodItem(key);
  for (const [family, pattern] of [
    ["roti", /\b(roti|chapati|phulka)\b/], ["dal", /\b(dal|dahl|lentils?)\b/],
    ["okra", /\b(bhindi|okra)\b/], ["rice", /\b(?:steamed|white|cooked|plain) rice\b|^rice$/],
  ] as const) if (pattern.test(key)) return family;
  return exact?.id || key;
};

/** One counted inventory. Display labels can flag a missing dish, never add calories. */
export function buildScanInventory<T extends InventoryFood>(foods: T[], labels: string[], parse: (text: string) => { quantity: number; unit: string } | null) {
  const counted: (T & { componentId: string })[] = foods.map((food, index) => ({ ...food, componentId: `scan-${index}` }));
  const reviewNotes: Record<string, string> = {};
  for (const food of counted) {
    if (typeof food.confidence === "number" && food.confidence < .65) reviewNotes[food.componentId] = "Check this dish and its amount; the photo was unclear.";
    const reference = resolveFoodItem(food.name);
    if (reference && !supportsFoodUnit(reference, food.unit || reference.defaultUnit)) reviewNotes[food.componentId] = "Enter grams for this dish; its food reference has no weight per piece.";
  }
  const suggestions: ScanSuggestion[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < labels.length; index++) {
    const label = labels[index];
    if (/home[- ]cooked|low oil|garnish|tableware|not counted|not part of (?:the )?(?:meal|plate)/i.test(label)) continue;
    const name = stripLabel(label);
    const portion = parse(label);
    const labelKey = `${name}:${portion?.quantity}:${portion?.unit}`;
    if (!name || seen.has(labelKey)) continue;
    seen.add(labelKey);
    const matches = counted.filter(food => {
      const other = stripLabel(food.name);
      return annotationFamily(food.name) === annotationFamily(name) ||
        (other.length > 3 && (` ${name} `).includes(` ${other} `));
    });
    if (!matches.length) {
      suggestions.push({ id: `label-${index}`, name, quantity: portion?.quantity || 1, unit: portion?.unit || "serving", label });
      continue;
    }
    // With multiple bowls the label may describe one bowl or their combined mass.
    // Do not assign that quantity to each bowl, or silently choose a portion.
    const conflict = matches.length > 1 || (portion && matches.some(food => {
      if (food.unit === portion.unit) return Math.abs((food.quantity ?? 1) - portion.quantity) > .01;
      const reference = resolveFoodItem(food.name);
      if (!reference) return false;
      const foodGrams = normalizeQuantityToGrams(reference, food.quantity ?? 1, food.unit);
      const labelGrams = normalizeQuantityToGrams(reference, portion.quantity, portion.unit);
      return foodGrams !== null && labelGrams !== null && Math.abs(foodGrams - labelGrams) > 1;
    }));
    const labelReference = exactScanFood(name);
    const identityConflict = labelReference && matches.some(food => {
      const reference = exactScanFood(food.name);
      return reference && reference.id !== labelReference.id;
    });
    if (conflict || identityConflict) for (const food of matches) reviewNotes[food.componentId] = `Check ${identityConflict ? "dish and amount" : "amount"}: the photo also described “${label}”.`;
  }
  return { foods: counted, suggestions, reviewNotes };
}

/** Compatibility helper: labels are annotations rather than additional foods. */
export function reconcileScanInventory<T extends InventoryFood>(foods: T[], labels: string[], parse: (text: string) => { quantity: number; unit: string } | null) {
  return buildScanInventory(foods, labels, parse).foods;
}

/** Preserve old drafts and user corrections; require a fresh check of pre-fix photo rows. */
export function restoreScanDraft(rows: ScanComponent[], version: number): ScanComponent[] {
  return rows.map(row => version < 2 && row.portionSource === "photo"
    ? { ...row, confirmed: false, reviewNote: "Check this saved dish and remove any duplicate before logging." }
    : row);
}

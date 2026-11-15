export interface MealReference {
  id: string; file: string; split: "development" | "held-out";
  foods: { name: string; aliases?: string[]; grams?: number }[];
  measured?: { calories: number; proteinG?: number; source: string };
}
/** One-to-one matches: duplicate predictions cannot conceal missed components. */
export function evaluateMeal(reference: MealReference, prediction: { foods?: { name: string; grams?: number | null }[]; calories?: number; proteinG?: number; confidence?: string }) {
  const foods = prediction.foods || [], used = new Set<number>();
  const normalized = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const gramErrors: number[] = [], missed: string[] = [];
  for (const expected of reference.foods) {
    const aliases = [expected.name, ...(expected.aliases || [])].map(normalized);
    const index = foods.findIndex((food, position) => !used.has(position) && aliases.includes(normalized(food.name)));
    if (index === -1) { missed.push(expected.name); continue; }
    used.add(index);
    if (typeof expected.grams === "number" && typeof foods[index].grams === "number") gramErrors.push(Math.abs(foods[index].grams! - expected.grams));
  }
  const measured = reference.measured && reference.measured.source.trim() && reference.measured.calories > 0 ? reference.measured : undefined;
  return { referenceId: reference.id, split: reference.split, precision: foods.length ? used.size / foods.length : 0, recall: reference.foods.length ? used.size / reference.foods.length : null,
    missed, unexpected: foods.filter((_, index) => !used.has(index)).map(food => food.name),
    gramsMAE: gramErrors.length ? gramErrors.reduce((sum, error) => sum + error, 0) / gramErrors.length : null,
    portionCoverage: reference.foods.filter(food => typeof food.grams === "number").length ? gramErrors.length / reference.foods.filter(food => typeof food.grams === "number").length : null,
    calorieAbsoluteError: measured && Number.isFinite(prediction.calories) ? Math.abs(prediction.calories! - measured.calories) : null,
    calorieRelativeError: measured && Number.isFinite(prediction.calories) ? Math.abs(prediction.calories! - measured.calories) / measured.calories : null,
    catastrophicUndercount: measured && Number.isFinite(prediction.calories) ? prediction.calories! < measured.calories * .5 : null,
    proteinAbsoluteError: measured && typeof measured.proteinG === "number" && typeof prediction.proteinG === "number" ? Math.abs(prediction.proteinG - measured.proteinG) : null,
    confidence: prediction.confidence || "unknown", measuredAccuracyAvailable: Boolean(measured) };
}

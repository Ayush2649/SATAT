import { expect, it } from "vitest";
import { evaluateMeal, type MealReference } from "@/lib/nutrition/scan-evaluation";
const reference: MealReference = { id: "mixed-meal", file: "local.jpg", split: "held-out", foods: [{ name: "Steamed Rice", grams: 400 }, { name: "Paneer Bhurji", grams: 100 }, { name: "Dal" }, { name: "Raw Banana Sabzi" }] };
it("counts missing dal and wrong egg as failures even when rice is recognized", () => {
  const result = evaluateMeal(reference, { foods: [{ name: "Steamed Rice", grams: 200 }, { name: "Egg Bhurji", grams: 90 }], calories: 393 });
  expect(result.recall).toBe(.25); expect(result.precision).toBe(.5); expect(result.gramsMAE).toBe(200);
  expect(result.missed).toContain("Dal"); expect(result.unexpected).toContain("Egg Bhurji");
  expect(result.calorieAbsoluteError).toBeNull();
});
it("does not report calorie accuracy without measured reference provenance", () => {
  const result = evaluateMeal({ ...reference, measured: { calories: 1000, source: "" } }, { calories: 393 });
  expect(result.measuredAccuracyAvailable).toBe(false);
});
it("reports measured error and catastrophic undercount when references exist", () => {
  const result = evaluateMeal({ ...reference, measured: { calories: 1000, proteinG: 30, source: "Weighed recipe" } }, { calories: 393, proteinG: 16 });
  expect(result.calorieAbsoluteError).toBe(607); expect(result.proteinAbsoluteError).toBe(14); expect(result.catastrophicUndercount).toBe(true);
});
it("does not match duplicate rice twice", () => {
  const result = evaluateMeal({ ...reference, foods: [{ name: "Steamed Rice" }, { name: "Steamed Rice" }] }, { foods: [{ name: "Steamed Rice" }] });
  expect(result.recall).toBe(.5);
});

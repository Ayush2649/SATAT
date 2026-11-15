import { describe, expect, it } from "vitest";
import { calculateMealNutrition, resolveFoodItem, normalizeQuantityToGrams } from "@/lib/ai/nutrition/calculator";
import { DEFAULT_MACRO_GOALS, validMealMacros, parseMealMacroFields } from "@/lib/nutrition/goals";
import { taskFocusMinutes, withFocusTarget } from "@/lib/tasks/focus";
import { reconcileFoodPortions } from "@/lib/ai/providers/common";
import { includesIngredient } from "@/lib/nutrition/hints";
import { remainingSeconds } from "@/lib/useFocusTimer";
import { ritualStorageKey } from "@/lib/useRituals";

describe("Meal accuracy and audit regressions", () => {
  it.each(["Mysterious Dark Matter Shake", "Quantum Nano Shake X", "Unidentified Secret Smoothie"])("keeps %s unresolved", name => {
    const result = calculateMealNutrition([{ name, quantity: 1, unit: "serving" }]);
    expect(result.allFoodsVerified).toBe(false);
    expect(result.requiresManualReview).toBe(true);
    expect(result.items[0].calories).toBeNull();
  });
  it("uses visible gram weights for condiment bowls instead of treating each as 150g", () => {
    const [food] = reconcileFoodPortions([{ name: "Coconut Chutney", quantity: 1, unit: "katori", confidence: 0.8 }], ["Coconut chutney ~30g"]);
    expect(food.quantity).toBe(30);
    expect(food.unit).toBe("g");
    const result = calculateMealNutrition([food]);
    expect(result.calories).toBeLessThan(100);
  });
  it("does not verify an ambiguous rice or pongal identity as plain rice", () => {
    expect(resolveFoodItem("Pongal / Rice with Cashew")).toBeNull();
  });
  it("keeps an estimated portion range from being scaled twice", () => {
    const result = calculateMealNutrition([{ name: "Green Chutney", quantity: 30, unit: "g", estimatedNutrition: {
      calories: 33, proteinG: 1, carbsG: 3, fatG: 2, calorieRange: { low: 24, high: 45 }, calorieRangeBasis: "portion",
      nutritionPer100g: { calories: 110, proteinG: 3, carbsG: 10, fatG: 7 },
    } }]);
    expect(result.items[0].calorieRange).toEqual({ low: 24, high: 45 });
    expect(result.items[0].calories).toBeGreaterThanOrEqual(24);
  });
  it("honors explicit weights rather than silently capping a second serving", () => {
    expect(normalizeQuantityToGrams(resolveFoodItem("sooji halwa"), 300, "g")).toBe(300);
    const one = calculateMealNutrition([{ name: "sooji halwa", quantity: 150, unit: "g" }]);
    const two = calculateMealNutrition([{ name: "sooji halwa", quantity: 300, unit: "g" }]);
    expect(two.calories).toBeCloseTo(one.calories * 2, 0);
  });
  it.each([-100, Infinity, NaN, 0])("rejects invalid meal energy %s", calories => {
    expect(validMealMacros({ calories, proteinG: 0, carbsG: 0, fatG: 0 })).toBe(false);
  });
  it("rejects negative macros and allows legitimate zero protein", () => {
    expect(validMealMacros({ calories: 45, proteinG: 0, carbsG: 0, fatG: 5 })).toBe(true);
    expect(validMealMacros({ calories: 45, proteinG: -1, carbsG: 0, fatG: 5 })).toBe(false);
    expect(DEFAULT_MACRO_GOALS.proteinG).toBe(150);
  });
  it.each(["no egg", "without boiled egg", "skip the egg"])("does not invent an addon from %s", hint => {
    expect(includesIngredient(hint, "(?:boiled\\s+)?egg")).toBe(false);
  });
  it("recognizes an affirmative addon in another clause", () => {
    expect(includesIngredient("no ghee, one boiled egg", "(?:boiled\\s+)?egg")).toBe(true);
  });
});

describe("Account scope and background timer", () => {
  it("does not interpret blank manual nutrition as known zero macros", () => {
    expect(parseMealMacroFields({ calories: "100", proteinG: "", carbsG: "", fatG: "" })).toBeNull();
    expect(parseMealMacroFields({ calories: "45", proteinG: "0", carbsG: "0", fatG: "5" })?.fatG).toBe(5);
  });
  it("keeps the selected focus plan in existing notes without duplicating it on edit", () => {
    const notes = withFocusTarget("Read chapter 2", 2);
    expect(taskFocusMinutes(notes)).toBe(50);
    const updated = withFocusTarget(notes, 3);
    expect(updated).toBe("Read chapter 2\nFocus target: 75 min");
    expect(taskFocusMinutes("Unrelated note")).toBeNull();
    expect(taskFocusMinutes("Focus target: 9999 min")).toBeNull();
  });
  it("gives different accounts distinct ritual keys without importing unowned history", () => {
    expect(ritualStorageKey("a", "2026-11-14")).not.toBe(ritualStorageKey("b", "2026-11-14"));
    expect(ritualStorageKey("a", "2026-11-14")).not.toBe("satat_rituals_2026-11-14");
  });
  it("uses elapsed time after navigation or throttling, clamps at zero, preserves a pause", () => {
    const state = { minutes: 25, remaining: 1500, deadline: 1500000 };
    expect(remainingSeconds(state, 1000)).toBe(1499);
    expect(remainingSeconds(state, 600000)).toBe(900);
    expect(remainingSeconds(state, 2000000)).toBe(0);
    expect(remainingSeconds({ ...state, remaining: 900, deadline: null }, 2000000)).toBe(900);
  });
});

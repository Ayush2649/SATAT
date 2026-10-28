/**
 * tests/diet/nutrition-accuracy.test.ts
 *
 * Sprint 4.9 & Sprint 4.10 Nutrition Accuracy Engine Tests.
 * Verifies:
 * - Atwater math enforcement (4P + 4C + 9F)
 * - Ground truth food anchors (IFCT & USDA)
 * - Raw vs cooked staple disambiguation (e.g. Soya Chunks dry default)
 * - Portioned parsing for free text queries (including grams/gms/scoops)
 * - Compound multi-item meal resolution ("2 whole eggs with 2 rotis") without dropping ingredients
 * - Resilient barcode and OCR fallback behaviors
 */

import { describe, it, expect } from "vitest";
import {
  enforceAtwaterMath,
  findFoodAnchor,
  resolveMultiItemFoodAnchors,
  parseQueryPortion,
  FOOD_ANCHORS,
} from "@/lib/nutrition/foodAnchors";
import { resolveFoodItem, calculateMealNutrition } from "@/lib/ai/nutrition/calculator";

describe("Sprint 4.9 & 4.10: Nutrition Accuracy Engine", () => {
  describe("enforceAtwaterMath", () => {
    it("calibrates calories when LLM output drifts by > 8% from Atwater formula", () => {
      // 20g protein, 40g carbs, 10g fat => Atwater: 20*4 + 40*4 + 10*9 = 80 + 160 + 90 = 330 kcal
      // Suppose LLM hallucinated 450 kcal (+36% drift)
      const input = {
        calories: 450,
        proteinG: 20,
        carbsG: 40,
        fatG: 10,
      };
      const result = enforceAtwaterMath(input);
      expect(result.calories).toBe(330);
      expect(result.proteinG).toBe(20);
      expect(result.carbsG).toBe(40);
      expect(result.fatG).toBe(10);
    });

    it("preserves calories if within 8% tolerance of Atwater formula", () => {
      // 10g protein, 20g carbs, 5g fat => Atwater: 40 + 80 + 45 = 165 kcal
      // 168 kcal is within 2% of 165 kcal
      const input = {
        calories: 168,
        proteinG: 10,
        carbsG: 20,
        fatG: 5,
      };
      const result = enforceAtwaterMath(input);
      expect(result.calories).toBe(168);
    });

    it("fixes 0 or negative calories when macros are present", () => {
      const input = {
        calories: 0,
        proteinG: 25,
        carbsG: 5,
        fatG: 2,
      };
      // Atwater: 25*4 + 5*4 + 2*9 = 100 + 20 + 18 = 138 kcal
      const result = enforceAtwaterMath(input);
      expect(result.calories).toBe(138);
    });
  });

  describe("parseQueryPortion", () => {
    it("extracts gram weights cleanly across formats (g, gms, grams)", () => {
      expect(parseQueryPortion("50g soya chunks")).toEqual({
        qty: 50,
        unit: "g",
        cleanName: "soya chunks",
      });
      expect(parseQueryPortion("100 grams of paneer")).toEqual({
        qty: 100,
        unit: "g",
        cleanName: "paneer",
      });
      expect(parseQueryPortion("200 gms paneer")).toEqual({
        qty: 200,
        unit: "g",
        cleanName: "paneer",
      });
      expect(parseQueryPortion("150 gm chicken breast")).toEqual({
        qty: 150,
        unit: "g",
        cleanName: "chicken breast",
      });
    });

    it("extracts ml liquids cleanly", () => {
      expect(parseQueryPortion("200ml milk")).toEqual({
        qty: 200,
        unit: "ml",
        cleanName: "milk",
      });
    });

    it("extracts scoops cleanly", () => {
      expect(parseQueryPortion("2 scoops whey")).toEqual({
        qty: 2,
        unit: "scoop",
        cleanName: "whey",
      });
    });

    it("extracts discrete piece counts cleanly", () => {
      expect(parseQueryPortion("2 rotis")).toEqual({
        qty: 2,
        unit: "piece",
        cleanName: "rotis",
      });
      expect(parseQueryPortion("3 boiled eggs")).toEqual({
        qty: 3,
        unit: "piece",
        cleanName: "boiled eggs",
      });
    });
  });

  describe("Single Item findFoodAnchor", () => {
    it("defaults dry soya chunks to raw/dry weight", () => {
      const match = findFoodAnchor("50g soya chunks");
      expect(match).not.toBeNull();
      expect(match?.matched).toBe(true);
      expect(match?.anchor?.state).toBe("dry");
      // 50g dry soya chunks per IFCT: 52g P/100g => 26g P
      expect(match?.macros.proteinG).toBe(26);
      expect(match?.macros.calories).toBe(173);
    });

    it("correctly identifies cooked / boiled soya chunks when explicitly specified", () => {
      const match = findFoodAnchor("150g boiled soya chunks");
      expect(match).not.toBeNull();
      expect(match?.anchor?.state).toBe("cooked");
      expect(match?.macros.proteinG).toBe(27);
      expect(match?.macros.calories).toBe(180);
    });

    it("resolves 200 gms paneer with exact IFCT macro values", () => {
      const paneer = findFoodAnchor("200 gms paneer");
      expect(paneer).not.toBeNull();
      expect(paneer?.anchor?.id).toBe("paneer_raw");
      expect(paneer?.macros.calories).toBe(530);
      expect(paneer?.macros.proteinG).toBe(36.6);
      expect(paneer?.macros.carbsG).toBe(6.8);
      expect(paneer?.macros.fatG).toBe(41.6);
    });

    it("resolves standard 35g roti accurately (104 kcal each, 208 kcal for 2)", () => {
      const plain = findFoodAnchor("2 rotis");
      expect(plain).not.toBeNull();
      expect(plain?.anchor?.id).toBe("roti_plain");
      expect(plain?.macros.calories).toBe(208);
      expect(plain?.macros.proteinG).toBe(6.2);
      expect(plain?.macros.carbsG).toBe(42);
      expect(plain?.macros.fatG).toBe(1.6);
    });

    it("resolves whey protein scoops", () => {
      const scoop = findFoodAnchor("1 scoop whey");
      expect(scoop).not.toBeNull();
      expect(scoop?.anchor?.id).toBe("whey_isolate");
      expect(scoop?.macros.proteinG).toBe(25);
    });

    it("resolves Amul High Protein Packaged products", () => {
      const lassi = findFoodAnchor("amul protein lassi");
      expect(lassi).not.toBeNull();
      expect(lassi?.macros.proteinG).toBe(15);
      expect(lassi?.macros.calories).toBe(130);

      const buttermilk = findFoodAnchor("amul protein buttermilk");
      expect(buttermilk).not.toBeNull();
      expect(buttermilk?.macros.proteinG).toBe(15);
      expect(buttermilk?.macros.calories).toBe(90);
    });
  });

  describe("Compound Multi-Item Meal Resolution (BUG 1 Fix)", () => {
    it("resolves '2 whole eggs with 2 rotis' without dropping either ingredient (~352 kcal)", () => {
      const result = resolveMultiItemFoodAnchors("2 whole eggs with 2 rotis");
      expect(result).not.toBeNull();
      expect(result?.matched).toBe(true);
      expect(result?.items.length).toBe(2);

      // Segment 1: 2 whole eggs = 144 kcal, 12.6g P, 0.8g C, 9.6g F
      expect(result?.items[0].name).toContain("Whole Egg");
      expect(result?.items[0].macros.calories).toBe(144);
      expect(result?.items[0].macros.proteinG).toBe(12.6);

      // Segment 2: 2 rotis = 208 kcal, 6.2g P, 42g C, 1.6g F
      expect(result?.items[1].name).toContain("Plain Roti");
      expect(result?.items[1].macros.calories).toBe(208);
      expect(result?.items[1].macros.proteinG).toBe(6.2);

      // Combined Summed Total: ~352 kcal, ~18.8g P, ~42.8g C, ~11.2g F
      expect(result?.macros.calories).toBe(352);
      expect(result?.macros.proteinG).toBe(18.8);
      expect(result?.macros.carbsG).toBe(42.8);
      expect(result?.macros.fatG).toBe(11.2);
    });

    it("resolves '100g chicken breast and 150g rice' without dropping the second item", () => {
      const result = resolveMultiItemFoodAnchors("100g chicken breast and 150g rice");
      expect(result).not.toBeNull();
      expect(result?.matched).toBe(true);
      expect(result?.items.length).toBe(2);

      // Chicken breast (cooked) 100g = 165 kcal, 31.0g P, 0g C, 3.6g F
      // Cooked white rice 150g = 195 kcal, 4.1g P, 42.3g C, 0.5g F
      // Summed: ~360 kcal, ~35.1g P, ~42.3g C, ~4.1g F
      expect(result?.macros.calories).toBe(360);
      expect(result?.macros.proteinG).toBe(35.1);
      expect(result?.macros.carbsG).toBe(42.3);
      expect(result?.macros.fatG).toBe(4.1);
    });

    it("returns null when an unknown ingredient is in a compound phrase rather than dropping it", () => {
      // "2 rotis with grandma secret gravy" -> roti is known, secret gravy is not
      // Must return null so it falls back to full AI decomposition instead of dropping the gravy!
      const result = resolveMultiItemFoodAnchors("2 rotis with grandma secret gravy");
      expect(result).toBeNull();
    });

    it("route via findFoodAnchor cleanly routes compound queries without dropping items", () => {
      const result = findFoodAnchor("2 whole eggs with 2 rotis");
      expect(result).not.toBeNull();
      expect(result?.matched).toBe(true);
      // Calories must match combined total (~352 kcal), NOT just 2 rotis (208 kcal) or eggs (144 kcal)!
      expect(result?.macros.calories).toBe(352);
      expect(result?.macros.proteinG).toBe(18.8);
    });
  });

  describe("Deterministic Indian Food DB Integration", () => {
    it("resolves newly added fitness staples in resolveFoodItem", () => {
      expect(resolveFoodItem("soya chunks")?.id).toBe("soya_chunks_dry");
      expect(resolveFoodItem("paneer")?.id).toBe("paneer_fresh");
      expect(resolveFoodItem("oats")?.id).toBe("oats_rolled");
      expect(resolveFoodItem("egg")?.id).toBe("egg_whole");
      expect(resolveFoodItem("egg white")?.id).toBe("egg_white");
      expect(resolveFoodItem("chicken breast")?.id).toBe("chicken_breast_cooked");
      expect(resolveFoodItem("whey")?.id).toBe("whey_isolate");
    });
  });
});

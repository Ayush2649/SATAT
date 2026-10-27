/**
 * tests/diet/nutrition-accuracy.test.ts
 *
 * Sprint 4.9 Nutrition Accuracy Engine Tests.
 * Verifies:
 * - Atwater math enforcement (4P + 4C + 9F)
 * - Ground truth food anchors (IFCT & USDA)
 * - Raw vs cooked staple disambiguation (e.g. Soya Chunks dry default)
 * - Portioned parsing for free text queries
 */

import { describe, it, expect } from "vitest";
import {
  enforceAtwaterMath,
  findFoodAnchor,
  parseQueryPortion,
  FOOD_ANCHORS,
} from "@/lib/nutrition/foodAnchors";
import { resolveFoodItem, calculateMealNutrition } from "@/lib/ai/nutrition/calculator";

describe("Sprint 4.9: Nutrition Accuracy Engine", () => {
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
    it("extracts gram weights cleanly", () => {
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

  describe("findFoodAnchor", () => {
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

    it("resolves plain roti vs roti with ghee", () => {
      const plain = findFoodAnchor("2 rotis");
      expect(plain).not.toBeNull();
      expect(plain?.anchor?.id).toBe("roti_plain");
      // 2 plain rotis = ~170 kcal, 6g protein
      expect(plain?.macros.proteinG).toBe(6);
      expect(plain?.macros.calories).toBe(170);

      const ghee = findFoodAnchor("1 roti with ghee");
      expect(ghee).not.toBeNull();
      expect(ghee?.anchor?.id).toBe("roti_ghee");
      expect(ghee?.macros.fatG).toBe(5.5);
    });

    it("resolves raw paneer block by weight", () => {
      const paneer = findFoodAnchor("100g paneer");
      expect(paneer).not.toBeNull();
      expect(paneer?.anchor?.id).toBe("paneer_raw");
      expect(paneer?.macros.proteinG).toBe(18);
      expect(paneer?.macros.fatG).toBe(20);
      expect(paneer?.macros.calories).toBe(268);
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

    it("enforces Atwater factor math in calculateMealNutrition", () => {
      const result = calculateMealNutrition(
        [
          { name: "soya chunks", quantity: 50, unit: "gram" },
          { name: "Plain Roti", quantity: 2, unit: "piece" },
        ],
        "Soya and Roti"
      );

      const expectedAtwater = Math.round(
        4 * result.proteinG + 4 * result.carbsG + 9 * result.fatG
      );

      // Calorie must match Atwater math within rounding
      expect(Math.abs(result.calories - expectedAtwater)).toBeLessThanOrEqual(2);
    });
  });
});

import { describe, it, expect } from "vitest";
import { resolveDishThumbnail } from "@/lib/diet/dishMatcher";
import {
  QUICK_MODIFIERS,
  calculateLiveScanMacros,
} from "@/components/diet/MealScannerModal";

describe("Sprint 4.8 Diet Enhancements", () => {
  it("resolves dedicated soya dish image for soyabean and soya chunks", () => {
    const soyaUrl = resolveDishThumbnail("50 gms Soyabean");
    expect(soyaUrl).toBe(
      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=300&q=75"
    );
    const chunksUrl = resolveDishThumbnail("Soya Chunks Curry");
    expect(chunksUrl).toBe(
      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=300&q=75"
    );
  });

  it("never matches generic fallback for oats, dal, soya, paneer", () => {
    const fallback = "photo-1546069901-ba9599a7e63c";
    expect(resolveDishThumbnail("Oats with Milk and Almond")).not.toContain(fallback);
    expect(resolveDishThumbnail("Dal Chawal")).not.toContain(fallback);
    expect(resolveDishThumbnail("50 gms Soyabean")).not.toContain(fallback);
    expect(resolveDishThumbnail("Paneer Bhurji")).not.toContain(fallback);
  });
});

describe("Sprint 9.2: Quick Modifier Pills & Live Scan Macro Toggling", () => {
  const baseScan = {
    baseCalories: 250,
    baseProtein: 10,
    baseCarbs: 35,
    baseFat: 8,
  };

  it("immediately increases displayed calories by +120 kcal and protein by +24g when clicking + 1 Scoop Whey", () => {
    const result = calculateLiveScanMacros({
      ...baseScan,
      activeModifiers: ["+ 1 Scoop Whey"],
    });

    expect(result.currentCalories).toBe(250 + 120); // 370 kcal
    expect(result.currentProtein).toBe(10 + 24); // 34 g
    expect(result.currentCarbs).toBe(35 + 3); // 38 g
    expect(result.currentFat).toBe(Math.round(8 + 1.5)); // 9.5 -> rounded to 10 g
    expect(result.addonCalories).toBe(120);
    expect(result.addonProtein).toBe(24);
  });

  it("immediately increases calories by +45 kcal and fat by +5g when toggling + 1 tsp Ghee", () => {
    const result = calculateLiveScanMacros({
      ...baseScan,
      activeModifiers: ["+ 1 tsp Ghee"],
    });

    expect(result.currentCalories).toBe(250 + 45); // 295 kcal
    expect(result.currentFat).toBe(8 + 5); // 13 g
    expect(result.currentProtein).toBe(10);
    expect(result.addonCalories).toBe(45);
    expect(result.addonFat).toBe(5);
  });

  it("immediately increases calories by +78 kcal, protein by +6g, fat by +5g when toggling + Boiled Egg", () => {
    const result = calculateLiveScanMacros({
      ...baseScan,
      activeModifiers: ["+ Boiled Egg"],
    });

    expect(result.currentCalories).toBe(250 + 78); // 328 kcal
    expect(result.currentProtein).toBe(10 + 6); // 16 g
    expect(result.currentFat).toBe(8 + 5); // 13 g
    expect(result.currentCarbs).toBe(35 + 1); // 36 g
  });

  it("reduces base scan fat by 25% (up to 8g) and subtracts fatReduction * 9 kcal when Home Cooked is active", () => {
    // With 20g fat, 25% is 5g fat reduction -> 5 * 9 = 45 kcal reduction
    const oilyScan = {
      baseCalories: 400,
      baseProtein: 12,
      baseCarbs: 45,
      baseFat: 20,
    };
    const result = calculateLiveScanMacros({
      ...oilyScan,
      activeModifiers: ["Home Cooked"],
    });

    expect(result.fatReduction).toBe(5);
    expect(result.currentFat).toBe(20 - 5); // 15 g
    expect(result.currentCalories).toBe(400 - 45); // 355 kcal
  });

  it("accumulates multiple active modifiers additively without interference", () => {
    const result = calculateLiveScanMacros({
      ...baseScan,
      activeModifiers: ["+ 1 Scoop Whey", "+ 1 tsp Ghee", "+ Boiled Egg"],
    });

    expect(result.currentCalories).toBe(250 + 120 + 45 + 78); // 493 kcal
    expect(result.currentProtein).toBe(10 + 24 + 0 + 6); // 40 g
    expect(result.currentFat).toBe(Math.round(8 + 1.5 + 5 + 5)); // 20 g
  });

  it("avoids double-counting when server already included the modifier in serverVisibleItems", () => {
    const result = calculateLiveScanMacros({
      ...baseScan,
      activeModifiers: ["+ 1 Scoop Whey"],
      serverVisibleItems: ["Besan Cheela ~140g", "Whey protein ~30 g"],
    });

    // Server already has whey in base numbers, so addonCalories should be 0
    expect(result.addonCalories).toBe(0);
    expect(result.addonProtein).toBe(0);
    expect(result.currentCalories).toBe(250);
    expect(result.currentProtein).toBe(10);
  });

  it("scales base macros with portionMultiplier while applying add-on modifiers cleanly", () => {
    const result = calculateLiveScanMacros({
      ...baseScan,
      portionMultiplier: 1.5,
      activeModifiers: ["+ 1 Scoop Whey"],
    });

    // Base: 250 * 1.5 = 375 kcal, Whey: +120 kcal -> 495 kcal
    expect(result.currentCalories).toBe(375 + 120);
    // Base: 10 * 1.5 = 15g P, Whey: +24g P -> 39g P
    expect(result.currentProtein).toBe(15 + 24);
  });
});


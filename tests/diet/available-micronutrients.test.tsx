import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AvailableMicronutrients from "@/components/diet/AvailableMicronutrients";
import { UNKNOWN_MICROS } from "@/lib/nutrition/scan-review";
import type { MealEntry } from "@/types";
const meal: MealEntry = { id: "test", userId: "test", date: "2026-11-15", name: "Rice and dal", macros: { calories: 400, carbsG: 65, fatG: 8, proteinG: 17 }, createdAt: 1 };
const render = (values: typeof UNKNOWN_MICROS) => renderToStaticMarkup(<AvailableMicronutrients meal={{ ...meal, scanReview: { version: 1, components: [], micronutrients: values } }} />);
describe("Compact logged meal nutrients", () => {
  it("renders nothing for legacy meals or an entirely unknown nutrient record", () => {
    expect(renderToStaticMarkup(<AvailableMicronutrients meal={meal} />)).toBe("");
    expect(render(UNKNOWN_MICROS)).toBe("");
  });
  it("shows only available values, preserving explicit zero without placeholders", () => {
    const html = render({ ...UNKNOWN_MICROS, ironMg: 2.4, vitaminCMg: 0 });
    expect(html).toContain("Iron (mg)"); expect(html).toContain("2.4");
    expect(html).toContain("Vitamin C (mg)"); expect(html).toContain("0.0");
    expect(html).not.toMatch(/Calcium|Potassium|Vitamin A|Not available/);
  });
  it("hides invalid numeric values rather than displaying them", () => {
    expect(render({ ...UNKNOWN_MICROS, ironMg: NaN, calciumMg: Infinity, potassiumMg: -1 })).toBe("");
  });
});

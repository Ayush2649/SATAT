import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MacroDonutBreakdown from "@/components/diet/MacroDonutBreakdown";

describe("MacroDonutBreakdown", () => {
  it("renders zero macros cleanly without crashing", () => {
    const html = renderToStaticMarkup(
      React.createElement(MacroDonutBreakdown, {
        variant: "dark",
        calories: 0,
        carbs: 0,
        fat: 0,
        protein: 0,
      })
    );
    expect(html).toContain("0");
    expect(html).toContain("kcal");
    expect(html).toContain("Carbs");
    expect(html).toContain("Fat");
    expect(html).toContain("Protein");
  });

  it("calculates percentage shares correctly", () => {
    // 50g carbs = 200 kcal, 20g fat = 180 kcal, 30g protein = 120 kcal.
    // Total macro cal = 500 kcal.
    // Carbs = 200/500 = 40%
    // Fat = 180/500 = 36%
    // Protein = 120/500 = 24%
    const html = renderToStaticMarkup(
      React.createElement(MacroDonutBreakdown, {
        variant: "dark",
        calories: 500,
        carbs: 50,
        fat: 20,
        protein: 30,
      })
    );
    expect(html).toContain("40%");
    expect(html).toContain("36%");
    expect(html).toContain("24%");
    expect(html).toContain("50g");
    expect(html).toContain("20g");
    expect(html).toContain("30g");
  });

  it("renders light variant with target readouts and cal unit", () => {
    const html = renderToStaticMarkup(
      React.createElement(MacroDonutBreakdown, {
        variant: "light",
        calories: 350,
        carbs: 40,
        fat: 10,
        protein: 25,
        targetCarbs: 200,
        targetFat: 65,
        targetProtein: 150,
      })
    );
    expect(html).toContain("cal");
    expect(html).toContain("/200g");
    expect(html).toContain("/65g");
    expect(html).toContain("/150g");
  });

  it("ensures light and dark variants use identical ring arc colors (#F59E0B, #E05A47, #2D6A4F)", () => {
    const darkHtml = renderToStaticMarkup(
      React.createElement(MacroDonutBreakdown, {
        variant: "dark",
        calories: 400,
        carbs: 40,
        fat: 15,
        protein: 25,
      })
    );
    const lightHtml = renderToStaticMarkup(
      React.createElement(MacroDonutBreakdown, {
        variant: "light",
        calories: 400,
        carbs: 40,
        fat: 15,
        protein: 25,
      })
    );

    // Both must use Amber for Carbs, Terracotta for Fat, and Matcha Sage for Protein ring arcs
    expect(darkHtml).toContain('stroke="#F59E0B"');
    expect(darkHtml).toContain('stroke="#E05A47"');
    expect(darkHtml).toContain('stroke="#2D6A4F"');

    expect(lightHtml).toContain('stroke="#F59E0B"');
    expect(lightHtml).toContain('stroke="#E05A47"');
    expect(lightHtml).toContain('stroke="#2D6A4F"');
  });
});


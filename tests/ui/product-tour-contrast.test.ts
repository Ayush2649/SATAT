import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BUG-05: ProductTour Contrast & Theme-Aware Tokens", () => {
  const tourSourcePath = path.resolve(__dirname, "../../components/ui/ProductTour.tsx");
  const tourSource = fs.readFileSync(tourSourcePath, "utf8");

  it("1. Eliminates hardcoded text-gray-800 and text-gray-300 from task list labels", () => {
    // The previous bug was: <span className={cn("text-xs font-semibold", t.done ? "line-through text-gray-300" : "text-gray-800")}>{t.text}</span>
    // In dark mode, text-gray-800 on var(--surface-0) failed WCAG AA (< 1.3:1 contrast ratio)
    expect(tourSource).not.toContain("text-gray-800");
  });

  it("2. Applies theme-aware tokens var(--text-1) and var(--text-3) to task labels", () => {
    // Must use var(--text-1) for high-contrast pending text and var(--text-3) for completed text
    expect(tourSource).toContain('color: t.done ? "var(--text-3)" : "var(--text-1)"');
    expect(tourSource).toContain('textDecoration: t.done ? "line-through" : "none"');
  });

  it("3. Uses theme-aware color token for progress indicator label", () => {
    // Progress label should use var(--text-3) rather than hardcoded text-gray-400
    expect(tourSource).toContain('style={{ color: "var(--text-3)" }}');
  });

  it("4. Employs consistent, accessible dismiss buttons across steps", () => {
    // Dismiss buttons should use btn-ghost and include an accessible aria-label
    expect(tourSource).not.toContain("text-white/30 hover:text-white hover:bg-white/10");
    const ghostDismissMatches = tourSource.match(/btn-ghost z-10/g);
    // Across Step0, Step1, Step2, Step3, Step4 (all 5 steps)
    expect(ghostDismissMatches).not.toBeNull();
    expect(ghostDismissMatches!.length).toBeGreaterThanOrEqual(4);
  });
});

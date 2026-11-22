import { describe, it, expect } from "vitest";
import { measureOrbitViewport } from "@/lib/orbit/viewport";

describe("Orbit visual viewport measurements", () => {
  it("keeps normal layout for focus without a keyboard and browser-bar changes", () => {
    expect(measureOrbitViewport({ baselineHeight: 852, visualHeight: 852 }).keyboardOpen).toBe(false);
    expect(measureOrbitViewport({ baselineHeight: 852, visualHeight: 780 }).keyboardOpen).toBe(false);
  });
  it("uses the visible phone area when a virtual keyboard opens", () => {
    expect(measureOrbitViewport({ baselineHeight: 852, visualHeight: 430 })).toEqual({
      availableHeight: 430, keyboardOpen: true, keyboardOffset: 422,
    });
  });
  it("returns to normal when the keyboard closes even if the input is still focused", () => {
    const open = measureOrbitViewport({ baselineHeight: 852, visualHeight: 430 });
    const closed = measureOrbitViewport({ baselineHeight: 852, visualHeight: 852 });
    expect(open.keyboardOpen).toBe(true);
    expect(closed).toEqual({ availableHeight: 852, keyboardOpen: false, keyboardOffset: 0 });
  });
  it("clears only the shared header on a tablet, without subtracting keyboard height twice", () => {
    expect(measureOrbitViewport({ baselineHeight: 1024, visualHeight: 540, headerHeight: 64 })).toEqual({
      availableHeight: 476, keyboardOpen: true, keyboardOffset: 484,
    });
  });
  it("does not mistake pinch zoom for a keyboard", () => {
    expect(measureOrbitViewport({ baselineHeight: 852, visualHeight: 426, scale: 2 }).keyboardOpen).toBe(false);
  });
  it("does not collapse the interface for a transient invalid viewport measurement", () => {
    expect(measureOrbitViewport({ baselineHeight: 852, visualHeight: 0 }).availableHeight).toBe(852);
    expect(measureOrbitViewport({ baselineHeight: 852, visualHeight: NaN, headerHeight: 64 }).availableHeight).toBe(788);
  });
});

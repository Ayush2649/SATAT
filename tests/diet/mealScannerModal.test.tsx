import { describe, it, expect } from "vitest";
import { resolveDishThumbnail } from "@/lib/diet/dishMatcher";

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


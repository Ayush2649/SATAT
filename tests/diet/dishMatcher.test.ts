import { describe, it, expect } from "vitest";
import { resolveDishThumbnail, formatMealTimeAndCategory } from "@/lib/diet/dishMatcher";

describe("dishMatcher", () => {
  it("uses existingPhotoUrl when provided", () => {
    const customUrl = "https://custom.image/photo.jpg";
    expect(resolveDishThumbnail("Any Name", customUrl)).toBe(customUrl);
  });

  it("matches oats keywords including almond", () => {
    const url = resolveDishThumbnail("Oats with Milk and Almond");
    expect(url).toContain("photo-1517673400267-0251440c45dc");
  });

  it("matches corn keywords distinctly", () => {
    const url = resolveDishThumbnail("1 piece boiled corn");
    expect(url).toContain("photo-1551754655-cd27e38d2076");
  });

  it("matches dal and rice keywords", () => {
    const url = resolveDishThumbnail("Yellow Dal Tadka with Steamed Rice");
    expect(url).toContain("photo-1546833999-b9f581a1996d");
  });

  it("matches dosa and sambar keywords", () => {
    const url = resolveDishThumbnail("Masala Dosa with Sambar");
    expect(url).toContain("photo-1630383249896-424e482df921");
  });

  it("matches chicken and grill keywords", () => {
    const url = resolveDishThumbnail("Grilled Chicken Breast");
    expect(url).toContain("photo-1532550907401-a500c9a57435");
  });

  it("matches paneer keywords with dedicated paneer dish photo", () => {
    const url = resolveDishThumbnail("Paneer Bhurji with 2 Rotis");
    expect(url).toContain("photo-1631452180519-c014fe946bc7");
  });

  it("matches egg and toast keywords", () => {
    const url = resolveDishThumbnail("Scrambled Eggs on Avocado Toast");
    expect(url).toContain("photo-1525351484163-7529414344d8");
  });

  it("matches whey and shake keywords", () => {
    const url = resolveDishThumbnail("Whey Protein Shake with Almond Milk");
    expect(url).toContain("photo-1517673400267-0251440c45dc"); // 'almond' matches first if both present, or check pure whey
    const pureWhey = resolveDishThumbnail("Whey Protein Shake");
    expect(pureWhey).toContain("photo-1553530666-ba11a7da3888");
  });

  it("matches yogurt and dahi keywords", () => {
    const url = resolveDishThumbnail("Bowl of fresh curd");
    expect(url).toContain("photo-1488477181946-6428a0291777");
  });

  it("falls back to wholesome plate for unknown dish", () => {
    const url = resolveDishThumbnail("Mysterious Superfood Blend");
    expect(url).toContain("photo-1546069901-ba9599a7e63c");
  });

  it("formats meal time and category correctly", () => {
    const morningDate = new Date("2026-10-27T08:30:00");
    const morning = formatMealTimeAndCategory(morningDate.getTime());
    expect(morning.timeLabel).toBe("08:30 AM");
    expect(morning.categoryLabel).toBe("BREAKFAST");

    const lunchDate = new Date("2026-10-27T13:15:00");
    const lunch = formatMealTimeAndCategory(lunchDate.getTime());
    expect(lunch.timeLabel).toBe("01:15 PM");
    expect(lunch.categoryLabel).toBe("LUNCH");

    const eveningDate = new Date("2026-10-27T17:45:00");
    const evening = formatMealTimeAndCategory(eveningDate.getTime());
    expect(evening.timeLabel).toBe("05:45 PM");
    expect(evening.categoryLabel).toBe("EVENING FUEL");

    const dinnerDate = new Date("2026-10-27T20:30:00");
    const dinner = formatMealTimeAndCategory(dinnerDate.getTime());
    expect(dinner.timeLabel).toBe("08:30 PM");
    expect(dinner.categoryLabel).toBe("DINNER");
  });
});

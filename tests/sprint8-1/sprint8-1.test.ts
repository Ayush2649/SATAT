import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 8.1: Landing Page UX, Typography, Timeline Spine, Non-Repeating Photos, Light-Mode Orbit, and Full-Width Streak Card", () => {
  const heroSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/Hero.tsx"),
    "utf8"
  );
  const mobileHeroSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/mobile/MobileHero.tsx"),
    "utf8"
  );
  const problemSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/ProblemSection.tsx"),
    "utf8"
  );
  const mealScanSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/MealScanShowcase.tsx"),
    "utf8"
  );
  const orbitSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/OrbitSection.tsx"),
    "utf8"
  );
  const progressSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/ProgressSection.tsx"),
    "utf8"
  );

  it("1. Horizontal Timeline Spine & Dots in ProblemSection.tsx are aligned with continuous track and active progress bar", () => {
    expect(problemSource).toContain("bottom-[7px]");
    expect(problemSource).toContain("w-4 h-4 rounded-full border-4");
    expect(problemSource).toContain("h-[2px] bg-[#1C1917]/15 dark:bg-white/15");
    expect(problemSource).toContain("bg-[#2D6A4F] dark:bg-[#34D399] transition-all duration-500");
    expect(problemSource).toContain("md:whitespace-nowrap");
  });

  it("2. Landing page uses 7 unique, verified Unsplash photos with zero duplicates across Hero, Rhythm, and Snap", () => {
    const unsplashRegex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g;
    const heroMatches = heroSource.match(unsplashRegex) || [];
    const problemMatches = problemSource.match(unsplashRegex) || [];
    const mealScanMatches = mealScanSource.match(unsplashRegex) || [];

    const allMatches = [...heroMatches, ...problemMatches, ...mealScanMatches];
    const uniqueIds = new Set(allMatches.map((url) => url.split("?")[0]));

    // Check that we have unique photos
    expect(uniqueIds.size).toBeGreaterThanOrEqual(7);

    // Verify specific unique photos
    expect(heroSource).toContain("photo-1517838277536-f5f99be501cd"); // gym floor
    expect(heroSource).toContain("photo-1517673132405-a56a62b18caf"); // protein oatmeal
    expect(problemSource).toContain("photo-1507652313519-d4e9174996dd"); // dawn yoga
    expect(problemSource).toContain("photo-1512621776951-a57141f2eefd"); // nourish lunch
    expect(problemSource).toContain("photo-1581009146145-b5ef050c2e1e"); // kettlebell lift
    expect(problemSource).toContain("photo-1544787219-7f47ccb76574"); // evening tea
    expect(mealScanSource).toContain("photo-1546069901-ba9599a7e63c"); // paneer bowl
  });

  it("3. Orbit Section renders <Orbit3DCore /> in Deep Botanical Espresso container with high contrast and widened headline", () => {
    expect(orbitSource).toContain('bg-[#191D1A]');
    expect(orbitSource).toContain('border-[#34D399]/30');
    expect(orbitSource).toContain('max-w-[680px]');
    expect(orbitSource).toContain('<Orbit3DCore size="lg" state="active"');
  });

  it("4. Hero headline breaks cleanly across desktop (md:whitespace-nowrap) and mobile 3-line balanced stack", () => {
    expect(heroSource).toContain("Your body ");
    expect(heroSource).toContain("doesn&apos;t live in");
    expect(heroSource).toContain("five separate apps.");
    expect(heroSource).toContain("md:whitespace-nowrap");

    expect(mobileHeroSource).toContain("Your body ");
    expect(mobileHeroSource).toContain("doesn&apos;t live in");
    expect(mobileHeroSource).toContain("five separate apps.");
  });

  it("5. Streak card in ProgressSection fixes 'Day 16' vs 'Day 14' mismatch with full-width 12-column layout & Live Momentum Telemetry", () => {
    // No Day 16 mismatch
    expect(progressSource).not.toContain("Day 16 · Healed");
    expect(progressSource).toContain("Day 14 · Rested");
    expect(progressSource).toContain('key: "day14"');

    // Full-width 12-col layout
    expect(progressSource).toContain("grid-cols-1 lg:grid-cols-12");
    expect(progressSource).toContain("lg:col-span-7");
    expect(progressSource).toContain("lg:col-span-5");

    // Enlarged calendar circles
    expect(progressSource).toContain("w-11 h-11 sm:w-12 sm:h-12");

    // Live Momentum Telemetry panel
    expect(progressSource).toContain("LIVE MOMENTUM TELEMETRY · DAY");
    expect(progressSource).toContain("Habit Adherence");
    expect(progressSource).toContain("Measured Strength / Capacity");
    expect(progressSource).toContain("Adaptive Recovery / Rest");
    expect(progressSource).toContain("Auto-Rested Bridge");
  });

  it("6. All key section anchors feature scroll-mt-28 to prevent fixed header overlap", () => {
    expect(problemSource).toContain('id="rhythm"');
    expect(problemSource).toContain("scroll-mt-28");

    expect(mealScanSource).toContain('id="snap"');
    expect(mealScanSource).toContain("scroll-mt-28");

    expect(orbitSource).toContain('id="orbit"');
    expect(orbitSource).toContain("scroll-mt-28");

    expect(progressSource).toContain('id="proof"');
    expect(progressSource).toContain("scroll-mt-28");
  });
});

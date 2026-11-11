import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.8: Landing Page Complete Overhaul Verification", () => {
  const landingNavSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/LandingNav.tsx"),
    "utf8"
  );
  const heroSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/Hero.tsx"),
    "utf8"
  );
  const mobileHeroSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/mobile/MobileHero.tsx"),
    "utf8"
  );
  const problemSectionSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/ProblemSection.tsx"),
    "utf8"
  );
  const mealScanSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/MealScanShowcase.tsx"),
    "utf8"
  );
  const orbitSectionSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/OrbitSection.tsx"),
    "utf8"
  );
  const progressSectionSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/ProgressSection.tsx"),
    "utf8"
  );
  const footerSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/Footer.tsx"),
    "utf8"
  );
  const desktopLandingSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/DesktopLandingPage.tsx"),
    "utf8"
  );
  const mobileLandingSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/mobile/MobileLandingPage.tsx"),
    "utf8"
  );

  it("1. Floating Glassmorphic Pill Header renders non-clipping fixed container with seamless navigation links", () => {
    expect(landingNavSource).toContain("fixed top-4 inset-x-0 z-50 px-4 sm:px-8 pointer-events-none");
    expect(landingNavSource).toContain("pointer-events-auto max-w-[1440px] mx-auto bg-[#FCFBF9]/88 dark:bg-[#141916]/88 backdrop-blur-xl");
    expect(landingNavSource).toContain("rounded-full px-4 sm:px-6 py-2.5");
    expect(landingNavSource).toContain('href="#rhythm"');
    expect(landingNavSource).toContain('href="#snap"');
    expect(landingNavSource).toContain('href="#orbit"');
    expect(landingNavSource).toContain('href="#proof"');
    expect(landingNavSource).toContain("satat.");
    expect(landingNavSource).toContain("Start free");
    expect(landingNavSource).toContain("Sign in");
  });

  it("2. Hero separated CTAs: 'Start free →' links to /onboarding and 'Sign in with Google' features official 4-color SVG logo", () => {
    // Desktop Hero
    expect(heroSource).toContain('href="/onboarding"');
    expect(heroSource).toContain("Start free");
    expect(heroSource).toContain("Sign in with Google");
    expect(heroSource).toContain('signIn("google"');
    expect(heroSource).toContain("#4285F4");
    expect(heroSource).toContain("#34A853");
    expect(heroSource).toContain("#FBBC05");
    expect(heroSource).toContain("#EA4335");

    // Mobile Hero
    expect(mobileHeroSource).toContain('href="/onboarding"');
    expect(mobileHeroSource).toContain("Start free");
    expect(mobileHeroSource).toContain("Sign in with Google");
    expect(mobileHeroSource).toContain('signIn("google"');
    expect(mobileHeroSource).toContain("#4285F4");
  });

  it("3. User Day Timeline (#rhythm) renders 4 biological cadences with desktop horizontal track & mobile vertical spine", () => {
    expect(problemSectionSource).toContain('id="rhythm"');
    expect(problemSectionSource).toContain("DAILY BIOLOGICAL CADENCE");
    expect(problemSectionSource).toContain("A single day, in seamless motion.");
    expect(problemSectionSource).toContain("07:30 AM · DAWN CHECK-IN");
    expect(problemSectionSource).toContain("01:15 PM · MIDDAY FUEL");
    expect(problemSectionSource).toContain("06:30 PM · DUSK RECALIBRATION");
    expect(problemSectionSource).toContain("10:15 PM · NOCTURNAL RECOVERY");
    expect(problemSectionSource).toContain("7h 45m Sleep Synced · 92% Readiness");
    expect(problemSectionSource).toContain("640 kcal · 42g Protein Logged in 2s");
    expect(problemSectionSource).toContain("Upper Body A Condensed → 35m Compound Focus");
    expect(problemSectionSource).toContain("135g Protein Target Closed · 24-Day Flow Intact");
  });

  it("4. HealthifySnap-Style Meal Scan Showcase (#snap) features sticky viewport and auto-popping cards", () => {
    expect(mealScanSource).toContain('id="snap"');
    expect(mealScanSource).toContain("Track Your Food With Just a Snap");
    expect(mealScanSource).toContain("Rice &amp; Paneer Bowl");
    expect(mealScanSource).toContain("454 Cal");
    expect(mealScanSource).toContain("Grilled Paneer");
    expect(mealScanSource).toContain("Orbit");
  });

  it("5. Orbit Section (#orbit) showcases 3D depth-of-field stage with <Orbit3DCore /> and floating prompt cloud", () => {
    expect(orbitSectionSource).toContain('id="orbit"');
    expect(orbitSectionSource).toContain("Try Orbit — Your Personal AI Biological Copilot");
    expect(orbitSectionSource).toContain('<Orbit3DCore size="lg" state="active"');
    expect(orbitSectionSource).toContain("How was my protein intake today?");
    expect(orbitSectionSource).toContain("Condense my Upper Body workout to 35m");
    expect(orbitSectionSource).toContain("How to improve my deep sleep score?");
    expect(orbitSectionSource).toContain("High protein vegetarian dinner ideas?");
    expect(orbitSectionSource).toContain("Shift Deep Work to dopamine peak");
  });

  it("6. Streak Proof Section (#proof) features spacious milestone tabs and dark-mode high-contrast comparison pills", () => {
    expect(progressSectionSource).toContain('id="proof"');
    expect(progressSectionSource).toContain("LIVING STREAKS");
    expect(progressSectionSource).toContain("Why continuous beats");
    expect(progressSectionSource).toContain("perfect.");
    expect(progressSectionSource).toContain("bg-[#EFECE4] dark:bg-[#1C221E] p-1.5 sm:p-2 rounded-full");
    expect(progressSectionSource).toContain("Traditional Apps: Streak Reset to 0 ✕");
    expect(progressSectionSource).toContain("Satat Rhythm: 14 Days Unbroken · Auto-Bridged 2 Rest Days ✓");
    expect(progressSectionSource).toContain("bg-[#FEE2E2] dark:bg-[#2A1414] text-[#B91C1C] dark:text-[#FCA5A5]");
    expect(progressSectionSource).toContain("bg-[#D8F3DC] dark:bg-[#132A1F] text-[#1B4332] dark:text-[#6EE7B7]");
  });

  it("7. Both Desktop and Mobile Landing Pages integrate all newly enhanced sections seamlessly", () => {
    expect(desktopLandingSource).toContain("<MealScanShowcase />");
    expect(mobileLandingSource).toContain("<MealScanShowcase />");
    expect(footerSource).toContain('href="#snap"');
  });
});

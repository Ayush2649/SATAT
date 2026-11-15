import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 8.2: Fix Start Free CTA Redirect Loop, Orbit 3D Aura Stage, Snap Desktop Right Anchor, and Exact Photo Alignment", () => {
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
  const heroSceneSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/HeroProductScene.tsx"),
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
  const finalCtaSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/FinalCTA.tsx"),
    "utf8"
  );
  const footerSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/Footer.tsx"),
    "utf8"
  );
  const hookSource = fs.readFileSync(
    path.resolve(__dirname, "../../hooks/useLandingAuth.ts"),
    "utf8"
  );

  it("1. Unified handleStartOrSignIn hook directly invokes Google OAuth for unauthenticated users, avoiding black-screen redirect loops", () => {
    expect(hookSource).toContain("useLandingAuth");
    expect(hookSource).toContain("handleStartOrSignIn");
    expect(hookSource).toContain('signIn("google"');

    // Wired into LandingNav
    expect(landingNavSource).toContain("useLandingAuth");
    expect(landingNavSource).toContain("handleStartOrSignIn");

    // Wired into Hero & MobileHero
    expect(heroSource).toContain("useLandingAuth");
    expect(heroSource).toContain("handleStartOrSignIn");
    expect(mobileHeroSource).toContain("useLandingAuth");
    expect(mobileHeroSource).toContain("handleStartOrSignIn");

    // Wired into MealScanShowcase
    expect(mealScanSource).toContain("useLandingAuth");
    expect(mealScanSource).toContain("handleStartOrSignIn");

    // Wired into OrbitSection
    expect(orbitSource).toContain("useLandingAuth");
    expect(orbitSource).toContain("handleStartOrSignIn");

    // Wired into FinalCTA & Footer
    expect(finalCtaSource).toContain("useLandingAuth");
    expect(finalCtaSource).toContain("handleStartOrSignIn");
    expect(footerSource).toContain("useLandingAuth");
    expect(footerSource).toContain("handleStartOrSignIn");
  });

  it("2. Orbit 3D Core rendered in spacious, unclipped circular radial aura and #orbit section prevents #snap phone bleeding", () => {
    // Unclipped circular radial aura
    expect(orbitSource).toContain("w-44 h-44 sm:w-52 sm:h-52");
    expect(orbitSource).toContain("overflow-visible");
    expect(orbitSource).toContain("before:rounded-full");
    expect(orbitSource).toContain("rgba(25,29,26,0.92)");
    expect(orbitSource).toContain('<Orbit3DCore size="lg" state="active"');

    // Opaque and elevated z-index on #orbit prevents bleed-through
    expect(orbitSource).toContain("relative z-20");
    expect(orbitSource).toContain("bg-[#F6F3EC] dark:bg-[#0A0D0B]");
    expect(orbitSource).toContain("mt-12");

    // #snap stage has overflow-hidden
    expect(mealScanSource).toContain("overflow-hidden");
  });

  it("3. #snap stage uses 12-column full-width grid and pushes phone mockup cleanly to the right on desktop", () => {
    expect(mealScanSource).toContain("max-w-[1440px]");
    expect(mealScanSource).toContain("grid grid-cols-1 lg:grid-cols-12");
    expect(mealScanSource).toContain("lg:col-span-6 text-left");
    expect(mealScanSource).toContain("lg:col-span-6 flex flex-col items-center lg:items-end justify-center lg:pr-8 xl:pr-14");
    expect(mealScanSource).toContain("Try Snap with a Photo");
  });

  it("4. All landing page imagery matches text 1:1 with exact verified food and fitness photography", () => {
    // Oatmeal & Whey matches real oatmeal photo
    expect(heroSource).toContain("photo-1511690743698-d9d85f2fbf38");
    expect(heroSceneSource).toContain("photo-1511690743698-d9d85f2fbf38");

    // 07:30 AM Dawn Check-in matches morning runner
    expect(problemSource).toContain("photo-1476480862126-209bfaa8edc8");

    // 01:15 PM Midday Fuel matches healthy lunch bowl
    expect(problemSource).toContain("photo-1512621776951-a57141f2eefd");

    // 06:30 PM Dusk Recalibration matches hypertrophy session
    expect(problemSource).toContain("photo-1581009146145-b5ef050c2e1e");

    // 10:15 PM Nocturnal Recovery matches Greek yogurt & berries
    expect(problemSource).toContain("photo-1488477181946-6428a0291777");
  });
});

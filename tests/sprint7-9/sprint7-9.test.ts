import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.9: SATAT Geometric Logo Mark, HealthifySnap Sticky Scroll & Orbit 3D Stage Verification", () => {
  const landingNavSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/LandingNav.tsx"),
    "utf8"
  );
  const footerSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/landing/Footer.tsx"),
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

  it("1. Navbar & Footer render the exact SATAT Geometric S Logo component without plain text 'S' circle", () => {
    // LandingNav uses Logo from @/components/Logo
    expect(landingNavSource).toContain('import Logo from "@/components/Logo"');
    expect(landingNavSource).toContain("<Logo size={24}");
    expect(landingNavSource).not.toContain(">S</div>");

    // Footer uses Logo from @/components/Logo
    expect(footerSource).toContain('import Logo from "@/components/Logo"');
    expect(footerSource).toContain("<Logo size={18}");
  });

  it("2. HealthifySnap #snap section uses a sticky 280vh track and passive scroll progress listener", () => {
    expect(mealScanSource).toContain('id="snap"');
    expect(mealScanSource).toContain("relative h-[280vh] w-full");
    expect(mealScanSource).toContain("sticky top-0 h-screen w-full max-w-[1360px] mx-auto");
    expect(mealScanSource).toContain('window.addEventListener("scroll", handleScroll');
    expect(mealScanSource).toContain("progress < 0.33 ? 0 : progress < 0.67 ? 1 : 2");
  });

  it("3. Left column is ultra-clean with zero manual step buttons, matching HealthifySnap", () => {
    expect(mealScanSource).toContain("SatatSnap");
    expect(mealScanSource).toContain("Track Your Food With Just a Snap");
    expect(mealScanSource).toContain(
      "Snap your meal for instant nutritional details and smart, AI-driven cadence advice from Orbit."
    );
    expect(mealScanSource).toContain("Try Snap with a Photo");

    // Zero manual step buttons
    expect(mealScanSource).not.toContain("1. Snap Plate");
    expect(mealScanSource).not.toContain("2. Instant Macros");
    expect(mealScanSource).not.toContain("3. Orbit Action");
  });

  it("4. Right column features iPhone mockup, 2 scroll-driven auto-popping cards, and cross-fading caption", () => {
    // Phone Mockup & Photo
    expect(mealScanSource).toContain("w-[270px] sm:w-[300px] h-[480px] sm:h-[530px]");
    expect(mealScanSource).toContain("photo-1546069901-ba9599a7e63c");
    expect(mealScanSource).toContain("VIDEO");
    expect(mealScanSource).toContain("PHOTO");
    expect(mealScanSource).toContain("PORTRAIT");
    expect(mealScanSource).toContain("PANO");

    // Card 1 — Nutrition Breakdown
    expect(mealScanSource).toContain("Rice &amp; Paneer Bowl");
    expect(mealScanSource).toContain("454 Cal");
    expect(mealScanSource).toContain("Grilled Paneer");
    expect(mealScanSource).toContain("1 katori · 242 Cal");
    expect(mealScanSource).toContain("Steamed Basmati Rice");
    expect(mealScanSource).toContain("0.5 cup · 159 Cal");
    expect(mealScanSource).toContain("Broccoli &amp; Greens");
    expect(mealScanSource).toContain("0.5 cup · 53 Cal");
    expect(mealScanSource).toContain("bottom-[175px]");

    // Card 2 — Orbit Actionable Insight
    expect(mealScanSource).toContain("✦ Orbit");
    expect(mealScanSource).toContain(
      "This meal offers 38g of clean protein. However, white rice can spike afternoon glucose—take a 12-min walk before your 3 PM Deep Work block."
    );
    expect(mealScanSource).toContain("bottom-3");

    // Dynamic 3-stage caption line
    expect(mealScanSource).toContain("Snap a photo of your meal.");
    expect(mealScanSource).toContain("SATAT identifies all the foods in your photo & tracks it for you.");
    expect(mealScanSource).toContain("Orbit AI gives you instant actionable insights to help you improve.");
  });

  it("5. Orbit section (#orbit) renders 3D Depth-of-Field stage with focal stack and 8 non-wrapping floating prompt cards", () => {
    expect(orbitSectionSource).toContain('id="orbit"');
    expect(orbitSectionSource).toContain('size="lg" state="active"');
    expect(orbitSectionSource).toContain("Try Orbit — Your Personal AI Biological Copilot");
    expect(orbitSectionSource).toContain(
      "Cross-synthesizing training strain, nutrition gaps, and focus blocks in real time."
    );
    expect(orbitSectionSource).toContain("Talk to Orbit AI");

    // 4 Crisp Foreground Cards
    expect(orbitSectionSource).toContain("How was my protein intake today?");
    expect(orbitSectionSource).toContain("How to improve my deep sleep score?");
    expect(orbitSectionSource).toContain("High protein vegetarian dinner ideas?");
    expect(orbitSectionSource).toContain("Condense my Upper Body workout to 35m");
    expect(orbitSectionSource).toContain("satatFloatSlow");

    // 4 Softly Blurred Background Cards
    expect(orbitSectionSource).toContain("Workout recovery readiness");
    expect(orbitSectionSource).toContain("How to hit 135g protein cleanly?");
    expect(orbitSectionSource).toContain("Shift Deep Work to dopamine peak");
    expect(orbitSectionSource).toContain("Analyze my 7-day strength trend");
    expect(orbitSectionSource).toContain("blur-[1.5px] opacity-45 scale-90");
    expect(orbitSectionSource).toContain("satatFloatDelayed");

    // Non-wrapping card formatting
    expect(orbitSectionSource).toContain("whitespace-nowrap");
  });
});

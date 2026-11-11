import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProductionLandingPage from "@/app/page";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signIn: vi.fn(),
}));

describe("Stitch Editorial Landing Page with Header, Footer & Continuous Proof", () => {
  it("renders all canonical sections seamlessly on warm sunlit stone canvas", () => {
    const html = renderToStaticMarkup(React.createElement(ProductionLandingPage));

    // Section 1: Floating Glassmorphic Pill Header (LandingNav)
    expect(html).toContain("satat.");
    expect(html).toContain("Sign in");
    expect(html).toContain("Start free");
    expect(html).toContain("Timeline");
    expect(html).toContain("AI Snap");
    expect(html).toContain("Orbit");
    expect(html).toContain("Proof");

    // Section 2: Hero (Separated Start free & Google OAuth button)
    expect(html).toContain("A GENTLER WAY TO STAY CONTINUOUS");
    expect(html).toContain("Your body doesn&#x27;t live in");
    expect(html).toContain("five separate apps.");
    expect(html).toContain("Workouts, meals, and daily plans that quietly adjust to real life.");
    expect(html).toContain("Sign in with Google");
    expect(html).toContain("Upper Body");
    expect(html).toContain("moved to 6PM · Sleep was light");
    expect(html).toContain("Upper body dumbbell strength training session");
    expect(html).toContain("Warm protein oatmeal bowl");
    expect(html).toContain("Oatmeal &amp; Whey");
    expect(html).toContain("420 kcal · 34g Protein");

    // Section 3: Interactive User Day Timeline (#rhythm)
    expect(html).toContain("DAILY BIOLOGICAL CADENCE");
    expect(html).toContain("A single day, in seamless motion.");
    expect(html).toContain("07:30 AM · DAWN CHECK-IN");
    expect(html).toContain("Morning Readiness &amp; Plan Sync");
    expect(html).toContain("7h 45m Sleep Synced · 92% Readiness");
    expect(html).toContain("01:15 PM · MIDDAY FUEL");
    expect(html).toContain("Zero-Anxiety Plate Recognition");
    expect(html).toContain("640 kcal · 42g Protein Logged in 2s");
    expect(html).toContain("06:30 PM · DUSK RECALIBRATION");
    expect(html).toContain("Adaptive Hypertrophy Session");
    expect(html).toContain("Upper Body A Condensed → 35m Compound Focus");
    expect(html).toContain("10:15 PM · NOCTURNAL RECOVERY");
    expect(html).toContain("Protein Window &amp; Cortisol Downshift");
    expect(html).toContain("135g Protein Target Closed · 24-Day Flow Intact");

    // Section 4: HealthifySnap-Style Meal Scan Showcase (#snap)
    expect(html).toContain("SATAT AI VISION · ZERO BARCODE ANXIETY");
    expect(html).toContain("Track your food with just a snap.");
    expect(html).toContain("High-Protein Rice &amp; Paneer Bowl");
    expect(html).toContain("640 kcal");
    expect(html).toContain("Grilled Paneer (150g)");
    expect(html).toContain("✦ Orbit Cadence Insight");

    // Section 5: Orbit Section (Orbit3DCore + Floating Prompt Cloud)
    expect(html).toContain("QUIET GUIDANCE");
    expect(html).toContain("A companion,");
    expect(html).toContain("not a dashboard");
    expect(html).toContain("orbit-3d-");
    expect(html).toContain("How was my protein intake today?");
    expect(html).toContain("Condense my Upper Body lift to 35m");
    expect(html).toContain("How do I improve my deep sleep score?");
    expect(html).toContain("Suggest a 40g protein vegetarian dinner");
    expect(html).toContain("Why is my training readiness 92%?");
    expect(html).toContain("Shift Deep Work to my dopamine peak");
    expect(html).toContain("Accept adjustment ✓");
    expect(html).toContain("Keep dinner as is");

    // Section 6: Continuous Proof (28-Day Organic Rhythm Matrix)
    expect(html).toContain("LIVING STREAKS");
    expect(html).toContain("Why continuous beats");
    expect(html).toContain("perfect.");
    expect(html).toContain("Other apps punish you with a broken streak when real life happens. Satat bends with your week so your momentum compounds.");
    expect(html).toContain("Day 7 · Start");
    expect(html).toContain("Day 16 · Healed");
    expect(html).toContain("Day 28 · Flow");
    expect(html).toContain("Traditional Apps: Streak Reset to 0 ✕");
    expect(html).toContain("Satat Rhythm: 14 Days Unbroken · Auto-Bridged 2 Rest Days ✓");

    // Section 7: Final CTA in dark botanical card
    expect(html).toContain("START YOUR PRACTICE");
    expect(html).toContain("Build a body and routine you can");
    expect(html).toContain("actually keep.");
    expect(html).toContain("text-[#6EE7B7]");
    expect(html).toContain("Begin in 60 seconds");

    // Section 8: Grounded Footer
    expect(html).toContain("Timeline");
    expect(html).toContain("AI Snap");
    expect(html).toContain("Orbit");
    expect(html).toContain("Proof");
    expect(html).toContain("Rooted in सतत् (Satat) — the Sanskrit principle of continuous, unbroken flow.");
  });

  it("confirms removed legacy SaaS sections and fake testimonials are NOT present", () => {
    const html = renderToStaticMarkup(React.createElement(ProductionLandingPage));

    // Confirm removed legacy sections are NOT present in app/page.tsx
    expect(html).not.toContain("THE FRAGMENTATION TRAP");
    expect(html).not.toContain("THE UNBROKEN THREAD");
    expect(html).not.toContain("DYNAMIC REBALANCING");
    expect(html).not.toContain("Rolling 28-Day Adherence");

    // Confirm fake testimonials are NOT present
    expect(html).not.toContain("Priya M.");
    expect(html).not.toContain("Rahul K.");
    expect(html).not.toContain("Ananya S.");
  });
});

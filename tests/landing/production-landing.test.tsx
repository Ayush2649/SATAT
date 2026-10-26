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

    // Section 1: Floating Editorial Header (LandingNav)
    expect(html).toContain("satat.");
    expect(html).toContain("Sign in");
    expect(html).toContain("Start free");

    // Section 2: Hero (Single line fit on mobile, Stitch semi-circle arch collage)
    expect(html).toContain("A GENTLER WAY TO STAY CONTINUOUS");
    expect(html).toContain("whitespace-nowrap");
    expect(html).toContain("Your body doesn&#x27;t live in");
    expect(html).toContain("five separate apps.");
    expect(html).toContain("Workouts, meals, and daily plans that quietly adjust to real life.");
    expect(html).toContain("Upper Body");
    expect(html).toContain("moved to 6PM · Sleep was light");
    expect(html).toContain("Upper body dumbbell strength training session");
    expect(html).toContain("Warm protein oatmeal bowl");
    expect(html).toContain("rounded-l-[92px]");
    expect(html).toContain("Oatmeal &amp; Whey");
    expect(html).toContain("420 kcal · 34g P");

    // Section 3: Problem (Rhythmic Cadence, Inter-Node Animated Beam & Live Signals)
    expect(html).toContain("RHYTHMIC CADENCE");
    expect(html).toContain("A single day, in seamless motion");
    expect(html).toContain("animate-timeline-beam");
    expect(html).toContain("animate-ping opacity-20");
    expect(html).toContain("ring-[3px] ring-[#F6F3EC]");
    expect(html).toContain("🌅 DAWN · 7:30 AM");
    expect(html).toContain("Morning check-in");
    expect(html).toContain("7h 45m sleep synced → Training readiness 92%");
    expect(html).toContain("🍴 MIDDAY · 1:15 PM");
    expect(html).toContain("Mindful nourishment");
    expect(html).toContain("Plate photo scanned → 540 kcal · 34g protein logged in 2s");
    expect(html).toContain("✨ DUSK · 6:30 PM");
    expect(html).toContain("Adaptive recalibration");
    expect(html).toContain("Upper Body A merged into Thursday → 24-day flow preserved");

    // Section 4: Orbit Section (Quiet Guidance, borderless living orb centerpiece)
    expect(html).toContain("QUIET GUIDANCE");
    expect(html).toContain("A companion, not a dashboard");
    expect(html).toContain("orbit-living-orb");
    expect(html).toContain("You trained heavier than usual today.");
    expect(html).toContain("added a bowl of Greek yogurt to tonight");
    expect(html).toContain("so you recover well");
    expect(html).toContain("Accept adjustment ✓");
    expect(html).toContain("Keep dinner as is");

    // Section 5: Continuous Proof (28-Day Organic Rhythm Matrix)
    expect(html).toContain("LIVING EVIDENCE · सतत्");
    expect(html).toContain("Why continuous beats");
    expect(html).toContain("perfect.");
    expect(html).toContain("Other apps punish you with a broken streak when real life happens. Satat bends with your week so your momentum compounds.");
    expect(html).toContain("Day 7 · Start");
    expect(html).toContain("Day 16 · Healed");
    expect(html).toContain("Day 28 · Flow");
    expect(html).toContain("Traditional Apps: Streak Reset to 0 ✕");
    expect(html).toContain("Satat Rhythm: 28 Days Unbroken · +12.4% Strength ✓");

    // Section 6: Final CTA in dark botanical card
    expect(html).toContain("START YOUR PRACTICE");
    expect(html).toContain("Build a body and routine you can");
    expect(html).toContain("actually keep.");
    expect(html).toContain("text-[#6EE7B7]");
    expect(html).toContain("Begin in 60 seconds");

    // Section 7: Grounded Footer
    expect(html).toContain("Rhythm");
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

    // Confirm internal developer links are NOT present
    expect(html).not.toContain("Design System Sandbox");
    expect(html).not.toContain("href=\"/design-system\"");
    expect(html).not.toContain("href=\"/design-preview\"");
    expect(html).not.toContain("href=\"/architecture\"");
  });

  it("verifies borderless editorial layout, physical collage geometry, and card styling", () => {
    const html = renderToStaticMarkup(React.createElement(ProductionLandingPage));

    // Warm Sunlit Stone canvas background
    expect(html).toContain("bg-[#F6F3EC]");

    // Physical collage styling (Stitch semi-circle arch layer)
    expect(html).toContain("-rotate-2");
    expect(html).toContain("rounded-l-[92px]");

    // Final CTA dark botanical card styling
    expect(html).toContain("bg-[#191D1A]");
    expect(html).toContain("rounded-[32px]");
  });
});

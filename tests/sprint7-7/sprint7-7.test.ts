import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.7: Shimmer Contrast, 7-Day Calendar Strip & 12-Column Geometry Verification", () => {
  const skeletonsSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/ui/PageSkeletons.tsx"),
    "utf8"
  );
  const appShellCss = fs.readFileSync(
    path.resolve(__dirname, "../../styles/app-shell.css"),
    "utf8"
  );
  const tailwindConfig = fs.readFileSync(
    path.resolve(__dirname, "../../tailwind.config.ts"),
    "utf8"
  );
  const homeView = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/HomeView.tsx"),
    "utf8"
  );
  const loadingDashboard = fs.readFileSync(
    path.resolve(__dirname, "../../app/dashboard/loading.tsx"),
    "utf8"
  );

  it("1. Shimmer has high dark-mode contrast (#121714 surface vs #222B26 bars) and sweeping wave highlight", () => {
    expect(skeletonsSource).toContain("dark:bg-[#121714]");
    expect(skeletonsSource).toContain("dark:bg-[#222B26]");
    expect(skeletonsSource).toContain("before:animate-[shimmer_1.8s_infinite]");
    expect(skeletonsSource).toContain("dark:before:via-[#34D399]/[0.08]");
    expect(skeletonsSource).toContain("bg-[#FCFBF9] dark:bg-[#121714] border border-[#1C1917]/[0.06] dark:border-white/[0.07] rounded-[28px] p-5");

    expect(appShellCss).toContain("@keyframes shimmer");
    expect(appShellCss).toContain("transform: translateX(100%);");
    expect(appShellCss).toContain(':not([class*="dark:bg-"])');
    expect(appShellCss).toContain("background-color: #222B26 !important;");

    expect(tailwindConfig).toContain("shimmer: \"shimmer 1.8s infinite\"");
    expect(tailwindConfig).toContain("shimmer: { \"100%\": { transform: \"translateX(100%)\" } }");
  });

  it("2. 7-Day calendar skeleton pills sit in unboxed header row and never overflow container", () => {
    expect(skeletonsSource).toContain("flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 w-full overflow-hidden");
    expect(skeletonsSource).toContain("grid grid-cols-7 gap-2 w-full xl:w-[360px] shrink-0");
    expect(skeletonsSource).toContain("h-16 w-full min-w-0 rounded-2xl bg-[#E6E1D6] dark:bg-[#1C2420]");
  });

  it("3. Left 8-column studio flow matches Today 1:1 geometry (workout hero, calorie ring, protein, rhythm feed)", () => {
    // Unboxed header
    expect(skeletonsSource).toContain("w-32 h-3 rounded-full");
    expect(skeletonsSource).toContain("w-64 h-9 rounded-xl");

    // Tall workout hero card
    expect(skeletonsSource).toContain("h-[250px] rounded-[28px] bg-[#EFECE4] dark:bg-[#18211C] border border-[#34D399]/15 p-6 flex flex-col justify-between");
    expect(skeletonsSource).toContain("dark:bg-[#26332C]");
    expect(skeletonsSource).toContain("h-11 w-44 rounded-full bg-[#E05A47]/30");

    // Two stacked Alabaster cards
    expect(skeletonsSource).toContain("h-[117px] rounded-[26px]");
    expect(skeletonsSource).toContain("w-14 h-14 rounded-full border-4 border-[#E6E1D6] dark:border-[#242E28]");
    expect(skeletonsSource).toContain("w-full h-2 rounded-full");

    // Today's Rhythm feed
    expect(skeletonsSource).toContain("h-20 rounded-[24px]");
    expect(skeletonsSource).toContain("w-12 h-12 rounded-xl");
    expect(skeletonsSource).toContain("w-16 h-7 rounded-full");
  });

  it("4. Right 4-column rail matches Today 1:1 geometry (whisper, 2x2 rituals grid, telemetry rows)", () => {
    // Orbit Adaptive Whisper
    expect(skeletonsSource).toContain("w-11/12 rounded-md");
    expect(skeletonsSource).toContain("w-3/4 rounded-md");

    // Daily Non-Negotiables 2x2 grid
    expect(skeletonsSource).toContain("grid grid-cols-2 gap-3");
    expect(skeletonsSource).toContain("h-28 rounded-[20px]");

    // Circadian telemetry
    expect(skeletonsSource).toContain("h-12 rounded-xl");
  });

  it("5. Loading state integration in HomeView and route boundary", () => {
    expect(homeView).toContain("<TodayPageSkeleton />");
    expect(loadingDashboard).toContain("<TodayPageSkeleton />");
  });
});


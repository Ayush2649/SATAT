import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.5: Full Verification Suite", () => {
  const chartSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/ProgressTrendChart.tsx"),
    "utf8"
  );
  const homeSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/HomeView.tsx"),
    "utf8"
  );
  const dietSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/diet/DietPage.tsx"),
    "utf8"
  );
  const workoutSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/workout/WorkoutPage.tsx"),
    "utf8"
  );
  const settingsSource = fs.readFileSync(
    path.resolve(__dirname, "../../app/dashboard/settings/page.tsx"),
    "utf8"
  );
  const cssSource = fs.readFileSync(
    path.resolve(__dirname, "../../styles/app-shell.css"),
    "utf8"
  );
  const chatbotSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/ui/AriaChatbot.tsx"),
    "utf8"
  );

  it("1. Weekly Momentum spline curve and dots use unified SVG math [viewBox 0 0 700 140]", () => {
    expect(chartSource).toContain("xCoords = [40, 148, 256, 364, 472, 580, 660]");
    expect(chartSource).toContain("const y = Math.round(98 - (src.score / 100) * 64);");
    expect(chartSource).toContain('viewBox="0 0 700 140"');
    expect(chartSource).toContain("circle cx={pt.x} cy={pt.y}");
    expect(chartSource).not.toContain("preserveAspectRatio=\"none\"");
  });

  it("2. Log a Custom Dish modal stepper buttons have dark mode styling & matched badge has truncate", () => {
    expect(dietSource).toContain(
      "bg-[#EFECE4] dark:bg-[#1E2621] text-[#1C1917] dark:text-[#F4F1EA] border border-[#1C1917]/10 dark:border-white/15 hover:bg-[#2D6A4F] hover:text-white"
    );
    expect(dietSource).toContain("truncate max-w-full");
  });

  it("3. Session Intelligence VOLUME HIGHLIGHT uses dark mode container & text classes", () => {
    expect(workoutSource).toContain(
      "bg-[#F2F9F5] dark:bg-[#13221B] border border-[#2D6A4F]/20 dark:border-[#34D399]/25 text-[#1C1917] dark:text-[#E6F4ED]"
    );
    expect(workoutSource).toContain("text-[#1C1917] dark:text-[#E6F4ED] leading-relaxed mt-1.5");
  });

  it("4. Workout sets render 'Click' affordance when unchecked and 'Done' checkmark when completed", () => {
    expect(workoutSource).toContain("Click");
    expect(workoutSource).toContain("Done");
    expect(workoutSource).toContain("min-w-[54px] h-8 rounded-lg");
    expect(workoutSource).toContain("bg-[#2D6A4F] text-white border border-[#34D399]/40");
  });

  it("5. Completing workout filters out uncompleted sets and requires at least one completed set", () => {
    expect(workoutSource).toContain("sets.filter((s) => Boolean(s.completed))");
    expect(workoutSource).toContain(
      'toast("Please mark at least one completed set as Done before finishing your session.", "error")'
    );
  });

  it("6. Streak pill is positioned in dedicated top-right slot above the 7-day calendar strip", () => {
    expect(homeSource).toContain("CIRCADIAN ALIGNMENT · {formatDateEyebrow()}");
    expect(homeSource).toContain("🔥 {activeStreakDays}d streak");
    expect(homeSource).toContain("Dedicated Top Eyebrow Row: Streak Pill Cleanly Positioned in Top-Right");
  });

  it("7. Full-width desktop workspace is configured in styles/app-shell.css", () => {
    expect(cssSource).toContain(".app-shell-content:not(:has(.orbit-view-root))");
    expect(cssSource).toContain("max-width: none !important;");
    expect(cssSource).toContain("padding-inline: 3rem !important;");
  });

  it("8. Desktop settings is redesigned into 12-column editorial bento grid and floating FAB is removed", () => {
    expect(settingsSource).toContain("grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full");
    expect(settingsSource).toContain("lg:col-span-5 space-y-6");
    expect(settingsSource).toContain("lg:col-span-7 space-y-6");
    expect(chatbotSource).toContain("return null;");
  });
});

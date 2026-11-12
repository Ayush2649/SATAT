import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 8.3: Honest Telemetry, Zero-States & Cognitive Declutter Verification", () => {
  const homeSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/HomeView.tsx"),
    "utf8"
  );

  it("1. Eradicates all hardcoded fallback telemetry numbers (1820, 124, 180, 55)", () => {
    // Assert removal of mock defaults for logged numbers
    expect(homeSource).not.toContain("1820");
    expect(homeSource).not.toContain("1,820");
    expect(homeSource).not.toContain("124");
    expect(homeSource).not.toContain("totals.c || 180");
    expect(homeSource).not.toContain("totals.f || 55");

    // Assert truthful computation
    expect(homeSource).toContain("loggedCalories = Math.round(totals.cal)");
    expect(homeSource).toContain("loggedProtein = Math.round(totals.p)");
    expect(homeSource).toContain("loggedCarbs = Math.round(totals.c)");
    expect(homeSource).toContain("loggedFat = Math.round(totals.f)");
  });

  it("2. Eradicates phantom static items (Oatmeal & Berries, LeetCode DSA Video) from rhythm timeline", () => {
    expect(homeSource).not.toContain("Oatmeal & Berries");
    expect(homeSource).not.toContain("Record LeetCode DSA Video");
  });

  it("3. Eradicates static unverified CIRCADIAN TELEMETRY biosensor card", () => {
    expect(homeSource).not.toContain("CIRCADIAN TELEMETRY\n");
    expect(homeSource).not.toContain("68 ms · High Parasympathetic");
    expect(homeSource).not.toContain("7h 42m · 88% Recovery Score");
    expect(homeSource).not.toContain("10:00 AM – 01:30 PM");
  });

  it("4. Implements honest zero-states for Calorie Ring and Protein Synthesis cards", () => {
    // Calorie zero state
    expect(homeSource).toContain("+ Log first meal →");
    expect(homeSource).toContain("remainingCalories.toLocaleString()} kcal left");
    expect(homeSource).toContain('href="/dashboard/diet"');

    // Protein zero state
    expect(homeSource).toContain('"Log a meal to track protein"');
    expect(homeSource).toContain('"✓ Daily protein target hit!"');
    expect(homeSource).toContain("${proteinRemaining}g away from goal");
  });

  it("5. Implements dynamic Mindful Whisper covering fresh slate, partial intake, target hit, and workout first", () => {
    expect(homeSource).toContain("Fresh slate today. Fuel your body with high-protein nutrition");
    expect(homeSource).toContain("Great session in the books! Prioritize a high-protein post-workout meal");
    expect(homeSource).toContain("Target reached — excellent fueling today with");
    expect(homeSource).toContain("proteinRemaining}g to reach your");
  });

  it("6. Implements Empty Day Kickoff Card with 3 actionable quick links when zero activities exist", () => {
    expect(homeSource).toContain("No activities logged yet for this day");
    expect(homeSource).toContain(
      "Set the tone for your day by logging a meal, starting your workout, or scheduling a priority focus block."
    );
    expect(homeSource).toContain("+ Log First Meal");
    expect(homeSource).toContain("+ Start Workout");
    expect(homeSource).toContain("+ Add Focus Task");
    expect(homeSource).toContain('href="/dashboard/diet"');
    expect(homeSource).toContain('href="/dashboard/workout"');
    expect(homeSource).toContain('href="/dashboard/tasks"');
  });

  it("7. Enables reactive date switching across 7-day week strip and collapsible mobile charts", () => {
    expect(homeSource).toContain("selectedDate, setSelectedDate");
    expect(homeSource).toContain("showMobileTrends, setShowMobileTrends");
    expect(homeSource).toContain("Show Weekly Momentum & Streak Calendar ⌄");
    expect(homeSource).toContain("Hide Weekly Momentum & Streak Calendar ⌃");
  });

  it("8. Preserves all critical test contracts from previous sprints", () => {
    expect(homeSource).toContain("CIRCADIAN ALIGNMENT · {formatDateEyebrow()}");
    expect(homeSource).toContain("🔥 {activeStreakDays}d streak");
    expect(homeSource).toContain(
      "Dedicated Top Eyebrow Row: Streak Pill Cleanly Positioned in Top-Right"
    );
    expect(homeSource).toContain("max-w-none");
    expect(homeSource).toContain("<TodayPageSkeleton />");
  });
});

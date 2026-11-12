import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 8.4: Voice Meal Modal Typography, Mobile Fuel Non-Truncation & Always-Visible Momentum", () => {
  const voiceModalSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/diet/VoiceMealModal.tsx"),
    "utf8"
  );
  const dietPageSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/diet/DietPage.tsx"),
    "utf8"
  );
  const homeViewSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/HomeView.tsx"),
    "utf8"
  );

  it("1. Voice Meal Modal header has NATURAL VOICE PARSER directly above non-wrapping 'Speak what you ate'", () => {
    expect(voiceModalSource).toContain("NATURAL VOICE PARSER");
    expect(voiceModalSource).toContain("Speak what you ate");
    expect(voiceModalSource).toContain("whitespace-nowrap");
    // Redundant 'Tap mic to speak' badge removed from header
    expect(voiceModalSource).not.toContain("Tap mic to speak");
  });

  it("2. Voice Meal Modal mic button and prompt copy match exact design specifications", () => {
    // Centered Coral Ember microphone button
    expect(voiceModalSource).toContain("w-16 h-16 rounded-full bg-[#E05A47]");
    expect(voiceModalSource).toContain("shadow-[0_8px_28px_rgba(224,90,71,0.4)]");
    expect(voiceModalSource).toContain("my-5 flex items-center justify-center mx-auto");

    // Clear primary prompts
    expect(voiceModalSource).toContain("Tap the mic and say what you had");
    expect(voiceModalSource).toContain("Listening... describe your meal");

    // Clean, scannable example pill box
    expect(voiceModalSource).toContain("2 rotis, 1 bowl dal tadka, 100g paneer bhurji & curd");
    expect(voiceModalSource).toContain("not-italic");
    expect(voiceModalSource).toContain("max-w-[300px] mx-auto px-3.5 py-2 rounded-xl");
  });

  it("3. Mobile Daily Nutrition Summary replaces 'remaining' with 'left' with non-truncating classes", () => {
    expect(dietPageSource).toContain("DAILY NUTRITION SUMMARY");
    expect(dietPageSource).toContain("{remainingCalories.toLocaleString()} kcal</strong>");
    expect(dietPageSource).toContain("left");
    expect(dietPageSource).toContain("whitespace-nowrap shrink-0");
  });

  it("4. HomeView always shows Weekly Momentum and Habit Compounding Streak sections on both mobile & desktop", () => {
    // Assert removal of collapse toggle button & state
    expect(homeViewSource).not.toContain("showMobileTrends");
    expect(homeViewSource).not.toContain("Show Weekly Momentum & Streak Calendar ⌄");
    expect(homeViewSource).not.toContain("Hide Weekly Momentum & Streak Calendar ⌃");

    // Assert both components are always rendered
    expect(homeViewSource).toContain("<ProgressTrendChart");
    expect(homeViewSource).toContain("<ConsistencyHeatmap");
    expect(homeViewSource).toContain("Weekly Momentum & Streak Consistency (Always Visible)");
  });
});

"use client";

import React, { useState } from "react";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";

interface PromptOption {
  id: number;
  prompt: string;
  quote: string;
  adjustment: string;
}

const PROMPT_OPTIONS: PromptOption[] = [
  {
    id: 1,
    prompt: "How was my protein intake today?",
    quote:
      "You trained heavier than usual today. I added a bowl of Greek yogurt to tonight's dinner so you recover well and close the 28g synthesis gap cleanly.",
    adjustment: "+28g protein added to tonight's dinner target.",
  },
  {
    id: 2,
    prompt: "Condense my Upper Body lift to 35m",
    quote:
      "Condensed Upper Body from 60m to 35m. Paired DB Incline Bench with Chest-Supported Rows in 4 high-density supersets.",
    adjustment: "Upper Body session condensed into 35m compound supersets.",
  },
  {
    id: 3,
    prompt: "How do I improve my deep sleep score?",
    quote:
      "Your 7h 45m sleep was consistent, but deep sleep dipped 18% below baseline. Cut caffeine after 2 PM and dim screens by 9:30 PM.",
    adjustment: "Circadian wind-down reminder scheduled for 9:30 PM.",
  },
  {
    id: 4,
    prompt: "Suggest a 40g protein vegetarian dinner",
    quote:
      "Grilled tofu & paneer bowl with edamame, quinoa, and sesame ginger dressing hits 42g protein with a low glycemic load.",
    adjustment: "42g vegetarian recovery bowl logged to planner.",
  },
  {
    id: 5,
    prompt: "Why is my training readiness 92%?",
    quote:
      "HRV recovered to 68ms and resting heart rate dropped 4 bpm overnight. Biological readiness is primed for heavier sets.",
    adjustment: "Training readiness calibrated at 92% (High Output).",
  },
  {
    id: 6,
    prompt: "Shift Deep Work to my dopamine peak",
    quote:
      "Moved your 90-minute Deep Work sprint to 10:00 AM, matching your post-cortisol dopamine peak before afternoon fatigue.",
    adjustment: "Deep Work rescheduled to 10:00 AM peak dopamine window.",
  },
];

export default function OrbitSection() {
  const [selectedPromptId, setSelectedPromptId] = useState<number>(1);
  const [status, setStatus] = useState<"idle" | "accepted" | "deferred">("idle");

  const currentOption =
    PROMPT_OPTIONS.find((p) => p.id === selectedPromptId) || PROMPT_OPTIONS[0];

  const handleSelectPrompt = (id: number) => {
    setSelectedPromptId(id);
    setStatus("idle");
  };

  return (
    <section
      id="orbit"
      className="py-16 sm:py-24 px-4 sm:px-8 bg-[#F6F3EC] dark:bg-[#0A0D0B] text-center relative overflow-hidden w-full max-w-[1400px] mx-auto transition-colors"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col items-center">
        {/* Eyebrow */}
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#2D6A4F] dark:text-[#6EE7B7]">
          QUIET GUIDANCE
        </span>

        {/* Title */}
        <h2 className="font-serif font-normal text-3xl sm:text-5xl text-[#1C1917] dark:text-[#F4F1EA] mt-2 mb-10 leading-tight">
          A companion, <span className="italic text-[#E05A47]">not a dashboard</span>
        </h2>

        {/* ── DESKTOP STAGE: Central Orbit3DCore with 6 Floating Prompts Surrounding It ── */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-center w-full my-6">
          {/* Left 3 Floating Prompt Pills */}
          <div className="col-span-4 flex flex-col items-end space-y-4">
            {PROMPT_OPTIONS.slice(0, 3).map((item, idx) => {
              const isSelected = item.id === selectedPromptId;
              const delay = `${idx * 0.4}s`;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPrompt(item.id)}
                  style={{ animationDelay: delay }}
                  className={`text-left text-xs font-semibold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-xs animate-[satatFloatSlow_4.5s_ease-in-out_infinite] ${
                    isSelected
                      ? "bg-[#191D1A] dark:bg-[#FCFBF9] text-white dark:text-[#191D1A] scale-105 shadow-md ring-2 ring-[#34D399]/40"
                      : "bg-[#FCFBF9] dark:bg-[#141916] text-[#57534E] dark:text-[#9CA39E] border border-[#1C1917]/10 dark:border-white/10 hover:border-[#2D6A4F] hover:text-[#1C1917] dark:hover:text-[#F4F1EA]"
                  }`}
                >
                  &ldquo;{item.prompt}&rdquo;
                </button>
              );
            })}
          </div>

          {/* Center 4 Columns: Luminous Gyroscope Stage */}
          <div className="col-span-4 flex flex-col items-center justify-center relative">
            <div className="w-56 h-56 rounded-full bg-radial from-[#2D6A4F]/15 via-[#2D6A4F]/5 to-transparent flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E05A47]/10 via-transparent to-[#34D399]/15 blur-xl pointer-events-none" />
              <Orbit3DCore size="xl" state="active" />
            </div>
          </div>

          {/* Right 3 Floating Prompt Pills */}
          <div className="col-span-4 flex flex-col items-start space-y-4">
            {PROMPT_OPTIONS.slice(3, 6).map((item, idx) => {
              const isSelected = item.id === selectedPromptId;
              const delay = `${(idx + 1) * 0.5}s`;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPrompt(item.id)}
                  style={{ animationDelay: delay }}
                  className={`text-left text-xs font-semibold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-xs animate-[satatFloatSlow_4.5s_ease-in-out_infinite] ${
                    isSelected
                      ? "bg-[#191D1A] dark:bg-[#FCFBF9] text-white dark:text-[#191D1A] scale-105 shadow-md ring-2 ring-[#34D399]/40"
                      : "bg-[#FCFBF9] dark:bg-[#141916] text-[#57534E] dark:text-[#9CA39E] border border-[#1C1917]/10 dark:border-white/10 hover:border-[#2D6A4F] hover:text-[#1C1917] dark:hover:text-[#F4F1EA]"
                  }`}
                >
                  &ldquo;{item.prompt}&rdquo;
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MOBILE STAGE: Central Orbit3DCore + Horizontal Chip Cloud ── */}
        <div className="lg:hidden flex flex-col items-center my-4 w-full">
          <div className="w-48 h-48 rounded-full bg-radial from-[#2D6A4F]/15 via-transparent to-transparent flex items-center justify-center relative mb-4">
            <Orbit3DCore size="lg" state="active" />
          </div>

          {/* Horizontal Floating Chip Cloud */}
          <div className="flex gap-2 overflow-x-auto w-full pb-3 px-2 no-scrollbar justify-start sm:justify-center">
            {PROMPT_OPTIONS.map((item) => {
              const isSelected = item.id === selectedPromptId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPrompt(item.id)}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-xs ${
                    isSelected
                      ? "bg-[#191D1A] dark:bg-[#FCFBF9] text-white dark:text-[#191D1A]"
                      : "bg-[#FCFBF9] dark:bg-[#141916] text-[#57534E] dark:text-[#9CA39E] border border-[#1C1917]/10 dark:border-white/10"
                  }`}
                >
                  {item.prompt}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Dynamic Orbit Whisper Quote & Adjustment Box ── */}
        <div className="max-w-xl mx-auto mt-6 bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] rounded-[28px] p-6 sm:p-8 shadow-sm">
          <blockquote className="font-serif italic text-lg sm:text-2xl text-[#1C1917] dark:text-[#F4F1EA] leading-relaxed">
            &ldquo;{currentOption.quote}&rdquo;
          </blockquote>

          {/* Interactive Action Buttons */}
          <div className="w-full max-w-[280px] mx-auto space-y-2.5 mt-6">
            <button
              type="button"
              onClick={() => setStatus("accepted")}
              className="w-full bg-[#2D6A4F] hover:bg-[#23533D] text-white rounded-full py-3.5 px-6 text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              {status === "accepted" ? "Adjustment applied ✓" : "Accept adjustment ✓"}
            </button>

            <button
              type="button"
              onClick={() => setStatus("deferred")}
              className="block w-full py-1.5 text-xs text-[#57534E] dark:text-[#9CA39E] hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors cursor-pointer"
            >
              {status === "deferred" ? "Kept dinner as is" : "Keep dinner as is"}
            </button>
          </div>

          {status === "accepted" && (
            <p className="mt-3.5 text-xs font-semibold text-[#2D6A4F] dark:text-[#6EE7B7] animate-fade-in">
              ✓ {currentOption.adjustment}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

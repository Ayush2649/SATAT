// components/onboarding/StepPace.tsx
"use client";

import { useState, useMemo } from "react";
import { Target, ArrowRight, Check } from "lucide-react";
import type { PaceTier } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepPaceProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

const FAT_LOSS_TIERS: {
  id: PaceTier;
  title: string;
  rateLabel: string;
  weeklyKg: number;
  dailyShift: string;
  description: string;
}[] = [
  {
    id: "relaxed",
    title: "Gentle Pace",
    rateLabel: "~0.23",
    weeklyKg: 0.23,
    dailyShift: "-250 kcal/d",
    description: "Subtle energy shift with minimal hunger. Easiest to maintain indefinitely.",
  },
  {
    id: "steady",
    title: "Steady Pace",
    rateLabel: "~0.36",
    weeklyKg: 0.36,
    dailyShift: "-400 kcal/d",
    description: "Balanced, sustainable fat loss protecting lean muscle and daily focus.",
  },
  {
    id: "fast",
    title: "Intensive Pace",
    rateLabel: "~0.55",
    weeklyKg: 0.55,
    dailyShift: "-600 kcal/d",
    description: "Structured tracking capped safely at 20% TDEE and 1% body weight per week.",
  },
];

const MUSCLE_GAIN_TIERS: {
  id: PaceTier;
  title: string;
  rateLabel: string;
  weeklyKg: number;
  dailyShift: string;
  description: string;
}[] = [
  {
    id: "relaxed",
    title: "Lean Growth",
    rateLabel: "~0.14",
    weeklyKg: 0.14,
    dailyShift: "+150 kcal/d",
    description: "Focus on minimal fat gain while steadily increasing workout performance.",
  },
  {
    id: "steady",
    title: "Steady Hypertrophy",
    rateLabel: "~0.23",
    weeklyKg: 0.23,
    dailyShift: "+250 kcal/d",
    description: "Balanced strength and hypertrophy supported by a controlled calorie surplus.",
  },
  {
    id: "fast",
    title: "Accelerated Surplus",
    rateLabel: "~0.36",
    weeklyKg: 0.36,
    dailyShift: "+400 kcal/d",
    description: "Higher caloric support for hard-gainers or high-volume training phases.",
  },
];

export function StepPace({
  formValues,
  updateFormField,
  onNext,
  isSaving,
}: StepPaceProps) {
  const isFatLoss = formValues.focusGoal === "fat_loss";
  const tiers = isFatLoss ? FAT_LOSS_TIERS : MUSCLE_GAIN_TIERS;
  const selectedPace = formValues.paceTier || "steady";

  const [targetWeightInput, setTargetWeightInput] = useState<string>(
    formValues.targetWeightKg ? String(formValues.targetWeightKg) : ""
  );

  const handleTargetWeightChange = (val: string) => {
    setTargetWeightInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      updateFormField("targetWeightKg", Math.round(num * 10) / 10);
    } else {
      updateFormField("targetWeightKg", null);
    }
  };

  const handleSelectPace = (tier: PaceTier) => {
    updateFormField("paceTier", tier);
  };

  const activeTier = tiers.find((t) => t.id === selectedPace) || tiers[1];

  const weightDelta = useMemo(() => {
    const current = formValues.weightKg;
    const target = formValues.targetWeightKg;
    if (!current || !target) return { diff: 5, weeks: 20, isLoss: true };
    const diff = Math.round(Math.abs(current - target) * 10) / 10;
    const weeks = Math.max(4, Math.round(diff / activeTier.weeklyKg));
    return { diff, weeks, isLoss: target < current };
  }, [formValues.weightKg, formValues.targetWeightKg, activeTier.weeklyKg]);

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 03 · YOUR CADENCE</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          What pace feels <span className="italic text-[#E05A47]">sustainable</span> for your life?
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          Consistency outperforms aggressive restriction. Choose a cadence your future self can keep with grace.
        </p>

        {/* Target Weight Card */}
        <div className="bg-[#FCFBF9] rounded-[24px] p-4 shadow-xs border border-[#1C1917]/[0.05] mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EFECE4] text-[#1C1917] flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E] block">
                  TARGET WEIGHT
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = parseFloat(targetWeightInput) || formValues.weightKg || 70;
                      const nextVal = Math.max(30, Math.round(currentVal - 1));
                      handleTargetWeightChange(String(nextVal));
                    }}
                    disabled={isSaving}
                    aria-label="Decrease target weight"
                    className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] font-bold flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={targetWeightInput}
                    onChange={(e) => handleTargetWeightChange(e.target.value)}
                    placeholder={String(formValues.weightKg || 70)}
                    disabled={isSaving}
                    className="relative z-10 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 rounded-lg px-1 w-20 font-serif text-3xl text-[#1C1917] text-center"
                    aria-label="Target weight in kilograms"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = parseFloat(targetWeightInput) || formValues.weightKg || 70;
                      const nextVal = Math.min(250, Math.round(currentVal + 1));
                      handleTargetWeightChange(String(nextVal));
                    }}
                    disabled={isSaving}
                    aria-label="Increase target weight"
                    className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] font-bold flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    +
                  </button>
                  <span className="font-serif text-base italic text-[#8C857B] ml-0.5">kg</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right pl-12 sm:pl-0">
              <span className="bg-[#B7F0D0] text-[#1B4332] px-3 py-1 rounded-full text-[11px] font-semibold inline-block">
                {weightDelta.isLoss ? "↘" : "↗"} {weightDelta.diff} kg over {weightDelta.weeks} wks
              </span>
              <span className="text-[10px] text-[#8C857B] block mt-1">
                Gentle metabolic arc
              </span>
            </div>
          </div>

          {/* Dashed trajectory SVG line */}
          <div className="mt-3 pt-2 border-t border-[#1C1917]/[0.04]">
            <svg viewBox="0 0 300 24" className="w-full h-6 overflow-visible">
              <circle cx="10" cy="18" r="3.5" fill="#2D6A4F" />
              <path
                d="M 10 18 Q 150 16 290 8"
                fill="none"
                stroke="#2D6A4F"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <circle cx="290" cy="8" r="3.5" fill="#E05A47" />
            </svg>
          </div>
        </div>

        {/* 3 Selectable Pace Cards */}
        <div className="space-y-3 mt-4">
          {tiers.map((tier) => {
            const isSelected = selectedPace === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleSelectPace(tier.id)}
                className={`w-full text-left rounded-[24px] transition-all relative cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? "bg-[#191D1A] text-white p-5 shadow-md border-2 border-[#E05A47]"
                    : "bg-[#FCFBF9] text-[#1C1917] p-4 border border-[#1C1917]/[0.05] shadow-xs hover:border-stone-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-sans font-bold text-base ${
                          isSelected ? "text-white" : "text-[#1C1917]"
                        }`}
                      >
                        {tier.title}
                      </h3>
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-white/10 text-stone-300" : "bg-[#EFECE4] text-[#57534E]"
                        }`}
                      >
                        {tier.dailyShift}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1.5 leading-relaxed ${
                        isSelected ? "text-stone-300" : "text-[#57534E]"
                      }`}
                    >
                      {tier.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end">
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#E05A47] text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}
                    <span
                      className={`font-serif text-2xl font-normal leading-tight ${
                        isSelected ? "text-white" : "text-[#1C1917]"
                      }`}
                    >
                      {tier.rateLabel}
                    </span>
                    <span
                      className={`font-serif text-xs italic ${
                        isSelected ? "text-stone-400" : "text-[#8C857B]"
                      }`}
                    >
                      kg / wk
                    </span>
                  </div>
                </div>

                {isSelected && tier.id === "steady" && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-[#6EE7B7] font-medium">
                    <span>✨ Recommended for your metabolic baseline</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-5">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
            ESTIMATED HORIZON
          </span>
          <span className="text-xs font-bold text-[#1C1917]">
            {weightDelta.weeks - 2} – {weightDelta.weeks + 2} Weeks to Goal
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNext()}
          disabled={isSaving}
          aria-label="Continue"
          className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-6 py-3.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
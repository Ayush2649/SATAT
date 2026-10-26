// components/onboarding/StepActivity.tsx
"use client";

import { Armchair, Footprints, Briefcase, Zap, ArrowRight, Check } from "lucide-react";
import type { ActivityLevel } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepActivityProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

const ACTIVITY_OPTIONS: {
  id: ActivityLevel;
  title: string;
  subtitle: string;
  multiplier: string;
  description: string;
  icon: typeof Armchair;
}[] = [
  {
    id: "sedentary",
    title: "Mostly Seated",
    subtitle: "Desk job, remote work, driving, reading",
    multiplier: "1.20× BMR",
    description: "Typical daily movement is minimal outside intentional exercise sessions.",
    icon: Armchair,
  },
  {
    id: "lightly_active",
    title: "On Your Feet Part-Time",
    subtitle: "5,000 – 8,000 steps / day",
    multiplier: "1.375× BMR",
    description: "Teaching, retail, light household activities, walking errands.",
    icon: Footprints,
  },
  {
    id: "moderately_active",
    title: "Constantly Moving",
    subtitle: "10,000+ steps / day",
    multiplier: "1.55× BMR",
    description: "Active commute, hospitality, busy childcare, trades, regular standing.",
    icon: Briefcase,
  },
  {
    id: "very_active",
    title: "Physically Demanding",
    subtitle: "Heavy physical labor / high exertion",
    multiplier: "1.725× BMR",
    description: "Construction, agriculture, manual labor, or multi-hour daily athletic work.",
    icon: Zap,
  },
];

export function StepActivity({
  formValues,
  updateFormField,
  onNext,
  isSaving,
}: StepActivityProps) {
  const selected = formValues.activityLevel || "lightly_active";

  const handleSelect = (id: ActivityLevel) => {
    updateFormField("activityLevel", id);
  };

  const activeOption = ACTIVITY_OPTIONS.find((o) => o.id === selected) || ACTIVITY_OPTIONS[1];

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 04 · DAILY MOVEMENT</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          How does your body <span className="italic text-[#E05A47]">move</span> during a typical day?
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          Your daily work and commuting routine accounts for far more energy burn than a 45-minute workout.
        </p>

        {/* Activity Selection Cards */}
        <div className="space-y-3 mt-5">
          {ACTIVITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left rounded-[24px] p-4 transition-all flex items-start gap-4 relative cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? "bg-[#191D1A] text-[#FCFBF9] shadow-md border-2 border-[#E05A47]"
                    : "bg-[#FCFBF9] text-[#1C1917] border border-[#1C1917]/[0.06] shadow-xs hover:border-stone-300"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? "bg-[#2D6A4F]/30 text-[#6EE7B7]" : "bg-[#EFECE4] text-[#1C1917]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`font-sans font-bold text-sm sm:text-base leading-snug truncate sm:whitespace-normal ${
                        isSelected ? "text-white" : "text-[#1C1917]"
                      }`}
                    >
                      {opt.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold leading-none ${
                          isSelected
                            ? "bg-white/12 text-[#6EE7B7] border border-white/10"
                            : "bg-[#EFECE4] text-[#57534E]"
                        }`}
                      >
                        {opt.multiplier}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#E05A47] text-white flex items-center justify-center shadow-xs shrink-0">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-xs mt-1.5 leading-relaxed ${
                      isSelected ? "text-stone-300" : "text-[#57534E]"
                    }`}
                  >
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-6">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
            DAILY EXPENDITURE
          </span>
          <span className="text-xs font-bold text-[#1C1917]">
            {activeOption.multiplier} Baseline Active
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

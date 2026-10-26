// components/onboarding/StepFocus.tsx
"use client";

import { Sparkles, ArrowRight, Check } from "lucide-react";
import type { FocusGoal } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepFocusProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}

const FOCUS_OPTIONS = [
  {
    id: "fat_loss" as FocusGoal,
    ariaLabel: "Build a Leaner Body",
    title: "Build a Leaner Body",
    description: "Drop body fat while keeping natural vitality.",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=500&q=75",
    pillText: "Adaptive macros",
  },
  {
    id: "muscle_gain" as FocusGoal,
    ariaLabel: "Build Strength & Muscle",
    title: "Build Strength & Muscle",
    description: "Build lean, functional muscle with steady progressive form.",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=500&q=75",
    pillText: "+ Overload sync",
  },
  {
    id: "habit_routine" as FocusGoal,
    ariaLabel: "Build Consistent Habits",
    title: "Build Consistent Habits",
    description: "Sustain meal timing, restful sleep, and daily structure.",
    image: "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&w=500&q=75",
    pillText: "Circadian sync",
  },
  {
    id: "vitality_health" as FocusGoal,
    ariaLabel: "Boost Daily Energy & Health",
    title: "Boost Daily Energy & Health",
    description: "Eat wholesome meals and move freely without midday crash.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=500&q=75",
    pillText: "Low cognitive load",
  },
];

export function StepFocus({
  formValues,
  updateFormField,
  onNext,
  isSaving,
}: StepFocusProps) {
  const selected = formValues.focusGoal;

  const handleSelect = (goal: FocusGoal) => {
    updateFormField("focusGoal", goal);
  };

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 01 · YOUR INTENTION</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          How do you want to feel <span className="italic text-[#E05A47]">12 weeks</span> from today?
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2.5 leading-relaxed">
          Choose what resonates deepest. Satat gently recalibrates as your daily life shifts.
        </p>

        {/* 2×2 Asymmetric Editorial Grid */}
        <div className="grid grid-cols-2 gap-3.5 mt-5">
          {FOCUS_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                aria-label={opt.ariaLabel}
                className={`rounded-[26px] p-3.5 text-left border-2 transition-all flex flex-col justify-between relative cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? "bg-[#191D1A] text-[#FCFBF9] border-[#E05A47] shadow-[0_16px_36px_rgba(25,29,26,0.22)] ring-2 ring-[#E05A47]/25"
                    : "bg-[#FCFBF9] text-[#1C1917] border-[#1C1917]/[0.06] hover:border-[#1C1917]/20 shadow-xs"
                }`}
              >
                <div className="h-28 w-full rounded-[18px] overflow-hidden relative mb-3 bg-[#EFECE4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opt.image}
                    alt={opt.title}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full absolute bottom-2 left-2 shadow-xs transition-colors ${
                      isSelected
                        ? "bg-[#191D1A]/85 backdrop-blur-md text-[#6EE7B7] border border-white/15"
                        : "bg-[#FCFBF9]/90 backdrop-blur-md text-[#1C1917]"
                    }`}
                  >
                    {opt.pillText}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#E05A47] text-white flex items-center justify-center absolute top-2 right-2 shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className={`font-sans font-bold text-sm leading-tight ${
                      isSelected ? "text-[#FCFBF9]" : "text-[#1C1917]"
                    }`}
                  >
                    {opt.title}
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
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

        {/* Reassurance Note */}
        <div className="flex items-center gap-2 text-xs text-[#57534E] mt-4 px-1">
          <div className="w-5 h-5 rounded-full bg-[#E0F2E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3" />
          </div>
          <span>Satat crafts a non-punitive ritual tailored to your rhythm.</span>
        </div>
      </div>

      {/* Floating Bottom Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F] shrink-0" />
          <div>
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
              BASELINE TARGET
            </span>
            <span className="text-xs font-bold text-[#1C1917]">
              Start with 3 gentle rituals
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNext()}
          disabled={!selected || isSaving}
          aria-label="Continue"
          className="w-12 h-12 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white flex items-center justify-center disabled:opacity-40 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="sr-only">Continue</span>
        </button>
      </div>
    </div>
  );
}

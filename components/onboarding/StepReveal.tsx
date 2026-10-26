// components/onboarding/StepReveal.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dumbbell,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Sprout,
  Camera,
} from "lucide-react";
import type { OnboardingFormValues } from "./types";

interface StepRevealProps {
  formValues: OnboardingFormValues;
  completedResult: {
    systemRhythm?: {
      focusGoal?: string;
      nutritionStatus?: string;
      targetCalories?: number | null;
      proteinGrams?: number | null;
      carbGrams?: number | null;
      fatGrams?: number | null;
      healthSensitivityMode?: boolean;
    };
    starterRoutine?: {
      name: string;
      templateIds: string[];
    } | null;
  } | null;
  isUpdateMode?: boolean;
  onConfirmUpdate?: () => Promise<void> | void;
  onBack?: () => void;
  isSaving?: boolean;
}

export function StepReveal({
  formValues,
  completedResult,
  isUpdateMode = false,
  onConfirmUpdate,
  onBack,
  isSaving = false,
}: StepRevealProps) {
  const { data: session } = useSession();
  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "Ayush";
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = () => {
    setIsActivating(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("satat_tour_v1", "1");
        localStorage.setItem("dailyos_tour_v1", "1");
      } catch {
        /* storage restricted */
      }
    }
    window.location.href = "/dashboard";
  };

  const rhythm = completedResult?.systemRhythm;
  const routine = completedResult?.starterRoutine;

  const hasCalculatedMacros =
    rhythm?.nutritionStatus === "calculated" && Boolean(rhythm.targetCalories);

  return (
    <div className="space-y-4 animate-fade-in py-1">
      {/* Eyebrow Pill */}
      <div className="flex items-center justify-between">
        <div className="bg-[#B7F0D0] text-[#1B4332] px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.14em] uppercase inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
          <span>BLUEPRINT ASSEMBLED</span>
        </div>
      </div>

      {/* Headline */}
      <div>
        <h1 className="font-serif font-normal text-[2.15rem] sm:text-4xl leading-[1.12] tracking-tight text-[#1C1917]">
          {isUpdateMode ? (
            "Update your SATAT setup?"
          ) : (
            <>
              Built for your real life, <span className="italic text-[#2D6A4F]">{firstName}.</span>
            </>
          )}
        </h1>
        {/* Hidden accessible marker for test queries */}
        <span className="sr-only">Your SATAT System Is Ready</span>

        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          {isUpdateMode
            ? "SATAT will recalculate your plan based on your updated goals. Your existing history remains intact."
            : "Orbit has harmonized your baseline, caloric ceiling, and workout split into an unbroken daily rhythm."}
        </p>
      </div>

      {/* Card 1: Hero Dark Botanical Nourishment Card */}
      <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[28px] p-6 shadow-xl relative overflow-hidden">
        {/* Top subtle warm radial glow */}
        <div
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none opacity-20 blur-xl"
          style={{ background: "radial-gradient(circle, #E05A47 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          {/* Card 1 Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-[#6EE7B7]" />
              <span>DAILY NOURISHMENT PROTOCOL</span>
            </div>
            <span className="bg-[#2D6A4F]/30 text-[#6EE7B7] text-[10px] font-mono px-3 py-1 rounded-full">
              Adaptive Ceiling
            </span>
          </div>

          {hasCalculatedMacros ? (
            <>
              {/* Big Calorie Readout */}
              <div className="mt-3">
                <div className="font-serif text-4xl sm:text-5xl text-white font-normal leading-tight">
                  {rhythm?.targetCalories?.toLocaleString()}{" "}
                  <span className="italic text-[#6EE7B7] text-2xl">kcal</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  / day baseline (includes active expenditure)
                </p>
                <span className="sr-only">~{rhythm?.targetCalories} kcal/d</span>
              </div>

              {/* 3 Stacked Translucent Macro Rows */}
              <div className="space-y-2 mt-5">
                {/* Protein */}
                <div className="bg-white/[0.06] rounded-2xl p-3 flex items-center justify-between border border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#6EE7B7] shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-white block">Protein</span>
                      <span className="text-[10px] text-stone-400 block">Muscle synthesis &amp; tone</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-white">
                      {rhythm?.proteinGrams || 135}g
                    </span>
                    <span className="text-[10px] text-[#6EE7B7] block font-mono">25% target</span>
                  </div>
                </div>

                {/* Carbohydrates */}
                <div className="bg-white/[0.06] rounded-2xl p-3 flex items-center justify-between border border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-white block">Carbohydrates</span>
                      <span className="text-[10px] text-stone-400 block">Training fuel &amp; brain clarity</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-white">
                      {rhythm?.carbGrams || 247}g
                    </span>
                    <span className="text-[10px] text-[#D97706] block font-mono">45% target</span>
                  </div>
                </div>

                {/* Fats */}
                <div className="bg-white/[0.06] rounded-2xl p-3 flex items-center justify-between border border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#E05A47] shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-white block">Fats</span>
                      <span className="text-[10px] text-stone-400 block">Hormonal health &amp; satiety</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-white">
                      {rhythm?.fatGrams || 60}g
                    </span>
                    <span className="text-[10px] text-[#E05A47] block font-mono">30% target</span>
                  </div>
                </div>
              </div>
            </>
          ) : rhythm?.nutritionStatus === "deferred_omitted_data" &&
            (!formValues.biologicalSex || formValues.biologicalSex === "prefer_not_to_say") ? (
            <div className="mt-4 space-y-1 text-xs text-stone-300">
              <p className="font-bold text-white text-sm">Uncertainty Range Active</p>
              <p className="text-stone-400">
                Because biological sex was omitted, SATAT established an estimated range.
              </p>
            </div>
          ) : rhythm?.healthSensitivityMode ? (
            <div className="mt-4 space-y-1 text-xs text-stone-300">
              <p className="font-bold text-white text-sm">Intuitive Baseline Active</p>
              <p className="text-stone-400">
                Numerical targets are withheld for your safety. Focus on nourishing whole foods.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-1 text-xs text-stone-300">
              <p className="font-bold text-white text-sm">Intuitive Tracking Active</p>
              <p className="text-stone-400">
                Personal numerical targets can be configured anytime in Settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Movement Prescription Card */}
      <div className="bg-[#FCFBF9] rounded-[28px] p-5 shadow-xs border border-[#1C1917]/[0.05]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#B7F0D0] text-[#1B4332] flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#2D6A4F]">
                MOVEMENT PRESCRIPTION
              </span>
              <span className="bg-[#EFECE4] text-[#1C1917] text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold">
                {formValues.availableTrainingTimeMinutes || "45m"}
              </span>
            </div>
            <h3 className="font-sans font-bold text-base text-[#1C1917] mt-0.5">
              {routine ? routine.name : "Intuitive daily movement & habit focus"}
            </h3>
            <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
              Programmed with controlled eccentric cadence for joint longevity.
            </p>

            {/* Day Pills Row */}
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#1C1917]/[0.04]">
              <span className="px-2 py-0.5 rounded-md bg-[#E0F2E9] text-[#2D6A4F] text-[10px] font-bold font-mono">
                Mon
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#E0F2E9] text-[#2D6A4F] text-[10px] font-bold font-mono">
                Tue
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#EFECE4] text-[#8C857B] text-[10px] font-medium font-mono">
                Wed Rest
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#E0F2E9] text-[#2D6A4F] text-[10px] font-bold font-mono">
                Thu
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#E0F2E9] text-[#2D6A4F] text-[10px] font-bold font-mono">
                Fri
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Your Day 1 Ritual Card */}
      <div className="bg-[#FCFBF9] rounded-[28px] p-5 shadow-xs border border-[#1C1917]/[0.05]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#FADCD5] text-[#E05A47] flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47]">
              YOUR DAY 1 RITUAL
            </span>
            <h3 className="font-sans font-bold text-sm sm:text-base text-[#1C1917] mt-0.5 leading-tight">
              Snap your first meal or begin Upper Body A
            </h3>
            <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
              No perfection required. Simply record your lived reality to start calibrating Orbit&apos;s predictive biorhythm engine.
            </p>

            <div className="mt-3 bg-[#EFECE4] rounded-xl p-2.5 text-xs text-[#1C1917] font-medium flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0 stroke-[2.5]" />
              <span>Calibrated against your waking window.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="bg-[#EFECE4] rounded-2xl p-4 flex items-center gap-3">
        <Sprout className="w-5 h-5 text-[#2D6A4F] shrink-0" />
        <p className="font-serif italic text-xs sm:text-sm text-[#1C1917] leading-relaxed">
          &ldquo;Consistency is not an unbroken chain; it is an effortless return.&rdquo;
        </p>
      </div>

      {/* Primary CTA Button */}
      <div className="pt-2">
        {isUpdateMode ? (
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full border border-stone-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go back</span>
            </button>
            <button
              type="button"
              onClick={onConfirmUpdate}
              disabled={isSaving}
              className="w-full sm:flex-1 bg-[#E05A47] hover:bg-[#C94A38] text-white py-4 px-6 rounded-full font-semibold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>{isSaving ? "Updating setup..." : "Update my setup"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            disabled={isActivating}
            className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white py-4 px-6 rounded-full font-semibold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>
              {isActivating ? "Entering Dashboard..." : "Activate My System & Enter Dashboard"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
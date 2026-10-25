// components/onboarding/StepPace.tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft, TrendingDown, TrendingUp, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
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
    rateLabel: "~0.23 kg / week",
    weeklyKg: 0.23,
    dailyShift: "-250 kcal/d",
    description: "Subtle energy shift with minimal hunger. Easiest to maintain indefinitely.",
  },
  {
    id: "steady",
    title: "Steady Pace",
    rateLabel: "~0.36 kg / week",
    weeklyKg: 0.36,
    dailyShift: "-400 kcal/d",
    description: "Balanced, sustainable fat loss protecting lean muscle and daily focus.",
  },
  {
    id: "fast",
    title: "Intensive Pace",
    rateLabel: "~0.55 kg / week",
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
    rateLabel: "~0.14 kg / week",
    weeklyKg: 0.14,
    dailyShift: "+150 kcal/d",
    description: "Focus on minimal fat gain while steadily increasing workout performance.",
  },
  {
    id: "steady",
    title: "Steady Hypertrophy",
    rateLabel: "~0.23 kg / week",
    weeklyKg: 0.23,
    dailyShift: "+250 kcal/d",
    description: "Balanced strength and hypertrophy supported by a controlled calorie surplus.",
  },
  {
    id: "fast",
    title: "Accelerated Surplus",
    rateLabel: "~0.36 kg / week",
    weeklyKg: 0.36,
    dailyShift: "+400 kcal/d",
    description: "Higher caloric support for hard-gainers or high-volume training phases.",
  },
];

export function StepPace({
  formValues,
  updateFormField,
  onNext,
  onBack,
  onSkip,
  isSaving,
}: StepPaceProps) {
  const isFatLoss = formValues.focusGoal === "fat_loss";
  const tiers = isFatLoss ? FAT_LOSS_TIERS : MUSCLE_GAIN_TIERS;
  const selectedPace = formValues.paceTier;

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

  const projection = useMemo(() => {
    const currentW = formValues.weightKg;
    const targetW = formValues.targetWeightKg;
    if (!currentW || !targetW || currentW === targetW) return null;
    const delta = Math.round((targetW - currentW) * 10) / 10;
    const activeTier = tiers.find((t) => t.id === (selectedPace || "steady")) || tiers[1];
    const weeks = Math.max(1, Math.round(Math.abs(delta) / activeTier.weeklyKg));
    return {
      delta,
      weeks,
      dailyShift: activeTier.dailyShift,
    };
  }, [formValues.weightKg, formValues.targetWeightKg, selectedPace, tiers]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)]">
          <span className="type-eyebrow text-[var(--brand)]">RATE OF ADAPTATION</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          How would you like to pace your journey?
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          SATAT prioritizes consistency over aggressive speed to protect lean muscle and hormone health.
        </p>
      </div>

      <div className="space-y-4">
        {/* Compact Target Weight Row */}
        <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] focus-within:border-[var(--brand)] transition-colors flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Target Body Weight (Optional, kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder={formValues.weightKg ? `e.g. ${formValues.weightKg}` : "e.g. 68"}
              value={targetWeightInput}
              onChange={(e) => handleTargetWeightChange(e.target.value)}
              className="w-full bg-transparent text-lg font-bold font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none"
            />
          </div>

          {projection ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-subtle)] text-[var(--brand)] font-mono text-[11px] font-bold">
              {projection.delta < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {projection.delta > 0 ? `+${projection.delta}` : projection.delta}kg · {projection.weeks}w
            </span>
          ) : (
            formValues.weightKg && (
              <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)]">
                Now: {formValues.weightKg}kg
              </span>
            )
          )}
        </div>

        {/* Compact Pace Rows */}
        <div className="space-y-2">
          {tiers.map((tier) => {
            const isSelected = selectedPace === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => updateFormField("paceTier", tier.id)}
                className={cn(
                  "w-full p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start justify-between gap-3 pressable",
                  isSelected
                    ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
                    : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]"
                )}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-[var(--text-primary)] text-sm">
                      {tier.title}
                    </span>
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--brand)]">
                      {tier.rateLabel}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      {tier.dailyShift}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-snug">
                    {tier.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-all",
                    isSelected
                      ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                      : "border-[var(--border-strong)] bg-transparent text-transparent"
                  )}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>

        {projection && (
          <div className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--brand)]" />
              Projected Horizon
            </span>
            <span className="text-[var(--text-primary)] font-semibold">
              ~{projection.weeks} weeks · {projection.dailyShift}
            </span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-4 px-2 py-1"
          >
            Skip pace setting
          </button>

          <button
            type="button"
            onClick={() => onNext()}
            disabled={isSaving}
            className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-1.5"
          >
            <span>{isSaving ? "Saving..." : "Continue"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
// components/onboarding/StepActivity.tsx
"use client";

import { Armchair, Footprints, Briefcase, Zap, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
  onBack,
  onSkip,
  isSaving,
}: StepActivityProps) {
  const selected = formValues.activityLevel;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)]">
          <span className="type-eyebrow text-[var(--brand)]">NON-EXERCISE EXPENDITURE (NEAT)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          How does your body move during a typical day?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Your daily work and commuting routine accounts for far more energy burn than a 45-minute workout.
        </p>
      </div>

      <div className="space-y-3 max-w-xl mx-auto pt-1">
        {ACTIVITY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateFormField("activityLevel", opt.id)}
              className={cn(
                "w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 pressable",
                isSelected
                  ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              )}
            >
              <div
                className={cn(
                  "p-2.5 rounded-xl border shrink-0 mt-0.5 transition-colors",
                  isSelected
                    ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-[var(--text-primary)] text-sm sm:text-base">
                      {opt.title}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {opt.subtitle}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[var(--brand)]">
                    {opt.multiplier}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>

              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-1 transition-all",
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

      <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-4 px-2 py-1"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={() => onNext()}
            disabled={isSaving}
            className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2"
          >
            <span>{isSaving ? "Saving..." : "Continue"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
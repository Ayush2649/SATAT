// components/onboarding/StepFocus.tsx
"use client";

import { Flame, Dumbbell, Heart, CalendarCheck, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FocusGoal } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepFocusProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}

const FOCUS_OPTIONS: {
  id: FocusGoal;
  title: string;
  tag: string;
  description: string;
  icon: typeof Flame;
  accentColor: string;
  accentBg: string;
}[] = [
  {
    id: "fat_loss",
    title: "Build a Leaner Body",
    tag: "Caloric Deficit + Muscle Preservation",
    description: "Reduce body fat sustainably while protecting daily energy and lean mass.",
    icon: Flame,
    accentColor: "#F59E0B",
    accentBg: "rgba(245, 158, 11, 0.12)",
  },
  {
    id: "muscle_gain",
    title: "Build Strength & Muscle",
    tag: "Hypertrophy + Progressive Overload",
    description: "Fuel compound training performance and structured lean tissue growth.",
    icon: Dumbbell,
    accentColor: "var(--brand)",
    accentBg: "var(--brand-subtle)",
  },
  {
    id: "vitality_health",
    title: "Boost Daily Energy & Health",
    tag: "Metabolic Equilibrium",
    description: "Maintain a steady weight, eat cleaner, and move consistently every day.",
    icon: Heart,
    accentColor: "#22C55E",
    accentBg: "rgba(34, 197, 94, 0.12)",
  },
  {
    id: "habit_routine",
    title: "Build Consistent Habits",
    tag: "Behavioral Continuity",
    description: "Establish an unbroken daily rhythm for meals, workouts, and recovery.",
    icon: CalendarCheck,
    accentColor: "#8B5CF6",
    accentBg: "rgba(139, 92, 246, 0.12)",
  },
];

export function StepFocus({
  formValues,
  updateFormField,
  onNext,
  onBack,
  isSaving,
}: StepFocusProps) {
  const selected = formValues.focusGoal;

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)]">
          <span className="type-eyebrow text-[var(--brand)]">PRIMARY 12-WEEK VECTOR</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          What is your main focus for the next 12 weeks?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          This helps SATAT shape your starting routine, protein targets, and daily energy baseline.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {FOCUS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateFormField("focusGoal", opt.id)}
              className={cn(
                "group relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-4 pressable",
                isSelected
                  ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: isSelected ? "var(--brand)" : opt.accentBg,
                      color: isSelected ? "#FFFFFF" : opt.accentColor,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                      isSelected
                        ? "bg-[var(--brand)] border-[var(--brand)] text-white scale-100"
                        : "border-[var(--border-strong)] bg-transparent text-transparent"
                    )}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <div>
                  <div className="font-display font-bold text-base text-[var(--text-primary)]">
                    {opt.title}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--brand)] font-semibold mt-0.5">
                    {opt.tag}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {opt.description}
              </p>
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

        <button
          type="button"
          onClick={() => onNext()}
          disabled={!selected || isSaving}
          className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2"
        >
          <span>{isSaving ? "Saving..." : "Continue"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
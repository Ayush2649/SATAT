// components/onboarding/StepWorkoutEnv.tsx
"use client";

import { Building2, Home, Activity, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EquipmentAccess } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepWorkoutEnvProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}

const EQUIPMENT_OPTIONS: {
  id: EquipmentAccess;
  title: string;
  tag: string;
  desc: string;
  icon: typeof Building2;
}[] = [
  {
    id: "commercial_gym",
    title: "Commercial / Full Gym",
    tag: "Barbells · Cables · Squat Racks · Machines",
    desc: "Barbells, dumbbells, cable machines, squat racks, and weight machines.",
    icon: Building2,
  },
  {
    id: "home_dumbbells",
    title: "Home with Dumbbells & Bench",
    tag: "Dumbbells · Flat/Incline Bench · Bands",
    desc: "Adjustable or fixed dumbbells, resistance bands, and a flat bench.",
    icon: Home,
  },
  {
    id: "bodyweight_only",
    title: "Anywhere / Bodyweight",
    tag: "Calisthenics · Zero Equipment",
    desc: "No equipment required. Calisthenics, core exercises, and floor movements.",
    icon: Activity,
  },
];

export function StepWorkoutEnv({
  formValues,
  updateFormField,
  onNext,
  onBack,
  isSaving,
}: StepWorkoutEnvProps) {
  const selectedEquip = formValues.equipmentAccess;
  const canProceed = Boolean(selectedEquip);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)]">
          <span className="type-eyebrow text-[var(--brand)]">EQUIPMENT CALIBRATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          Where will you do your workouts?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          We tailor your compound lifts and movement progressions to match your available equipment.
        </p>
      </div>

      <div className="space-y-3 max-w-xl mx-auto pt-1">
        {EQUIPMENT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedEquip === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateFormField("equipmentAccess", opt.id)}
              className={cn(
                "w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 pressable",
                isSelected
                  ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-xl border shrink-0 mt-0.5 transition-colors",
                  isSelected
                    ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                    {opt.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--brand)] font-semibold">
                    {opt.tag}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {opt.desc}
                </div>
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

        <button
          type="button"
          onClick={() => onNext()}
          disabled={!canProceed || isSaving}
          className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2"
        >
          <span>{isSaving ? "Saving..." : "Continue"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
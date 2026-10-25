// components/onboarding/StepDiet.tsx
"use client";

import { Salad, Egg, Beef, Leaf, Utensils, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DietaryPattern } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepDietProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

const DIET_OPTIONS: {
  id: DietaryPattern;
  title: string;
  desc: string;
  proteinSources: string;
  icon: typeof Salad;
}[] = [
  {
    id: "vegetarian",
    title: "Vegetarian",
    desc: "Dairy included, plant-forward. No meat or eggs.",
    proteinSources: "Paneer · Curd/Yogurt · Dal · Whey · Soy",
    icon: Salad,
  },
  {
    id: "eggetarian",
    title: "Eggetarian",
    desc: "Eggs and dairy included alongside plants. No meat.",
    proteinSources: "Whole Eggs · Egg Whites · Paneer · Dairy",
    icon: Egg,
  },
  {
    id: "non_vegetarian",
    title: "Non-Vegetarian",
    desc: "Includes poultry, fish, meat, dairy, and plants.",
    proteinSources: "Chicken · Fish · Eggs · Dairy · Legumes",
    icon: Beef,
  },
  {
    id: "vegan",
    title: "Vegan",
    desc: "100% plant-based. No meat, dairy, eggs, or animal products.",
    proteinSources: "Tofu · Tempeh · Edamame · Lentils · Plant Isolate",
    icon: Leaf,
  },
  {
    id: "anything",
    title: "No Specific Restriction",
    desc: "Open to all cuisines, recipes, and ingredients.",
    proteinSources: "Full-spectrum omnivore protein rotation",
    icon: Utensils,
  },
];

const COMMON_AVOIDANCES = [
  "Lactose / Dairy",
  "Gluten",
  "Nuts",
  "Soy",
  "Seafood",
];

export function StepDiet({
  formValues,
  updateFormField,
  onNext,
  onBack,
  onSkip,
  isSaving,
}: StepDietProps) {
  const selectedPattern = formValues.dietaryPattern;
  const currentAvoidances = formValues.foodAvoidances || [];

  const handleToggleAvoidance = (tag: string) => {
    if (currentAvoidances.includes(tag)) {
      updateFormField(
        "foodAvoidances",
        currentAvoidances.filter((t) => t !== tag)
      );
    } else {
      updateFormField("foodAvoidances", [...currentAvoidances, tag]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)]">
          <span className="type-eyebrow text-[var(--brand)]">NUTRITIONAL ARCHITECTURE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          What is your everyday eating style?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Helps SATAT balance your protein sources and calibrate Orbit&apos;s meal suggestions.
        </p>
      </div>

      <div className="space-y-5 max-w-xl mx-auto">
        {/* Dietary Pattern Grid */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Everyday Diet
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DIET_OPTIONS.map((opt, idx) => {
              const Icon = opt.icon;
              const isSelected = selectedPattern === opt.id;
              const isLastOdd = idx === DIET_OPTIONS.length - 1;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateFormField("dietaryPattern", opt.id)}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 pressable",
                    isLastOdd && "sm:col-span-2",
                    isSelected
                      ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
                      : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                  )}
                >
                  <div
                    className={cn(
                      "p-2.5 rounded-xl shrink-0 mt-0.5 transition-colors",
                      isSelected
                        ? "bg-[var(--brand)] text-white"
                        : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-sm text-[var(--text-primary)]">
                        {opt.title}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand)] stroke-[3] shrink-0" />}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                      {opt.desc}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--brand)] mt-1.5 truncate">
                      {opt.proteinSources}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Avoidances */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Common Food Avoidances (Optional)
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">Excluded from Orbit suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMON_AVOIDANCES.map((tag) => {
              const isChecked = currentAvoidances.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleAvoidance(tag)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 pressable",
                    isChecked
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-xs"
                      : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
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
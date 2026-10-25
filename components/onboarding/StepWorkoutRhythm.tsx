// components/onboarding/StepWorkoutRhythm.tsx
"use client";

import {
  Dumbbell,
  UtensilsCrossed,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Compass,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  WorkoutDaysPerWeek,
  AvailableTrainingTimeMinutes,
  PreferredTrainingWindow,
  TrainingExperience,
} from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepWorkoutRhythmProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}

const SPLIT_PREVIEW: Record<WorkoutDaysPerWeek, string> = {
  2: "2-Day Full Body Foundation (A / B)",
  3: "3-Day Full Body Progressive Split",
  4: "4-Day Upper / Lower Split (A / B)",
  5: "5-Day Push · Pull · Legs + Upper / Lower",
};

const TIME_OPTIONS: { id: AvailableTrainingTimeMinutes; label: string; desc: string }[] = [
  { id: "<20", label: "<20 min", desc: "Express micro-sessions" },
  { id: "20-30", label: "20–30 min", desc: "Efficient, focused workouts" },
  { id: "30-45", label: "30–45 min", desc: "Standard balanced training" },
  { id: "45-60", label: "45–60 min", desc: "Comprehensive sessions" },
  { id: "60+", label: "60+ min", desc: "Extended volume & pacing" },
];

const EXPERIENCE_OPTIONS: {
  id: TrainingExperience;
  title: string;
  desc: string;
  icon: typeof Compass;
}[] = [
  {
    id: "beginner",
    title: "Beginner",
    desc: "New to lifting or returning after a long break (< 6 months consistent).",
    icon: Compass,
  },
  {
    id: "intermediate",
    title: "Intermediate",
    desc: "Familiar with progressive overload and main compound forms (6 months – 2 years).",
    icon: Sparkles,
  },
  {
    id: "advanced",
    title: "Advanced",
    desc: "Confident with form, intensity, and self-directed programming (2+ years).",
    icon: Award,
  },
];

const WINDOW_OPTIONS: { id: PreferredTrainingWindow; label: string; time: string; icon: typeof Sun }[] = [
  { id: "morning", label: "Morning", time: "07:00", icon: Sun },
  { id: "afternoon", label: "Afternoon", time: "12:30", icon: Sparkles },
  { id: "evening", label: "Evening", time: "18:00", icon: Sunset },
  { id: "flexible", label: "Flexible", time: "No fixed reminder", icon: Moon },
];

export function StepWorkoutRhythm({
  formValues,
  updateFormField,
  onNext,
  onBack,
  isSaving,
}: StepWorkoutRhythmProps) {
  const includeWorkouts = formValues.includeWorkouts;

  const handleSelectInclude = (include: boolean) => {
    updateFormField("includeWorkouts", include);
    if (!include) {
      updateFormField("workoutDaysPerWeek", null);
      updateFormField("availableTrainingTimeMinutes", null);
      updateFormField("preferredTrainingWindow", null);
      updateFormField("trainingExperience", null);
      updateFormField("equipmentAccess", null);
    }
  };

  const canProceed =
    includeWorkouts === false ||
    (includeWorkouts === true &&
      formValues.workoutDaysPerWeek !== null &&
      formValues.availableTrainingTimeMinutes !== null &&
      formValues.trainingExperience !== null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)]">
          <span className="type-eyebrow text-[var(--brand)]">TRAINING CADENCE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          What is a realistic training rhythm you can sustain?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          A 30-minute session you complete every week beats a 90-minute plan you abandon.
        </p>
      </div>

      {/* Primary Opt-in Decision */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => handleSelectInclude(true)}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 pressable",
            includeWorkouts === true
              ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
              : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl shrink-0 transition-colors",
                includeWorkouts === true
                  ? "bg-[var(--brand)] text-white"
                  : "bg-[var(--surface)] text-[var(--brand)] border border-[var(--border)]"
              )}
            >
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-[var(--text-primary)] text-sm">
                Yes, include starter routine
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Personalized workout schedule &amp; plan
              </p>
            </div>
          </div>

          <div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center border shrink-0",
              includeWorkouts === true
                ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                : "border-[var(--border-strong)] bg-transparent text-transparent"
            )}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectInclude(false)}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 pressable",
            includeWorkouts === false
              ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
              : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl shrink-0 transition-colors",
                includeWorkouts === false
                  ? "bg-[var(--brand)] text-white"
                  : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
              )}
            >
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-[var(--text-primary)] text-sm">
                Not right now
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Focus on nutrition &amp; daily habits
              </p>
            </div>
          </div>

          <div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center border shrink-0",
              includeWorkouts === false
                ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                : "border-[var(--border-strong)] bg-transparent text-transparent"
            )}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        </button>
      </div>

      {/* Schedule Questions if Yes */}
      {includeWorkouts === true && (
        <div className="space-y-5 max-w-xl mx-auto pt-4 border-t border-[var(--border-subtle)] animate-slide-up">
          {/* 1. Days per week + Live Split Readout */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                How many days per week do you want to train?
              </label>
              {formValues.workoutDaysPerWeek && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[var(--brand)]">
                  <Layers className="w-3.5 h-3.5" />
                  {SPLIT_PREVIEW[formValues.workoutDaysPerWeek]}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {([2, 3, 4, 5] as WorkoutDaysPerWeek[]).map((days) => {
                const isSelected = formValues.workoutDaysPerWeek === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => updateFormField("workoutDaysPerWeek", days)}
                    className={cn(
                      "py-3 rounded-xl border text-sm font-mono font-bold transition-all pressable",
                      isSelected
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-xs"
                        : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    {days} days
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Available Time per Session (Compact 5-pill Bento) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Available Time per Session
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_OPTIONS.map((time) => {
                const isSelected = formValues.availableTrainingTimeMinutes === time.id;
                return (
                  <button
                    key={time.id}
                    type="button"
                    onClick={() => updateFormField("availableTrainingTimeMinutes", time.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all pressable",
                      isSelected
                        ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)]"
                        : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                      {time.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                      {time.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Training Experience */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Training Experience
            </label>
            <div className="space-y-2">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = formValues.trainingExperience === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateFormField("trainingExperience", opt.id)}
                    className={cn(
                      "w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 pressable",
                      isSelected
                        ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
                        : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0 mt-0.5 transition-colors",
                        isSelected
                          ? "bg-[var(--brand)] text-white"
                          : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm text-[var(--text-primary)]">
                        {opt.title}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Preferred Training Window */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Preferred Training Window (Optional)
              </label>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Sets push reminder</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WINDOW_OPTIONS.map((win) => {
                const Icon = win.icon;
                const isSelected = formValues.preferredTrainingWindow === win.id;
                return (
                  <button
                    key={win.id}
                    type="button"
                    onClick={() => updateFormField("preferredTrainingWindow", win.id)}
                    className={cn(
                      "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 pressable",
                      isSelected
                        ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] text-[var(--brand)]"
                        : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">{win.label}</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{win.time}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
// components/onboarding/StepReveal.tsx
"use client";

import { useState } from "react";
import {
  Dumbbell,
  Clock,
  Sun,
  Target,
  Sparkles,
  RefreshCw,
  Flame,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { OrbitMark } from "@/components/orbit/OrbitMark";
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

  const windowLabels: Record<string, string> = {
    morning: "Morning (07:00)",
    afternoon: "Afternoon (12:30)",
    evening: "Evening (18:00)",
    flexible: "Flexible",
  };

  const timeLabels: Record<string, string> = {
    "<20": "<20 min / session",
    "20-30": "20–30 min / session",
    "30-45": "30–45 min / session",
    "45-60": "45–60 min / session",
    "60+": "60+ min / session",
  };

  const hasCalculatedMacros =
    rhythm?.nutritionStatus === "calculated" && Boolean(rhythm.targetCalories);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] text-[var(--brand)] text-[11px] font-mono font-bold uppercase tracking-widest">
          <OrbitMark size={14} state="idle" />
          <span>{isUpdateMode ? "✦ Satat · Setup Update" : "✦ Blueprint Calibrated"}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          {isUpdateMode ? "Update your SATAT setup?" : "Your SATAT System Is Ready"}
        </h1>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          {isUpdateMode
            ? "SATAT will recalculate your plan based on your updated goals. Your existing history remains intact."
            : "Your training, nutrition, and daily rhythm are now wired into a single continuous loop."}
        </p>
      </div>

      <div className="space-y-3.5">
        {/* Fueling Baseline Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--brand)]">
              <Flame className="w-3.5 h-3.5" />
              <span>Daily Fueling Baseline</span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand)] font-semibold">
              Mifflin-St Jeor
            </span>
          </div>

          {hasCalculatedMacros ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2 pb-2.5 border-b border-[var(--border-subtle)]">
                <div>
                  <div className="text-[11px] text-[var(--text-muted)]">Daily Energy Target</div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    ~{rhythm?.targetCalories}{" "}
                    <span className="text-xs font-normal text-[var(--text-secondary)]">kcal/d</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[var(--text-muted)]">Protein Anchor</div>
                  <div className="text-lg font-bold font-mono text-[var(--brand)]">
                    ~{rhythm?.proteinGrams}g{" "}
                    <span className="text-xs font-normal text-[var(--text-secondary)]">/ day</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                    <span>PROTEIN</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--macro-protein)]" />
                  </div>
                  <div className="font-mono font-bold text-sm text-[var(--text-primary)] mt-0.5">
                    {rhythm?.proteinGrams ?? "—"}g
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                    <span>CARBS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--macro-carbs)]" />
                  </div>
                  <div className="font-mono font-bold text-sm text-[var(--text-primary)] mt-0.5">
                    {rhythm?.carbGrams ? `${rhythm.carbGrams}g` : "Balanced"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                    <span>FATS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--macro-fat)]" />
                  </div>
                  <div className="font-mono font-bold text-sm text-[var(--text-primary)] mt-0.5">
                    {rhythm?.fatGrams ? `${rhythm.fatGrams}g` : "Balanced"}
                  </div>
                </div>
              </div>
            </div>
          ) : rhythm?.nutritionStatus === "deferred_omitted_data" &&
            (!formValues.biologicalSex || formValues.biologicalSex === "prefer_not_to_say") ? (
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <p className="font-bold text-[var(--text-primary)]">Uncertainty Range Active</p>
              <p>Because biological sex was omitted, SATAT established an estimated range.</p>
            </div>
          ) : rhythm?.healthSensitivityMode ? (
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <p className="font-bold text-[var(--text-primary)]">Intuitive Baseline Active</p>
              <p>Numerical targets are withheld for your safety. Focus on nourishing whole foods.</p>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <p className="font-bold text-[var(--text-primary)]">Intuitive Tracking Active</p>
              <p>Personal numerical targets can be configured anytime in Settings.</p>
            </div>
          )}
        </div>

        {/* Starting Rhythm + Day 1 Mission */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--brand)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Starting Rhythm</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <span className="font-semibold text-[var(--text-primary)]">
                    {routine ? routine.name : "Daily movement & habit focus"}
                  </span>
                </div>

                {formValues.includeWorkouts && formValues.availableTrainingTimeMinutes && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span>{timeLabels[formValues.availableTrainingTimeMinutes]}</span>
                  </div>
                )}

                {formValues.preferredTrainingWindow && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Sun className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span>{windowLabels[formValues.preferredTrainingWindow]}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--success)] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Templates loaded in Train</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--success)]">
                <Target className="w-3.5 h-3.5" />
                <span>Day 1 Mission</span>
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                {formValues.includeWorkouts
                  ? "Log your first meal via photo/voice or inspect Session A on your workout board."
                  : "Log your first meal and establish your daily meal anchor."}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[var(--brand)]">
                <RefreshCw className="w-3 h-3" />
                <span>Autonomous Adaptation</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] leading-snug">
                Orbit reviews weekly adherence (Sundays 19:00) to tune volume &amp; fuel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-1">
        {isUpdateMode ? (
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="w-full sm:w-auto btn-secondary px-5 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go back</span>
            </button>
            <button
              type="button"
              onClick={onConfirmUpdate}
              disabled={isSaving}
              className="w-full sm:flex-1 btn-primary py-3 px-6 rounded-2xl font-bold text-sm tracking-wide uppercase shadow-md flex items-center justify-center gap-2"
            >
              <span>{isSaving ? "Updating your setup..." : "Update my setup"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            disabled={isActivating}
            className="w-full btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide uppercase shadow-md flex items-center justify-center gap-2"
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
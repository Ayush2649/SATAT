// components/onboarding/StepHealth.tsx
"use client";

import { Shield, HeartPulse, ChevronRight, ChevronLeft, Info, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthCondition } from "@/lib/onboarding/validation";

interface StepHealthProps {
  healthConditions: HealthCondition[];
  setHealthConditions: (conditions: HealthCondition[]) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
  error: string | null;
}

const HEALTH_OPTIONS: {
  id: HealthCondition;
  label: string;
  isClinical: boolean;
}[] = [
  { id: "pregnant_breastfeeding", label: "Currently pregnant or breastfeeding", isClinical: true },
  { id: "diabetes", label: "Diagnosed Type 1 or Type 2 Diabetes", isClinical: true },
  { id: "cardiovascular", label: "Cardiovascular or heart condition", isClinical: true },
  { id: "disordered_eating", label: "History of disordered eating", isClinical: true },
  { id: "physical_injury", label: "Physical injury limiting movement", isClinical: false },
  { id: "none", label: "None of the above", isClinical: false },
];

export function StepHealth({
  healthConditions,
  setHealthConditions,
  onNext,
  onBack,
  isSaving,
  error,
}: StepHealthProps) {
  const handleToggle = (id: HealthCondition) => {
    if (id === "none") {
      setHealthConditions(["none"]);
      return;
    }

    const next = healthConditions.filter((c) => c !== "none");
    if (next.includes(id)) {
      setHealthConditions(next.filter((c) => c !== id));
    } else {
      setHealthConditions([...next, id]);
    }
  };

  const hasClinicalCondition = healthConditions.some((c) =>
    ["pregnant_breastfeeding", "diabetes", "cardiovascular", "disordered_eating"].includes(c)
  );
  const hasPhysicalInjury = healthConditions.includes("physical_injury");
  const hasSelection = healthConditions.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--warning-subtle)] border border-[var(--border)] text-[var(--warning)] mb-1">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <span className="type-eyebrow text-[var(--brand)] block mb-1">
            CLINICAL SAFEGUARDS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
            Do you have any conditions requiring gentle, supervised guidance?
          </h1>
        </div>

        {/* Ephemeral Privacy Guarantee Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)]">
          <Lock className="w-3 h-3 text-[var(--brand)] shrink-0" />
          <span>Held strictly in RAM · Never saved to database drafts or logs</span>
        </div>
      </div>

      <div className="space-y-2.5 max-w-md mx-auto pt-1">
        {HEALTH_OPTIONS.map((opt) => {
          const isChecked = healthConditions.includes(opt.id);
          const isNoneOption = opt.id === "none";
          return (
            <label
              key={opt.id}
              className={cn(
                "flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer pressable",
                isNoneOption && "mt-2",
                isChecked
                  ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)] shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(opt.id)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                    isChecked
                      ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                      : "border-[var(--border-strong)] bg-[var(--surface)]"
                  )}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {opt.label}
                </span>
              </div>

              {opt.isClinical && (
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] shrink-0">
                  Adaptive Safe Mode
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Dynamic guidance notices */}
      {hasClinicalCondition && (
        <div
          className="max-w-md mx-auto p-4 rounded-2xl border flex items-start gap-3 animate-fade-in"
          style={{
            backgroundColor: "var(--warning-subtle)",
            borderColor: "color-mix(in srgb, var(--warning) 30%, transparent)",
          }}
        >
          <Shield className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">
            SATAT prioritizes your safety. Single-point calorie targets and intensive deficit paces will be withheld, pivoting to mindful habit tracking and whole-food nourishment.
          </p>
        </div>
      )}

      {hasPhysicalInjury && !hasClinicalCondition && (
        <div
          className="max-w-md mx-auto p-4 rounded-2xl border flex items-start gap-3 animate-fade-in"
          style={{
            backgroundColor: "var(--brand-subtle)",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
          }}
        >
          <Info className="w-5 h-5 text-[var(--brand)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">
            Automated starter workout routines will be withheld to protect your recovery. Please consult your physiotherapist for rehabilitation exercises. Daily nutrition tracking remains active.
          </p>
        </div>
      )}

      {error && (
        <div
          className="max-w-md mx-auto p-3.5 rounded-xl border text-xs font-medium text-center"
          style={{
            backgroundColor: "var(--error-subtle)",
            borderColor: "color-mix(in srgb, var(--error) 30%, transparent)",
            color: "var(--error)",
          }}
        >
          {error}
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
          disabled={!hasSelection || isSaving}
          className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2"
        >
          <span>{isSaving ? "Completing Setup..." : "Generate System Baseline"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
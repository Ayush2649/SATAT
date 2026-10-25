// components/onboarding/StepPhysical.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, HelpCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BiologicalSex } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepPhysicalProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

export function StepPhysical({
  formValues,
  updateFormField,
  onNext,
  onBack,
  onSkip,
  isSaving,
}: StepPhysicalProps) {
  const router = useRouter();
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");

  const [heightCmInput, setHeightCmInput] = useState<string>(
    formValues.heightCm ? String(formValues.heightCm) : ""
  );
  const [weightKgInput, setWeightKgInput] = useState<string>(
    formValues.weightKg ? String(formValues.weightKg) : ""
  );

  const initialFeet = formValues.heightCm
    ? Math.floor(formValues.heightCm / 2.54 / 12)
    : "";
  const initialInches = formValues.heightCm
    ? Math.round((formValues.heightCm / 2.54) % 12)
    : "";
  const [heightFeetInput, setHeightFeetInput] = useState<string>(
    initialFeet !== "" ? String(initialFeet) : ""
  );
  const [heightInchesInput, setHeightInchesInput] = useState<string>(
    initialInches !== "" ? String(initialInches) : ""
  );
  const [weightLbsInput, setWeightLbsInput] = useState<string>(
    formValues.weightKg ? String(Math.round(formValues.weightKg * 2.20462)) : ""
  );

  const [ageInput, setAgeInput] = useState<string>(
    formValues.age ? String(formValues.age) : ""
  );
  const [ageError, setAgeError] = useState<string | null>(null);

  const sexSelected = formValues.biologicalSex;

  const liveBiometrics = useMemo(() => {
    const h = formValues.heightCm;
    const w = formValues.weightKg;
    const a = formValues.age;
    if (!h || !w || h < 120 || w < 35) return null;
    const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    let bmr: number | null = null;
    if (a && a >= 18 && a <= 100) {
      const base = 10 * w + 6.25 * h - 5 * a;
      if (sexSelected === "male") bmr = Math.round(base + 5);
      else if (sexSelected === "female") bmr = Math.round(base - 161);
      else bmr = Math.round(base - 78);
    }
    return { bmi, bmr };
  }, [formValues.heightCm, formValues.weightKg, formValues.age, sexSelected]);

  const handleHeightCmChange = (val: string) => {
    setHeightCmInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      updateFormField("heightCm", Math.round(num * 10) / 10);
      const totalInches = num / 2.54;
      setHeightFeetInput(String(Math.floor(totalInches / 12)));
      setHeightInchesInput(String(Math.round(totalInches % 12)));
    } else {
      updateFormField("heightCm", null);
    }
  };

  const handleImperialHeightChange = (feet: string, inches: string) => {
    setHeightFeetInput(feet);
    setHeightInchesInput(inches);
    const f = parseFloat(feet) || 0;
    const i = parseFloat(inches) || 0;
    if (f > 0 || i > 0) {
      const cm = Math.round((f * 12 + i) * 2.54 * 10) / 10;
      setHeightCmInput(String(cm));
      updateFormField("heightCm", cm);
    } else {
      updateFormField("heightCm", null);
    }
  };

  const handleWeightKgChange = (val: string) => {
    setWeightKgInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      updateFormField("weightKg", Math.round(num * 10) / 10);
      setWeightLbsInput(String(Math.round(num * 2.20462)));
    } else {
      updateFormField("weightKg", null);
    }
  };

  const handleWeightLbsChange = (val: string) => {
    setWeightLbsInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const kg = Math.round((num / 2.20462) * 10) / 10;
      setWeightKgInput(String(kg));
      updateFormField("weightKg", kg);
    } else {
      updateFormField("weightKg", null);
    }
  };

  const handleAgeChange = (val: string) => {
    setAgeInput(val);
    if (!val.trim()) {
      setAgeError(null);
      updateFormField("age", null);
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setAgeError(null);
      updateFormField("age", null);
      return;
    }
    if (num > 100) {
      setAgeError("Please enter an age between 18 and 100.");
      updateFormField("age", null);
      return;
    }
    setAgeError(null);
    updateFormField("age", num);
  };

  const handleContinue = () => {
    if (ageInput.trim()) {
      const num = parseInt(ageInput, 10);
      if (isNaN(num)) {
        setAgeError("Please enter a valid age.");
        return;
      }
      if (num < 18) {
        router.replace("/onboarding/under-18");
        return;
      }
      if (num > 100) {
        setAgeError("Please enter an age between 18 and 100.");
        return;
      }
      updateFormField("age", num);
    } else {
      updateFormField("age", null);
    }
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="space-y-4">
        {/* Header + Inline Unit Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">
              Biometric Baseline
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setUnitSystem("metric")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                  unitSystem === "metric"
                    ? "bg-[var(--brand)] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                Metric (cm, kg)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem("imperial")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                  unitSystem === "imperial"
                    ? "bg-[var(--brand)] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                Imperial (ft/in, lbs)
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight leading-snug">
            What is your current physical baseline?
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Used strictly to estimate resting energy expenditure. Never shared publicly.
          </p>
        </div>

        {/* Compact Phone-First Biometric Tiles */}
        {unitSystem === "metric" ? (
          <div className="grid grid-cols-3 gap-2.5">
            {/* Height */}
            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--brand)]">
              <label className="block text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 175"
                value={heightCmInput}
                onChange={(e) => handleHeightCmChange(e.target.value)}
                className="w-full bg-transparent text-lg font-bold font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none"
              />
            </div>

            {/* Weight */}
            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--brand)]">
              <label className="block text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 70"
                value={weightKgInput}
                onChange={(e) => handleWeightKgChange(e.target.value)}
                className="w-full bg-transparent text-lg font-bold font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none"
              />
            </div>

            {/* Age */}
            <div
              className={cn(
                "p-3 rounded-2xl bg-[var(--surface)] border",
                ageError ? "border-[var(--error)]" : "border-[var(--border)] focus-within:border-[var(--brand)]"
              )}
            >
              <label className="block text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                Age (yrs)
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 28"
                value={ageInput}
                onChange={(e) => handleAgeChange(e.target.value)}
                className="w-full bg-transparent text-lg font-bold font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <label className="block text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                Height (ft / in)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Feet (e.g. 5)"
                  value={heightFeetInput}
                  onChange={(e) => handleImperialHeightChange(e.target.value, heightInchesInput)}
                  className="w-full bg-[var(--surface-subtle)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm font-bold font-mono text-[var(--text-primary)] focus:outline-none"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Inches (e.g. 9)"
                  value={heightInchesInput}
                  onChange={(e) => handleImperialHeightChange(heightFeetInput, e.target.value)}
                  className="w-full bg-[var(--surface-subtle)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm font-bold font-mono text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <label className="block text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 154"
                  value={weightLbsInput}
                  onChange={(e) => handleWeightLbsChange(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold font-mono text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <label className="block text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                  Age (yrs)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 28"
                  value={ageInput}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold font-mono text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {ageError && <p className="text-xs text-[var(--error)] font-medium">{ageError}</p>}

        {/* Biological Sex */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Biological Sex
            </label>
            <span className="text-[10px] text-[var(--text-muted)]">For metabolic formula</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "female" as BiologicalSex, label: "Female" },
              { id: "male" as BiologicalSex, label: "Male" },
              { id: "prefer_not_to_say" as BiologicalSex, label: "Prefer not to say" },
            ].map((opt) => {
              const isSelected = sexSelected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateFormField("biologicalSex", opt.id)}
                  className={cn(
                    "satat-option-row py-2.5 px-2 rounded-xl border text-xs font-semibold text-center",
                    isSelected
                      ? "border-[var(--brand)] bg-[var(--brand-subtle)] text-[var(--brand)] ring-1 ring-[var(--brand)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {sexSelected === "prefer_not_to_say" && (
            <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 pt-0.5">
              <HelpCircle className="w-3 h-3 text-[var(--brand)] shrink-0" />
              <span>SATAT will estimate an energy range rather than a fixed target.</span>
            </p>
          )}
        </div>

        {/* Live Resting Metabolic Pill */}
        {liveBiometrics && (
          <div className="px-3.5 py-2.5 rounded-xl bg-[var(--brand-subtle)] border border-[var(--brand)]/25 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
              <Activity className="w-3.5 h-3.5 text-[var(--brand)]" />
              Resting Baseline (BMR)
            </span>
            <span className="font-mono font-bold text-[var(--brand)]">
              {liveBiometrics.bmr
                ? `~${liveBiometrics.bmr.toLocaleString()} kcal/d · BMI ${liveBiometrics.bmi}`
                : `BMI ${liveBiometrics.bmi}`}
            </span>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="satat-onboarding-footer border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1"
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
            Skip for now
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isSaving || Boolean(ageError)}
            className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-1.5"
          >
            <span>{isSaving ? "Saving..." : "Continue"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
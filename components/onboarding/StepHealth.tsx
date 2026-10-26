// components/onboarding/StepHealth.tsx
"use client";

import { useEffect } from "react";
import { Lock, HeartPulse, ArrowRight, Check } from "lucide-react";
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
  isSaving,
  error,
}: StepHealthProps) {
  useEffect(() => {
    if (healthConditions.length === 0) {
      setHealthConditions(["none"]);
    }
  }, [healthConditions.length, setHealthConditions]);

  const handleToggle = (id: HealthCondition) => {
    if (id === "none") {
      setHealthConditions(["none"]);
      return;
    }

    const next = healthConditions.filter((c) => c !== "none");
    if (next.includes(id)) {
      const remaining = next.filter((c) => c !== id);
      setHealthConditions(remaining.length === 0 ? ["none"] : remaining);
    } else {
      setHealthConditions([...next, id]);
    }
  };

  const effectiveConditions = healthConditions.length === 0 ? ["none"] : healthConditions;
  const hasClinicalCondition = effectiveConditions.some((c) =>
    ["pregnant_breastfeeding", "diabetes", "cardiovascular", "disordered_eating"].includes(c)
  );
  const hasSelectedCondition = effectiveConditions.some((c) => c !== "none");
  const hasSelection = effectiveConditions.length > 0;

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 08 · GENTLE GUIDANCE</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          Any conditions requiring <span className="italic text-[#E05A47]">gentle guidance?</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          Satat places human safety before numerical targets. We respect clinical boundaries.
        </p>

        {/* Ephemeral Privacy Guarantee Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFECE4] border border-[#1C1917]/[0.05] text-[11px] font-mono text-[#57534E] mt-3">
          <Lock className="w-3 h-3 text-[#2D6A4F] shrink-0" />
          <span>Held strictly in RAM · Never saved to database drafts or logs</span>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Health Options Cards */}
        <div className="space-y-2.5 mt-5">
          {HEALTH_OPTIONS.map((opt) => {
            const isChecked = effectiveConditions.includes(opt.id);
            const isNoneOption = opt.id === "none";
            return (
              <label
                key={opt.id}
                className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[22px] transition-all cursor-pointer active:scale-[0.99] border-2 ${
                  isNoneOption ? "mt-3" : ""
                } ${
                  isChecked
                    ? "bg-[#191D1A] text-[#FCFBF9] border-[#E05A47] shadow-sm"
                    : "bg-[#FCFBF9] text-[#1C1917] border-transparent shadow-xs hover:border-stone-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(opt.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? "bg-[#E05A47] text-white"
                        : "border-2 border-stone-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      isChecked ? "text-white" : "text-[#1C1917]"
                    } ${isNoneOption ? "font-semibold" : ""}`}
                  >
                    {opt.label}
                  </span>
                </div>

                {opt.isClinical && (
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      isChecked
                        ? "bg-white/10 text-stone-300"
                        : "bg-[#EFECE4] text-[#8C857B]"
                    }`}
                  >
                    Clinical boundary
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full py-2.5 pl-5 pr-2.5 shadow-md border border-[#1C1917]/[0.06] flex items-center justify-between gap-3 mt-6">
        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block truncate">
            SAFETY CLEARANCE
          </span>
          <span className="text-xs font-semibold text-[#1C1917] block truncate whitespace-nowrap">
            {hasSelectedCondition ? "Gentle Mode" : "Standard Mode"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNext()}
          disabled={!hasSelection || isSaving}
          aria-label="Generate System Baseline"
          className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-5 py-3 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
        >
          <span>Generate Baseline</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

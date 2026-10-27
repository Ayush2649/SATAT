// components/onboarding/StepConsent.tsx
"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Check, ArrowRight } from "lucide-react";
import { CONSENT_VERSION } from "@/lib/onboarding/constants";
import type { OnboardingFormValues } from "./types";

interface StepConsentProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: (overrides?: Partial<OnboardingFormValues>) => void;
  isSaving: boolean;
}

export function StepConsent({
  formValues,
  updateFormField,
  onNext,
  isSaving,
}: StepConsentProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(formValues.confirmedAge18Plus);
  const [termsAgreed, setTermsAgreed] = useState(
    typeof formValues.consentGivenAt === "number" && formValues.consentGivenAt > 0
  );

  const handleToggleAge = (checked: boolean) => {
    setAgeConfirmed(checked);
    updateFormField("confirmedAge18Plus", checked);
  };

  const handleToggleTerms = (checked: boolean) => {
    setTermsAgreed(checked);
    const now = checked ? Date.now() : null;
    updateFormField("consentGivenAt", now);
    updateFormField("consentVersion", checked ? CONSENT_VERSION : null);
  };

  const canProceed = ageConfirmed && termsAgreed;

  const handleBegin = () => {
    if (!canProceed) return;
    const timestamp =
      typeof formValues.consentGivenAt === "number" && formValues.consentGivenAt > 0
        ? formValues.consentGivenAt
        : Date.now();

    updateFormField("confirmedAge18Plus", true);
    updateFormField("consentGivenAt", timestamp);
    updateFormField("consentVersion", CONSENT_VERSION);
    onNext({
      confirmedAge18Plus: true,
      consentGivenAt: timestamp,
      consentVersion: CONSENT_VERSION,
    });
  };

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 00 · SYSTEM PROTOCOL</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          Welcome to <span className="italic text-[#E05A47]">Satat.</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          Before we calibrate your baseline, please review how Satat supports your daily rhythm.
        </p>

        {/* Operating Scope & Boundary Card */}
        <div className="bg-[#FCFBF9] rounded-[24px] p-5 border border-[#1C1917]/[0.06] shadow-xs mt-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#57534E] font-semibold">
            <Lock className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Operating Scope &amp; Boundaries</span>
          </div>
          <p className="text-xs text-[#57534E] leading-relaxed">
            Satat is a continuous lifestyle habit companion designed for adults. Satat provides
            habit cadence, nutrition baselines, and structured movement. Satat does not provide
            medical therapy, clinical eating disorder rehabilitation, or pediatric growth tracking.
          </p>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-3 mt-4">
          {/* Checkbox 1: Age 18+ */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-[22px] border-2 transition-all cursor-pointer active:scale-[0.99] ${
              ageConfirmed
                ? "bg-[#FCFBF9] border-[#2D6A4F] shadow-xs"
                : "bg-[#FCFBF9] border-stone-200/70 hover:border-stone-300"
            }`}
          >
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => handleToggleAge(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                ageConfirmed
                  ? "bg-[#2D6A4F] text-white"
                  : "border-2 border-stone-300 bg-white"
              }`}
            >
              {ageConfirmed && <Check className="w-4 h-4 stroke-[2.5]" />}
            </div>
            <div>
              <span className="font-sans font-bold text-sm text-[#1C1917] block">
                I confirm I am 18 years of age or older
              </span>
              <span className="text-xs text-[#57534E] mt-0.5 block leading-relaxed">
                Satat algorithms and recovery floors are designed exclusively for adult physiology.
              </span>
            </div>
          </label>

          {/* Checkbox 2: Scope & Terms */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-[22px] border-2 transition-all cursor-pointer active:scale-[0.99] ${
              termsAgreed
                ? "bg-[#FCFBF9] border-[#2D6A4F] shadow-xs"
                : "bg-[#FCFBF9] border-stone-200/70 hover:border-stone-300"
            }`}
          >
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => handleToggleTerms(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                termsAgreed
                  ? "bg-[#2D6A4F] text-white"
                  : "border-2 border-stone-300 bg-white"
              }`}
            >
              {termsAgreed && <Check className="w-4 h-4 stroke-[2.5]" />}
            </div>
            <div>
              <span className="font-sans font-bold text-sm text-[#1C1917] block">
                I understand the operating scope and agree to Terms
              </span>
              <span className="text-xs text-[#57534E] mt-0.5 block leading-relaxed">
                I agree to the Satat Terms of Service, Privacy Policy, and safety guidelines.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-6">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
            ADULT HEALTH PROTOCOL
          </span>
          <span className="text-xs font-bold text-[#1C1917]">
            {CONSENT_VERSION} · Active Consent
          </span>
        </div>

        <button
          type="button"
          onClick={handleBegin}
          disabled={!canProceed || isSaving}
          aria-label="Begin Onboarding"
          className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-6 py-3.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Begin Onboarding</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

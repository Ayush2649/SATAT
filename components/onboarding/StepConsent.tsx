// components/onboarding/StepConsent.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ChevronRight, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const router = useRouter();
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
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--brand-subtle)] border border-[var(--border)] text-[var(--brand)] mb-1">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <span className="type-eyebrow text-[var(--brand)] block mb-1.5">
            SYSTEM PROTOCOL · {CONSENT_VERSION}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
            Welcome to Satat
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          Before we calibrate your baseline, please review how SATAT supports your daily rhythm.
        </p>
      </div>

      {/* Clinical & Scope Boundary Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          <Lock className="w-3.5 h-3.5 text-[var(--brand)]" />
          <span>Operating Scope &amp; Privacy</span>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          Satat is a daily habit companion designed for adults. Satat provides
          lifestyle estimates, habit tracking, and structured movement routines.
          Satat does not provide medical therapy, eating disorder treatment, or
          pediatric growth tracking.
        </p>
      </div>

      {/* Interactive Consent Checkboxes */}
      <div className="space-y-3 pt-1">
        <label
          className={cn(
            "flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer pressable",
            ageConfirmed
              ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)]"
              : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]"
          )}
        >
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => handleToggleAge(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                ageConfirmed
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "border-[var(--border-strong)] bg-[var(--surface)]"
              )}
            >
              {ageConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] leading-snug">
            I confirm that I am 18 years of age or older.
          </span>
        </label>

        <label
          className={cn(
            "flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer pressable",
            termsAgreed
              ? "border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)]"
              : "border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]"
          )}
        >
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => handleToggleTerms(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                termsAgreed
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "border-[var(--border-strong)] bg-[var(--surface)]"
              )}
            >
              {termsAgreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] leading-snug">
            I agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-[var(--brand)] font-semibold underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-[var(--brand)] font-semibold underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            , and consent to processing my entries to generate my baseline rhythm.
          </span>
        </label>
      </div>

      <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.replace("/onboarding/under-18")}
          className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-4 py-1"
        >
          I am under 18
        </button>

        <button
          type="button"
          onClick={handleBegin}
          disabled={!canProceed || isSaving}
          className="w-full sm:w-auto btn-primary px-7 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
        >
          <span>{isSaving ? "Saving..." : "Begin Onboarding"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
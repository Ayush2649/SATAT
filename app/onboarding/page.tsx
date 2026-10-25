// app/onboarding/page.tsx
"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useOnboardingWizard } from "@/components/onboarding/useOnboardingWizard";
import { StepConsent } from "@/components/onboarding/StepConsent";
import { StepFocus } from "@/components/onboarding/StepFocus";
import { StepPhysical } from "@/components/onboarding/StepPhysical";
import { StepPace } from "@/components/onboarding/StepPace";
import { StepActivity } from "@/components/onboarding/StepActivity";
import { StepWorkoutRhythm } from "@/components/onboarding/StepWorkoutRhythm";
import { StepWorkoutEnv } from "@/components/onboarding/StepWorkoutEnv";
import { StepDiet } from "@/components/onboarding/StepDiet";
import { StepHealth } from "@/components/onboarding/StepHealth";
import { StepReveal } from "@/components/onboarding/StepReveal";
import { CANONICAL_STEPS } from "@/lib/onboarding/constants";
import { calculateNutritionTargets } from "@/lib/nutrition/calculations";
import Logo from "@/components/Logo";
import { OrbitMark } from "@/components/orbit/OrbitMark";
import { Loader2, Flame, Dumbbell, Moon, Sun } from "lucide-react";

const GOAL_PALETTES: Record<
  string,
  { orb1: string; orb2: string; orb3: string; ring: string; label: string }
> = {
  default: {
    orb1: "#4F6BFF",
    orb2: "#8B5CF6",
    orb3: "#06B6D4",
    ring: "#5B78FF",
    label: "Awaiting Vector",
  },
  fat_loss: {
    orb1: "#F59E0B",
    orb2: "#4F6BFF",
    orb3: "#F43F5E",
    ring: "#F59E0B",
    label: "Lean Cut Vector",
  },
  muscle_gain: {
    orb1: "#4F6BFF",
    orb2: "#06B6D4",
    orb3: "#6366F1",
    ring: "#38BDF8",
    label: "Hypertrophy Vector",
  },
  vitality_health: {
    orb1: "#10B981",
    orb2: "#06B6D4",
    orb3: "#4F6BFF",
    ring: "#10B981",
    label: "Vitality Equilibrium",
  },
  habit_routine: {
    orb1: "#8B5CF6",
    orb2: "#EC4899",
    orb3: "#4F6BFF",
    ring: "#A855F7",
    label: "Continuity Loop",
  },
};

const STEP_ORB_COORDS: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  scale: number;
}[] = [
  { x1: -15, y1: -10, x2: 20, y2: 25, x3: -10, y3: 35, scale: 1.0 },
  { x1: 18, y1: -18, x2: -22, y2: 15, x3: 15, y3: 30, scale: 1.08 },
  { x1: -25, y1: 12, x2: 25, y2: -12, x3: -5, y3: -25, scale: 1.12 },
  { x1: 22, y1: 20, x2: -18, y2: -20, x3: -20, y3: 22, scale: 1.05 },
  { x1: -12, y1: -24, x2: 28, y2: 10, x3: 10, y3: 28, scale: 1.15 },
  { x1: 26, y1: -8, x2: -26, y2: 22, x3: 0, y3: -18, scale: 1.1 },
  { x1: -20, y1: 24, x2: 16, y2: -22, x3: 24, y3: 16, scale: 1.06 },
  { x1: 14, y1: 18, x2: -24, y2: -14, x3: -14, y3: 26, scale: 1.14 },
  { x1: -18, y1: -16, x2: 22, y2: 20, x3: 16, y3: -20, scale: 1.08 },
  { x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0, scale: 1.28 },
];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const isUpdateMode = searchParams?.get("mode") === "update";

  const {
    state,
    updateFormField,
    setHealthConditions,
    handleNext,
    handleBack,
    handleSkip,
    handleConfirmUpdate,
  } = useOnboardingWizard({ isUpdateMode });

  const [darkStage, setDarkStage] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);

  const currentStepIndex = Math.max(0, CANONICAL_STEPS.indexOf(state.currentStep));
  const totalSteps = CANONICAL_STEPS.length;
  const isRevealStep = state.currentStep === "step_9_reveal";

  const interactionSeed = useMemo(() => {
    const fv = state.formValues;
    const str = [
      state.currentStep,
      fv.confirmedAge18Plus,
      fv.consentGivenAt ? 1 : 0,
      fv.focusGoal,
      fv.heightCm,
      fv.weightKg,
      fv.age,
      fv.biologicalSex,
      fv.targetWeightKg,
      fv.paceTier,
      fv.activityLevel,
      fv.includeWorkouts,
      fv.workoutDaysPerWeek,
      fv.availableTrainingTimeMinutes,
      fv.trainingExperience,
      fv.preferredTrainingWindow,
      fv.equipmentAccess,
      fv.dietaryPattern,
      (fv.foodAvoidances || []).join(","),
      state.healthConditions.join(","),
    ].join("|");

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 3600;
    }
    return hash;
  }, [state.currentStep, state.formValues, state.healthConditions]);

  useEffect(() => {
    setPulseKey((prev) => prev + 1);
  }, [interactionSeed]);

  const livePreview = useMemo(() => {
    const fv = state.formValues;
    if (!fv.focusGoal) return null;
    try {
      return calculateNutritionTargets({
        focusGoal: fv.focusGoal,
        heightCm: fv.heightCm ?? null,
        weightKg: fv.weightKg ?? null,
        age: fv.age ?? null,
        biologicalSex: fv.biologicalSex ?? null,
        activityLevel: fv.activityLevel ?? "lightly_active",
        paceTier: fv.paceTier ?? "steady",
        healthSensitivityMode: false,
        withholdNutritionDueToHealth: false,
      });
    } catch {
      return null;
    }
  }, [state.formValues]);

  if (state.isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#06080D] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#4F6BFF]/15 border border-[#4F6BFF]/30 flex items-center justify-center text-[#5B78FF] shadow-[0_0_40px_rgba(79,107,255,0.35)]">
            <OrbitMark size={28} state="thinking" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Loader2 className="w-4 h-4 text-[#5B78FF] animate-spin" />
            <span>{isUpdateMode ? "Loading your SATAT setup..." : "Initializing SATAT..."}</span>
          </div>
        </div>
      </div>
    );
  }

  const palette = GOAL_PALETTES[state.formValues.focusGoal || "default"] || GOAL_PALETTES.default;
  const coords = STEP_ORB_COORDS[currentStepIndex] || STEP_ORB_COORDS[0];

  const microOffset = (interactionSeed % 90) - 45;
  const outerRingAngle = currentStepIndex * 36 + microOffset * 0.6;
  const middleRingAngle = -currentStepIndex * 48 - microOffset * 0.9;
  const innerRingAngle = currentStepIndex * 72 + microOffset * 1.2;

  const gridPanX = -(currentStepIndex * 32 + (interactionSeed % 24));
  const gridPanY = -(currentStepIndex * 22 + ((interactionSeed >> 2) % 24));

  const workoutNodes = state.formValues.includeWorkouts
    ? state.formValues.workoutDaysPerWeek || 3
    : 0;

  return (
    <div
      className={`satat-onboarding-stage ${
        darkStage ? "dark force-dark-stage" : ""
      } min-h-[100dvh] flex flex-col justify-between py-4 sm:py-8 px-3.5 sm:px-6 relative overflow-hidden transition-colors duration-700 selection:bg-[var(--brand-subtle)] selection:text-[var(--brand)]`}
      style={{
        backgroundColor: darkStage ? "#06080D" : "#F3F6FC",
        color: "var(--text-primary)",
      }}
    >
      {/* ── LIVING REACTIVE BACKGROUND ENGINE ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-[-120px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate3d(${gridPanX}px, ${gridPanY}px, 0)`,
            backgroundImage: darkStage
              ? `radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px),
                 linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`
              : `radial-gradient(circle, rgba(59,84,212,0.16) 1px, transparent 1px),
                 linear-gradient(to right, rgba(59,84,212,0.045) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(59,84,212,0.045) 1px, transparent 1px)`,
            backgroundSize: "32px 32px, 96px 96px, 96px 96px",
            maskImage: "radial-gradient(ellipse 80% 75% at 50% 45%, black 35%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 75% at 50% 45%, black 35%, transparent 100%)",
          }}
        />

        <div className="absolute inset-0 animate-aurora-float">
          <div
            className="absolute top-1/4 left-1/2 w-[420px] sm:w-[620px] h-[420px] sm:h-[620px] rounded-full blur-[95px] sm:blur-[120px] transition-all duration-1000 ease-out"
            style={{
              backgroundColor: palette.orb1,
              opacity: darkStage ? 0.28 : 0.24,
              transform: `translate3d(calc(-50% + ${coords.x1 + (microOffset % 15)}vw), ${
                coords.y1
              }vh, 0) scale(${coords.scale})`,
            }}
          />

          <div
            className="absolute top-1/2 left-1/2 w-[360px] sm:w-[540px] h-[360px] sm:h-[540px] rounded-full blur-[90px] sm:blur-[115px] transition-all duration-1000 ease-out"
            style={{
              backgroundColor: palette.orb2,
              opacity: darkStage ? 0.22 : 0.20,
              transform: `translate3d(calc(-50% + ${coords.x2}vw), ${
                coords.y2 - (microOffset % 12)
              }vh, 0) scale(${2.1 - coords.scale * 0.8})`,
            }}
          />

          <div
            className="absolute bottom-1/4 left-1/2 w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] rounded-full blur-[85px] sm:blur-[110px] transition-all duration-1000 ease-out"
            style={{
              backgroundColor: palette.orb3,
              opacity: darkStage ? 0.18 : 0.18,
              transform: `translate3d(calc(-50% + ${coords.x3}vw), ${coords.y3}vh, 0) scale(${
                coords.scale
              })`,
            }}
          />
        </div>

        <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] sm:w-[760px] h-[540px] sm:h-[760px] flex items-center justify-center">
          <div
            key={pulseKey}
            className="absolute top-1/2 left-1/2 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full border-2 animate-orbital-wave"
            style={{
              borderColor: palette.ring,
            }}
          />

          <svg
            viewBox="0 0 600 600"
            className="w-full h-full overflow-visible"
            style={{ opacity: darkStage ? 0.55 : 0.45 }}
          >
            <defs>
              <linearGradient id="satat-orbital-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={palette.orb1} stopOpacity="0.85" />
                <stop offset="50%" stopColor={palette.orb2} stopOpacity="0.35" />
                <stop offset="100%" stopColor={palette.orb3} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <g
              style={{
                transform: `rotate(${outerRingAngle}deg)`,
                transformOrigin: "300px 300px",
                transition: "transform 950ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <circle
                cx="300"
                cy="300"
                r="265"
                fill="none"
                stroke="url(#satat-orbital-grad)"
                strokeWidth="1.25"
                strokeDasharray="6 10"
              />
              {CANONICAL_STEPS.map((_, idx) => {
                const angleRad = (idx * 36 * Math.PI) / 180;
                const cx = 300 + 265 * Math.cos(angleRad);
                const cy = 300 + 265 * Math.sin(angleRad);
                const reached = idx <= currentStepIndex;
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r={reached ? 4.5 : 2.5}
                    fill={reached ? palette.orb1 : "currentColor"}
                    opacity={reached ? 0.95 : 0.25}
                  />
                );
              })}
            </g>

            <g
              style={{
                transform: `rotate(${middleRingAngle}deg)`,
                transformOrigin: "300px 300px",
                transition: "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <circle
                cx="300"
                cy="300"
                r="210"
                fill="none"
                stroke={palette.ring}
                strokeWidth="1.5"
                strokeOpacity="0.28"
                strokeDasharray="140 80 40 80"
              />
              {Array.from({ length: workoutNodes }).map((_, idx) => {
                const angleRad = ((idx * (360 / workoutNodes)) * Math.PI) / 180;
                const cx = 300 + 210 * Math.cos(angleRad);
                const cy = 300 + 210 * Math.sin(angleRad);
                return (
                  <g key={idx}>
                    <circle cx={cx} cy={cy} r="8" fill={palette.orb2} opacity="0.25" />
                    <circle cx={cx} cy={cy} r="4" fill={palette.orb1} />
                  </g>
                );
              })}
            </g>

            <g
              style={{
                transform: `rotate(${innerRingAngle}deg) scale(${
                  0.92 + currentStepIndex * 0.015
                })`,
                transformOrigin: "300px 300px",
                transition: "transform 850ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <circle
                cx="300"
                cy="300"
                r="152"
                fill="none"
                stroke="url(#satat-orbital-grad)"
                strokeWidth="2"
                strokeDasharray="90 190"
                strokeLinecap="round"
              />
              <circle cx="300" cy="148" r="5" fill={palette.ring} />
            </g>
          </svg>
        </div>
      </div>

      {/* ── FOREGROUND GLASS INTERFACE ── */}
      <div className="relative z-10 w-full max-w-xl mx-auto space-y-3.5 sm:space-y-5">
        {!isRevealStep && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-3">
              {/* Left: Brand + Non-Wrapping Step Counter */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
                <Logo size={22} className="rounded-lg shadow-xs shrink-0" />
                <span className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)]">
                  SATAT
                </span>
                <span className="text-[var(--border-strong)]">·</span>
                <span className="font-mono text-[11px] font-medium text-[var(--text-secondary)] whitespace-nowrap">
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
              </div>

              {/* Right: Non-Wrapping Telemetry Capsule + Theme Toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                {livePreview?.targetCalories && (
                  <div className="satat-glass-card px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] shadow-xs flex items-center gap-1.5 text-[11px] font-mono whitespace-nowrap">
                    <span className="flex items-center gap-1 font-bold text-[var(--text-primary)] whitespace-nowrap">
                      <Flame className="w-3 h-3 shrink-0" style={{ color: palette.ring }} />
                      {livePreview.targetCalories}
                      <span className="text-[10px] font-normal text-[var(--text-muted)]">kcal</span>
                    </span>

                    <span className="text-[var(--border-strong)]">·</span>

                    <span
                      className="font-bold whitespace-nowrap"
                      style={{ color: palette.ring }}
                    >
                      {livePreview.proteinGrams}g P
                    </span>

                    {state.formValues.includeWorkouts && state.formValues.workoutDaysPerWeek && (
                      <>
                        <span className="text-[var(--border-strong)]">·</span>
                        <span className="flex items-center gap-0.5 font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                          <Dumbbell className="w-3 h-3 shrink-0" />
                          {state.formValues.workoutDaysPerWeek}d
                        </span>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setDarkStage((d) => !d)}
                  title="Switch Onboarding Atmosphere"
                  className="w-7 h-7 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xs shrink-0 transition-transform active:scale-90"
                >
                  {darkStage ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 10-Segment Luminous Progress Bar */}
            <div className="grid grid-cols-10 gap-1" aria-hidden="true">
              {CANONICAL_STEPS.map((stepKey, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={stepKey}
                    className="h-1.5 rounded-full overflow-hidden transition-all duration-500"
                    style={{
                      backgroundColor: isCompleted
                        ? palette.ring
                        : isCurrent
                        ? "var(--brand-subtle)"
                        : "var(--border)",
                      boxShadow: isCompleted ? `0 0 10px ${palette.ring}66` : "none",
                    }}
                  >
                    {isCurrent && (
                      <div
                        className="h-full w-full rounded-full animate-pulse"
                        style={{ backgroundColor: palette.ring }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {state.error && (
          <div
            className="p-3.5 rounded-2xl border text-xs font-medium text-center animate-fade-in backdrop-blur-md"
            style={{
              backgroundColor: "var(--error-subtle)",
              borderColor: "color-mix(in srgb, var(--error) 30%, transparent)",
              color: "var(--error)",
            }}
          >
            {state.error}
          </div>
        )}

        {/* Main Frosted Glass Stage */}
        <div
          key={state.currentStep}
          className="satat-glass-card animate-onboarding-step rounded-[26px] sm:rounded-[32px] p-4 sm:p-8 relative overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] transition-colors duration-700"
            style={{
              background: `linear-gradient(90deg, transparent 5%, ${palette.orb1}88 50%, transparent 95%)`,
            }}
          />

          {state.currentStep === "step_0_consent" && (
            <StepConsent
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_1_focus" && (
            <StepFocus
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              onBack={handleBack}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_2_physical" && (
            <StepPhysical
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_3_pace" && (
            <StepPace
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_4_activity" && (
            <StepActivity
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_5_workout_rhythm" && (
            <StepWorkoutRhythm
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              onBack={handleBack}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_6_workout_env" && (
            <StepWorkoutEnv
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              onBack={handleBack}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_7_diet" && (
            <StepDiet
              formValues={state.formValues}
              updateFormField={updateFormField}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              isSaving={state.isSaving}
            />
          )}

          {state.currentStep === "step_8_health" && (
            <StepHealth
              healthConditions={state.healthConditions}
              setHealthConditions={setHealthConditions}
              onNext={handleNext}
              onBack={handleBack}
              isSaving={state.isSaving}
              error={state.error}
            />
          )}

          {state.currentStep === "step_9_reveal" && (
            <StepReveal
              formValues={state.formValues}
              completedResult={state.completedResult}
              isUpdateMode={isUpdateMode}
              onConfirmUpdate={handleConfirmUpdate}
              onBack={handleBack}
              isSaving={state.isSaving}
            />
          )}
        </div>
      </div>

      <footer className="relative z-10 w-full text-center pt-4 pb-1 text-[11px] font-mono text-[var(--text-muted)]">
        SATAT System · Continuity is the Catalyst
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#06080D] text-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 text-[#5B78FF] animate-spin" />
            <p className="text-sm font-medium text-slate-400">
              Initializing SATAT...
            </p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
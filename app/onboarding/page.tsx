// app/onboarding/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { OrbitMark } from "@/components/orbit/OrbitMark";

const STEP_TITLES: Record<string, string> = {
  step_0_consent: "Safety & Eligibility",
  step_1_focus: "",
  step_2_physical: "Physical Baseline",
  step_3_pace: "Pace & Cadence",
  step_4_activity: "Daily Movement",
  step_5_workout_rhythm: "Training Rhythm",
  step_6_workout_env: "Training Space",
  step_7_diet: "Daily Nourishment",
  step_8_health: "Gentle Guidance",
  step_9_reveal: "Profile Completion",
};

const SKIPPABLE_STEPS = ["step_2_physical", "step_3_pace", "step_4_activity", "step_7_diet"];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const isUpdateMode = searchParams?.get("mode") === "update";
  const { data: session } = useSession();
  const userImage = session?.user?.image;

  const {
    state,
    updateFormField,
    setHealthConditions,
    handleNext,
    handleBack,
    handleSkip,
    handleConfirmUpdate,
  } = useOnboardingWizard({ isUpdateMode });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.currentStep]);

  const currentStepIndex = Math.max(0, CANONICAL_STEPS.indexOf(state.currentStep));
  const totalSteps = CANONICAL_STEPS.length;
  const isFirstStep = state.currentStep === "step_0_consent";
  const isSkippable = SKIPPABLE_STEPS.includes(state.currentStep);

  const getProgressLabel = () => {
    if (state.currentStep === "step_9_reveal") return { text: "SYNTHESIS COMPLETE", isSuccess: true };
    if (state.currentStep === "step_2_physical") return { text: "CALIBRATION PROGRESS", isSuccess: false };
    if (state.currentStep === "step_3_pace") return { text: "RHYTHM ARCHITECTURE", isSuccess: false };
    return { text: "SYSTEM CALIBRATION", isSuccess: false };
  };

  const progressLabel = getProgressLabel();

  if (state.isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F6F3EC] text-[#1C1917]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#1C1917]/10 flex items-center justify-center shadow-sm">
            <OrbitMark size={32} />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#57534E]">
            <Loader2 className="w-4 h-4 text-[#2D6A4F] animate-spin" />
            <span>{isUpdateMode ? "Loading your SATAT setup..." : "Initializing SATAT..."}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F3EC] text-[#1C1917] flex flex-col justify-between px-5 py-5 sm:py-8 relative overflow-x-hidden selection:bg-[#E05A47]/15 selection:text-[#E05A47]">
      {/* Top Soft Botanical Sage Radial Wash */}
      <div
        className="absolute top-0 inset-x-0 h-48 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(216, 243, 220, 0.55) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col flex-1">
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between w-full h-10 mb-2">
          {/* Left: Back arrow button */}
          <div className="w-10 flex items-center justify-start">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back"
                className="w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-[#1C1917]/[0.06] text-[#1C1917] flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-[#1C1917]" />
              </button>
            )}
          </div>

          {/* Center: Dynamic Step Title */}
          <h2 className="font-sans font-semibold text-base text-[#1C1917] tracking-tight text-center flex-1">
            {STEP_TITLES[state.currentStep] || ""}
          </h2>

          {/* Right: Skip button + User icon badge */}
          <div className="w-24 flex items-center justify-end gap-2">
            {isSkippable && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer"
              >
                Skip
              </button>
            )}
            <div
              className="w-9 h-9 rounded-full bg-[#191D1A] text-white flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
              aria-label="User Profile"
            >
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt={session?.user?.name || "Profile"}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </div>
        </header>

        {/* Segmented Calibration Progress Bar */}
        <div className="w-full mt-2 mb-6">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.14em] uppercase mb-1.5">
            <span className={progressLabel.isSuccess ? "text-[#2D6A4F]" : "text-[#57534E]"}>
              {progressLabel.text}
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#57534E]">
              {currentStepIndex + 1 < 10 ? `0${currentStepIndex + 1}` : currentStepIndex + 1} / {totalSteps}
            </span>
          </div>

          {/* 10-Segment Progress Bar */}
          <div className="grid grid-cols-10 gap-1.5" aria-hidden="true">
            {CANONICAL_STEPS.map((stepKey, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;

              let segmentBg = "bg-[#1C1917]/10";
              if (idx === 0 && (isCurrent || isCompleted)) {
                segmentBg = isCurrent ? "bg-[#191D1A]" : "bg-[#E05A47]";
              } else if (isCurrent) {
                segmentBg = "bg-[#191D1A]";
              } else if (isCompleted) {
                segmentBg = "bg-[#2D6A4F]";
              }

              return (
                <div
                  key={stepKey}
                  className={`h-1.5 rounded-full transition-all duration-300 ${segmentBg}`}
                />
              );
            })}
          </div>
        </div>

        {/* Global Error Notice if any */}
        {state.error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 text-center animate-fade-in">
            {state.error}
          </div>
        )}

        {/* Main Step Container (Open Canvas — No Outer Box Card) */}
        <main className="w-full flex-1 flex flex-col justify-between">
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
        </main>
      </div>

      {/* Subtle Grounded Footer */}
      <footer className="w-full max-w-md mx-auto text-center pt-6 pb-2 text-[11px] font-mono text-[#8C857B] relative z-10">
        SATAT System · Continuity is the Catalyst
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#F6F3EC] text-[#1C1917]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 text-[#2D6A4F] animate-spin" />
            <p className="text-sm font-medium text-[#57534E]">
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

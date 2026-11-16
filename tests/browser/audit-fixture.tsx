import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import DietPage from "@/components/diet/DietPage";
import TaskBoard from "@/components/tasks/TaskBoard";
import { ToastProvider } from "@/components/ui/Toast";
import { AccountContext, selectAccount } from "./audit-adapters";
import { useRituals } from "@/lib/useRituals";
import { useFocusTimer } from "@/lib/useFocusTimer";
import { StepPhysical } from "@/components/onboarding/StepPhysical";
import { StepConsent } from "@/components/onboarding/StepConsent";
import { StepWorkoutEnv } from "@/components/onboarding/StepWorkoutEnv";
import type { OnboardingFormValues } from "@/components/onboarding/types";
function LocalState({ uid }: { uid: string }) {
  const { rituals, toggleRitual } = useRituals(uid, "2026-11-15");
  const [completed, setCompleted] = useState(0);
  const timer = useFocusTimer(uid, () => setCompleted(value => value + 1));
  return <div className="flex flex-wrap gap-3 border-t py-3 text-sm">
    <span data-testid="ritual-status">Test ritual: {rituals.test ? "done" : "not done"}</span>
    <button onClick={() => toggleRitual("test")}>Toggle test ritual</button>
    <span data-testid="timer-status">Timer: {timer.secondsRemaining}s · {timer.isTimerRunning ? "running" : "paused"} · completed {completed}</span>
    <button onClick={() => timer.start(25)}>Start isolated timer</button>
    <button onClick={timer.reset}>Reset isolated timer</button>
  </div>;
}
function SetupSteps() {
  const [step, setStep] = useState("physical");
  const [values, setValues] = useState<OnboardingFormValues>({ consentGivenAt: null, consentVersion: null, confirmedAge18Plus: false, focusGoal: null, heightCm: null, weightKg: null, age: null, biologicalSex: null, targetWeightKg: null, paceTier: null, activityLevel: null, includeWorkouts: true, workoutDaysPerWeek: null, availableTrainingTimeMinutes: null, preferredTrainingWindow: null, equipmentAccess: null, trainingExperience: null, dietaryPattern: null, foodAvoidances: [] });
  const [continued, setContinued] = useState(0);
  function update<K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) { setValues(previous => ({ ...previous, [key]: value })); }
  const next = () => setContinued(value => value + 1);
  return <section className="mx-auto max-w-2xl space-y-4">
    <nav className="flex gap-3"><button onClick={() => setStep("physical")}>Test physical step</button><button onClick={() => setStep("consent")}>Test consent step</button><button onClick={() => setStep("equipment")}>Test equipment step</button></nav>
    <output aria-label="Setup test state">Continued {continued}; equipment {values.equipmentAccess || "none"}; consent {values.confirmedAge18Plus && values.consentGivenAt ? "recorded" : "not recorded"}</output>
    {step === "physical" ? <StepPhysical formValues={values} updateFormField={update} onNext={next} onBack={() => {}} onSkip={() => {}} isSaving={false} /> : step === "consent" ? <StepConsent formValues={values} updateFormField={update} onNext={next} isSaving={false} /> : <StepWorkoutEnv formValues={values} updateFormField={update} onNext={next} onBack={() => {}} isSaving={false} />}
  </section>;
}
function App() {
  const [uid, setUid] = useState("audit-browser-a");
  const [page, setPage] = useState("Fuel");
  const [mount, setMount] = useState(0);
  function changeAccount(next: string) { selectAccount(next); setUid(next); }
  const dark = document.documentElement.classList.contains("dark");
  const [theme, setTheme] = useState(dark);
  return <AccountContext.Provider value={uid}><ToastProvider>
    <header className="mb-5 rounded-2xl border border-[var(--satat-border-strong)] bg-[var(--satat-surface)] p-4 text-[var(--satat-text-primary)]">
      <h1 className="text-xl font-bold">Isolated SATAT audit</h1>
      <p className="text-xs my-2">Demo Firestore only · test account {uid.endsWith("a") ? "A" : "B"}. No Google login or production records. Scan uploads use a fixed UI-test response.</p>
      <nav className="flex flex-wrap gap-3 text-sm">
        <button onClick={() => changeAccount("audit-browser-a")}>Switch to account A</button>
        <button onClick={() => changeAccount("audit-browser-b")}>Switch to account B</button>
        <button onClick={() => setPage("Fuel")}>Open test Fuel</button>
        <button onClick={() => setPage("Plan")}>Open test Plan</button>
        <button onClick={() => setPage("Setup")}>Open test setup</button>
        <button onClick={() => setMount(value => value + 1)}>Remount test view</button>
        <button onClick={() => { document.documentElement.classList.toggle("dark", !theme); setTheme(!theme); }}>Use {theme ? "light" : "dark"} test theme</button>
      </nav>
      <LocalState key={uid + mount} uid={uid} />
    </header>
    <main key={uid + page + mount}>{page === "Fuel" ? <DietPage /> : page === "Plan" ? <TaskBoard /> : <SetupSteps />}</main>
  </ToastProvider></AccountContext.Provider>;
}
createRoot(document.getElementById("root")!).render(<App />);

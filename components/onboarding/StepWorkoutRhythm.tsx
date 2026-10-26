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
  ArrowRight,
  Check,
} from "lucide-react";
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

const DAY_OPTIONS: { days: WorkoutDaysPerWeek; sublabel: string }[] = [
  { days: 2, sublabel: "Gentle" },
  { days: 3, sublabel: "Balanced" },
  { days: 4, sublabel: "Upper/Low" },
  { days: 5, sublabel: "Athletic" },
];

const TIME_OPTIONS: { id: AvailableTrainingTimeMinutes; label: string; desc: string }[] = [
  { id: "<20", label: "<20 min", desc: "Express" },
  { id: "20-30", label: "20–30 min", desc: "Focused" },
  { id: "30-45", label: "30–45 min", desc: "Balanced" },
  { id: "45-60", label: "45–60 min", desc: "Complete" },
  { id: "60+", label: "60+ min", desc: "Extended" },
];

const EXPERIENCE_OPTIONS: {
  id: TrainingExperience;
  title: string;
  desc: string;
  icon: typeof Compass;
  image: string;
}[] = [
  {
    id: "beginner",
    title: "Beginner",
    desc: "New to lifting or returning after a break (< 6 months).",
    icon: Compass,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    desc: "Familiar with progressive overload and compounds (6m–2y).",
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "advanced",
    title: "Advanced",
    desc: "Confident with form, intensity, and high volume (2y+).",
    icon: Award,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=70",
  },
];

const WINDOW_OPTIONS: { id: PreferredTrainingWindow; label: string; time: string; icon: typeof Sun; image: string }[] = [
  { id: "morning", label: "Morning", time: "07:00", icon: Sun, image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=70" },
  { id: "afternoon", label: "Afternoon", time: "12:30", icon: Sparkles, image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=70" },
  { id: "evening", label: "Evening", time: "18:00", icon: Sunset, image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=400&q=70" },
  { id: "flexible", label: "Flexible", time: "No fixed time", icon: Moon, image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=70" },
];

export function StepWorkoutRhythm({
  formValues,
  updateFormField,
  onNext,
  isSaving,
}: StepWorkoutRhythmProps) {
  const includeWorkouts = formValues.includeWorkouts !== false;
  const currentDays = (formValues.workoutDaysPerWeek || 3) as WorkoutDaysPerWeek;
  const currentTime = formValues.availableTrainingTimeMinutes || "30-45";
  const currentWindow = formValues.preferredTrainingWindow || "morning";
  const currentExperience = formValues.trainingExperience || "beginner";

  const handleToggleInclude = (include: boolean) => {
    updateFormField("includeWorkouts", include);
    if (!include) {
      updateFormField("workoutDaysPerWeek", null);
      updateFormField("availableTrainingTimeMinutes", null);
      updateFormField("preferredTrainingWindow", null);
      updateFormField("trainingExperience", null);
      updateFormField("equipmentAccess", null);
    } else {
      updateFormField("workoutDaysPerWeek", 3);
      updateFormField("availableTrainingTimeMinutes", "30-45");
      updateFormField("preferredTrainingWindow", "morning");
      updateFormField("trainingExperience", "beginner");
      updateFormField("equipmentAccess", "commercial_gym");
    }
  };

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 05 · TRAINING CADENCE</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          What training rhythm can you <span className="italic text-[#E05A47]">sustain?</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          Consistency beats heroics. Choose days and times that integrate seamlessly with your schedule.
        </p>

        {/* Workouts Inclusion Toggle */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => handleToggleInclude(true)}
            className={`p-3.5 rounded-[20px] text-left border-2 transition-all cursor-pointer flex items-center gap-3 ${
              includeWorkouts
                ? "bg-[#191D1A] text-white border-[#E05A47] shadow-sm"
                : "bg-[#FCFBF9] text-[#1C1917] border-stone-200/70 hover:border-stone-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                includeWorkouts ? "bg-white/10 text-[#6EE7B7]" : "bg-[#EFECE4] text-[#1C1917]"
              }`}
            >
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-sans font-bold text-xs block leading-tight">
                Include Workouts
              </span>
              <span className={`text-[10px] block mt-0.5 ${includeWorkouts ? "text-stone-300" : "text-[#57534E]"}`}>
                Structured routines
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleToggleInclude(false)}
            className={`p-3.5 rounded-[20px] text-left border-2 transition-all cursor-pointer flex items-center gap-3 ${
              !includeWorkouts
                ? "bg-[#191D1A] text-white border-[#E05A47] shadow-sm"
                : "bg-[#FCFBF9] text-[#1C1917] border-stone-200/70 hover:border-stone-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                !includeWorkouts ? "bg-white/10 text-[#6EE7B7]" : "bg-[#EFECE4] text-[#1C1917]"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="font-sans font-bold text-xs block leading-tight">
                Nutrition &amp; Habits
              </span>
              <span className={`text-[10px] block mt-0.5 ${!includeWorkouts ? "text-stone-300" : "text-[#57534E]"}`}>
                Exclusively daily habits
              </span>
            </div>
          </button>
        </div>

        {includeWorkouts && (
          <div className="space-y-4 mt-5">
            {/* 4-Column Day Selector (Stitch image_4de89d.jpg) */}
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E] block mb-2">
                WORKOUT DAYS PER WEEK
              </span>
              <div className="grid grid-cols-4 gap-2">
                {DAY_OPTIONS.map((opt) => {
                  const isSelected = currentDays === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => updateFormField("workoutDaysPerWeek", opt.days)}
                      className={`rounded-[18px] p-3 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#E05A47] text-white shadow-md font-bold scale-[1.02]"
                          : "bg-[#FCFBF9] text-[#1C1917] border border-[#1C1917]/[0.06] hover:border-stone-300 font-medium"
                      }`}
                    >
                      <span className="font-serif text-2xl block leading-tight">{opt.days}</span>
                      <span
                        className={`text-[10px] uppercase font-mono block mt-0.5 ${
                          isSelected ? "text-white/90" : "text-[#8C857B]"
                        }`}
                      >
                        {opt.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Warm Stone Split Name Box */}
              <div className="mt-2.5 p-3 rounded-2xl bg-[#EFECE4]/80 border border-stone-200/60 text-xs text-[#1C1917] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0" />
                <span className="font-semibold">{SPLIT_PREVIEW[currentDays]}</span>
              </div>
            </div>

            {/* Session Duration */}
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E] block mb-2">
                SESSION DURATION
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map((opt) => {
                  const isSelected = currentTime === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateFormField("availableTrainingTimeMinutes", opt.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#191D1A] text-white font-semibold shadow-xs"
                          : "bg-[#FCFBF9] text-[#57534E] border border-stone-200/70 hover:border-stone-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Training Window */}
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E] block mb-2">
                PREFERRED REMINDER WINDOW
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WINDOW_OPTIONS.map((opt) => {
                  const isSelected = currentWindow === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateFormField("preferredTrainingWindow", opt.id)}
                      className={`p-2 rounded-[18px] text-center border transition-all cursor-pointer flex flex-col items-center overflow-hidden ${
                        isSelected
                          ? "bg-[#191D1A] text-white border-[#E05A47] shadow-xs"
                          : "bg-[#FCFBF9] text-[#1C1917] border-stone-200/70 hover:border-stone-300"
                      }`}
                    >
                      <div className="h-14 w-full rounded-xl overflow-hidden mb-2 relative bg-[#EFECE4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={opt.image}
                          alt={opt.label}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-white drop-shadow-sm" />
                        </div>
                      </div>
                      <span className="text-xs font-bold block">{opt.label}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? "text-stone-300" : "text-[#8C857B]"}`}>
                        {opt.time}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E] block mb-2">
                TRAINING EXPERIENCE
              </span>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const isSelected = currentExperience === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateFormField("trainingExperience", opt.id)}
                      className={`p-2.5 rounded-[18px] text-left border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? "bg-[#191D1A] text-white border-[#E05A47] shadow-xs"
                          : "bg-[#FCFBF9] text-[#1C1917] border-stone-200/70 hover:border-stone-300"
                      }`}
                    >
                      <div className="h-16 w-full rounded-xl overflow-hidden mb-2.5 relative bg-[#EFECE4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={opt.image}
                          alt={opt.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{opt.title}</span>
                        <p className={`text-[10px] mt-1 leading-snug ${isSelected ? "text-stone-300" : "text-[#8C857B]"}`}>
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Nutrition & Habits Editorial Focus Card (When Workouts Excluded) */}
        {!includeWorkouts && (
          <div className="bg-[#FCFBF9] rounded-[26px] p-4 shadow-xs border border-[#1C1917]/[0.06] space-y-4 animate-fade-in mt-5">
            {/* Top rounded lifestyle image */}
            <div className="h-36 w-full rounded-[18px] overflow-hidden relative bg-[#EFECE4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=75"
                alt="Wholesome meal prep and morning sunlight"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <span className="bg-[#191D1A]/90 backdrop-blur-md text-[#FCFBF9] text-[10px] font-medium px-2.5 py-1 rounded-full absolute bottom-2.5 left-2.5 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
                Active Non-Exercise Rhythm
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl text-[#1C1917]">
                Pure nourishment &amp; circadian flow
              </h3>
              <p className="text-xs text-[#57534E] leading-relaxed mt-1">
                We will pause structured gym splits for now and calibrate your system around 3 daily anchors:
              </p>
            </div>

            <div className="space-y-2">
              <div className="bg-[#EFECE4]/70 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🍽️</span>
                  <span className="font-medium text-[#1C1917]">Smart Meal &amp; Protein Pacing</span>
                </div>
                <span className="text-[11px] font-semibold text-[#2D6A4F]">Auto-calibrated</span>
              </div>

              <div className="bg-[#EFECE4]/70 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚶</span>
                  <span className="font-medium text-[#1C1917]">Gentle Daily Step &amp; NEAT Flow</span>
                </div>
                <span className="text-[11px] font-semibold text-[#2D6A4F]">Low-friction</span>
              </div>

              <div className="bg-[#EFECE4]/70 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌙</span>
                  <span className="font-medium text-[#1C1917]">Evening Wind-Down &amp; Recovery</span>
                </div>
                <span className="text-[11px] font-semibold text-[#2D6A4F]">Circadian sync</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8C857B] italic">
              You can activate structured gym or home workouts anytime from your Train tab.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-6">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
            WEEKLY COMMITMENT
          </span>
          <span className="text-xs font-bold text-[#1C1917]">
            {includeWorkouts
              ? `${currentDays} Days / Week · ${currentTime} min`
              : "Habit & Nutrition Focus Only"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNext()}
          disabled={isSaving}
          aria-label="Continue"
          className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-6 py-3.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

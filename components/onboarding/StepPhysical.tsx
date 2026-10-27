// components/onboarding/StepPhysical.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ruler, Scale, Calendar, Activity, ArrowRight, Leaf, Minus, Plus } from "lucide-react";
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
    if (!h || !w || h < 120 || w < 35) return { bmi: null, bmr: 1780 };
    const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    let bmr: number = 1780;
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

  const stepHeight = (delta: number) => {
    const current = formValues.heightCm || 175;
    const next = Math.max(120, Math.min(230, current + delta));
    handleHeightCmChange(String(next));
  };

  const stepAge = (delta: number) => {
    const current = formValues.age || 28;
    const next = Math.max(18, Math.min(100, current + delta));
    handleAgeChange(String(next));
  };

  const handleSelectSex = (sex: BiologicalSex) => {
    updateFormField("biologicalSex", sex);
  };

  const handleContinue = () => {
    if (ageInput.trim()) {
      const num = parseInt(ageInput, 10);
      if (isNaN(num)) {
        setAgeError("Please enter a valid age.");
        return;
      }
      if (num < 18) {
        router.push("/onboarding/under-18");
        return;
      }
      if (num > 100) {
        setAgeError("Please enter an age between 18 and 100.");
        return;
      }
      updateFormField("age", num);
    }
    onNext();
  };

  const sexDisplay =
    sexSelected === "male"
      ? "Male"
      : sexSelected === "female"
      ? "Female"
      : sexSelected === "prefer_not_to_say"
      ? "Neutral"
      : "Select";

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 02 · YOUR BASELINE</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          Where is your body <span className="italic text-[#E05A47]">starting from</span> today?
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          Pure physiology without moral judgment. Satat uses this to calibrate non-punitive energy curves.
        </p>

        {/* Unit Switcher Pill (Centered) */}
        <div className="flex justify-center mt-4">
          <div className="bg-[#EFECE4] p-1 rounded-full inline-flex">
            <button
              type="button"
              onClick={() => setUnitSystem("metric")}
              className={`rounded-full px-5 py-2 text-xs transition-all cursor-pointer ${
                unitSystem === "metric"
                  ? "bg-[#191D1A] text-white font-semibold shadow-xs"
                  : "text-[#57534E] hover:text-[#1C1917] font-medium"
              }`}
            >
              Metric (cm, kg)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem("imperial")}
              className={`rounded-full px-5 py-2 text-xs transition-all cursor-pointer ${
                unitSystem === "imperial"
                  ? "bg-[#191D1A] text-white font-semibold shadow-xs"
                  : "text-[#57534E] hover:text-[#1C1917] font-medium"
              }`}
            >
              Imperial (ft/in, lbs)
            </button>
          </div>
        </div>

        {/* 2×2 Tactile Biometric Bento Grid */}
        <div className="grid grid-cols-2 gap-3.5 mt-4">
          {/* Card 1: Stature / Height */}
          <div className="bg-[#FCFBF9] rounded-[24px] p-4 shadow-xs border border-[#1C1917]/[0.05] flex flex-col justify-between min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E]">
                STATURE / HEIGHT
              </span>
              <Ruler className="w-4 h-4 text-[#8C857B]" />
            </div>

            <div className="my-2">
              {unitSystem === "metric" ? (
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={heightCmInput}
                    onChange={(e) => handleHeightCmChange(e.target.value)}
                    placeholder="175"
                    className="w-24 bg-transparent font-serif text-3xl font-normal text-[#1C1917] focus:outline-none"
                    aria-label="Height in centimeters"
                  />
                  <span className="font-serif text-lg italic text-[#8C857B]">cm</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    value={heightFeetInput}
                    onChange={(e) => handleImperialHeightChange(e.target.value, heightInchesInput)}
                    placeholder="5"
                    className="w-10 bg-transparent font-serif text-3xl font-normal text-[#1C1917] focus:outline-none"
                    aria-label="Height in feet"
                  />
                  <span className="font-serif text-base italic text-[#8C857B]">ft</span>
                  <input
                    type="number"
                    value={heightInchesInput}
                    onChange={(e) => handleImperialHeightChange(heightFeetInput, e.target.value)}
                    placeholder="9"
                    className="w-12 bg-transparent font-serif text-3xl font-normal text-[#1C1917] focus:outline-none"
                    aria-label="Height in inches"
                  />
                  <span className="font-serif text-base italic text-[#8C857B]">in</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepHeight(-1)}
                aria-label="Decrease height"
                className="w-9 h-9 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => stepHeight(1)}
                aria-label="Increase height"
                className="w-9 h-9 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Body Mass */}
          <div className="bg-[#FCFBF9] rounded-[24px] p-4 shadow-xs border border-[#1C1917]/[0.05] flex flex-col justify-between min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E]">
                BODY MASS
              </span>
              <Scale className="w-4 h-4 text-[#8C857B]" />
            </div>

            <div className="my-2">
              {unitSystem === "metric" ? (
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={weightKgInput}
                    onChange={(e) => handleWeightKgChange(e.target.value)}
                    placeholder="70"
                    className="w-24 bg-transparent font-serif text-3xl font-normal text-[#1C1917] focus:outline-none"
                    aria-label="Weight in kilograms"
                  />
                  <span className="font-serif text-lg italic text-[#8C857B]">kg</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={weightLbsInput}
                    onChange={(e) => handleWeightLbsChange(e.target.value)}
                    placeholder="154"
                    className="w-24 bg-transparent font-serif text-3xl font-normal text-[#1C1917] focus:outline-none"
                    aria-label="Weight in pounds"
                  />
                  <span className="font-serif text-lg italic text-[#8C857B]">lbs</span>
                </div>
              )}
            </div>

            <div className="bg-[#B7F0D0] text-[#1B4332] text-[10px] font-semibold px-3 py-1 rounded-full w-fit flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
              <span>Recorded today</span>
            </div>
          </div>

          {/* Card 3: Age */}
          <div className="bg-[#FCFBF9] rounded-[24px] p-4 shadow-xs border border-[#1C1917]/[0.05] flex flex-col justify-between min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E]">
                AGE
              </span>
              <Calendar className="w-4 h-4 text-[#8C857B]" />
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={ageInput}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  placeholder="28"
                  className="w-20 bg-transparent font-serif text-3xl font-normal text-[#1C1917] focus:outline-none"
                  aria-label="Age in years"
                />
                <span className="font-serif text-lg italic text-[#8C857B]">yrs</span>
              </div>
              {ageError && (
                <span className="text-[10px] text-red-600 block mt-0.5 leading-tight">
                  {ageError}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepAge(-1)}
                aria-label="Decrease age"
                className="w-9 h-9 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => stepAge(1)}
                aria-label="Increase age"
                className="w-9 h-9 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 4: Metabolism / Biological Sex */}
          <div className="bg-[#FCFBF9] rounded-[24px] p-4 shadow-xs border border-[#1C1917]/[0.05] flex flex-col justify-between min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E]">
                METABOLISM
              </span>
              <Activity className="w-4 h-4 text-[#8C857B]" />
            </div>

            <div className="my-1">
              <div className="font-serif text-2xl text-[#1C1917] leading-tight">
                {sexDisplay}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => handleSelectSex("female")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                  sexSelected === "female"
                    ? "bg-[#191D1A] text-white"
                    : "bg-[#EFECE4] text-[#57534E] hover:text-[#1C1917]"
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => handleSelectSex("male")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                  sexSelected === "male"
                    ? "bg-[#191D1A] text-white"
                    : "bg-[#EFECE4] text-[#57534E] hover:text-[#1C1917]"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => handleSelectSex("prefer_not_to_say")}
                className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all cursor-pointer ${
                  sexSelected === "prefer_not_to_say"
                    ? "bg-[#191D1A] text-white"
                    : "bg-[#EFECE4] text-[#57534E] hover:text-[#1C1917]"
                }`}
              >
                Neutral
              </button>
            </div>
          </div>
        </div>

        {/* Mint Mifflin-St Jeor Callout Card */}
        <div className="bg-[#B7F0D0]/80 border border-[#2D6A4F]/15 rounded-[24px] p-4 flex items-start gap-3.5 mt-4">
          <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-xs text-[#1B4332]">
              Resting baseline: ~{liveBiometrics.bmr || 1780} kcal / day
            </h4>
            <p className="text-[11px] text-[#2D6A4F] mt-0.5 leading-relaxed">
              Calibrated via Mifflin-St Jeor equation. We never cut below this recovery threshold.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Floating Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E05A47] shrink-0" />
          <div>
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
              TARGET ENERGY FLOOR
            </span>
            <span className="text-xs font-bold text-[#1C1917]">
              {(liveBiometrics.bmr || 1780).toLocaleString()} kcal
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={isSaving}
          aria-label="Continue"
          className="w-12 h-12 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white flex items-center justify-center disabled:opacity-40 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="sr-only">Continue</span>
        </button>
      </div>
    </div>
  );
}
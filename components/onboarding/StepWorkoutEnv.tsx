// components/onboarding/StepWorkoutEnv.tsx
"use client";

import { Building2, Home, Activity, ArrowRight, Check } from "lucide-react";
import type { EquipmentAccess } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepWorkoutEnvProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}

const EQUIPMENT_OPTIONS: {
  id: EquipmentAccess;
  title: string;
  tag: string;
  desc: string;
  icon: typeof Building2;
  image: string;
}[] = [
  {
    id: "commercial_gym",
    title: "Commercial / Full Gym",
    tag: "Barbells · Cables · Squat Racks · Machines",
    desc: "Barbells, dumbbells, cable machines, squat racks, and weight machines.",
    icon: Building2,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=75",
  },
  {
    id: "home_dumbbells",
    title: "Home with Dumbbells & Bench",
    tag: "Dumbbells · Flat/Incline Bench · Bands",
    desc: "Adjustable or fixed dumbbells, resistance bands, and a flat bench.",
    icon: Home,
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=500&q=75",
  },
  {
    id: "bodyweight_only",
    title: "Anywhere / Bodyweight",
    tag: "Calisthenics · Zero Equipment",
    desc: "No equipment required. Calisthenics, core exercises, and floor movements.",
    icon: Activity,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=75",
  },
];

export function StepWorkoutEnv({
  formValues,
  updateFormField,
  onNext,
  isSaving,
}: StepWorkoutEnvProps) {
  const selectedEquip = formValues.equipmentAccess || "commercial_gym";

  const handleSelect = (id: EquipmentAccess) => {
    updateFormField("equipmentAccess", id);
  };

  const activeOption = EQUIPMENT_OPTIONS.find((o) => o.id === selectedEquip) || EQUIPMENT_OPTIONS[0];

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 06 · TRAINING SPACE</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          Where will you do your <span className="italic text-[#2D6A4F]">workouts?</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          We tailor your compound lifts and movement progressions to match your available equipment.
        </p>

        {/* Options */}
        <div className="space-y-3 mt-5">
          {EQUIPMENT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedEquip === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left rounded-[24px] p-3 sm:p-4 transition-all flex items-center gap-3.5 sm:gap-4 relative cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? "bg-[#191D1A] text-[#FCFBF9] shadow-md border-2 border-[#E05A47]"
                    : "bg-[#FCFBF9] text-[#1C1917] border border-[#1C1917]/[0.06] shadow-xs hover:border-stone-300"
                }`}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 relative shadow-xs bg-[#EFECE4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opt.image}
                    alt={opt.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center absolute bottom-1.5 left-1.5 shadow-sm ${
                      isSelected ? "bg-[#191D1A]/90 text-[#6EE7B7]" : "bg-white/90 text-[#1C1917]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 pr-6">
                  <div className="flex flex-col">
                    <h3
                      className={`font-sans font-bold text-sm sm:text-base leading-snug ${
                        isSelected ? "text-white" : "text-[#1C1917]"
                      }`}
                    >
                      {opt.title}
                    </h3>
                    <span
                      className={`text-[10px] sm:text-[11px] font-mono mt-0.5 ${
                        isSelected ? "text-[#6EE7B7]" : "text-[#E05A47]"
                      }`}
                    >
                      {opt.tag}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] sm:text-xs mt-1.5 leading-relaxed ${
                      isSelected ? "text-stone-300" : "text-[#57534E]"
                    }`}
                  >
                    {opt.desc}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#E05A47] text-white flex items-center justify-center absolute top-4 right-4 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-6">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
            ENVIRONMENT
          </span>
          <span className="text-xs font-bold text-[#1C1917]">
            {activeOption.title}
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

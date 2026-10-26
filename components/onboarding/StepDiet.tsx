// components/onboarding/StepDiet.tsx
"use client";

import { Salad, Egg, Beef, Leaf, Utensils, ArrowRight, Check } from "lucide-react";
import type { DietaryPattern } from "@/lib/onboarding/validation";
import type { OnboardingFormValues } from "./types";

interface StepDietProps {
  formValues: OnboardingFormValues;
  updateFormField: <K extends keyof OnboardingFormValues>(key: K, value: OnboardingFormValues[K]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

const DIET_OPTIONS: {
  id: DietaryPattern;
  title: string;
  desc: string;
  proteinSources: string;
  icon: typeof Salad;
  image: string;
}[] = [
  {
    id: "vegetarian",
    title: "Vegetarian",
    desc: "Dairy included, plant-forward. No meat or eggs.",
    proteinSources: "Paneer · Curd · Dal · Whey · Soy",
    icon: Salad,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=75",
  },
  {
    id: "eggetarian",
    title: "Eggetarian",
    desc: "Eggs and dairy included alongside plants. No meat.",
    proteinSources: "Eggs · Egg Whites · Paneer · Dairy",
    icon: Egg,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=75",
  },
  {
    id: "non_vegetarian",
    title: "Non-Vegetarian",
    desc: "Includes poultry, fish, meat, dairy, and plants.",
    proteinSources: "Chicken · Fish · Eggs · Dairy · Legumes",
    icon: Beef,
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=500&q=75",
  },
  {
    id: "vegan",
    title: "Vegan",
    desc: "100% plant-based. No meat, dairy, eggs, or animal products.",
    proteinSources: "Tofu · Tempeh · Edamame · Lentils",
    icon: Leaf,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=75",
  },
  {
    id: "anything",
    title: "No Specific Restriction",
    desc: "Open to all cuisines, recipes, and ingredients.",
    proteinSources: "Full-spectrum omnivore protein rotation",
    icon: Utensils,
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=500&q=75",
  },
];

const COMMON_AVOIDANCES = [
  "Lactose / Dairy",
  "Gluten",
  "Nuts",
  "Soy",
  "Seafood",
];

export function StepDiet({
  formValues,
  updateFormField,
  onNext,
  isSaving,
}: StepDietProps) {
  const selectedPattern = formValues.dietaryPattern || "anything";
  const currentAvoidances = formValues.foodAvoidances || [];

  const handleSelectPattern = (id: DietaryPattern) => {
    updateFormField("dietaryPattern", id);
  };

  const handleToggleAvoidance = (tag: string) => {
    if (currentAvoidances.includes(tag)) {
      updateFormField(
        "foodAvoidances",
        currentAvoidances.filter((t) => t !== tag)
      );
    } else {
      updateFormField("foodAvoidances", [...currentAvoidances, tag]);
    }
  };

  const activeOption = DIET_OPTIONS.find((o) => o.id === selectedPattern) || DIET_OPTIONS[4];

  return (
    <div className="flex flex-col justify-between flex-1 py-1 animate-fade-in">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>STEP 07 · DAILY NOURISHMENT</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[2.15rem] leading-[1.12] tracking-tight text-[#1C1917] mt-2">
          What is your everyday <span className="italic text-[#2D6A4F]">eating style?</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
          Satat works with your culture and preferences. We never prescribe dogmatic meal plans.
        </p>

        {/* Dietary Pattern Cards */}
        <div className="space-y-2.5 mt-5">
          {DIET_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedPattern === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectPattern(opt.id)}
                className={`w-full text-left rounded-[24px] p-3 sm:p-3.5 transition-all flex items-center gap-3.5 relative overflow-hidden cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? "bg-[#191D1A] text-[#FCFBF9] shadow-md border-2 border-[#E05A47]"
                    : "bg-[#FCFBF9] text-[#1C1917] border border-[#1C1917]/[0.06] shadow-xs hover:border-stone-300"
                }`}
              >
                {/* Background culinary image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={opt.image}
                  alt={opt.title}
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
                    isSelected ? "opacity-35" : "opacity-25"
                  }`}
                  loading="lazy"
                />
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isSelected
                      ? "bg-gradient-to-r from-[#191D1A]/95 via-[#191D1A]/90 to-[#191D1A]/70"
                      : "bg-gradient-to-r from-[#FCFBF9]/95 via-[#FCFBF9]/90 to-[#FCFBF9]/75"
                  }`}
                />

                {/* Left dish thumbnail */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-xs relative z-10 bg-[#EFECE4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opt.image}
                    alt={opt.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center absolute bottom-1 right-1 shadow-xs ${
                      isSelected ? "bg-[#191D1A] text-[#6EE7B7]" : "bg-white text-[#1C1917]"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 pr-6 relative z-10">
                  <h3
                    className={`font-sans font-bold text-sm sm:text-base leading-snug ${
                      isSelected ? "text-white" : "text-[#1C1917]"
                    }`}
                  >
                    {opt.title}
                  </h3>
                  <p
                    className={`text-[11px] sm:text-xs mt-0.5 leading-relaxed ${
                      isSelected ? "text-stone-300" : "text-[#57534E]"
                    }`}
                  >
                    {opt.desc}
                  </p>
                  <span
                    className={`text-[10px] font-mono block mt-0.5 ${
                      isSelected ? "text-[#6EE7B7]" : "text-[#2D6A4F]"
                    }`}
                  >
                    {opt.proteinSources}
                  </span>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#E05A47] text-white flex items-center justify-center absolute top-3.5 right-3.5 shadow-xs relative z-10">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Common Sensitivities / Avoidances */}
        <div className="mt-5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#57534E] block mb-2">
            ANY FOODS OR INGREDIENTS YOU AVOID?
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_AVOIDANCES.map((tag) => {
              const isChecked = currentAvoidances.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleAvoidance(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    isChecked
                      ? "bg-[#2D6A4F] text-white font-semibold shadow-xs"
                      : "bg-[#FCFBF9] text-[#57534E] border border-stone-200/70 hover:border-stone-300"
                  }`}
                >
                  {isChecked ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Floating Capsule Bar */}
      <div className="bg-[#FCFBF9] rounded-full p-2.5 pl-5 shadow-[0_14px_34px_rgba(28,25,23,0.08)] border border-[#1C1917]/[0.05] flex items-center justify-between mt-6">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#8C857B] block">
            DIETARY ANCHOR
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

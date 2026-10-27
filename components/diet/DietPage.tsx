"use client";

import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { useSession } from "next-auth/react";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import {
  Plus,
  Minus,
  Utensils,
  Camera,
  Trash2,
  X,
  Loader2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookmarkPlus,
  Search,
  Mic,
  Check,
  Barcode,
} from "lucide-react";
import VoiceMealModal from "@/components/diet/VoiceMealModal";
import MealScannerModal from "@/components/diet/MealScannerModal";
import MacroDonutBreakdown from "@/components/diet/MacroDonutBreakdown";
import { resolveDishThumbnail, formatMealTimeAndCategory } from "@/lib/diet/dishMatcher";
import { cn, todayString, formatDate, localDateString } from "@/lib/utils";
import {
  getMeals,
  addMeal,
  deleteMeal,
  getMacroGoals,
  saveMacroGoals,
  getMealTemplates,
  saveMealTemplate,
  updateMealTemplate,
  deleteMealTemplate,
} from "@/lib/firestore";
import { setDietContext } from "@/lib/orbitContext";
import type { MealEntry, MealMacros, MacroGoals, MealTemplate } from "@/types";
import EmptyState from "@/components/ui/EmptyState";

const defaultGoals: MacroGoals = { calories: 2000, proteinG: 150, carbsG: 200, fatG: 65 };

// ── Main Component ────────────────────────────────────────────────────────────
export default function DietPage() {
  const { data: session } = useSession();
  const { firebaseUser, isReady } = useFirebaseAuth();
  const userId = firebaseUser?.uid ?? (session?.user as any)?.id ?? session?.user?.email ?? "";

  const [date, setDate] = useState(todayString());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<MacroGoals | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<"plate" | "barcode">("plate");
  const [showSaved, setShowSaved] = useState(false);
  const [showVoiceMeal, setShowVoiceMeal] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [savingTemplate, setSavingTemplate] = useState<{ name: string; macros: MealMacros } | null>(null);

  // Expanded meal card accordion
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  // Load the selected day's meals, goals, and saved meal templates.
  useEffect(() => {
    if (!userId || !firebaseUser || !isReady) {
      setMeals([]);
      return;
    }

    let cancelled = false;

    const loadDietData = async () => {
      setLoading(true);
      try {
        const [mealData, goalData, templateData] = await Promise.all([
          (getMeals as any)(userId, date),
          (getMacroGoals as any)(userId),
          (getMealTemplates as any)(userId),
        ]);

        if (cancelled) return;

        const loadedMeals = Array.isArray(mealData) ? mealData : [];
        setMeals(loadedMeals);
        setGoals(goalData ? { ...defaultGoals, ...goalData } : defaultGoals);
        setTemplates(Array.isArray(templateData) ? templateData : []);

        // Default the first meal to expanded if any exists
        if (loadedMeals.length > 0) {
          setExpandedMealId(loadedMeals[0].id);
        } else {
          setExpandedMealId(null);
        }
      } catch (error) {
        console.error("Failed to load diet data:", error);
        if (!cancelled) {
          setMeals([]);
          setTemplates([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDietData();

    return () => {
      cancelled = true;
    };
  }, [userId, date, firebaseUser, isReady]);

  const totals = meals.reduce<MealMacros>(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal.macros.calories) || 0),
      proteinG: acc.proteinG + (Number(meal.macros.proteinG) || 0),
      carbsG: acc.carbsG + (Number(meal.macros.carbsG) || 0),
      fatG: acc.fatG + (Number(meal.macros.fatG) || 0),
      ...(acc.fiberG != null || meal.macros.fiberG != null
        ? { fiberG: (acc.fiberG || 0) + (Number(meal.macros.fiberG) || 0) }
        : {}),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const isToday = date === todayString();
  const targetCalories = goals?.calories ?? 2000;
  const remainingCalories = Math.max(0, targetCalories - Math.round(totals.calories));

  // Keep Orbit's diet context in sync so it can answer meal-specific questions.
  useEffect(() => {
    if (!userId) return;

    setDietContext({
      meals: meals.map((meal) => ({
        name: meal.name,
        calories: Math.round(meal.macros.calories),
        proteinG: Math.round(meal.macros.proteinG),
        carbsG: Math.round(meal.macros.carbsG),
        fatG: Math.round(meal.macros.fatG),
      })),
      totals: {
        calories: Math.round(totals.calories),
        proteinG: Math.round(totals.proteinG),
        carbsG: Math.round(totals.carbsG),
        fatG: Math.round(totals.fatG),
      },
      goals: goals
        ? {
            calories: Math.round(goals.calories),
            proteinG: Math.round(goals.proteinG),
            carbsG: Math.round(goals.carbsG),
            fatG: Math.round(goals.fatG),
          }
        : null,
      date,
    } as any);
  }, [userId, date, meals, goals, totals.calories, totals.proteinG, totals.carbsG, totals.fatG]);

  const changeDate = (days: number) => {
    setDate((current) => {
      const next = new Date(`${current}T12:00:00`);
      next.setDate(next.getDate() + days);
      return localDateString(next);
    });
  };

  const handleAddMeal = async (meal: Omit<MealEntry, "id">) => {
    try {
      const created = await (addMeal as any)(meal);
      setMeals((prev) => [...prev, created]);
      if (!expandedMealId) {
        setExpandedMealId(created.id);
      }
      setShowAddMeal(false);
      setShowScanner(false);
    } catch (error) {
      console.error("Failed to add meal:", error);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await (deleteMeal as any)(mealId, userId);
      setMeals((prev) => prev.filter((meal) => meal.id !== mealId));
      if (expandedMealId === mealId) {
        setExpandedMealId(null);
      }
    } catch (error) {
      console.error("Failed to delete meal:", error);
    }
  };

  const handleSaveGoals = async (nextGoals: MacroGoals) => {
    try {
      await (saveMacroGoals as any)(userId, nextGoals);
      setGoals(nextGoals);
      setShowGoals(false);
    } catch (error) {
      console.error("Failed to save macro goals:", error);
    }
  };

  const handleSaveTemplate = async (template: Omit<MealTemplate, "id">) => {
    try {
      const saved = await (saveMealTemplate as any)(template);
      setTemplates((prev) => {
        const next = saved?.id ? saved : { ...template, id: crypto.randomUUID() };
        return [...prev, next];
      });
      setSavingTemplate(null);
    } catch (error) {
      console.error("Failed to save meal template:", error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await (deleteMealTemplate as any)(templateId, userId);
      setTemplates((prev) => prev.filter((template) => template.id !== templateId));
    } catch (error) {
      console.error("Failed to delete meal template:", error);
    }
  };

  const handleLogFromTemplate = async (meal: Omit<MealEntry, "id">, templateId: string) => {
    try {
      const created = await (addMeal as any)(meal);
      setMeals((prev) => [...prev, created]);

      const template = templates.find((item) => item.id === templateId);
      if (template) {
        const updatedTemplate = {
          ...template,
          useCount: (template.useCount || 0) + 1,
          lastUsedAt: Date.now(),
        };
        try {
          await (updateMealTemplate as any)(templateId, updatedTemplate);
          setTemplates((prev) =>
            prev.map((item) => (item.id === templateId ? updatedTemplate : item))
          );
        } catch (templateError) {
          console.warn("Template useCount update error:", templateError);
        }
      }

      setShowSaved(false);
    } catch (error) {
      console.error("Failed to log saved meal:", error);
    }
  };

  const handleLogVoiceMeals = async (payload: any) => {
    const candidates = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.meals)
      ? payload.meals
      : [payload];

    const validMeals = candidates.filter(Boolean);

    for (const item of validMeals) {
      const meal = item?.meal ?? item;
      if (!meal?.name || !meal?.macros) continue;

      const normalized: Omit<MealEntry, "id"> = {
        userId,
        date,
        name: meal.name,
        macros: {
          calories: Number(meal.macros.calories) || 0,
          proteinG: Number(meal.macros.proteinG) || 0,
          carbsG: Number(meal.macros.carbsG) || 0,
          fatG: Number(meal.macros.fatG) || 0,
          ...(meal.macros.fiberG != null ? { fiberG: Number(meal.macros.fiberG) || 0 } : {}),
        },
        createdAt: meal.createdAt || Date.now(),
      };

      await handleAddMeal(normalized);
    }

    setShowVoiceMeal(false);
  };

  return (
    <div className="w-full max-w-md mx-auto lg:max-w-5xl pb-6 animate-fade-in text-[#1C1917]">
      {/* ── 1. TOP HEADER & QUICK-ACTION ICON PILLS ── */}
      <div className="flex items-start justify-between pt-1 pb-3">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1917] tracking-tight leading-none">
            Nourishment Studio
          </h1>
          <p className="text-xs text-[#57534E] mt-1.5 font-medium">
            Mindful fueling, zero calorie anxiety.
          </p>
        </div>

        {/* 3 Circular Tactile Icon Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowVoiceMeal(true)}
            type="button"
            className="w-9 h-9 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Log meal by voice"
            aria-label="Log meal by voice"
          >
            <Mic className="w-4 h-4 text-[#2D6A4F]" />
          </button>

          <button
            onClick={() => setShowSaved(true)}
            type="button"
            className="w-9 h-9 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Saved meals"
            aria-label="Saved meals"
          >
            <Bookmark className="w-4 h-4 text-[#E05A47]" />
          </button>

          <button
            onClick={() => setShowGoals(true)}
            type="button"
            className="w-9 h-9 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Nutrition goals"
            aria-label="Daily macro goals"
          >
            <Settings className="w-4 h-4 text-[#57534E]" />
          </button>
        </div>
      </div>

      {/* ── 2. DATE NAVIGATOR CAPSULE ── */}
      <div className="bg-[#FCFBF9] rounded-full px-4 py-2 border border-[#1C1917]/[0.06] shadow-2xs flex items-center justify-between mb-4">
        <button
          onClick={() => changeDate(-1)}
          type="button"
          className="w-7 h-7 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] flex items-center justify-center text-[#1C1917] transition-all cursor-pointer"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
            {formatDate(date)}
          </span>
          {isToday && (
            <span className="bg-[#D1FAE5] text-[#1B4332] text-[10px] font-bold px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>

        <button
          onClick={() => changeDate(1)}
          disabled={isToday}
          type="button"
          className="w-7 h-7 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] flex items-center justify-center text-[#1C1917] transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── 3. HERO DARK BOTANICAL NUTRITION SUMMARY CARD ── */}
      <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[28px] p-5 shadow-xl mb-4">
        {/* Top Row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="bg-[#2D6A4F]/30 border border-[#6EE7B7]/20 text-[#6EE7B7] rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
            DAILY NUTRITION SUMMARY
          </span>
          <span className="text-xs text-stone-300 font-medium text-right truncate">
            <strong className="text-white font-bold">{remainingCalories.toLocaleString()} kcal</strong>{" "}
            remaining · Target {targetCalories.toLocaleString()}
          </span>
        </div>

        {/* 3-Segment Macro Donut Breakdown (Dark Variant) */}
        <MacroDonutBreakdown
          variant="dark"
          calories={totals.calories}
          carbs={totals.carbsG}
          fat={totals.fatG}
          protein={totals.proteinG}
          targetCarbs={goals?.carbsG}
          targetFat={goals?.fatG}
          targetProtein={goals?.proteinG}
        />
      </div>

      {/* ── 4. FLAGSHIP USP LAUNCHER CARD: "SCAN PLATE OR BARCODE" ── */}
      <div className="bg-[#FCFBF9] rounded-[26px] p-4 border border-[#1C1917]/[0.06] shadow-xs mb-5">
        <div className="flex items-center gap-3.5">
          {/* Thumbnail with viewfinder corners */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden relative shrink-0 shadow-xs bg-[#EFECE4]">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=75"
              alt="Meal scanning viewfinder"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Corner brackets */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#E05A47]" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#E05A47]" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#E05A47]" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#E05A47]" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#E05A47] block">
              INSTANT AI VISION
            </span>
            <h2 className="font-sans font-bold text-lg text-[#1C1917] leading-snug">
              Scan Plate or Barcode
            </h2>
            <p className="text-xs text-[#57534E] truncate mt-0.5">
              Dal Chawal, bowls, or labels for 2-second macros.
            </p>
          </div>
        </div>

        {/* Bottom Action Buttons Row */}
        <div className="flex items-center justify-end gap-2.5 mt-3.5">
          <button
            type="button"
            onClick={() => {
              setScannerMode("plate");
              setShowScanner(true);
            }}
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Plate</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScannerMode("barcode");
              setShowScanner(true);
            }}
            className="bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Barcode</span>
          </button>
        </div>
      </div>

      {/* ── 5. "TODAY'S NOURISHMENT LOG" SECTION ── */}
      <div className="mb-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
              TODAY&apos;S NOURISHMENT LOG
            </span>
            <span className="bg-[#EFECE4] text-[#1C1917] text-[10px] font-bold px-2 py-0.5 rounded-full ml-1.5">
              {meals.length}
            </span>
          </div>

          <button
            onClick={() => setShowAddMeal(true)}
            type="button"
            className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer"
          >
            + Manual Log
          </button>
        </div>

        {/* Logged Meal Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#FCFBF9] rounded-[26px] animate-pulse" />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="bg-[#FCFBF9] rounded-[28px] p-8 text-center border border-[#1C1917]/[0.06] shadow-xs">
            <Utensils className="w-8 h-8 text-[#8C857B] mx-auto mb-2 opacity-60" />
            <p className="font-serif text-lg text-[#1C1917]">No Meals Logged Today</p>
            <p className="text-xs text-[#57534E] max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
              Snap a plate with instant AI vision, speak your meal, or log manual dishes.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setScannerMode("plate");
                  setShowScanner(true);
                }}
                className="bg-[#E05A47] text-white rounded-full px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Scan Plate Now
              </button>
              <button
                type="button"
                onClick={() => setShowAddMeal(true)}
                className="bg-[#EFECE4] text-[#1C1917] rounded-full px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                + Custom Dish
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => {
              const isExpanded = expandedMealId === meal.id;
              const photoUrl = resolveDishThumbnail(meal.name, meal.photoUrl);
              const { timeLabel, categoryLabel } = formatMealTimeAndCategory(meal.createdAt);

              return (
                <div
                  key={meal.id}
                  className="bg-[#FCFBF9] rounded-[26px] p-4 border border-[#1C1917]/[0.06] shadow-xs transition-all"
                >
                  {/* Top Row: Clickable to toggle expanded drawer */}
                  <div
                    onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                    className="flex items-center gap-3.5 cursor-pointer"
                  >
                    {/* Dish Photo */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-2xs bg-[#EFECE4]">
                      <img
                        src={photoUrl}
                        alt={meal.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Meal Info */}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase text-[#8C857B] block">
                        {timeLabel} · {categoryLabel}
                      </span>
                      <h3 className="font-sans font-bold text-base text-[#1C1917] leading-snug truncate">
                        {meal.name}
                      </h3>

                      {/* Collapsed Macro Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="bg-[#FADCD5]/70 text-[#C94A38] rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0">
                          {Math.round(meal.macros.calories)} kcal
                        </span>
                        <span className="bg-[#D1FAE5] text-[#1B4332] rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0">
                          {Math.round(meal.macros.proteinG)}g P
                        </span>
                        <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                          {Math.round(meal.macros.carbsG)}g C
                        </span>
                        <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                          {Math.round(meal.macros.fatG)}g F
                        </span>
                      </div>
                    </div>

                    {/* Right Action Icons & Chevron */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSavingTemplate({ name: meal.name, macros: meal.macros });
                        }}
                        title="Save as a reusable meal"
                        type="button"
                        aria-label={`Save ${meal.name} as a reusable meal`}
                        className="w-7 h-7 rounded-full hover:bg-[#EFECE4] text-[#8C857B] hover:text-[#1C1917] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteMeal(meal.id);
                        }}
                        type="button"
                        aria-label={`Delete ${meal.name}`}
                        className="w-7 h-7 rounded-full hover:bg-[#FADCD5] text-[#8C857B] hover:text-[#E05A47] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="w-7 h-7 flex items-center justify-center text-[#8C857B]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Macro Donut Drawer */}
                  {isExpanded && (
                    <div className="bg-[#F6F3EC] rounded-[20px] p-3.5 mt-3.5 border border-[#1C1917]/[0.04] animate-slide-down">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#8C857B] tracking-wider uppercase mb-2">
                        <span>MACRO DONUT BREAKDOWN</span>
                        <span>1 Serving</span>
                      </div>
                      <MacroDonutBreakdown
                        variant="light"
                        calories={meal.macros.calories}
                        carbs={meal.macros.carbsG}
                        fat={meal.macros.fatG}
                        protein={meal.macros.proteinG}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DUAL-MODE SCANNER MODAL ── */}
      {showScanner && (
        <MealScannerModal
          userId={userId}
          date={date}
          initialMode={scannerMode}
          onSave={handleAddMeal}
          onClose={() => setShowScanner(false)}
          onSwitchToManual={() => {
            setShowScanner(false);
            setShowAddMeal(true);
          }}
          onSwitchToVoice={() => {
            setShowScanner(false);
            setShowVoiceMeal(true);
          }}
        />
      )}

      {/* ── SMART CUSTOM DISH MODAL (AddMealModal) ── */}
      {showAddMeal && (
        <AddMealModal
          userId={userId}
          date={date}
          onSave={handleAddMeal}
          onSaveTemplate={handleSaveTemplate}
          onClose={() => setShowAddMeal(false)}
        />
      )}

      {/* ── MACRO GOALS MODAL ── */}
      {showGoals && (
        <GoalsModal goals={goals} onSave={handleSaveGoals} onClose={() => setShowGoals(false)} />
      )}

      {/* ── SAVED MEALS REPERTOIRE MODAL ── */}
      {showSaved && (
        <SavedMealsModal
          templates={templates}
          userId={userId}
          date={date}
          onLog={handleLogFromTemplate}
          onDelete={handleDeleteTemplate}
          onClose={() => setShowSaved(false)}
        />
      )}

      {/* ── SAVE REPERTOIRE TEMPLATE MODAL ── */}
      {savingTemplate && (
        <SaveTemplateModal
          userId={userId}
          initial={savingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setSavingTemplate(null)}
        />
      )}

      {/* ── VOICE NOURISHMENT MODAL ── */}
      {showVoiceMeal && (
        <VoiceMealModal onAdd={handleLogVoiceMeals} onClose={() => setShowVoiceMeal(false)} />
      )}
    </div>
  );
}

// ── MODAL DIALOG CONTAINER ───────────────────────────────────────────────────
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#191D1A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-[#FCFBF9] text-[#1C1917] rounded-[32px] w-full max-w-md p-5 sm:p-6 shadow-2xl border border-[#1C1917]/[0.08] animate-slide-up max-h-[90dvh] my-auto overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1C1917]/[0.05]">
          <h3 className="font-serif text-xl sm:text-2xl text-[#1C1917]">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex items-center justify-center transition-all cursor-pointer"
            aria-label={`Close ${title}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── ADD MEAL MODAL (Smart Custom Dish Logger) ────────────────────────────────
function AddMealModal({
  userId,
  date,
  onSave,
  onSaveTemplate,
  onClose,
}: {
  userId: string;
  date: string;
  onSave: (m: Omit<MealEntry, "id">) => void;
  onSaveTemplate: (t: Omit<MealTemplate, "id">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimated, setEstimated] = useState(false);
  const lastEstimated = useRef("");

  const matchedPhoto = resolveDishThumbnail(name);

  const estimateMacros = async (dishName: string) => {
    if (!dishName.trim() || dishName.trim().length < 3) return;
    if (dishName.trim() === lastEstimated.current) return;

    setEstimating(true);
    setEstimated(false);
    try {
      const res = await fetch("/api/estimate-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName: dishName.trim() }),
      });
      const data = await res.json();
      if (!data.error) {
        setCalories(String(data.calories));
        setProtein(String(data.proteinG));
        setCarbs(String(data.carbsG));
        setFat(String(data.fatG));
        lastEstimated.current = dishName.trim();
        setEstimated(true);
      }
    } catch {
      // silently fail — user can fill manually
    } finally {
      setEstimating(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const macros = {
      calories: Number(calories) || 0,
      proteinG: Number(protein) || 0,
      carbsG: Number(carbs) || 0,
      fatG: Number(fat) || 0,
    };
    if (saveAsTemplate) {
      onSaveTemplate({
        userId,
        name: name.trim(),
        baseQuantity: 1,
        unit: "serving",
        macros,
        createdAt: Date.now(),
        useCount: 0,
      });
    }
    onSave({
      userId,
      date,
      name: name.trim(),
      macros,
      photoUrl: matchedPhoto,
      createdAt: Date.now(),
    });
  };

  const stepMacro = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    current: string,
    delta: number
  ) => {
    const val = Math.max(0, (Number(current) || 0) + delta);
    setter(String(val));
    setEstimated(false);
  };

  return (
    <Modal title="Log a Custom Dish" onClose={onClose}>
      <div className="space-y-4">
        {/* Header badges */}
        <div className="flex items-center justify-between -mt-2">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#E05A47]">
            SMART DISCERNMENT
          </span>
          <span className="bg-[#E0F2E9] text-[#2D6A4F] text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Auto-Match
          </span>
        </div>

        {/* Dish Name & Live Matched Thumbnail */}
        <div className="bg-[#F6F3EC] rounded-2xl p-3.5 flex items-center justify-between gap-3 border border-[#1C1917]/[0.05]">
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block mb-1">
              DISH NAME / RECIPE *
            </label>
            <input
              autoFocus
              className="w-full bg-transparent text-sm font-bold text-[#1C1917] outline-none"
              placeholder="e.g. 2 besan cheela with curd"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setEstimated(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div className="w-14 h-14 rounded-2xl overflow-hidden relative shrink-0 shadow-2xs bg-[#EFECE4]">
            <img src={matchedPhoto} alt="Dish match preview" className="w-full h-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-[#2D6A4F]/90 text-white text-[8px] font-bold text-center py-0.2 tracking-wider uppercase flex items-center justify-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> Matched
            </span>
          </div>
        </div>

        {/* AI Recalculate Trigger */}
        <button
          type="button"
          onClick={() => estimateMacros(name)}
          disabled={estimating || !name.trim()}
          className="w-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] rounded-full py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {estimating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D6A4F]" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
          )}
          <span>{estimating ? "Calculating Macros..." : "Recalculate Macros from Dish Name"}</span>
        </button>

        {/* 2x2 Tactile Macro Grid with Steppers */}
        <div className="grid grid-cols-2 gap-3">
          {/* Calories */}
          <div className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.05]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C94A38] block mb-1">
              ENERGY (KCAL)
            </span>
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => stepMacro(setCalories, calories, -25)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                -
              </button>
              <input
                type="number"
                placeholder="0"
                value={calories}
                onChange={(e) => {
                  setCalories(e.target.value);
                  setEstimated(false);
                }}
                className="w-14 text-center bg-transparent text-sm font-bold text-[#1C1917] outline-none"
              />
              <button
                type="button"
                onClick={() => stepMacro(setCalories, calories, 25)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Protein */}
          <div className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.05]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] block mb-1">
              PROTEIN (G)
            </span>
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => stepMacro(setProtein, protein, -5)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                -
              </button>
              <input
                type="number"
                placeholder="0"
                value={protein}
                onChange={(e) => {
                  setProtein(e.target.value);
                  setEstimated(false);
                }}
                className="w-14 text-center bg-transparent text-sm font-bold text-[#1C1917] outline-none"
              />
              <button
                type="button"
                onClick={() => stepMacro(setProtein, protein, 5)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.05]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] block mb-1">
              CARBS (G)
            </span>
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => stepMacro(setCarbs, carbs, -5)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                -
              </button>
              <input
                type="number"
                placeholder="0"
                value={carbs}
                onChange={(e) => {
                  setCarbs(e.target.value);
                  setEstimated(false);
                }}
                className="w-14 text-center bg-transparent text-sm font-bold text-[#1C1917] outline-none"
              />
              <button
                type="button"
                onClick={() => stepMacro(setCarbs, carbs, 5)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Fat */}
          <div className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.05]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E05A47] block mb-1">
              FAT (G)
            </span>
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => stepMacro(setFat, fat, -2)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                -
              </button>
              <input
                type="number"
                placeholder="0"
                value={fat}
                onChange={(e) => {
                  setFat(e.target.value);
                  setEstimated(false);
                }}
                className="w-14 text-center bg-transparent text-sm font-bold text-[#1C1917] outline-none"
              />
              <button
                type="button"
                onClick={() => stepMacro(setFat, fat, 2)}
                className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Save as Repertoire checkbox */}
        <button
          type="button"
          onClick={() => setSaveAsTemplate((v) => !v)}
          className="w-full flex items-center gap-2.5 py-1 px-1 cursor-pointer"
        >
          <span
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
              saveAsTemplate ? "bg-[#2D6A4F] border-[#2D6A4F]" : "border-stone-300"
            )}
          >
            {saveAsTemplate && <Check className="w-3.5 h-3.5 text-white" />}
          </span>
          <span className="text-xs font-semibold text-[#57534E] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#2D6A4F]" />
            Save to my Repertoire for 1-tap logging
          </span>
        </button>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-3.5 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            type="button"
            className="flex-1 bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-3.5 text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            Add to Today&apos;s Fuel →
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── SAVED MEALS MODAL (Repertoire) ───────────────────────────────────────────
function SavedMealsModal({
  templates,
  userId,
  date,
  onLog,
  onDelete,
  onClose,
}: {
  templates: MealTemplate[];
  userId: string;
  date: string;
  onLog: (meal: Omit<MealEntry, "id">, templateId: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MealTemplate | null>(null);

  if (selected) {
    return (
      <LogTemplateView
        template={selected}
        userId={userId}
        date={date}
        onBack={() => setSelected(null)}
        onLog={onLog}
        onClose={onClose}
      />
    );
  }

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <Modal title="Frequent & Saved Staples" onClose={onClose}>
      <div className="space-y-3.5">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F] block -mt-2">
          SAVED REPERTOIRE
        </span>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C857B]" />
          <input
            className="w-full bg-[#F6F3EC] rounded-full pl-10 pr-4 py-2 text-xs text-[#1C1917] outline-none border border-[#1C1917]/[0.06]"
            placeholder="Search staples (e.g., Oats, Dosa, Chicken)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="w-10 h-10 text-[#8C857B] mx-auto mb-2 opacity-50" />
            <p className="font-serif text-base text-[#1C1917]">No Saved Meals Yet</p>
            <p className="text-xs text-[#57534E] mt-1 px-4 leading-relaxed">
              Tap the bookmark icon on any logged meal to save it here for one-tap logging.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[50dvh] overflow-y-auto no-scrollbar pr-0.5">
            {filtered.map((t) => {
              const thumb = resolveDishThumbnail(t.name);
              return (
                <div
                  key={t.id}
                  className="bg-[#F6F3EC] rounded-[22px] p-3 flex items-center justify-between gap-3 border border-[#1C1917]/[0.05]"
                >
                  <div
                    onClick={() => setSelected(t)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#EFECE4]">
                      <img src={thumb} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-[#1C1917] leading-snug truncate">
                        {t.name}
                      </h4>
                      <p className="text-[10px] text-[#8C857B] mt-0.5 truncate">
                        Per {t.baseQuantity} {t.unit}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="bg-[#FADCD5]/70 text-[#C94A38] text-[9px] font-bold px-2 py-0.2 rounded-full whitespace-nowrap">
                          {Math.round(t.macros.calories)} kcal
                        </span>
                        <span className="bg-[#D1FAE5] text-[#1B4332] text-[9px] font-bold px-2 py-0.2 rounded-full whitespace-nowrap">
                          {Math.round(t.macros.proteinG)}g P
                        </span>
                        <span className="text-[9px] text-[#57534E] whitespace-nowrap">
                          {Math.round(t.macros.carbsG)}g C · {Math.round(t.macros.fatG)}g F
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelected(t)}
                      className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xs transition-all cursor-pointer"
                    >
                      + Log
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      className="text-[#8C857B] hover:text-[#E05A47] p-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── LOG TEMPLATE VIEW (Scale & Log Saved Staple) ──────────────────────────────
function LogTemplateView({
  template,
  userId,
  date,
  onBack,
  onLog,
  onClose,
}: {
  template: MealTemplate;
  userId: string;
  date: string;
  onBack: () => void;
  onLog: (meal: Omit<MealEntry, "id">, templateId: string) => void;
  onClose: () => void;
}) {
  const scaledFor = (q: number) => {
    const f = (q || 0) / (template.baseQuantity || 1);
    return {
      calories: String(Math.round(template.macros.calories * f)),
      protein: String(Math.round(template.macros.proteinG * f)),
      carbs: String(Math.round(template.macros.carbsG * f)),
      fat: String(Math.round(template.macros.fatG * f)),
      fiber: template.macros.fiberG != null ? String(Math.round(template.macros.fiberG * f)) : "",
    };
  };

  const [qty, setQty] = useState(String(template.baseQuantity));
  const [macros, setMacros] = useState(scaledFor(template.baseQuantity));

  const setQtyAndScale = (v: string) => {
    setQty(v);
    setMacros(scaledFor(Number(v)));
  };

  const stepSize = template.baseQuantity >= 1 ? 1 : 0.5;
  const step = (delta: number) => {
    const next = Math.max(0, Math.round(((Number(qty) || 0) + delta) * 10) / 10);
    setQtyAndScale(String(next));
  };

  const handleLog = () => {
    const q = Number(qty) || 0;
    const label = q === template.baseQuantity ? template.name : `${template.name} (${qty} ${template.unit})`;
    onLog(
      {
        userId,
        date,
        name: label,
        macros: {
          calories: Number(macros.calories) || 0,
          proteinG: Number(macros.protein) || 0,
          carbsG: Number(macros.carbs) || 0,
          fatG: Number(macros.fat) || 0,
          ...(macros.fiber ? { fiberG: Number(macros.fiber) } : {}),
        },
        createdAt: Date.now(),
      },
      template.id
    );
  };

  return (
    <Modal title={template.name} onClose={onClose}>
      <div className="space-y-4">
        <button
          onClick={onBack}
          type="button"
          className="text-xs font-semibold text-[#2D6A4F] flex items-center gap-1 -mt-2 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Repertoire
        </button>

        {/* Quantity Stepper */}
        <div className="bg-[#F6F3EC] rounded-2xl p-3.5 border border-[#1C1917]/[0.05]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block mb-1">
            PORTION QUANTITY
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => step(-stepSize)}
              type="button"
              className="w-8 h-8 rounded-full bg-white text-base font-bold flex items-center justify-center cursor-pointer shadow-2xs"
            >
              -
            </button>
            <input
              type="number"
              className="w-20 text-center text-lg font-bold bg-transparent text-[#1C1917] outline-none"
              value={qty}
              onChange={(e) => setQtyAndScale(e.target.value)}
            />
            <span className="text-xs font-bold text-[#8C857B]">{template.unit}</span>
            <button
              onClick={() => step(stepSize)}
              type="button"
              className="w-8 h-8 rounded-full bg-white text-base font-bold flex items-center justify-center cursor-pointer shadow-2xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Scaled Macro Donut Breakdown */}
        <div className="bg-[#191D1A] text-white rounded-[24px] p-4 shadow-md">
          <MacroDonutBreakdown
            variant="dark"
            calories={Number(macros.calories) || 0}
            carbs={Number(macros.carbs) || 0}
            fat={Number(macros.fat) || 0}
            protein={Number(macros.protein) || 0}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onBack}
            type="button"
            className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-3.5 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleLog}
            type="button"
            className="flex-1 bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-3.5 text-xs font-semibold shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Log Meal</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── SAVE TEMPLATE MODAL ───────────────────────────────────────────────────────
function SaveTemplateModal({
  userId,
  initial,
  onSave,
  onClose,
}: {
  userId: string;
  initial: { name: string; macros: MealMacros };
  onSave: (t: Omit<MealTemplate, "id">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [baseQuantity, setBaseQuantity] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [macros, setMacros] = useState({
    calories: String(Math.round(initial.macros.calories)),
    protein: String(Math.round(initial.macros.proteinG)),
    carbs: String(Math.round(initial.macros.carbsG)),
    fat: String(Math.round(initial.macros.fatG)),
  });

  const units = ["serving", "bowl", "plate", "piece", "cup", "g"];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      userId,
      name: name.trim(),
      baseQuantity: Number(baseQuantity) || 1,
      unit: unit.trim() || "serving",
      macros: {
        calories: Number(macros.calories) || 0,
        proteinG: Number(macros.protein) || 0,
        carbsG: Number(macros.carbs) || 0,
        fatG: Number(macros.fat) || 0,
      },
      createdAt: Date.now(),
      useCount: 0,
    });
  };

  return (
    <Modal title="Save to Repertoire" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block mb-1">
            STAPLE NAME *
          </label>
          <input
            className="w-full bg-[#F6F3EC] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C1917] outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block mb-1.5">
            SERVING UNIT
          </label>
          <div className="flex flex-wrap gap-1.5">
            {units.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                  unit === u ? "bg-[#2D6A4F] text-white" : "bg-[#EFECE4] text-[#57534E]"
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-3 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            type="button"
            className="flex-1 bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-full py-3 text-xs font-semibold shadow-md cursor-pointer disabled:opacity-50"
          >
            Save Staple
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── GOALS MODAL ───────────────────────────────────────────────────────────────
function GoalsModal({
  goals,
  onSave,
  onClose,
}: {
  goals: MacroGoals | null;
  onSave: (g: MacroGoals) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    calories: goals ? String(goals.calories) : "2000",
    proteinG: goals ? String(goals.proteinG) : "150",
    carbsG: goals ? String(goals.carbsG) : "200",
    fatG: goals ? String(goals.fatG) : "65",
  });

  const handleSave = () => {
    const cal = Number(form.calories);
    const p = Number(form.proteinG);
    const c = Number(form.carbsG);
    const f = Number(form.fatG);
    if (!cal || !p || !c || !f || cal <= 0 || p <= 0 || c <= 0 || f <= 0) return;
    onSave({
      calories: Math.round(cal),
      proteinG: Math.round(p),
      carbsG: Math.round(c),
      fatG: Math.round(f),
    });
  };

  const fields = [
    { key: "calories" as const, label: "Calories", unit: "kcal", color: "text-[#E05A47]" },
    { key: "proteinG" as const, label: "Protein", unit: "g", color: "text-[#2D6A4F]" },
    { key: "carbsG" as const, label: "Carbs", unit: "g", color: "text-[#F59E0B]" },
    { key: "fatG" as const, label: "Fat", unit: "g", color: "text-[#E05A47]" },
  ];

  return (
    <Modal title="Daily Macro Goals" onClose={onClose}>
      <p className="text-xs text-[#57534E] -mt-2 mb-4 font-medium">
        Calibrate your daily nutritional anchors
      </p>
      <div className="space-y-3 mb-5">
        {fields.map(({ key, label, unit, color }) => (
          <div
            key={key}
            className="grid grid-cols-12 items-center gap-3 bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.05]"
          >
            <label className={cn("col-span-3 text-xs font-bold", color)}>{label}</label>
            <input
              type="number"
              className="col-span-7 text-right text-sm font-bold bg-transparent text-[#1C1917] outline-none"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
            <span className="col-span-2 text-xs font-semibold text-[#8C857B] whitespace-nowrap text-left">{unit}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          type="button"
          className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-3 text-xs font-semibold cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          type="button"
          className="flex-1 bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-full py-3 text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          Save Goals
        </button>
      </div>
    </Modal>
  );
}


// ── MEAL PHOTO PREVIEW CONTAINER (Compliant Next.js Image) ────────────────────
export function MealPhotoPreview({
  preview,
  scanning,
  reestimating,
  scanStage,
  setError,
}: {
  preview: string;
  scanning?: boolean;
  reestimating?: boolean;
  scanStage?: string;
  setError: (err: string) => void;
}) {
  if (!preview) return null;
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden">
      <NextImage
        src={preview}
        alt="Meal preview"
        fill
        unoptimized
        className="object-cover"
        onError={() => setError("Image preview not supported. Please select a JPG or PNG.")}
      />
      {(scanning || reestimating) && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-2 text-white z-10">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">
            {scanning ? scanStage : "Recalculating macros..."}
          </span>
        </div>
      )}
    </div>
  );
}

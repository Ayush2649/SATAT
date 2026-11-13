"use client";

import { createPortal } from "react-dom";
import React, { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import {
  X,
  Camera,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MacroDonutBreakdown from "@/components/diet/MacroDonutBreakdown";
import { resolveDishThumbnail } from "@/lib/diet/dishMatcher";
import { resolveFoodItem } from "@/lib/ai/nutrition/calculator";
import type { MealEntry } from "@/types";

export type MealScannerModalProps = {
  userId: string;
  date: string;
  initialMode?: "plate" | "barcode";
  onSave: (m: Omit<MealEntry, "id">) => void;
  onClose: () => void;
  onSwitchToManual?: () => void;
  onSwitchToVoice?: () => void;
};

export interface QuickModifierPreset {
  label: string;
  componentChip: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  isHomeCookedModifier?: boolean;
}

export const QUICK_MODIFIERS: QuickModifierPreset[] = [
  {
    label: "+ 1 Scoop Whey",
    componentChip: "Whey protein ~30 g",
    calories: 120,
    proteinG: 24,
    carbsG: 3,
    fatG: 1.5,
  },
  {
    label: "+ 1 tsp Ghee",
    componentChip: "Ghee ~5 g",
    calories: 45,
    proteinG: 0,
    carbsG: 0,
    fatG: 5,
  },
  {
    label: "+ Boiled Egg",
    componentChip: "Boiled egg ~50 g",
    calories: 78,
    proteinG: 6,
    carbsG: 1,
    fatG: 5,
  },
  {
    label: "Home Cooked",
    componentChip: "Home-cooked (low oil)",
    isHomeCookedModifier: true,
  },
];

export interface LiveScanMacroOptions {
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  portionMultiplier?: number;
  activeModifiers: string[];
  serverVisibleItems?: string[];
  hintText?: string;
}

export interface LiveScanMacroResult {
  currentCalories: number;
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  addonCalories: number;
  addonProtein: number;
  addonCarbs: number;
  addonFat: number;
  fatReduction: number;
}

export function calculateLiveScanMacros({
  baseCalories,
  baseProtein,
  baseCarbs,
  baseFat,
  portionMultiplier = 1.0,
  activeModifiers = [],
  serverVisibleItems = [],
  hintText = "",
}: LiveScanMacroOptions): LiveScanMacroResult {
  let scaledCalories = Math.round(baseCalories * portionMultiplier);
  let scaledCarbs = Math.round(baseCarbs * portionMultiplier);
  let scaledFat = Math.round(baseFat * portionMultiplier);
  let scaledProtein = Math.round(baseProtein * portionMultiplier);

  const isHomeCookedActive = activeModifiers.includes("Home Cooked");
  const serverHasHomeCooked = serverVisibleItems.some((v) => /home[- ]cooked/i.test(v));
  let fatReduction = 0;

  if (isHomeCookedActive && !serverHasHomeCooked) {
    fatReduction = Math.min(8, Math.round(scaledFat * 0.25));
    scaledFat = Math.max(0, scaledFat - fatReduction);
    scaledCalories = Math.max(0, scaledCalories - fatReduction * 9);
  }

  let addonCalories = 0;
  let addonProtein = 0;
  let addonCarbs = 0;
  let addonFat = 0;

  for (const mod of QUICK_MODIFIERS) {
    if (mod.isHomeCookedModifier) continue;
    const isActive = activeModifiers.includes(mod.label);
    let serverHasMod = false;

    if (mod.label === "+ 1 Scoop Whey") {
      serverHasMod = serverVisibleItems.some((v) => /whey|protein powder/i.test(v));
    } else if (mod.label === "+ 1 tsp Ghee") {
      serverHasMod = serverVisibleItems.some((v) => /\bghee\b/i.test(v));
    } else if (mod.label === "+ Boiled Egg") {
      serverHasMod = serverVisibleItems.some((v) => /\b(boiled\s+egg|egg)\b/i.test(v));
    }

    if (isActive && !serverHasMod) {
      addonCalories += mod.calories || 0;
      addonProtein += mod.proteinG || 0;
      addonCarbs += mod.carbsG || 0;
      addonFat += mod.fatG || 0;
    }
  }

  const lowerHint = hintText.toLowerCase();
  if (
    lowerHint &&
    !activeModifiers.includes("+ 1 Scoop Whey") &&
    !serverVisibleItems.some((v) => /whey/i.test(v)) &&
    /\bwhey\b/i.test(lowerHint)
  ) {
    addonCalories += 120;
    addonProtein += 24;
    addonCarbs += 3;
    addonFat += 1.5;
  }
  if (
    lowerHint &&
    !activeModifiers.includes("+ 1 tsp Ghee") &&
    !serverVisibleItems.some((v) => /\bghee\b/i.test(v)) &&
    /\bghee\b/i.test(lowerHint)
  ) {
    addonCalories += 45;
    addonFat += 5;
  }
  if (
    lowerHint &&
    !activeModifiers.includes("+ Boiled Egg") &&
    !serverVisibleItems.some((v) => /\begg\b/i.test(v)) &&
    /\b(boiled\s+egg|egg)\b/i.test(lowerHint)
  ) {
    addonCalories += 78;
    addonProtein += 6;
    addonCarbs += 1;
    addonFat += 5;
  }
  if (
    lowerHint &&
    !serverVisibleItems.some((v) => /curd|dahi/i.test(v)) &&
    /\b(curd|dahi)\b/i.test(lowerHint)
  ) {
    addonCalories += 60;
    addonProtein += 3.5;
    addonCarbs += 4.7;
    addonFat += 3.3;
  }

  return {
    currentCalories: Math.max(0, Math.round(scaledCalories + addonCalories)),
    currentProtein: Math.max(0, Math.round(scaledProtein + addonProtein)),
    currentCarbs: Math.max(0, Math.round(scaledCarbs + addonCarbs)),
    currentFat: Math.max(0, Math.round(scaledFat + addonFat)),
    addonCalories,
    addonProtein,
    addonCarbs,
    addonFat,
    fatReduction,
  };
}

// Client-side image resize helper (max 1024px, JPEG 0.82)
async function resizeImageClient(
  file: File,
  maxDim = 1024,
  quality = 0.82
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        const raw = dataUrl.split(",")[1];
        resolve({ base64: raw, mimeType: file.type || "image/jpeg" });
      };
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            const raw = dataUrl.split(",")[1];
            return resolve({ base64: raw, mimeType: file.type || "image/jpeg" });
          }

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const scaledDataUrl = canvas.toDataURL("image/jpeg", quality);
          const base64 = scaledDataUrl.split(",")[1];
          resolve({ base64, mimeType: "image/jpeg" });
        } catch {
          const raw = dataUrl.split(",")[1];
          resolve({ base64: raw, mimeType: file.type || "image/jpeg" });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function MealScannerModal({
  userId,
  date,
  initialMode = "plate",
  onSave,
  onClose,
  onSwitchToManual,
  onSwitchToVoice,
}: MealScannerModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Plate Photo AI state (starts strictly empty - zero fake preloaded photos!)
  const [preview, setPreview] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState("Compressing photo...");
  const [result, setResult] = useState<any>(null);
  const [hint, setHint] = useState("");
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isPhotoUnavailable, setIsPhotoUnavailable] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);
  const [mounted, setMounted] = useState(false);
  const lastUploadedFileRef = useRef<File | null>(null);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  const resetPlateState = () => {
    setPreview("");
    setResult(null);
    setError("");
    setIsPhotoUnavailable(false);
    setPortionMultiplier(1.0);
    setActiveModifiers([]);
  };

  const handleFile = async (file: File) => {
    lastUploadedFileRef.current = file;
    if (scanning) return;
    setError("");
    setIsPhotoUnavailable(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setScanning(true);
    setScanStage("Compressing photo...");

    try {
      const { base64, mimeType } = await resizeImageClient(file);
      setPreview(`data:${mimeType};base64,${base64}`);

      setScanStage("Analyzing plate components with Orbit Vision...");
      const stageTimer = setTimeout(() => {
        if (!controller.signal.aborted) {
          setScanStage("Calculating nutritional macros...");
        }
      }, 2200);

      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          hint: hint.trim() || undefined,
        }),
      });

      clearTimeout(stageTimer);

      if (controller.signal.aborted) return;

      const data = await res.json();
      if (data.error) {
        if (data.error === "PHOTO_UNAVAILABLE" || data.message?.includes("Photo scan is busy")) {
          setIsPhotoUnavailable(true);
          setError("Photo scan is busy. Type or speak your meal instead.");
        } else {
          setError(data.error);
        }
      } else {
        setResult(data);
        setPortionMultiplier(1.0);

        // Detect if any modifier was included by server
        const detectedMods: string[] = [];
        if (data.visibleItems?.some((v: string) => /whey|protein powder/i.test(v))) {
          detectedMods.push("+ 1 Scoop Whey");
        }
        if (data.visibleItems?.some((v: string) => /\bghee\b/i.test(v))) {
          detectedMods.push("+ 1 tsp Ghee");
        }
        if (data.visibleItems?.some((v: string) => /\b(boiled\s+egg|egg)\b/i.test(v))) {
          detectedMods.push("+ Boiled Egg");
        }
        if (data.visibleItems?.some((v: string) => /home[- ]cooked/i.test(v))) {
          detectedMods.push("Home Cooked");
        }
        if (detectedMods.length > 0) {
          setActiveModifiers(detectedMods);
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError("Failed to analyze image. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleReanalyzeWithHint = () => {
    if (lastUploadedFileRef.current) {
      handleFile(lastUploadedFileRef.current);
    }
  };

  const isNoFoodDetected = Boolean(
    result &&
      (!result.calories ||
        result.calories === 0 ||
        !result.name ||
        result.name.toLowerCase().includes("unknown") ||
        result.noFoodDetected)
  );

  const handleToggleModifier = (mod: QuickModifierPreset) => {
    const isCurrentlyActive = activeModifiers.includes(mod.label);
    let updatedModifiers: string[];
    if (isCurrentlyActive) {
      updatedModifiers = activeModifiers.filter((m) => m !== mod.label);
      setHint((prev) => {
        const parts = prev
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        const filtered = parts.filter(
          (p) => p.toLowerCase() !== mod.label.toLowerCase()
        );
        return filtered.join(", ");
      });
    } else {
      updatedModifiers = [...activeModifiers, mod.label];
      setHint((prev) => {
        const parts = prev
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        if (!parts.some((p) => p.toLowerCase() === mod.label.toLowerCase())) {
          parts.push(mod.label);
        }
        return parts.join(", ");
      });
    }
    setActiveModifiers(updatedModifiers);
  };

  const handleSelectCandidate = (candidateName: string) => {
    const matched = resolveFoodItem(candidateName);
    if (matched) {
      const grams = matched.gramsPerDefaultUnit || 100;
      const factor = grams / 100;
      setResult((prev: any) => ({
        ...prev,
        name: candidateName,
        calories: Math.round(matched.per100g.calories * factor),
        proteinG: Math.round(matched.per100g.proteinG * factor),
        carbsG: Math.round(matched.per100g.carbsG * factor),
        fatG: Math.round(matched.per100g.fatG * factor),
      }));
    } else {
      setResult((prev: any) => ({
        ...prev,
        name: candidateName,
      }));
    }
  };

  // Real macros extracted strictly from real AI estimation
  const rawCalories = Number(result?.calories) || 0;
  const rawCarbs = Number(result?.carbsG) || 0;
  const rawFat = Number(result?.fatG) || 0;
  const rawProtein = Number(result?.proteinG) || 0;
  const detectedDishName = result?.name || "Detected Meal";

  const {
    currentCalories,
    currentCarbs,
    currentFat,
    currentProtein,
  } = calculateLiveScanMacros({
    baseCalories: rawCalories,
    baseProtein: rawProtein,
    baseCarbs: rawCarbs,
    baseFat: rawFat,
    portionMultiplier,
    activeModifiers,
    serverVisibleItems: result?.visibleItems || [],
    hintText: hint,
  });

  const activeAddonChips = QUICK_MODIFIERS
    .filter((mod) => activeModifiers.includes(mod.label))
    .map((mod) => mod.componentChip)
    .filter((chip) => {
      const keyword = chip.toLowerCase().split(" ")[0];
      return !result?.visibleItems?.some((v: string) =>
        v.toLowerCase().includes(keyword)
      );
    });

  const handleLogPlateMeal = () => {
    if (currentCalories <= 0) {
      setError("Cannot log a meal with 0 calories.");
      return;
    }

    const activeAddonsForName = activeModifiers.filter((m) => m !== "Home Cooked");
    let savedMealName = detectedDishName;
    if (activeModifiers.includes("Home Cooked") && !savedMealName.toLowerCase().includes("home-cooked")) {
      savedMealName = `Home-Cooked ${savedMealName}`;
    }
    if (portionMultiplier !== 1.0) {
      savedMealName = `${savedMealName} (${portionMultiplier.toFixed(1)}×)`;
    }
    if (activeAddonsForName.length > 0) {
      savedMealName = `${savedMealName} ${activeAddonsForName.join(" ")}`;
    }

    onSave({
      userId,
      date,
      name: savedMealName,
      macros: {
        calories: currentCalories,
        proteinG: currentProtein,
        carbsG: currentCarbs,
        fatG: currentFat,
      },
      photoUrl: preview || undefined,
      createdAt: Date.now(),
    });
  };

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#191D1A]/65 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center sm:p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fuel Scanner"
        className="relative w-full max-w-lg bg-[#FCFBF9] text-[#1C1917] rounded-t-[32px] sm:rounded-[32px] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#1C1917]/10 animate-slide-up"
      >
        {/* Sticky Modal Header (Never scrolls away) */}
        <div className="shrink-0 px-5 pt-4 pb-3 bg-[#FCFBF9] border-b border-[#1C1917]/[0.06] flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            type="button"
            className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close Scanner"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center flex-1 min-w-0">
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-[#2D6A4F] block leading-none">
              RITUAL SCAN
            </span>
            <span className="font-sans font-bold text-base text-[#1C1917] leading-tight mt-0.5 block truncate">
              Fuel Scanner
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#E0F2E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Independently Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 no-scrollbar">
          {/* Editorial Serif Title */}
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-tight leading-snug">
              Instant Food Intelligence
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              Hold plate in clear daylight for component-by-component macro estimation.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in">
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={scanning}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {/* STATE 1: INITIAL EMPTY CAPTURE STATE */}
              {!preview && !result && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="rounded-[26px] border-2 border-dashed border-[#1C1917]/15 bg-[#F6F3EC] p-7 text-center relative overflow-hidden aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:border-[#E05A47] transition-all group shadow-2xs"
                >
                  <div className="absolute top-3.5 left-3.5 w-6 h-6 border-t-2 border-l-2 border-[#2D6A4F]/50 rounded-tl-lg pointer-events-none group-hover:border-[#E05A47]" />
                  <div className="absolute top-3.5 right-3.5 w-6 h-6 border-t-2 border-r-2 border-[#2D6A4F]/50 rounded-tr-lg pointer-events-none group-hover:border-[#E05A47]" />
                  <div className="absolute bottom-3.5 left-3.5 w-6 h-6 border-b-2 border-l-2 border-[#2D6A4F]/50 rounded-bl-lg pointer-events-none group-hover:border-[#E05A47]" />
                  <div className="absolute bottom-3.5 right-3.5 w-6 h-6 border-b-2 border-r-2 border-[#2D6A4F]/50 rounded-br-lg pointer-events-none group-hover:border-[#E05A47]" />

                  <div className="w-14 h-14 rounded-full bg-[#191D1A] text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6 text-[#E05A47]" />
                  </div>
                  <h3 className="font-serif text-xl text-[#1C1917] leading-snug">
                    Capture or Upload Your Plate
                  </h3>
                  <p className="text-xs text-[#57534E] max-w-[240px] mt-1 leading-relaxed">
                    Take a photo of your meal or pick from gallery for instant macro breakdown.
                  </p>

                  <div className="mt-4">
                    <span className="bg-[#E05A47] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Take / Choose Photo
                    </span>
                  </div>
                </div>
              )}

              {/* STATE 2 & 3: PHOTO SELECTED */}
              {preview && (
                <div className="rounded-[26px] overflow-hidden relative aspect-[4/3] bg-[#191D1A] shadow-md border border-white/10 group">
                  <NextImage src={preview} alt="User plate scan" fill unoptimized className="object-cover" />

                  <div className="absolute top-3.5 left-3.5 w-6 h-6 border-t-2 border-l-2 border-[#E05A47] rounded-tl-lg pointer-events-none" />
                  <div className="absolute top-3.5 right-3.5 w-6 h-6 border-t-2 border-r-2 border-[#E05A47] rounded-tr-lg pointer-events-none" />
                  <div className="absolute bottom-3.5 left-3.5 w-6 h-6 border-b-2 border-l-2 border-[#E05A47] rounded-bl-lg pointer-events-none" />
                  <div className="absolute bottom-3.5 right-3.5 w-6 h-6 border-b-2 border-r-2 border-[#E05A47] rounded-br-lg pointer-events-none" />

                  {/* Real AI tags (only when food detected) */}
                  {result && !scanning && !isNoFoodDetected && (
                    <div className="absolute top-4 inset-x-4 flex flex-wrap gap-1.5 pointer-events-none">
                      <span className="bg-[#191D1A]/85 backdrop-blur-md text-white rounded-full px-3 py-1 text-[11px] font-semibold shadow-md inline-flex items-center gap-1 border border-white/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                        {detectedDishName}
                      </span>
                      {result?.visibleItems?.slice(0, 3).map((item: string) => (
                        <span
                          key={item}
                          className="bg-[#191D1A]/75 backdrop-blur-md text-stone-200 rounded-full px-2.5 py-1 text-[10px] font-medium shadow-md border border-white/10"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom confidence badge */}
                  {result && !scanning && !isNoFoodDetected && (
                    <div className="absolute bottom-3.5 left-3.5">
                      {(() => {
                        const conf = (result.confidence || "high").toLowerCase();
                        if (conf === "high") {
                          return (
                            <span className="bg-[#D1FAE5] text-[#065F46] rounded-full px-2.5 py-1 text-[10px] font-bold shadow-md inline-flex items-center gap-1 border border-[#065F46]/10">
                              <Check className="w-3 h-3 text-[#065F46]" />
                              <span>High Confidence · Depth Calibrated</span>
                            </span>
                          );
                        }
                        if (conf === "medium") {
                          return (
                            <span className="bg-[#FEF3C7] text-[#92400E] rounded-full px-2.5 py-1 text-[10px] font-bold shadow-md inline-flex items-center gap-1 border border-[#92400E]/10">
                              <span>Medium Confidence · Portion Estimated</span>
                            </span>
                          );
                        }
                        return (
                          <span className="bg-[#FEE2E2] text-[#991B1B] rounded-full px-2.5 py-1 text-[10px] font-bold shadow-md inline-flex items-center gap-1 border border-[#991B1B]/10">
                            <span>Low Confidence · Add a Context Hint below</span>
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  {/* STATE 2: SCANNING OVERLAY */}
                  {scanning && (
                    <div className="absolute inset-0 bg-[#191D1A]/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                      <Loader2 className="w-8 h-8 animate-spin text-[#E05A47] mb-2" />
                      <p className="text-sm font-bold tracking-tight">{scanStage}</p>
                      <p className="text-xs text-stone-300 mt-0.5">Biomechanical vision model active</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error or busy state */}
              {isPhotoUnavailable ? (
                <div className="rounded-2xl p-3.5 text-center space-y-2 bg-[#FAF5E6] border border-[#E0AB57]/30 text-xs">
                  <p className="font-semibold text-[#8C6D2B]">
                    Photo scan is busy. Type or speak your meal instead.
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchToManual?.();
                      }}
                      className="bg-[#EFECE4] text-[#1C1917] rounded-full px-3 py-1.5 font-semibold text-xs cursor-pointer"
                    >
                      Type meal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchToVoice?.();
                      }}
                      className="bg-[#2D6A4F] text-white rounded-full px-3 py-1.5 font-semibold text-xs cursor-pointer"
                    >
                      Speak meal
                    </button>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-2xl p-3 text-xs font-semibold bg-[#FADCD5] text-[#C94A38] border border-[#E05A47]/20">
                  {error}
                </div>
              ) : null}

              {/* Context Hint Card */}
              <div className="bg-[#FCFBF9] dark:bg-[#1C221E] rounded-[24px] p-4 border border-[#1C1917]/[0.06] dark:border-white/10 shadow-2xs">
                <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block mb-1.5">
                  CONTEXT HINT (OPTIONAL — OIL, GHEE, PREPARATION)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="e.g. 2 aloo parathas, extra ghee, whey scoop"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && result && !scanning && hint.trim()) {
                        e.preventDefault();
                        handleReanalyzeWithHint();
                      }
                    }}
                    className={cn(
                      "w-full bg-[#F6F3EC] dark:bg-[#191D1A]/60 rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] dark:text-[#FCFBF9] outline-none border border-[#1C1917]/[0.06] dark:border-white/10 transition-all",
                      result && !scanning && hint.trim() ? "pr-28" : ""
                    )}
                  />
                  {result && !scanning && hint.trim() && (
                    <button
                      type="button"
                      onClick={handleReanalyzeWithHint}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      aria-label="Apply Hint and re-analyze"
                    >
                      <span>Apply Hint</span>
                      <span className="text-xs">↻</span>
                    </button>
                  )}
                </div>

                {/* Quick-tap modifier pills */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {QUICK_MODIFIERS.map((mod) => {
                    const isActive = activeModifiers.includes(mod.label);
                    return (
                      <button
                        key={mod.label}
                        type="button"
                        onClick={() => handleToggleModifier(mod)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95",
                          isActive
                            ? "bg-[#2D6A4F] text-white border border-[#34D399]/40 shadow-xs"
                            : "bg-[#EFECE4] dark:bg-[#1C221E] text-[#57534E] dark:text-[#9CA39E] hover:bg-[#E2DDD2] hover:text-[#1C1917] dark:hover:text-white border border-transparent"
                        )}
                        aria-pressed={isActive}
                      >
                        {isActive && <Check className="w-3 h-3 text-[#34D399]" />}
                        <span>{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STATE 3A: NON-FOOD OR 0-CALORIE AMBER GUIDANCE CARD */}
              {result && !scanning && isNoFoodDetected && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-[24px] p-4 text-[#92400E] space-y-3 animate-slide-up shadow-sm">
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2 text-[#92400E]">
                      <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                      <span>Could not detect a clear meal on this plate</span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed text-[#B45309]">
                      Make sure your food is clearly visible in good lighting, or type what you&apos;re eating in the Context Hint box above and tap Re-Analyze.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="bg-[#191D1A] hover:bg-black text-white rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all active:scale-95"
                    >
                      Retake / Choose Another Photo
                    </button>

                    {hint.trim() && (
                      <button
                        type="button"
                        onClick={handleReanalyzeWithHint}
                        className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all active:scale-95"
                      >
                        Analyze from Context Hint
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STATE 3B: REAL FOOD ESTIMATION RETURNED (Stacked Full-Width Title — Never Truncated) */}
              {result && !scanning && !isNoFoodDetected && (
                <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[26px] p-4 sm:p-5 shadow-xl animate-slide-up space-y-3">
                  <div>
                    <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#6EE7B7] block leading-none mb-1">
                      DETECTED DISH
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl text-white leading-snug break-words">
                      {detectedDishName}
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-300 font-medium">Portion</span>
                      {/* 1-tap quick multiplier chips */}
                      <div className="flex items-center gap-1">
                        {[0.5, 1.0, 1.5, 2.0].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPortionMultiplier(m)}
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer active:scale-95",
                              Math.abs(portionMultiplier - m) < 0.05
                                ? "bg-[#E05A47] text-white shadow-xs"
                                : "bg-white/10 text-stone-300 hover:bg-white/20"
                            )}
                          >
                            {m}×
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/10 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1.5 text-xs text-white shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        aria-label="Decrease portion"
                        onClick={() =>
                          setPortionMultiplier((prev) =>
                            Math.max(0.25, Math.round((prev - 0.25) * 100) / 100)
                          )
                        }
                        className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold transition-all cursor-pointer active:scale-95"
                      >
                        -
                      </button>
                      <span className="font-semibold text-xs whitespace-nowrap px-1">
                        {portionMultiplier.toFixed(1)}× Bowl
                      </span>
                      <button
                        type="button"
                        aria-label="Increase portion"
                        onClick={() =>
                          setPortionMultiplier((prev) =>
                            Math.min(3.0, Math.round((prev + 0.25) * 100) / 100)
                          )
                        }
                        className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold transition-all cursor-pointer active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 3-Segment Macro Donut Breakdown */}
                  <MacroDonutBreakdown
                    variant="dark"
                    calories={currentCalories}
                    carbs={currentCarbs}
                    fat={currentFat}
                    protein={currentProtein}
                  />

                  {/* Detected Components Breakdown */}
                  {((result?.visibleItems && result.visibleItems.length > 0) || activeAddonChips.length > 0) && (
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-stone-400 block mb-1.5">
                        PLATE COMPONENTS DETECTED
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result?.visibleItems?.map((item: string, idx: number) => (
                          <span
                            key={`base-${idx}`}
                            className="bg-white/10 text-stone-200 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-medium"
                          >
                            {item}
                          </span>
                        ))}
                        {activeAddonChips.map((chip, idx) => (
                          <span
                            key={`addon-${idx}`}
                            className="bg-[#2D6A4F] text-[#D1FAE5] border border-[#34D399]/40 rounded-full px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs animate-fade-in"
                          >
                            <Check className="w-3 h-3 text-[#34D399]" />
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candidate alternatives if multiple */}
                  {result?.candidates && result.candidates.length > 1 && (
                    <div className="pt-1">
                      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-stone-400 block mb-1.5">
                        OR SELECT MATCHING DISH
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.candidates.map((cand: any) => (
                          <button
                            key={cand.name}
                            type="button"
                            onClick={() => handleSelectCandidate(cand.name)}
                            className={cn(
                              "text-xs px-3 py-1 rounded-full transition-all cursor-pointer font-medium",
                              cand.name === detectedDishName
                                ? "bg-[#E05A47] text-white"
                                : "bg-white/10 text-stone-200 hover:bg-white/20"
                            )}
                          >
                            {cand.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Log to Today's Fuel button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLogPlateMeal}
                      disabled={currentCalories <= 0}
                      className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-3.5 px-6 text-sm font-semibold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Log to Today&apos;s Fuel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


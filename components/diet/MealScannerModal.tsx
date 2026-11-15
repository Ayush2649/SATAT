"use client";

import ScanComponentEditor from "@/components/diet/ScanComponentEditor";
import { componentsFromScan, summarizeComponents, type ScanComponent } from "@/lib/nutrition/scan-review";
import { includesIngredient } from "@/lib/nutrition/hints";
import { useDialogFocus } from "@/lib/useDialogFocus";
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
import type { MealEntry } from "@/types";

export type MealScannerModalProps = {
  userId: string;
  date: string;
  initialMode?: "plate" | "barcode";
  onSave: (m: Omit<MealEntry, "id">) => unknown | Promise<unknown>;
  onClose: () => void;
  onSwitchToManual?: (draft?: { name: string; macros: MealEntry["macros"]; incomplete?: boolean }) => void;
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

  // Preparation labels do not establish an oil quantity.
  const fatReduction = 0;

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
    includesIngredient(lowerHint, "whey")
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
    includesIngredient(lowerHint, "ghee")
  ) {
    addonCalories += 45;
    addonFat += 5;
  }
  if (
    lowerHint &&
    !activeModifiers.includes("+ Boiled Egg") &&
    !serverVisibleItems.some((v) => /\begg\b/i.test(v)) &&
    includesIngredient(lowerHint, "(?:boiled\\s+)?egg")
  ) {
    addonCalories += 78;
    addonProtein += 6;
    addonCarbs += 1;
    addonFat += 5;
  }
  if (
    lowerHint &&
    !serverVisibleItems.some((v) => /curd|dahi/i.test(v)) &&
    includesIngredient(lowerHint, "curd|dahi")
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

// Preserve scan detail; a separate small thumbnail is produced when logging.
async function resizeImageClient(
  file: File,
  maxDim = 1536,
  quality = 0.92
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
  const [components, setComponents] = useState<ScanComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState("");
  const draftKey = `satat_scan_review_${encodeURIComponent(userId)}_${date}`;
  useEffect(() => {
    setDraftReady("");
    setComponents([]); setResult(null);
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (draft?.version === 1 && Array.isArray(draft.rows) && draft.rows.length && Date.now() - draft.savedAt < 86400000 && draft.rows.every((row: any) => typeof row.id === "string" && typeof row.name === "string" && typeof row.amount === "string" && typeof row.unit === "string" && row.micros)) {
        setComponents(draft.rows); setResult({ name: "Saved meal review", foods: [], confidence: "low", ambiguity: "high" });
      }
    } catch { /* Invalid or unavailable local drafts are ignored. */ }
    setDraftReady(draftKey);
  }, [draftKey]);
  useEffect(() => {
    if (draftReady !== draftKey || !components.length) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ version: 1, savedAt: Date.now(), rows: components })); } catch { /* Review still works without local storage. */ }
  }, [components, draftKey, draftReady]);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [isPhotoUnavailable, setIsPhotoUnavailable] = useState(false);
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
    setComponents([]);
    try { localStorage.removeItem(draftKey); } catch { /* Storage restricted. */ }
    setError("");
    setIsPhotoUnavailable(false);
  };

  const handleFile = async (file: File, hintOverride?: string) => {
    if (file === lastUploadedFileRef.current && components.some(row => row.portionSource === "user")) {
      setError("Your component corrections are kept. Choose another photo to start a new scan."); return;
    }
    lastUploadedFileRef.current = file;
    if (scanning) return;
    setError("");
    setIsPhotoUnavailable(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setResult(null);
    setScanning(true);
    setScanStage("Compressing photo...");

    const timeout = setTimeout(() => controller.abort(), 45000);
    let stageTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) throw new Error("Choose an image under 15 MB.");
      const { base64, mimeType } = await resizeImageClient(file);
      setPreview(`data:${mimeType};base64,${base64}`);

      setScanStage("Identifying the visible foods...");
      stageTimer = setTimeout(() => {
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
          hint: (hintOverride ?? hint).trim() || undefined,
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
        setComponents(componentsFromScan(data.foods || []));

        // Add-ons are explicit user edits, never inferred selections.
          }
    } catch (err: any) {
      if (err?.name === "AbortError") { setError("The scan took too long. Try again, or enter your meal manually."); return; }
      setError(err?.message === "Choose an image under 15 MB." ? err.message : "Failed to analyze image. Please try again.");
    } finally {
      clearTimeout(timeout);
      clearTimeout(stageTimer);
      setScanning(false);
    }
  };

  const handleReanalyzeWithHint = () => {
    if (lastUploadedFileRef.current) {
      handleFile(lastUploadedFileRef.current);
    }
  };

  const isNoFoodDetected = Boolean(result?.noFoodDetected);
  const [editingFood, setEditingFood] = useState(false);
  useDialogFocus(handleClose, mounted);

  const componentSummary = summarizeComponents(components);
  const { calories: currentCalories, proteinG: currentProtein, carbsG: currentCarbs, fatG: currentFat } = componentSummary.totals;
  const detectedDishName = components.map(row => row.name.trim()).filter(Boolean).join(" + ") || "Meal estimate";
  const handleLogPlateMeal = async () => {
    if (saving) return;
    if (!componentSummary.complete || editingFood || currentCalories <= 0) {
      setError("Finish editing your meal before logging."); return;
    }
    setSaving(true);
    try {
      const thumbnail = lastUploadedFileRef.current ? await resizeImageClient(lastUploadedFileRef.current, 500, 0.78) : null;
      const saved = await onSave({ userId, date, name: detectedDishName, macros: { calories: currentCalories, proteinG: currentProtein, carbsG: currentCarbs, fatG: currentFat }, ...(thumbnail && thumbnail.base64.length < 150000 ? { photoUrl: `data:${thumbnail.mimeType};base64,${thumbnail.base64}` } : {}), createdAt: Date.now(), nutritionStatus: "estimated", hasIncompleteNutrition: false, scanReview: JSON.parse(JSON.stringify({ version: 1, components: components.map(row => ({ ...row, confirmed: true })), micronutrients: componentSummary.micronutrients })) });
      if (saved !== false) { try { localStorage.removeItem(draftKey); } catch { /* Storage restricted. */ } }
    } catch { setError("Could not save. Your reviewed components are kept; try again."); }
    finally { setSaving(false); }
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
              MEAL PHOTO
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
          {!result && <div className="text-center sm:text-left">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-tight leading-snug">
              Scan your meal
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              {result ? "Check the dishes, adjust anything, and log." : "Take a clear photo of your whole meal."}
            </p>
          </div>}

          <div className="space-y-4 animate-fade-in">
            <input
                ref={fileRef}
                type="file"
                aria-label="Meal photo"
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
                  role="button"
                tabIndex={0}
                aria-label="Choose a meal photo"
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileRef.current?.click(); } }}
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
                <div className="rounded-[26px] overflow-hidden relative aspect-[4/3] bg-[var(--satat-bg)] border border-[var(--satat-border)] group">
                  <NextImage src={preview} alt="User plate scan" fill unoptimized className="object-contain" />

                  <div className="absolute top-3.5 left-3.5 w-6 h-6 border-t-2 border-l-2 border-[#E05A47] rounded-tl-lg pointer-events-none" />
                  <div className="absolute top-3.5 right-3.5 w-6 h-6 border-t-2 border-r-2 border-[#E05A47] rounded-tr-lg pointer-events-none" />
                  <div className="absolute bottom-3.5 left-3.5 w-6 h-6 border-b-2 border-l-2 border-[#E05A47] rounded-bl-lg pointer-events-none" />
                  <div className="absolute bottom-3.5 right-3.5 w-6 h-6 border-b-2 border-r-2 border-[#E05A47] rounded-br-lg pointer-events-none" />

                  {/* STATE 2: SCANNING OVERLAY */}
                  {scanning && (
                    <div className="absolute inset-0 bg-[#191D1A]/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                      <Loader2 className="w-8 h-8 animate-spin text-[#E05A47] mb-2" />
                      <p className="text-sm font-bold tracking-tight">{scanStage}</p>
                      <p className="text-xs text-stone-300 mt-0.5">Checking visible foods and approximate portions</p>
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

              {!result && (
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

              </div>
              )}

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

              {result && !scanning && !isNoFoodDetected && (
                <div className="space-y-4">
                  <ScanComponentEditor rows={components} onChange={rows => { setComponents(rows); setError(""); }} onEditingChange={setEditingFood} />
                  <div role="status" className="rounded-2xl border border-[var(--satat-border)] bg-[var(--satat-bg)] p-3">
                    {!componentSummary.complete && <p className="mb-2 text-xs text-[var(--satat-brand)]">Check the marked dishes to complete this estimate.</p>}
                    <MacroDonutBreakdown variant="light" calories={currentCalories} carbs={currentCarbs} fat={currentFat} protein={currentProtein} />
                    <p className="mt-2 text-center text-[11px] text-[var(--satat-text-muted)]">{componentSummary.complete ? "Estimated nutrition · portions and cooking oil may vary." : "Partial total · some nutrition is missing."}</p>
                  </div>
                  <button type="button" onClick={handleLogPlateMeal} disabled={saving || !componentSummary.complete || editingFood || currentCalories <= 0} className="w-full rounded-full bg-[var(--satat-brand)] text-white py-3.5 text-sm font-semibold disabled:opacity-50">{saving ? "Saving meal…" : "Looks right · Log meal"}</button>
                  <div className="flex justify-center gap-5 text-xs text-[var(--satat-text-secondary)]">
                    <button type="button" onClick={resetPlateState}>Scan again</button>
                    <button type="button" onClick={() => { handleClose(); onSwitchToManual?.({ name: detectedDishName, macros: { calories: currentCalories, proteinG: currentProtein, carbsG: currentCarbs, fatG: currentFat }, incomplete: !componentSummary.complete }); }}>Enter manually</button>
                  </div>
                  <details className="text-xs text-[var(--satat-text-muted)]"><summary className="cursor-pointer text-center">Add a note for the scan</summary>
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

              </div>
                  </details>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


"use client";

import { createPortal } from "react-dom";
import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  AlertCircle,
  Loader2,
  Sparkles,
  Barcode as BarcodeIcon,
  Plus,
  Minus,
  Check,
  Search,
  ScanBarcode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MacroDonutBreakdown from "@/components/diet/MacroDonutBreakdown";
import { resolveDishThumbnail } from "@/lib/diet/dishMatcher";
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

interface PackagedStaple {
  id: string;
  name: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const PACKAGED_STAPLES: PackagedStaple[] = [
  {
    id: "greek-yogurt",
    name: "High-Protein Greek Yogurt",
    servingLabel: "150g tub",
    calories: 130,
    proteinG: 15,
    carbsG: 8,
    fatG: 0,
  },
  {
    id: "amul-buttermilk",
    name: "Amul High Protein Buttermilk",
    servingLabel: "200ml pack",
    calories: 90,
    proteinG: 15,
    carbsG: 5,
    fatG: 1.5,
  },
  {
    id: "whey-isolate",
    name: "Whey Protein Isolate",
    servingLabel: "1 scoop (33g)",
    calories: 120,
    proteinG: 25,
    carbsG: 2,
    fatG: 1,
  },
  {
    id: "rolled-oats",
    name: "Rolled Oats Pouch",
    servingLabel: "50g serving",
    calories: 190,
    proteinG: 6,
    carbsG: 33,
    fatG: 3.5,
  },
  {
    id: "paneer-block",
    name: "Fresh Paneer Block",
    servingLabel: "100g portion",
    calories: 265,
    proteinG: 18,
    carbsG: 4,
    fatG: 20,
  },
  {
    id: "peanut-butter",
    name: "Natural Peanut Butter",
    servingLabel: "2 tbsp (32g)",
    calories: 190,
    proteinG: 8,
    carbsG: 6,
    fatG: 16,
  },
];

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

async function detectBarcodeClient(file: File): Promise<string | null> {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    return null;
  }
  try {
    const formats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"];
    const detector = new (window as any).BarcodeDetector({ formats });
    const bitmap = await createImageBitmap(file);
    const barcodes = await detector.detect(bitmap);
    if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
      return String(barcodes[0].rawValue).trim();
    }
  } catch {
    // fallback
  }
  return null;
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
  const [mode, setMode] = useState<"plate" | "barcode">(initialMode);
  const fileRef = useRef<HTMLInputElement>(null);
  const barcodeFileRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Plate Photo AI state (starts strictly empty - zero fake preloaded photos!)
  const [preview, setPreview] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState("Compressing photo...");
  const [result, setResult] = useState<any>(null);
  const [hint, setHint] = useState("");
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

  // Barcode / Packaged Staples state
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [stapleQuantities, setStapleQuantities] = useState<Record<string, number>>({});
  const [customStapleLookup, setCustomStapleLookup] = useState<PackagedStaple | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [barcodeScanStage, setBarcodeScanStage] = useState("");
  const [barcodeScanError, setBarcodeScanError] = useState("");

  const handleBarcodeFile = async (file: File) => {
    setBarcodeScanError("");
    setBarcodeScanning(true);
    setBarcodeScanStage("Reading barcode & optimizing image...");
    try {
      const [detectedBarcode, resized] = await Promise.all([
        detectBarcodeClient(file),
        resizeImageClient(file, 1400, 0.9),
      ]);

      setBarcodeScanStage(
        detectedBarcode
          ? `Searching barcode #${detectedBarcode}...`
          : "Scanning nutrition label & barcode with OCR..."
      );

      const res = await fetch("/api/diet/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: detectedBarcode || undefined,
          barcodeDigits: detectedBarcode || undefined,
          imageBase64: resized.base64,
          mimeType: resized.mimeType,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setCustomStapleLookup({
          id: data.item.id || `lookup-${Date.now()}`,
          name: data.item.name,
          servingLabel: data.item.servingLabel || "1 serving",
          calories: Math.round(data.item.calories),
          proteinG: Math.round(data.item.proteinG || 0),
          carbsG: Math.round(data.item.carbsG || 0),
          fatG: Math.round(data.item.fatG || 0),
        });
      } else {
        setBarcodeScanError(data.error || "Could not read barcode or nutrition label.");
      }
    } catch {
      setBarcodeScanError("Failed to process nutrition label image.");
    } finally {
      setBarcodeScanning(false);
    }
  };

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

  const handleAppendHint = (modifier: string) => {
    setHint((prev) => (prev.trim() ? `${prev.trim()}, ${modifier}` : modifier));
  };

  // Real macros extracted strictly from real AI estimation
  const rawCalories = Number(result?.calories) || 0;
  const rawCarbs = Number(result?.carbsG) || 0;
  const rawFat = Number(result?.fatG) || 0;
  const rawProtein = Number(result?.proteinG) || 0;
  const detectedDishName = result?.name || "Detected Meal";

  const currentCalories = Math.round(rawCalories * portionMultiplier);
  const currentCarbs = Math.round(rawCarbs * portionMultiplier);
  const currentFat = Math.round(rawFat * portionMultiplier);
  const currentProtein = Math.round(rawProtein * portionMultiplier);

  const handleLogPlateMeal = () => {
    if (currentCalories <= 0) {
      setError("Cannot log a meal with 0 calories.");
      return;
    }

    onSave({
      userId,
      date,
      name:
        portionMultiplier !== 1.0
          ? `${detectedDishName} (${portionMultiplier.toFixed(1)}×)`
          : detectedDishName,
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

  const handleLogStaple = (staple: PackagedStaple) => {
    const qty = stapleQuantities[staple.id] ?? 1;
    if (qty <= 0) return;

    onSave({
      userId,
      date,
      name: qty === 1 ? staple.name : `${staple.name} (${qty}× ${staple.servingLabel})`,
      macros: {
        calories: Math.round(staple.calories * qty),
        proteinG: Math.round(staple.proteinG * qty),
        carbsG: Math.round(staple.carbsG * qty),
        fatG: Math.round(staple.fatG * qty),
      },
      createdAt: Date.now(),
    });
  };

  const updateStapleQty = (id: string, delta: number) => {
    setStapleQuantities((prev) => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleLookupCustomStaple = async () => {
    const q = barcodeSearch.trim();
    if (!q) return;
    setLookupLoading(true);
    setBarcodeScanError("");
    try {
      // 1. Try dedicated barcode / food anchor / OpenFoodFacts search route
      const res = await fetch("/api/diet/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setCustomStapleLookup({
          id: data.item.id || `lookup-${Date.now()}`,
          name: data.item.name,
          servingLabel: data.item.servingLabel || "1 serving",
          calories: Math.round(data.item.calories),
          proteinG: Math.round(data.item.proteinG || 0),
          carbsG: Math.round(data.item.carbsG || 0),
          fatG: Math.round(data.item.fatG || 0),
        });
        return;
      }

      // 2. Fallback to estimate-meal route
      const estRes = await fetch("/api/estimate-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName: q }),
      });
      const estData = await estRes.json();
      if (!estData.error && estData.calories > 0) {
        setCustomStapleLookup({
          id: `lookup-${Date.now()}`,
          name: q,
          servingLabel: "1 serving",
          calories: Math.round(estData.calories),
          proteinG: Math.round(estData.proteinG || 0),
          carbsG: Math.round(estData.carbsG || 0),
          fatG: Math.round(estData.fatG || 0),
        });
      }
    } catch {
      // ignore lookup error
    } finally {
      setLookupLoading(false);
    }
  };

  const filteredStaples = PACKAGED_STAPLES.filter((s) =>
    s.name.toLowerCase().includes(barcodeSearch.trim().toLowerCase())
  );

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
              Hold plate in daylight or scan packaged staples.
            </p>
          </div>

          {/* Dual-Mode Segmented Switcher */}
          <div
            className="bg-[#EFECE4] p-1 rounded-full grid grid-cols-2 gap-1 mb-2"
            role="tablist"
            aria-label="Scanner modes"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "plate"}
              onClick={() => setMode("plate")}
              className={cn(
                "rounded-full py-2 text-xs transition-all text-center whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5",
                mode === "plate"
                  ? "bg-[#191D1A] text-[#FCFBF9] font-semibold shadow-xs"
                  : "text-[#57534E] hover:text-[#1C1917] font-medium"
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Plate Photo AI</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "barcode"}
              onClick={() => setMode("barcode")}
              className={cn(
                "rounded-full py-2 text-xs transition-all text-center whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5",
                mode === "barcode"
                  ? "bg-[#191D1A] text-[#FCFBF9] font-semibold shadow-xs"
                  : "text-[#57534E] hover:text-[#1C1917] font-medium"
              )}
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              <span>Barcode &amp; Label</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              MODE 1: PLATE PHOTO AI
              ══════════════════════════════════════════════════════════════════ */}
          {mode === "plate" && (
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
                  <img src={preview} alt="User plate scan" className="w-full h-full object-cover" />

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
              <div className="bg-[#FCFBF9] rounded-[24px] p-4 border border-[#1C1917]/[0.06] shadow-2xs">
                <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block mb-1.5">
                  CONTEXT HINT (OPTIONAL — OIL, GHEE, PREPARATION)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 aloo parathas, extra ghee, whey scoop"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  className="w-full bg-[#F6F3EC] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] outline-none border border-[#1C1917]/[0.06]"
                />

                {/* Quick-tap modifier pills */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {["+ 1 tsp Ghee", "+ 1 Scoop Whey", "+ Boiled Egg", "Home Cooked"].map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => handleAppendHint(mod)}
                      className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#57534E] hover:text-[#1C1917] rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {mod}
                    </button>
                  ))}
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

                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-xs text-stone-300 font-medium">Portion calibration</span>
                    <div className="bg-white/10 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1.5 text-xs text-white shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setPortionMultiplier((prev) =>
                            Math.max(0.5, Math.round((prev - 0.25) * 100) / 100)
                          )
                        }
                        className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-semibold text-xs whitespace-nowrap px-1">
                        {portionMultiplier.toFixed(1)}× Bowl
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPortionMultiplier((prev) =>
                            Math.min(3.0, Math.round((prev + 0.25) * 100) / 100)
                          )
                        }
                        className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold transition-all cursor-pointer"
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
                  {result?.visibleItems && result.visibleItems.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-stone-400 block mb-1.5">
                        PLATE COMPONENTS DETECTED
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.visibleItems.map((item: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-white/10 text-stone-200 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-medium"
                          >
                            {item}
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
                            onClick={() => setResult({ ...result, name: cand.name })}
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
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MODE 2: BARCODE & LABEL SCANNER
              ══════════════════════════════════════════════════════════════════ */}
          {mode === "barcode" && (
            <div className="space-y-4 animate-fade-in">
              <input
                ref={barcodeFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleBarcodeFile(e.target.files[0]);
                  }
                }}
              />

              {/* Viewfinder Card */}
              <div className="bg-[#191D1A] rounded-[26px] p-5 text-center relative overflow-hidden shadow-md border border-white/10">
                <div className="text-[9px] font-mono text-stone-400 flex items-center justify-between tracking-wider mb-2">
                  <span>BARCODE &amp; NUTRITION LABEL</span>
                  <span className="text-[#34D399] flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                    {barcodeScanning ? "SCANNING" : "READY"}
                  </span>
                </div>

                <div className="relative my-3 flex flex-col items-center justify-center">
                  {barcodeScanning ? (
                    <div className="py-4 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-[#E05A47] animate-spin" />
                      <p className="text-xs text-white/80 font-medium">{barcodeScanStage}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 opacity-40">
                        {[4, 2, 8, 3, 6, 2, 4, 10, 2, 5, 8, 3, 2, 6, 4, 2, 8, 5, 3].map((h, i) => (
                          <div
                            key={i}
                            className="bg-white rounded-xs"
                            style={{ width: `${(i % 3) + 2}px`, height: `${30 + h}px` }}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-x-0 h-0.5 bg-[#E05A47] shadow-[0_0_16px_#E05A47] animate-pulse" />
                    </>
                  )}
                </div>

                {barcodeScanError && (
                  <p className="text-xs text-[#E05A47] bg-[#E05A47]/10 border border-[#E05A47]/20 rounded-xl p-2.5 mb-2">
                    {barcodeScanError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={barcodeScanning}
                  onClick={() => barcodeFileRef.current?.click()}
                  className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-5 py-3 text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-lg mt-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{barcodeScanning ? "Processing..." : "Scan Nutrition Label or Barcode"}</span>
                </button>
              </div>

              {/* Barcode / Packaged Food Search Input with Search / Estimate Action Button */}
              <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] shadow-2xs">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block mb-1.5">
                  LOOKUP PACKAGED FOOD / BARCODE
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C857B]" />
                    <input
                      type="text"
                      placeholder="Type product name or barcode (e.g., Amul Lassi, Greek Yogurt, Whey)..."
                      value={barcodeSearch}
                      onChange={(e) => setBarcodeSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLookupCustomStaple()}
                      className="w-full bg-[#F6F3EC] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1C1917] outline-none border border-[#1C1917]/[0.06]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookupCustomStaple}
                    disabled={lookupLoading || !barcodeSearch.trim()}
                    className="bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    {lookupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search / Estimate"}
                  </button>
                </div>
              </div>

              {/* Custom Lookup Result Card with Stepper */}
              {customStapleLookup && (
                <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#2D6A4F]/20 shadow-xs animate-slide-down w-full overflow-hidden">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#EFECE4]">
                        <img
                          src={resolveDishThumbnail(customStapleLookup.name)}
                          alt={customStapleLookup.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-[#1C1917] leading-snug">
                          {customStapleLookup.name}
                        </h4>
                        {/* Macro Pills - Flex Wrap (Never truncated!) */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="bg-[#EFECE4] text-[#1C1917] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            {Math.round(customStapleLookup.calories * (stapleQuantities[customStapleLookup.id] ?? 1))} kcal
                          </span>
                          <span className="bg-[#EFECE4] text-[#2D6A4F] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            {Math.round(customStapleLookup.proteinG * (stapleQuantities[customStapleLookup.id] ?? 1))}g P
                          </span>
                          <span className="bg-[#EFECE4] text-[#D97706] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            {Math.round(customStapleLookup.carbsG * (stapleQuantities[customStapleLookup.id] ?? 1))}g C
                          </span>
                          <span className="bg-[#EFECE4] text-[#E05A47] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            {Math.round(customStapleLookup.fatG * (stapleQuantities[customStapleLookup.id] ?? 1))}g F
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper for custom lookup item */}
                    <div className="flex items-center gap-1 bg-[#F6F3EC] rounded-full px-2 py-0.5 border border-[#1C1917]/[0.06] shrink-0 self-start mt-0.5">
                      <button
                        type="button"
                        onClick={() => updateStapleQty(customStapleLookup.id, -1)}
                        className="w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-[#EFECE4] text-[#1C1917] transition-all"
                        aria-label={`Decrease quantity of ${customStapleLookup.name}`}
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-[#1C1917]">
                        {stapleQuantities[customStapleLookup.id] ?? 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateStapleQty(customStapleLookup.id, 1)}
                        className="w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-[#EFECE4] text-[#1C1917] transition-all"
                        aria-label={`Increase quantity of ${customStapleLookup.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#1C1917]/[0.05]">
                    <span className="text-[10px] font-bold text-[#2D6A4F] bg-[#E0F2E9] px-2 py-0.5 rounded-full">
                      Verified Nutrition Label
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLogStaple(customStapleLookup)}
                      className="bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      Add to Fuel
                    </button>
                  </div>
                </div>
              )}

              {/* Results ONLY when user searches (Empty by default!) */}
              {barcodeSearch.trim().length > 0 && (
                <div className="space-y-2.5 max-h-[42dvh] overflow-y-auto overflow-x-hidden no-scrollbar pr-0.5">
                  <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block px-1">
                    MATCHED PACKAGED STAPLES ({filteredStaples.length})
                  </span>

                  {filteredStaples.length === 0 && !customStapleLookup && !lookupLoading ? (
                    <div className="text-center py-6 bg-[#FCFBF9] rounded-[22px] border border-[#1C1917]/[0.06] p-4">
                      <p className="text-xs text-[#57534E]">
                        No packaged staples match &ldquo;{barcodeSearch}&rdquo;.
                      </p>
                      <p className="text-[11px] text-[#8C857B] mt-1">
                        Tap <strong className="text-[#1C1917]">Search / Estimate</strong> above to calculate nutrition with AI.
                      </p>
                    </div>
                  ) : (
                    filteredStaples.map((staple) => {
                      const qty = stapleQuantities[staple.id] ?? 1;
                      const thumb = resolveDishThumbnail(staple.name);

                      return (
                        <div
                          key={staple.id}
                          className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs w-full overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#EFECE4]">
                                <img
                                  src={thumb}
                                  alt={staple.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm text-[#1C1917] leading-snug">
                                  {staple.name}
                                </h4>
                                {/* 4 Macro Pills - Clean Flex Wrap (Never truncated!) */}
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <span className="bg-[#EFECE4] text-[#1C1917] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                    {Math.round(staple.calories * qty)} kcal
                                  </span>
                                  <span className="bg-[#EFECE4] text-[#2D6A4F] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                    {Math.round(staple.proteinG * qty)}g P
                                  </span>
                                  <span className="bg-[#EFECE4] text-[#D97706] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                    {Math.round(staple.carbsG * qty)}g C
                                  </span>
                                  <span className="bg-[#EFECE4] text-[#E05A47] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                    {Math.round(staple.fatG * qty)}g F
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-[#F6F3EC] rounded-full px-2 py-0.5 border border-[#1C1917]/[0.06] shrink-0 self-start mt-0.5">
                              <button
                                type="button"
                                onClick={() => updateStapleQty(staple.id, -1)}
                                className="w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-[#EFECE4] text-[#1C1917] transition-all"
                                aria-label={`Decrease quantity of ${staple.name}`}
                              >
                                -
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-[#1C1917]">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateStapleQty(staple.id, 1)}
                                className="w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-[#EFECE4] text-[#1C1917] transition-all"
                                aria-label={`Increase quantity of ${staple.name}`}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#1C1917]/[0.05]">
                            <span className="text-[10px] font-bold text-[#2D6A4F] bg-[#E0F2E9] px-2 py-0.5 rounded-full whitespace-nowrap">
                              Verified Nutrition Label
                            </span>

                            <button
                              type="button"
                              onClick={() => handleLogStaple(staple)}
                              className="bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95"
                            >
                              Add to Fuel
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


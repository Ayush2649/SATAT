"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MacroDonutBreakdownProps {
  variant?: "dark" | "light";
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  targetCarbs?: number | null;
  targetFat?: number | null;
  targetProtein?: number | null;
  className?: string;
}

export default function MacroDonutBreakdown({
  variant = "dark",
  calories = 0,
  carbs = 0,
  fat = 0,
  protein = 0,
  targetCarbs,
  targetFat,
  targetProtein,
  className,
}: MacroDonutBreakdownProps) {
  const safeCalories = Math.round(Number(calories) || 0);
  const safeCarbs = Math.round(Number(carbs) || 0);
  const safeFat = Math.round(Number(fat) || 0);
  const safeProtein = Math.round(Number(protein) || 0);

  // Calorie shares from grams: 4 kcal/g carbs, 9 kcal/g fat, 4 kcal/g protein
  const carbCal = Math.max(0, safeCarbs * 4);
  const fatCal = Math.max(0, safeFat * 9);
  const proteinCal = Math.max(0, safeProtein * 4);
  const totalMacroCal = carbCal + fatCal + proteinCal;

  const hasAnyMacro = safeCalories > 0 && totalMacroCal > 0;

  let carbPct = 0;
  let fatPct = 0;
  let proteinPct = 0;

  if (hasAnyMacro) {
    carbPct = Math.round((carbCal / totalMacroCal) * 100);
    fatPct = Math.round((fatCal / totalMacroCal) * 100);
    proteinPct = Math.max(0, 100 - carbPct - fatPct);
  }

  // Circle Geometry: cx="52" cy="52" r="40" strokeWidth="9" in viewBox="0 0 104 104"
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.3274

  // Unified Macro Donut Arc Colors (Exact 1:1 match with Daily Nutrition Summary ring everywhere):
  //   - Carbs arc: #14B8A6 (Teal-Emerald)
  //   - Fat arc: #F59E0B (Amber)
  //   - Protein arc: #8B5CF6 (Vibrant Violet)
  const segments = [
    {
      key: "carbs",
      pct: carbPct,
      arcColor: "#14B8A6",
      textColor: variant === "dark" ? "#14B8A6" : "#0D9488",
    },
    {
      key: "fat",
      pct: fatPct,
      arcColor: "#F59E0B",
      textColor: variant === "dark" ? "#F59E0B" : "#D97706",
    },
    {
      key: "protein",
      pct: proteinPct,
      arcColor: "#8B5CF6",
      textColor: variant === "dark" ? "#A78BFA" : "#7C3AED",
    },
  ];

  const activeSegments = hasAnyMacro ? segments.filter((s) => s.pct > 0) : [];
  const gapPx = activeSegments.length > 1 ? 4 : 0;
  const totalGaps = activeSegments.length * gapPx;
  const availableCircumference = Math.max(0, circumference - totalGaps);

  let currentOffset = 0;
  const computedArcs = activeSegments.map((seg) => {
    const arcLength = (seg.pct / 100) * availableCircumference;
    const strokeDasharray = `${arcLength} ${circumference - arcLength}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += arcLength + gapPx;

    return {
      key: seg.key,
      color: seg.arcColor,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className={cn("flex items-center justify-between gap-3 sm:gap-4 w-full", className)}>
      {/* ── Left: SVG Donut Ring ── */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative flex items-center justify-center">
        <svg
          viewBox="0 0 104 104"
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={`Macro breakdown: ${carbPct}% carbs, ${fatPct}% fat, ${proteinPct}% protein`}
        >
          {/* Subtle background empty track circle */}
          <circle
            cx="52"
            cy="52"
            r={radius}
            fill="none"
            stroke={variant === "dark" ? "rgba(255, 255, 255, 0.10)" : "rgba(28, 25, 23, 0.08)"}
            strokeWidth="9"
          />

          {/* Active colored segments with strokeLinecap="butt" (Flat geometric cuts, zero dots at 0 kcal) */}
          {hasAnyMacro &&
            computedArcs.map((arc) => (
              <circle
                key={arc.key}
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth="9"
                strokeLinecap="butt"
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                className="transition-all duration-300"
              />
            ))}
        </svg>

        {/* Center calorie readout inside donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span
            className={cn(
              "text-lg sm:text-xl font-bold leading-none tracking-tight",
              variant === "dark" ? "text-white" : "text-[#1C1917]"
            )}
          >
            {safeCalories.toLocaleString()}
          </span>
          <span className="text-[10px] text-[#8C857B] mt-0.5 font-medium leading-none">
            {variant === "dark" ? "kcal" : "cal"}
          </span>
        </div>
      </div>

      {/* ── Right: 3-Column Macro Readout Inset Box ── */}
      <div
        className={cn(
          "flex-1 rounded-2xl py-3 px-2 border",
          variant === "dark"
            ? "bg-white/[0.04] border-white/[0.06] text-white"
            : "bg-[#EFECE4]/60 border-[#1C1917]/[0.05] text-[#1C1917]"
        )}
      >
        <div
          className={cn(
            "grid grid-cols-3 divide-x text-center",
            variant === "dark" ? "divide-white/[0.08]" : "divide-[#1C1917]/[0.08]"
          )}
        >
          {/* Column 1: Carbs */}
          <div className="px-1 min-w-0 flex flex-col items-center justify-center">
            <span
              className="text-xs font-bold whitespace-nowrap block leading-none"
              style={{ color: segments[0].textColor }}
            >
              {carbPct}%
            </span>
            <span
              className={cn(
                "text-base sm:text-lg font-bold whitespace-nowrap mt-0.5 leading-tight",
                variant === "dark" ? "text-white" : "text-[#1C1917]"
              )}
            >
              {safeCarbs}g
            </span>
            {targetCarbs != null && targetCarbs > 0 && (
              <span className="text-[10px] text-stone-400 font-normal block whitespace-nowrap mt-0.5 leading-none">
                /{targetCarbs}g
              </span>
            )}
            <span className="text-[11px] text-[#8C857B] font-medium whitespace-nowrap mt-0.5 block leading-none">
              Carbs
            </span>
          </div>

          {/* Column 2: Fat */}
          <div className="px-1 min-w-0 flex flex-col items-center justify-center">
            <span
              className="text-xs font-bold whitespace-nowrap block leading-none"
              style={{ color: segments[1].textColor }}
            >
              {fatPct}%
            </span>
            <span
              className={cn(
                "text-base sm:text-lg font-bold whitespace-nowrap mt-0.5 leading-tight",
                variant === "dark" ? "text-white" : "text-[#1C1917]"
              )}
            >
              {safeFat}g
            </span>
            {targetFat != null && targetFat > 0 && (
              <span className="text-[10px] text-stone-400 font-normal block whitespace-nowrap mt-0.5 leading-none">
                /{targetFat}g
              </span>
            )}
            <span className="text-[11px] text-[#8C857B] font-medium whitespace-nowrap mt-0.5 block leading-none">
              Fat
            </span>
          </div>

          {/* Column 3: Protein */}
          <div className="px-1 min-w-0 flex flex-col items-center justify-center">
            <span
              className="text-xs font-bold whitespace-nowrap block leading-none"
              style={{ color: segments[2].textColor }}
            >
              {proteinPct}%
            </span>
            <span
              className={cn(
                "text-base sm:text-lg font-bold whitespace-nowrap mt-0.5 leading-tight",
                variant === "dark" ? "text-white" : "text-[#1C1917]"
              )}
            >
              {safeProtein}g
            </span>
            {targetProtein != null && targetProtein > 0 && (
              <span className="text-[10px] text-stone-400 font-normal block whitespace-nowrap mt-0.5 leading-none">
                /{targetProtein}g
              </span>
            )}
            <span className="text-[11px] text-[#8C857B] font-medium whitespace-nowrap mt-0.5 block leading-none">
              Protein
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

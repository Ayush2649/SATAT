"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Orbit3DCore } from "./Orbit3DCore";

export interface OrbitLauncherBadgeProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  className?: string;
  tooltipPosition?: "top" | "bottom";
  showTooltip?: boolean;
}

/**
 * OrbitLauncherBadge — Clean Rounded-Square 3D Emblem Badge.
 *
 * Visual Specifications:
 * - Rounded Square Geometry: rounded-2xl / rounded-xl with smooth tactile corners.
 * - Surface Styling: Deep Botanical Espresso (#191D1A) with border-white/[0.12],
 *   shadow-md, and smooth scale transition (hover:scale-105 active:scale-95).
 * - Emblem: Zero text ("Orbit", "AI") in badge body. Framed miniature moving 3D
 *   orbital rings and core (<Orbit3DCore size="sm" state="idle" />).
 * - Hover Tooltip: Floating dark pill tooltip with "Orbit" label.
 */
export function OrbitLauncherBadge({
  size = "lg",
  href = "/dashboard/orbit",
  onClick,
  className,
  tooltipPosition = "top",
  showTooltip = true,
}: OrbitLauncherBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl",
    lg: "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl",
  }[size];

  const badgeClass = cn(
    "relative bg-[#191D1A] hover:bg-[#232924] text-[#FCFBF9] border border-white/[0.12] shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group select-none shrink-0 cursor-pointer overflow-visible",
    sizeClasses,
    className
  );

  const innerCoreAndTooltip = (
    <>
      {/* 3D Animated Celestial Core Emblem (Zero Text) */}
      <div className="relative flex items-center justify-center pointer-events-none">
        <Orbit3DCore size="sm" state="idle" />
      </div>

      {/* Floating Hover Tooltip */}
      {showTooltip && (
        <span
          role="tooltip"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 bg-[#191D1A] text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-white/10",
            tooltipPosition === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
          )}
        >
          Orbit
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Open Orbit AI"
        className={badgeClass}
        onClick={onClick}
      >
        {innerCoreAndTooltip}
      </Link>
    );
  }

  return (
    <div
      className={badgeClass}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {innerCoreAndTooltip}
    </div>
  );
}

export default OrbitLauncherBadge;

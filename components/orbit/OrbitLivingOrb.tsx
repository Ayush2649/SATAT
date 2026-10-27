"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import type { OrbitState } from "./OrbitMark";

export interface OrbitLivingOrbProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "hero" | number;
  className?: string;
  state?: OrbitState;
  mood?: "idle" | "thinking" | "speaking" | "success" | "error";
  animated?: boolean;
}

/**
 * OrbitLivingOrb — The proprietary living sensory orb for SATAT.
 *
 * Visual System:
 * - Multi-stop breathing radial sphere blending Botanical Matcha Sage (#2D6A4F)
 *   and Terracotta Clay (#E05A47) with a pure alabaster light core.
 * - Rotating inner dashed ring conveying continuous ambient intelligence.
 * - Precision botanical lotus flower SVG identity at the core.
 */
export function OrbitLivingOrb({
  size = 48,
  className,
  state = "idle",
  animated = true,
  ...props
}: OrbitLivingOrbProps) {
  const reactId = useId();
  const id = `living-orb-${reactId.replace(/:/g, "")}`;
  const isThinking = state === "thinking";
  const isResponding = state === "responding";
  const isSuccess = state === "success";
  const isError = state === "error";

  // Spin duration adapts based on state
  const spinDuration = isThinking ? "4s" : isResponding ? "8s" : "22s";
  const breatheDuration = isThinking ? "1.2s" : isResponding ? "1.6s" : "3.6s";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "orbit-living-orb shrink-0 select-none overflow-visible",
        animated && "orbit-living-orb--animated",
        `orbit-living-orb--${state}`,
        className
      )}
      role="img"
      aria-label={`Orbit AI (${state})`}
      {...props}
    >
      <defs>
        {/* Atmospheric ambient glow */}
        <radialGradient id={`${id}-ambient`} cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor={isError ? "#DC2626" : isSuccess ? "#2D6A4F" : "#E05A47"}
            stopOpacity={isThinking ? "0.45" : "0.28"}
          />
          <stop
            offset="65%"
            stopColor={isSuccess ? "#2D6A4F" : "#2D6A4F"}
            stopOpacity="0.12"
          />
          <stop offset="100%" stopColor="#191D1A" stopOpacity="0" />
        </radialGradient>

        {/* Breathing Sage / Terracotta Peach Radial Sphere */}
        <radialGradient id={`${id}-sphere`} cx="38%" cy="32%" r="66%">
          <stop offset="0%" stopColor="#FFFDF9" stopOpacity="1" />
          <stop offset="22%" stopColor="#FDE5E2" stopOpacity="0.95" />
          <stop offset="52%" stopColor={isSuccess ? "#40916C" : "#E05A47"} stopOpacity="0.92" />
          <stop offset="82%" stopColor="#2D6A4F" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#191D1A" stopOpacity="1" />
        </radialGradient>

        {/* Subtle inner depth rim */}
        <linearGradient id={`${id}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#E05A47" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.6" />
        </linearGradient>

        {/* Lotus Petal Fill Gradient */}
        <linearGradient id={`${id}-lotus-petal`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#F6F3EC" stopOpacity="0.85" />
        </linearGradient>

        {/* Lotus Wing Petals Gradient */}
        <linearGradient id={`${id}-lotus-wing`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#EFECE4" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* 1. Atmospheric Ambient Glow */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill={`url(#${id}-ambient)`}
        className="transition-all duration-700"
      />

      {/* 2. Breathing Living Sphere */}
      <g
        style={{
          transformOrigin: "50px 50px",
          animation: animated ? `orbit-living-breathe ${breatheDuration} ease-in-out infinite` : "none",
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="41"
          fill={`url(#${id}-sphere)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="1.25"
          filter="drop-shadow(0 8px 18px rgba(28, 25, 23, 0.22))"
        />

        {/* Specular highlight */}
        <ellipse
          cx="42"
          cy="28"
          rx="14"
          ry="7"
          transform="rotate(-24 42 28)"
          fill="#FFFFFF"
          opacity="0.32"
        />
      </g>

      {/* 3. Rotating Inner Dashed Ring */}
      <g
        style={{
          transformOrigin: "50px 50px",
          animation: animated ? `orbit-living-spin-slow ${spinDuration} linear infinite` : "none",
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Satellite tracker node on the dashed ring */}
        <circle cx="50" cy="14" r="2" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* 4. Botanical Lotus Icon Core */}
      <g
        style={{
          transformOrigin: "50px 50px",
          animation: animated ? `orbit-living-lotus-pulse ${breatheDuration} ease-in-out infinite` : "none",
        }}
        filter="drop-shadow(0 2px 4px rgba(25, 29, 26, 0.35))"
      >
        {/* Center Petal (upright teardrop) */}
        <path
          d="M50 33 C48 37 45.5 42 45.5 48 C45.5 53.5 47.8 56.5 50 56.5 C52.2 56.5 54.5 53.5 54.5 48 C54.5 42 52 37 50 33 Z"
          fill={`url(#${id}-lotus-petal)`}
          stroke="rgba(25, 29, 26, 0.12)"
          strokeWidth="0.5"
        />

        {/* Left Inner Petal */}
        <path
          d="M50 56.5 C45 55.5 39.5 50.5 40.5 43 C41.2 38.5 45 40 47 43.5 C48.5 46.5 49.5 51 50 56.5 Z"
          fill={`url(#${id}-lotus-wing)`}
          stroke="rgba(25, 29, 26, 0.1)"
          strokeWidth="0.5"
        />

        {/* Right Inner Petal */}
        <path
          d="M50 56.5 C55 55.5 60.5 50.5 59.5 43 C58.8 38.5 55 40 53 43.5 C51.5 46.5 50.5 51 50 56.5 Z"
          fill={`url(#${id}-lotus-wing)`}
          stroke="rgba(25, 29, 26, 0.1)"
          strokeWidth="0.5"
        />

        {/* Left Outer Flourish */}
        <path
          d="M49 57 C41 55.5 33 49.5 34.5 44 C35.2 41.5 38 42.5 40 45.5 C42.5 49 45.5 53.5 49 57 Z"
          fill={`url(#${id}-lotus-wing)`}
          opacity="0.85"
        />

        {/* Right Outer Flourish */}
        <path
          d="M51 57 C59 55.5 67 49.5 65.5 44 C64.8 41.5 62 42.5 60 45.5 C57.5 49 54.5 53.5 51 57 Z"
          fill={`url(#${id}-lotus-wing)`}
          opacity="0.85"
        />

        {/* Calyx / Base Cradle */}
        <path
          d="M37.5 56.5 C41 60 45.5 62 50 62 C54.5 62 59 60 62.5 56.5 C57.5 58.8 53.8 59.2 50 59.2 C46.2 59.2 42.5 58.8 37.5 56.5 Z"
          fill={`url(#${id}-lotus-petal)`}
          opacity="0.95"
        />

        {/* Radiant Heart Dot */}
        <circle cx="50" cy="50" r="1.5" fill="#E05A47" opacity="0.85" />
      </g>
    </svg>
  );
}

export default OrbitLivingOrb;


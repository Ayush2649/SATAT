"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { OrbitLivingOrb } from "./OrbitLivingOrb";

export type OrbitState = "idle" | "thinking" | "responding" | "success" | "error";

export interface OrbitIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  animated?: boolean;
  state?: OrbitState;
}

/**
 * OrbitMark / OrbitIcon — The proprietary visual identity for SATAT Orbit.
 * 
 * Scaled Architecture:
 * - At larger scale (size >= 32): Transitions to the living sensory orb (OrbitLivingOrb)
 *   with breathing sage/peach radial sphere, rotating inner dashed ring, and botanical lotus icon.
 * - At compact scale (size < 32): Renders the precise celestial vector mark
 *   with 28° inclined celestial elliptical ring (9.4 × 4.6 rx/ry), luminous core (r=3.5),
 *   and satellite traveling along the orbital ring (r=1.45 at [20.18, 10.41]).
 */
export function OrbitIcon({
  size = 24,
  className,
  animated = false,
  state = "idle",
  ...props
}: OrbitIconProps) {
  const activeState: OrbitState = animated && state === "idle" ? "thinking" : state;
  const reactId = useId();
  // Sanitize id for SVG url references (React useId produces colons like ":r1:")
  const id = `orbit-${reactId.replace(/:/g, "")}`;

  // When size >= 32, render the breathing living orb
  if (size >= 32) {
    return (
      <OrbitLivingOrb
        size={size}
        className={className}
        state={activeState}
        animated={animated}
        {...props}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "orbit-mark shrink-0 select-none",
        `orbit-mark--${activeState}`,
        className
      )}
      role="img"
      aria-label={`Orbit AI (${activeState})`}
      {...props}
    >
      <defs>
        {/* Soft atmospheric ambient glow */}
        <radialGradient id={`${id}-aura`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--satat-brand, #E05A47)" stopOpacity="0.32" />
          <stop offset="70%" stopColor="var(--satat-sage, #2D6A4F)" stopOpacity="0.10" />
          <stop offset="100%" stopColor="var(--satat-brand, #E05A47)" stopOpacity="0" />
        </radialGradient>

        {/* Luminous central core: celestial sphere lighting */}
        <radialGradient id={`${id}-core`} cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="28%" stopColor="#FDE5E2" />
          <stop offset="68%" stopColor="var(--satat-brand, #E05A47)" />
          <stop offset="100%" stopColor="#2D6A4F" />
        </radialGradient>

        {/* Elliptical ring: directional celestial lighting */}
        <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7A89D" />
          <stop offset="45%" stopColor="var(--satat-brand-hover, #C94A38)" />
          <stop offset="85%" stopColor="#2D6A4F" />
          <stop offset="100%" stopColor="#1B4332" />
        </linearGradient>

        {/* Satellite subtle corona */}
        <radialGradient id={`${id}-sat-aura`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F7A89D" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--satat-brand, #E05A47)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Luminous aura behind central core */}
      <circle
        cx="12"
        cy="12"
        r="6.0"
        fill={`url(#${id}-aura)`}
        className="orbit-aura"
      />

      {/* 2. Precise elliptical orbital ring */}
      <ellipse
        cx="12"
        cy="12"
        rx="9.4"
        ry="4.6"
        transform="rotate(-28 12 12)"
        stroke={`url(#${id}-ring)`}
        strokeWidth="1.65"
        strokeLinecap="round"
        className="orbit-ring"
      />

      {/* 3. Luminous central core (enlarged by ~27.5% inside orbital ring) */}
      <g className="orbit-core-group">
        <circle
          cx="12"
          cy="12"
          r="3.5"
          fill={`url(#${id}-core)`}
          className="orbit-core"
        />
      </g>

      {/* 4. Small satellite traveling along the ring */}
      <g className="orbit-satellite-group">
        <circle
          cx="20.18"
          cy="10.41"
          r="2.2"
          fill={`url(#${id}-sat-aura)`}
          className="orbit-satellite-aura"
        />
        <circle
          cx="20.18"
          cy="10.41"
          r="1.45"
          fill="#FFFFFF"
          stroke="#2D6A4F"
          strokeWidth="0.5"
          className="orbit-satellite"
        />
      </g>
    </svg>
  );
}

// Canonical exports and aliases
export { OrbitLivingOrb };
export const OrbitMark = OrbitIcon;
export default OrbitIcon;

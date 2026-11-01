"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import type { OrbitState } from "./OrbitMark";

export interface Orbit3DCoreProps {
  size?: "sm" | "md" | "lg" | number;
  state?: OrbitState;
  className?: string;
  showRadar?: boolean;
}

/**
 * Orbit3DCore — Dead-Center Celestial 3D Orbital Physics Core.
 *
 * Architecture:
 * - Square Stage: Exactly 184px × 184px centered viewport (mx-auto my-2).
 * - Background Radar: Concentric dashed SVG circles (r=86, r=64, r=42) + subtle crosshairs,
 *   centered at cx=92, cy=92.
 * - Central Planet Core: 44px × 44px (w-11 h-11) shaded Matcha-Emerald sphere,
 *   pinned to geometric (50%, 50%) via absolute inset-0 m-auto.
 * - Celestial Orbital Planes: Three locked 3D tilt planes (rotateX + rotateY fixed)
 *   rotating ONLY around local Z-axis (rotateZ) to eliminate erratic wobble or gimbal tumbling.
 * - Planetary speeds:
 *   - Idle: Inner Ring 20s (Terracotta #E05A47), Middle Ring 28s counter-spin (Mint #6EE7B7),
 *     Outer Ring 36s (Stone #D6CFC2/40), Core 6s breathing glow.
 *   - Thinking: Rings accelerate smoothly to 6s, 8s, 10s with pulsing emerald aura.
 */
export function Orbit3DCore({
  size = "lg",
  state = "idle",
  className,
  showRadar = true,
}: Orbit3DCoreProps) {
  const reactId = useId();
  const id = `orbit-3d-${reactId.replace(/:/g, "")}`;

  const isThinking = state === "thinking" || state === "responding";
  const isSuccess = state === "success";
  const isError = state === "error";

  // Dimension scaling
  let containerPx = 184;
  let scaleRatio = 1;
  if (typeof size === "number") {
    containerPx = size;
    scaleRatio = size / 184;
  } else if (size === "sm") {
    containerPx = 92;
    scaleRatio = 0.5;
  } else if (size === "md") {
    containerPx = 140;
    scaleRatio = 140 / 184;
  }

  // Animation durations
  const innerDuration = isThinking ? "6s" : "20s";
  const middleDuration = isThinking ? "8s" : "28s";
  const outerDuration = isThinking ? "10s" : "36s";

  return (
    <div
      className={cn(
        "relative mx-auto my-2 flex items-center justify-center select-none overflow-visible",
        className
      )}
      style={{
        width: `${containerPx}px`,
        height: `${containerPx}px`,
        perspective: "800px",
      }}
      role="img"
      aria-label={`Orbit 3D Celestial Core (${state})`}
    >
      {/* Inline styles for guaranteed Z-axis orbital keyframes & celestial breathing */}
      <style>{`
        @keyframes orbitSpinZ1 {
          0% { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        @keyframes orbitSpinZ2 {
          0% { transform: rotateZ(360deg); }
          100% { transform: rotateZ(0deg); }
        }
        @keyframes orbitSpinZ3 {
          0% { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        @keyframes orbitCoreBreathe6s {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 28px rgba(110, 231, 183, 0.35);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 38px rgba(110, 231, 183, 0.55), 0 0 16px rgba(45, 106, 79, 0.65);
          }
        }
        @keyframes orbitAuraPulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0.25; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* ── 1. BACKGROUND RADAR CONCENTRIC SVG CIRCLES ── */}
      {showRadar && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none m-auto"
          viewBox="0 0 184 184"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Outer dashed radar circle r=86 */}
          <circle
            cx="92"
            cy="92"
            r="86"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {/* Middle dashed radar circle r=64 */}
          <circle
            cx="92"
            cy="92"
            r="64"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {/* Inner dashed radar circle r=42 */}
          <circle
            cx="92"
            cy="92"
            r="42"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Subtle crosshair lines */}
          <line
            x1="92"
            y1="4"
            x2="92"
            y2="180"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <line
            x1="4"
            y1="92"
            x2="180"
            y2="92"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Micro-tick cardinal accents */}
          <line x1="92" y1="5" x2="92" y2="9" stroke="rgba(110,231,183,0.3)" strokeWidth="1.5" />
          <line x1="92" y1="175" x2="92" y2="179" stroke="rgba(110,231,183,0.3)" strokeWidth="1.5" />
          <line x1="5" y1="92" x2="9" y2="92" stroke="rgba(110,231,183,0.3)" strokeWidth="1.5" />
          <line x1="175" y1="92" x2="179" y2="92" stroke="rgba(110,231,183,0.3)" strokeWidth="1.5" />
        </svg>
      )}

      {/* ── 2. CELESTIAL ORBITAL PLANES & 3D PLANET (Centered at 50%, 50%) ── */}
      <div
        className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none"
        style={{
          width: `${184 * scaleRatio}px`,
          height: `${184 * scaleRatio}px`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* OUTER EQUATORIAL RING (Warm Stone #D6CFC2/40, w-40 h-40 / 160px) */}
        {/* Locked tilt rotateX(72deg) rotateY(-6deg), ultra-calm 36s spin */}
        <div
          className="absolute inset-0 m-auto pointer-events-none"
          style={{
            width: `${160 * scaleRatio}px`,
            height: `${160 * scaleRatio}px`,
            transform: "rotateX(72deg) rotateY(-6deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="w-full h-full rounded-full border border-[#D6CFC2]/25 relative"
            style={{
              animation: `orbitSpinZ3 ${outerDuration} linear infinite`,
            }}
          >
            {/* Subtle stone node marker */}
            <div
              className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D6CFC2]/60"
            />
          </div>
        </div>

        {/* MIDDLE RING (Mint Sage #6EE7B7, w-32 h-32 / 128px) */}
        {/* Locked tilt rotateX(62deg) rotateY(28deg), smooth 28s counter-spin */}
        <div
          className="absolute inset-0 m-auto pointer-events-none"
          style={{
            width: `${128 * scaleRatio}px`,
            height: `${128 * scaleRatio}px`,
            transform: "rotateX(62deg) rotateY(28deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="w-full h-full rounded-full border border-[#6EE7B7]/35 relative"
            style={{
              animation: `orbitSpinZ2 ${middleDuration} linear infinite`,
            }}
          >
            {/* 5px Mint satellite node on rim */}
            <div
              className="absolute -top-[2.5px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#6EE7B7] shadow-[0_0_8px_#6EE7B7]"
            />
          </div>
        </div>

        {/* INNER RING (Terracotta #E05A47, w-24 h-24 / 96px) */}
        {/* Locked tilt rotateX(66deg) rotateY(-18deg), smooth 20s spin */}
        <div
          className="absolute inset-0 m-auto pointer-events-none"
          style={{
            width: `${96 * scaleRatio}px`,
            height: `${96 * scaleRatio}px`,
            transform: "rotateX(66deg) rotateY(-18deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="w-full h-full rounded-full border border-[#E05A47]/45 relative"
            style={{
              animation: `orbitSpinZ1 ${innerDuration} linear infinite`,
            }}
          >
            {/* 6px glowing Terracotta satellite node on rim */}
            <div
              className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E05A47] shadow-[0_0_8px_#E05A47]"
            />
          </div>
        </div>

        {/* ── 3. CENTER PLANET CORE (Dead-center 44px × 44px Matcha-Emerald Sphere) ── */}
        <div
          className="absolute inset-0 m-auto flex items-center justify-center rounded-full pointer-events-none"
          style={{
            width: `${44 * scaleRatio}px`,
            height: `${44 * scaleRatio}px`,
          }}
        >
          {/* Thinking state pulsing emerald aura rings */}
          {isThinking && (
            <>
              <div
                className="absolute inset-0 rounded-full border border-[#6EE7B7]/50"
                style={{
                  animation: "orbitAuraPulse 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite",
                }}
              />
              <div
                className="absolute -inset-1.5 rounded-full border border-[#6EE7B7]/30 animate-pulse"
              />
            </>
          )}

          {/* Central 3D Shaded Sphere */}
          <div
            className="w-full h-full rounded-full relative flex items-center justify-center overflow-hidden"
            style={{
              background: isError
                ? "radial-gradient(circle at 35% 30%, #F87171 0%, #DC2626 55%, #191D1A 95%)"
                : isSuccess
                ? "radial-gradient(circle at 35% 30%, #A7F3D0 0%, #2D6A4F 55%, #0F1713 95%)"
                : "radial-gradient(circle at 35% 30%, #6EE7B7 0%, #2D6A4F 55%, #0F1713 95%)",
              animation: "orbitCoreBreathe6s 6s ease-in-out infinite",
              boxShadow: isError
                ? "0 0 28px rgba(220, 38, 38, 0.45)"
                : "0 0 28px rgba(110, 231, 183, 0.35)",
            }}
          >
            {/* Specular gloss highlight */}
            <div
              className="absolute top-1 left-2 w-3.5 h-2 rounded-full bg-white/40 blur-[1px] rotate-[-25deg] pointer-events-none"
            />

            {/* SATAT Botanical Lotus Core Vector Identity */}
            <svg
              className="w-5 h-5 text-white/85 relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Central Petal */}
              <path
                d="M12 4C10.5 7.5 9.5 11 12 15C14.5 11 13.5 7.5 12 4Z"
                fill="currentColor"
                opacity="0.95"
              />
              {/* Left Wing Petal */}
              <path
                d="M7.5 8C7 11 8.5 13.5 11.5 14.5C9.5 13.5 8 11 7.5 8Z"
                fill="currentColor"
                opacity="0.8"
              />
              {/* Right Wing Petal */}
              <path
                d="M16.5 8C17 11 15.5 13.5 12.5 14.5C14.5 13.5 16 11 16.5 8Z"
                fill="currentColor"
                opacity="0.8"
              />
              {/* Base Calyx Anchor */}
              <ellipse cx="12" cy="16.5" rx="3.5" ry="1.2" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orbit3DCore;

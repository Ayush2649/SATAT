"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { OrbitHalo } from "./OrbitHalo";
import type { OrbitState } from "./OrbitMark";

export interface OrbitLivingOrbProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "hero" | number;
  className?: string;
  state?: OrbitState;
  mood?: "idle" | "thinking" | "speaking" | "success" | "error";
  animated?: boolean;
}

/** Compatibility entry point; it always uses the same planet and ring. */
export function OrbitLivingOrb({ size = 48, state, mood, animated = true, className, ...props }: OrbitLivingOrbProps) {
  const pixels = typeof size === "number" ? size : { sm: 32, md: 48, lg: 96, hero: 184 }[size];
  const activeState = state ?? (mood === "speaking" ? "responding" : mood) ?? "idle";
  return <OrbitHalo size={pixels} state={activeState} animated={animated}
    className={cn("orbit-living-orb", `orbit-living-orb--${activeState}`, className)} {...props} />;
}

export default OrbitLivingOrb;

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { OrbitHalo } from "./OrbitHalo";

export type OrbitState = "idle" | "thinking" | "responding" | "success" | "error" | "active";

export interface OrbitIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  animated?: boolean;
  state?: OrbitState;
}

/** Stable public aliases for the shared, approved Halo identity. */
export function OrbitIcon({ size = 24, className, animated, state = "idle", ...props }: OrbitIconProps) {
  const activeState = animated && state === "idle" ? "thinking" : state;
  return <OrbitHalo size={size} state={activeState} animated={animated !== false}
    className={cn("orbit-mark", `orbit-mark--${activeState}`, className)} {...props} />;
}

export { OrbitLivingOrb } from "./OrbitLivingOrb";
export { Orbit3DCore } from "./Orbit3DCore";
export { OrbitLauncherBadge } from "./OrbitLauncherBadge";
export const OrbitMark = OrbitIcon;
export default OrbitIcon;

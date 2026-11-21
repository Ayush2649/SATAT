"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { OrbitHalo } from "./OrbitHalo";
import type { OrbitState } from "./OrbitMark";

export interface Orbit3DCoreProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  state?: OrbitState;
  className?: string;
  /** Accepted for caller compatibility; Halo has no radar decoration. */
  showRadar?: boolean;
}

/** Responsive stage retaining the existing size and accessibility contracts. */
export function Orbit3DCore({ size = "lg", state = "idle", className }: Orbit3DCoreProps) {
  const pixels = typeof size === "number" ? size : { sm: 38, md: 92, lg: 184, xl: 224 }[size];
  return (
    <div data-testid="orbit-3d-core" className={cn("orbit-3d-core orbit-halo-stage", className)}
      style={{ width: pixels, maxWidth: "100%", aspectRatio: "1" }}
      role="img" aria-label={`Orbit 3D Celestial Core (${state})`}>
      <OrbitHalo size={pixels} state={state} aria-hidden="true" />
    </div>
  );
}

export default Orbit3DCore;

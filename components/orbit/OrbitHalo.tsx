"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import type { OrbitState } from "./OrbitMark";

export interface OrbitHaloProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  state?: OrbitState;
  animated?: boolean;
}

/** The approved Halo artwork, shared by every Orbit entry point. */
export function OrbitHalo({ size = 48, state = "idle", animated = true, className, style, ...props }: OrbitHaloProps) {
  const id = `orbit-halo-${useId().replace(/:/g, "")}`;
  const detailed = size >= 96;
  const stars = size >= 64;
  const compact = size <= 40;
  const ref = (name: string) => `url(#${id}-${name})`;
  const ring = () => (
    <>
      <path d="M-113 0 A113 38 0 0 0 113 0 L113 6 A113 38 0 0 1 -113 6 Z" fill={ref("side")} />
      <path d="M-94 0 A94 29 0 0 1 94 0 L94 5 A94 29 0 0 0 -94 5 Z" fill="var(--halo-clay-deep)" />
      <path d="M-113 0 A113 38 0 1 1 113 0 A113 38 0 1 1 -113 0 Z M-94 0 A94 29 0 1 0 94 0 A94 29 0 1 0 -94 0 Z" fillRule="evenodd" fill={ref("ring")} />
      <ellipse className="halo-edge" rx="112.7" ry="37.7" fill="none" stroke={ref("edge")} strokeWidth=".85" />
      {!compact && <ellipse className="halo-glint" rx="108" ry="35" pathLength="100" fill="none" stroke="var(--halo-cream)" strokeWidth="1.15" strokeLinecap="round" strokeDasharray="9 91" />}
    </>
  );
  const envelope = (children: React.ReactNode) => (
    <g className="halo-envelope"><g className="halo-drift">{children}</g></g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={compact ? "12 30 256 176" : "0 0 280 234"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("orbit-halo", `orbit-halo--${state}`, compact && "orbit-halo--compact", className)}
      style={{ "--halo-size": `${size}px`, ...style } as React.CSSProperties}
      data-animated={animated}
      data-orbit-artwork="halo"
      role="img"
      aria-label={`Orbit AI (${state})`}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-core`} cx="30%" cy="22%" r="85%">
          <stop stopColor="var(--halo-core-lit)" />
          <stop offset=".42" stopColor="var(--halo-sage)" />
          <stop offset=".79" stopColor="var(--halo-core-deep)" />
          <stop offset="1" stopColor="var(--halo-anchor)" />
        </radialGradient>
        <radialGradient id={`${id}-bounce`} cx="74%" cy="88%" r="65%">
          <stop stopColor="var(--halo-clay)" stopOpacity=".24" />
          <stop offset=".6" stopColor="var(--halo-clay)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="27%" cy="18%" r="84%">
          <stop offset=".65" stopColor="var(--halo-cream)" stopOpacity="0" />
          <stop offset=".91" stopColor="var(--halo-sage)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--halo-sage)" stopOpacity=".25" />
        </radialGradient>
        <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="74%" y2="100%">
          <stop stopColor="var(--halo-clay-light)" />
          <stop offset=".42" stopColor="var(--halo-clay)" />
          <stop offset="1" stopColor="var(--halo-clay-deep)" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop stopColor="var(--halo-clay)" />
          <stop offset="1" stopColor="var(--halo-clay-deep)" />
        </linearGradient>
        <linearGradient id={`${id}-edge`}>
          <stop stopColor="var(--halo-cream)" stopOpacity=".55" />
          <stop offset=".6" stopColor="var(--halo-cream)" stopOpacity=".04" />
          <stop offset="1" stopColor="var(--halo-clay-light)" stopOpacity=".3" />
        </linearGradient>
        {detailed && <>
          <filter id={`${id}-soft`} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id={`${id}-cast`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" /></filter>
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="8" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </>}
        <clipPath id={`${id}-front`}><rect x="-125" y="0" width="250" height="80" /></clipPath>
        <clipPath id={`${id}-sphere`}><circle r="57" /></clipPath>
      </defs>
      {detailed && <ellipse className="halo-ground" cx="140" cy="214" rx="57" ry="5" fill="var(--halo-anchor)" filter={ref("soft")} opacity=".12" />}
      <g transform="translate(140 113)">
        <g className="halo-float">
          <g className="halo-reaction">
            <g opacity="var(--halo-ring-alpha)">{envelope(ring())}</g>
            <g className="halo-core">
              <circle r="57" fill={ref("core")} />
              <circle r="57" fill={ref("bounce")} />
              <circle r="57" fill={ref("rim")} />
              <g clipPath={ref("sphere")}>
                {envelope(<path d="M-113 6 A113 38 0 0 0 113 6" fill="none" stroke="var(--halo-anchor)" strokeWidth="15" opacity=".38" filter={detailed ? ref("cast") : undefined} />)}
                {detailed && <circle r="57" fill="var(--halo-cream)" opacity=".045" filter={ref("grain")} />}
              </g>
            </g>
            {envelope(<g clipPath={ref("front")} opacity="var(--halo-ring-alpha)">{ring()}</g>)}
          </g>
        </g>
      </g>
      {stars && <g className="halo-stars" aria-hidden="true" fill="var(--halo-sage)" opacity=".55">
        {[[62, 42, 1], [221, 32, .7], [28, 153, .65], [237, 183, .85]].map(([x, y, scale], index) => (
          <polygon key={index} points="0,-5 1.2,-1.2 5,0 1.2,1.2 0,5 -1.2,1.2 -5,0 -1.2,-1.2" transform={`translate(${x} ${y}) scale(${scale})`} fill={index % 2 ? "var(--halo-clay)" : undefined} />
        ))}
      </g>}
    </svg>
  );
}

export default OrbitHalo;

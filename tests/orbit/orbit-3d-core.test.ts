import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";

describe("Orbit3DCore Dead-Center Celestial Physics & Stage Alignment", () => {
  it("renders 184px square centered stage with radar circles", () => {
    const html = renderToStaticMarkup(React.createElement(Orbit3DCore));
    expect(html).toContain('width:184px;height:184px');
    // Concentric dashed radar circles
    expect(html).toContain('r="86"');
    expect(html).toContain('r="64"');
    expect(html).toContain('r="42"');
    expect(html).toContain('stroke-dasharray="3 3"');
    expect(html).toContain('stroke="rgba(255,255,255,0.08)"');
  });

  it("locks orbital planes into static 3D tilts to eliminate erratic gimbal wobbling", () => {
    const html = renderToStaticMarkup(React.createElement(Orbit3DCore));
    // Inner Ring Tilt
    expect(html).toContain("rotateX(66deg) rotateY(-18deg)");
    // Middle Ring Tilt
    expect(html).toContain("rotateX(62deg) rotateY(28deg)");
    // Outer Ring Tilt
    expect(html).toContain("rotateX(72deg) rotateY(-6deg)");
  });

  it("renders dead-centered 44px (w-11 h-11) shaded Matcha-Emerald sphere with breathing animation", () => {
    const html = renderToStaticMarkup(React.createElement(Orbit3DCore));
    expect(html).toContain("radial-gradient(circle at 35% 30%, #6EE7B7 0%, #2D6A4F 55%, #0F1713 95%)");
    expect(html).toContain("orbitCoreBreathe6s 6s ease-in-out infinite");
  });

  it("accelerates orbital speeds from calm idle to responsive thinking state", () => {
    const idleHtml = renderToStaticMarkup(React.createElement(Orbit3DCore, { state: "idle" }));
    expect(idleHtml).toContain("orbitSpinZ1 20s linear infinite");
    expect(idleHtml).toContain("orbitSpinZ2 28s linear infinite");
    expect(idleHtml).toContain("orbitSpinZ3 36s linear infinite");

    const thinkingHtml = renderToStaticMarkup(React.createElement(Orbit3DCore, { state: "thinking" }));
    expect(thinkingHtml).toContain("orbitSpinZ1 6s linear infinite");
    expect(thinkingHtml).toContain("orbitSpinZ2 8s linear infinite");
    expect(thinkingHtml).toContain("orbitSpinZ3 10s linear infinite");
    // Emerald aura ring during thinking
    expect(thinkingHtml).toContain("orbitAuraPulse 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite");
  });
});

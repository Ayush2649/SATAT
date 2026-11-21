import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { OrbitMark, type OrbitState } from "@/components/orbit/OrbitMark";

describe("Orbit Halo motion and accessibility", () => {
  it("retains the default name and public state hooks", () => {
    const html = renderToStaticMarkup(React.createElement(OrbitMark));
    expect(html).toContain("orbit-mark--idle");
    expect(html).toContain('aria-label="Orbit AI (idle)"');
    expect(html).toContain('data-animated="true"');
  });
  it("forwards every supported lifecycle state", () => {
    for (const state of ["idle", "thinking", "responding", "success", "error", "active"] as OrbitState[]) {
      const html = renderToStaticMarkup(React.createElement(OrbitMark, { state }));
      expect(html).toContain(`orbit-mark--${state}`);
      expect(html).toContain(`orbit-halo--${state}`);
    }
  });
  it("preserves the legacy animated-to-thinking shorthand and permits an explicitly still mark", () => {
    expect(renderToStaticMarkup(React.createElement(OrbitMark, { animated: true }))).toContain("orbit-mark--thinking");
    expect(renderToStaticMarkup(React.createElement(OrbitMark, { animated: false }))).toContain('data-animated="false"');
  });
  it("renders a shaded planet and a clipped front/back ring with all referenced definitions present", () => {
    const html = renderToStaticMarkup(React.createElement(OrbitMark, { size: 132 }));
    const definitions = new Set(Array.from(html.matchAll(/id="([^"]+)"/g), match => match[1]));
    for (const match of Array.from(html.matchAll(/url\(#([^\)]+)\)/g))) expect(definitions.has(match[1])).toBe(true);
    expect(html).toContain('fill-rule="evenodd"');
    expect(html).toContain('clip-path="url(#');
    expect(html).toContain("halo-core");
  });
  it("loads motion styles in the real app with reduced-motion and explicit animation-off overrides", () => {
    const globals = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
    const css = fs.readFileSync(path.resolve(__dirname, "../../styles/orbit-halo.css"), "utf8");
    expect(globals).toContain('@import "../styles/orbit-halo.css"');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain('.orbit-halo[data-animated="false"]');
    expect(css).toContain("animation: none !important");
    expect(css).toContain(".orbit-halo--error");
    expect(globals).not.toContain("@keyframes orbit-error-shake");
  });
  it("isolates gradient and clipping IDs when multiple logos render together", () => {
    const html = renderToStaticMarkup(React.createElement("div", null,
      React.createElement(OrbitMark, { size: 32 }), React.createElement(OrbitMark, { size: 148 })));
    const ids = Array.from(html.matchAll(/id="([^"]+)"/g), match => match[1]);
    expect(ids.length).toBeGreaterThan(10);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("preserves caller-provided SVG accessibility, sizing and styling attributes", () => {
    const html = renderToStaticMarkup(React.createElement(OrbitMark, { size: 20, "aria-label": "Ask Orbit", className: "custom-orbit", style: { opacity: .8 } }));
    expect(html).toContain('aria-label="Ask Orbit"');
    expect(html).toContain('width="20"');
    expect(html).toContain("custom-orbit");
    expect(html).toContain("opacity:0.8");
  });
});

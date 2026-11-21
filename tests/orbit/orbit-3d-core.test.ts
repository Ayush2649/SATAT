import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";
import { OrbitLivingOrb } from "@/components/orbit/OrbitLivingOrb";
import { OrbitMark } from "@/components/orbit/OrbitMark";

describe("Shared Orbit Halo stage", () => {
  it("retains the stage label and test ID while fitting a narrower parent", () => {
    const html = renderToStaticMarkup(React.createElement(Orbit3DCore));
    expect(html).toContain('data-testid="orbit-3d-core"');
    expect(html).toContain('width:184px;max-width:100%;aspect-ratio:1');
    expect(html).toContain('aria-label="Orbit 3D Celestial Core (idle)"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('stroke-dasharray="3 3"');
  });
  it("routes all public renderers to the same artwork rather than size-specific logos", () => {
    for (const component of [OrbitMark, Orbit3DCore, OrbitLivingOrb]) {
      const html = renderToStaticMarkup(React.createElement(component as React.ComponentType<any>, { size: 96 }));
      expect(html).toContain('data-orbit-artwork="halo"');
      expect(html).toContain('fill-rule="evenodd"');
      expect(html).not.toMatch(/lotus|radar|orbitSpinZ/);
    }
  });
  it("keeps four stars at large sizes and removes texture and stars from compact launchers", () => {
    const large = renderToStaticMarkup(React.createElement(Orbit3DCore, { size: 132 }));
    const small = renderToStaticMarkup(React.createElement(Orbit3DCore, { size: "sm" }));
    expect((large.match(/<polygon /g) || []).length).toBe(4);
    expect(large).toContain("feTurbulence");
    expect(small).not.toContain("<polygon");
    expect(small).not.toContain("feTurbulence");
    expect(small).toContain('width:38px;max-width:100%');
  });
  it("preserves existing size aliases and forwards each actual assistant state", () => {
    for (const [size, pixels] of [["sm", 38], ["md", 92], ["lg", 184], ["xl", 224]] as const) {
      const html = renderToStaticMarkup(React.createElement(Orbit3DCore, { size, state: "thinking", showRadar: false }));
      expect(html).toContain(`width:${pixels}px`);
      expect(html).toContain("orbit-halo--thinking");
    }
  });
});

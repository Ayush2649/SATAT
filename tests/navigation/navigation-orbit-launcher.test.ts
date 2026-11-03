import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { OrbitLauncherBadge } from "@/components/orbit/OrbitLauncherBadge";

describe("Global Orbit 3D Launcher Badge in Navigation (Sprint 6.2)", () => {
  const navSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/Navigation.tsx"),
    "utf8"
  );
  const badgeSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/orbit/OrbitLauncherBadge.tsx"),
    "utf8"
  );

  it("1. Imports OrbitLauncherBadge in Navigation", () => {
    expect(navSource).toContain('import { OrbitLauncherBadge } from "@/components/orbit/OrbitLauncherBadge";');
  });

  it("2. Renders clean single top app header Orbit launcher badge without redundant bottom-right overlap (Sprint 6.3)", () => {
    expect(navSource).toContain('pathname !== "/dashboard/orbit"');
    expect(navSource).toContain("app-mobile-actions");
    expect(navSource).toContain('<OrbitLauncherBadge size="md" tooltipPosition="bottom" />');
    // Does NOT render redundant floating bottom-right launcher that covers task progress
    expect(navSource).not.toContain("fixed right-4 bottom-[calc(62px+max(14px,env(safe-area-inset-bottom))+12px)]");
  });

  it("3. Renders top app header Orbit launcher badge next to bell and avatar", () => {
    expect(navSource).toContain("app-mobile-actions");
    expect(navSource).toContain('<OrbitLauncherBadge size="md" tooltipPosition="bottom" />');
  });

  it("4. OrbitLauncherBadge renders rounded-square container with no text in badge body", () => {
    const html = renderToStaticMarkup(React.createElement(OrbitLauncherBadge, { size: "lg" }));
    // Rounded square styling
    expect(html).toContain("rounded-2xl");
    expect(html).toContain("bg-[#191D1A]");
    expect(html).toContain("border-[#6EE7B7]/30");
    expect(html).toContain("hover:scale-105");

    // Must NOT contain text like "Orbit AI" in the visible badge body
    expect(html).not.toContain(">Orbit AI<");
    expect(html).not.toContain(">AI<");

    // Tooltip contains Orbit
    expect(html).toContain('role="tooltip"');
    expect(html).toContain("Orbit</span>");
  });

  it("5. Embeds moving 3D orbital core (<Orbit3DCore size=\"sm\" state=\"idle\" />)", () => {
    expect(badgeSource).toContain('<Orbit3DCore size="sm" state="idle" />');
  });
});

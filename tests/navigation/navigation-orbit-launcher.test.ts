import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Global Orbit 3D Launcher in Navigation", () => {
  const navSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/Navigation.tsx"),
    "utf8"
  );

  it("1. Imports Orbit3DCore in Navigation", () => {
    expect(navSource).toContain('import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";');
  });

  it("2. Renders floating bottom-right 3D Orbit launcher above taskbar when not on /dashboard/orbit", () => {
    expect(navSource).toContain('pathname !== "/dashboard/orbit"');
    expect(navSource).toContain('href="/dashboard/orbit"');
    expect(navSource).toContain(
      "fixed right-4 bottom-[calc(62px+max(14px,env(safe-area-inset-bottom))+12px)] z-40"
    );
    expect(navSource).toContain('<Orbit3DCore size="sm" state="idle" />');
    expect(navSource).toContain("Orbit AI");
    expect(navSource).toContain("bg-[#6EE7B7]");
  });

  it("3. Renders top app header Orbit pill next to bell and avatar", () => {
    expect(navSource).toContain("app-mobile-actions");
    expect(navSource).toContain("pl-1.5 pr-2.5 py-1 text-[11px] font-semibold");
    expect(navSource).toContain("<span>Orbit</span>");
  });
});

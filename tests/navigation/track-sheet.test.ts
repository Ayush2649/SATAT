import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.2: Quick Track (+) Modal Translucent Backdrop & Orbit AI 4th Tile", () => {
  const trackSheetSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/navigation/TrackSheet.tsx"),
    "utf8"
  );
  const cssSource = fs.readFileSync(
    path.resolve(__dirname, "../../styles/app-shell.css"),
    "utf8"
  );

  it("1. Renders translucent backdrop with explicit inline alpha styling and data-backdrop attribute", () => {
    expect(trackSheetSource).toContain('data-backdrop="true"');
    expect(trackSheetSource).toContain('backgroundColor: "rgba(10, 13, 11, 0.58)"');
    expect(trackSheetSource).toContain("backdrop-blur-md");
  });

  it("2. Protects translucent backdrops from opaque dark-mode background overrides in app-shell.css", () => {
    expect(cssSource).toContain(':not([data-backdrop="true"])');
    expect(cssSource).toContain('html.dark [data-backdrop="true"]');
    expect(cssSource).toContain("background: rgba(10, 13, 11, 0.58) !important;");
  });

  it("3. Replaces 4th tile with Ask Orbit AI Copilot", () => {
    expect(trackSheetSource).toContain("Ask Orbit AI");
    expect(trackSheetSource).toContain("Unified Copilot · Orbit");
    expect(trackSheetSource).toContain('<Orbit3DCore size="sm" state="idle" />');
    expect(trackSheetSource).toContain('handleAction("/dashboard/orbit")');
  });

  it("4. Contains all 4 distinct quick capture paths", () => {
    expect(trackSheetSource).toContain("Scan Meal Plate");
    expect(trackSheetSource).toContain("Start Workout");
    expect(trackSheetSource).toContain("Deep Work Task");
    expect(trackSheetSource).toContain("Ask Orbit AI");
    expect(trackSheetSource).not.toContain("Water & Biometrics");
  });
});

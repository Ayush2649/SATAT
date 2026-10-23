import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("OrbitView Retry Mechanism & Resilience", () => {
  const orbitViewSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/orbit/OrbitView.tsx"),
    "utf8"
  );

  it("1. Binds Retry button in error banner to handleRetry", () => {
    // Regression check: previously the Retry button in the error banner invoked
    // handleSend() with cleared input. Now it invokes handleRetry.
    expect(orbitViewSource).toContain("onClick={handleRetry}");
    // Verify handleRetry is defined
    expect(orbitViewSource).toContain("const handleRetry = useCallback");
  });

  it("2. Defines lastFailedMessageRef to preserve failed prompt across input resets", () => {
    expect(orbitViewSource).toContain("lastFailedMessageRef = useRef<string | null>(null);");
    expect(orbitViewSource).toContain("lastFailedMessageRef.current = text;");
    expect(orbitViewSource).toContain("lastFailedMessageRef.current = null;");
  });

  it("3. Identifies last user message in conversation without appending duplicate bubbles", () => {
    expect(orbitViewSource).toContain('messages.map((m) => m.role).lastIndexOf("user")');
  });

  it("4. Resets loading, error, and transitions orbitState on retry invocation", () => {
    expect(orbitViewSource).toContain("setError(null);");
    expect(orbitViewSource).toContain("setLoading(true);");
    expect(orbitViewSource).toContain('setOrbitState("thinking");');
  });
});


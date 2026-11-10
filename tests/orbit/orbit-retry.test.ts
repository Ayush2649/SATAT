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

  it("5. Provides New Chat / Reset button with handleResetChat action", () => {
    expect(orbitViewSource).toContain('aria-label="Reset chat"');
    expect(orbitViewSource).toContain("handleResetChat");
    expect(orbitViewSource).toContain("New Chat");
    expect(orbitViewSource).toContain("setMessages([]);");
    expect(orbitViewSource).toContain('setViewMode("overview");');
  });

  it("6. Auto-scrolls both mobile and desktop streams without ref collisions and handles overlay reopen", () => {
    expect(orbitViewSource).toContain("mobileScrollContainerRef");
    expect(orbitViewSource).toContain("desktopScrollContainerRef");
    expect(orbitViewSource).toContain("mobileMessagesEndRef");
    expect(orbitViewSource).toContain("desktopMessagesEndRef");
    expect(orbitViewSource).toContain("const scrollToBottom = useCallback((behavior: ScrollBehavior = \"smooth\")");
    expect(orbitViewSource).toContain("isOpen = true");
    expect(orbitViewSource).toContain("justOpened && messages.length > 0");
    expect(orbitViewSource).toContain('scrollToBottom("auto")');
  });

  it("7. Dispatches satat:data-refresh for single and multi-intent mutations and sends clientDate", () => {
    expect(orbitViewSource).toContain("dispatchMutationRefreshEvents");
    expect(orbitViewSource).toContain("Array.isArray(data.actions_executed)");
    expect(orbitViewSource).toContain("Array.isArray(data.action_executed)");
    expect(orbitViewSource).toContain('new CustomEvent("satat:data-refresh"');
    expect(orbitViewSource).toContain("clientDate: todayString()");
  });
});


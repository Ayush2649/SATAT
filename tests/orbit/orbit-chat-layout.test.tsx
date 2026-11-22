import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { id: "layout-test", name: "Preview" } } }) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/ui/Logo", () => ({ default: () => <span>SATAT symbol</span> }));
vi.mock("@/components/ui/NotificationBell", () => ({ default: () => <button aria-label="Notifications" /> }));
import OrbitView from "@/components/orbit/OrbitView";

describe("Orbit's shared conversation layout", () => {
  it("renders one composer and four suggestions below the logo without dashboard summaries", () => {
    const html = renderToStaticMarkup(<OrbitView />);
    expect((html.match(/<textarea/g) || []).length).toBe(1);
    expect((html.match(/class="orbit-chat-suggestion"/g) || []).length).toBe(4);
    expect(html.indexOf('aria-label="Orbit companion"')).toBeLessThan(html.indexOf('aria-label="Suggested questions"'));
    expect(html.indexOf('aria-label="Suggested questions"')).toBeLessThan(html.indexOf("<textarea"));
    expect(html).not.toMatch(/READY TO CHAT|YOUR NEXT STEP|Deep Sleep Window|High-Load Slots|Orbit Intelligence Stream/);
    expect(html).toContain('aria-label="Reset chat"');
    expect(html).toContain('aria-label="Send message"');
  });
  it("keeps context and existing entry points available behind chat options", () => {
    const html = renderToStaticMarkup(<OrbitView />);
    expect(html).toContain('<details class="orbit-chat-tools">');
    expect(html).toContain('aria-label="Conversation context"');
    expect(html).toContain("Camera Scan");
    expect(html).toContain("Voice Input");
    expect(html).toContain('aria-label="File attachments are not available; use Camera Scan for meal photos"');
  });
  it("supports a desktop overlay close action without adding another composer", () => {
    const html = renderToStaticMarkup(<OrbitView isOverlay onClose={() => {}} />);
    expect(html).toContain('aria-label="Close Orbit"');
    expect((html.match(/<textarea/g) || []).length).toBe(1);
  });
  it("preserves welcome content while the composer follows measured keyboard height", () => {
    const shell = fs.readFileSync(path.resolve(__dirname, "../../styles/app-shell.css"), "utf8");
    const chat = fs.readFileSync(path.resolve(__dirname, "../../styles/orbit-chat.css"), "utf8");
    const mobileRule = shell.match(/\.orbit-view-root\s*\{([^}]+)\}/)?.[1] || "";
    expect(mobileRule).not.toContain("height: 100% !important");
    const rules = Array.from(chat.matchAll(/([^{}]+)\{([^{}]*)\}/g));
    for (const [, selector, body] of rules) {
      if (/orbit-chat-(welcome|suggestions)/.test(selector) && !selector.includes("::-webkit-scrollbar")) {
        expect(body).not.toMatch(/display:\s*none|visibility:\s*hidden|opacity:\s*0(?:;|\s|$)/);
      }
    }
    expect(chat).toContain("var(--orbit-keyboard-overlap, 0px)");
    expect(chat).not.toMatch(/data-keyboard-open[^{}]+workspace[^{}]*\{[^}]*justify-content:\s*flex-end/);
    expect(chat).toContain("width: 184px !important; height: 184px");
    expect(chat).not.toMatch(/data-keyboard-open[^{}]+header[^{}]*\{[^}]*display:\s*none/);
    expect(chat).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });
});

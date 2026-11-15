"use client";
import { useEffect, useRef } from "react";

/** Focus the active dialog, contain Tab navigation and restore the opener. */
export function useDialogFocus(onClose: () => void, active = true) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;
    let dialog: HTMLElement | null = null;
    const frame = requestAnimationFrame(() => {
      dialog = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).at(-1) ?? null;
      const first = dialog?.querySelector<HTMLElement>('input:not([disabled]), textarea, button:not([disabled]), [tabindex="0"]');
      first?.focus();
    });
    const keydown = (event: KeyboardEvent) => {
      if (!dialog) return;
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]'))
        .filter(element => element.getClientRects().length > 0);
      const first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", keydown); if (opener?.isConnected) opener.focus(); };
  }, [active]);
}

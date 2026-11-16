"use client";
import { useEffect, useRef, useState } from "react";

export function ritualStorageKey(userId: string, date: string) {
  return `satat_rituals_${encodeURIComponent(userId)}_${date}`;
}

/** Account-scoped progress on this device. Legacy unowned records are not imported. */
export function useRituals(userId: string, date: string) {
  const [snapshot, setSnapshot] = useState<{ key: string; values: Record<string, boolean> }>({ key: "", values: {} });
  const latest = useRef(snapshot);
  const key = ritualStorageKey(userId, date);
  useEffect(() => {
    const read = () => {
      let values: Record<string, boolean> = {};
      try {
        const parsed = userId ? JSON.parse(localStorage.getItem(key) || "{}") : {};
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) values = Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "boolean")) as Record<string, boolean>;
      } catch { /* A malformed record starts empty for this account. */ }
      latest.current = { key, values }; setSnapshot(latest.current);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("satat:rituals-updated", read);
    return () => { window.removeEventListener("storage", read); window.removeEventListener("satat:rituals-updated", read); };
  }, [key, userId]);
  const toggleRitual = (id: string) => {
    if (!userId) return;
    const current = latest.current.key === key ? latest.current.values : {};
    const next = { ...current, [id]: !current[id] };
    latest.current = { key, values: next }; setSnapshot(latest.current);
    try { localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event("satat:rituals-updated")); } catch { /* Storage may be restricted. */ }
  };
  return { rituals: snapshot.key === key ? snapshot.values : {}, toggleRitual };
}

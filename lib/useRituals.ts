"use client";
import { useEffect, useState } from "react";

export function ritualStorageKey(userId: string, date: string) {
  return `satat_rituals_${encodeURIComponent(userId)}_${date}`;
}

/** Account-scoped progress on this device. Legacy unowned records are not imported. */
export function useRituals(userId: string, date: string) {
  const [rituals, setRituals] = useState<Record<string, boolean>>({});
  const key = ritualStorageKey(userId, date);
  useEffect(() => {
    const read = () => {
      try { setRituals(userId ? JSON.parse(localStorage.getItem(key) || "{}") : {}); }
      catch { setRituals({}); }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("satat:rituals-updated", read);
    return () => { window.removeEventListener("storage", read); window.removeEventListener("satat:rituals-updated", read); };
  }, [key, userId]);
  const toggleRitual = (id: string) => {
    if (!userId) return;
    const next = { ...rituals, [id]: !rituals[id] };
    setRituals(next);
    try { localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event("satat:rituals-updated")); } catch { /* Storage may be restricted. */ }
  };
  return { rituals, toggleRitual };
}

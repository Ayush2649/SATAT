"use client";
import { useEffect, useRef, useState } from "react";

export interface FocusTimerState { minutes: number; remaining: number; deadline: number | null }
export function remainingSeconds(state: FocusTimerState, now = Date.now()) {
  return state.deadline === null ? state.remaining : Math.max(0, Math.ceil((state.deadline - now) / 1000));
}

export function useFocusTimer(userId: string, onComplete: () => void) {
  const key = `satat_focus_${encodeURIComponent(userId)}`;
  const [state, setState] = useState<FocusTimerState>({ minutes: 25, remaining: 1500, deadline: null });
  const [readyKey, setReadyKey] = useState("");
  const completedDeadline = useRef<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  useEffect(() => {
    setReadyKey("");
    completedDeadline.current = null;
    let next: FocusTimerState = { minutes: 25, remaining: 1500, deadline: null };
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null");
      if (saved && Number.isFinite(saved.minutes) && saved.minutes >= 25 && saved.minutes <= 150 && Number.isFinite(saved.remaining)
        && (saved.deadline === null || Number.isFinite(saved.deadline))) next = saved;
    } catch { /* A malformed draft starts a fresh timer. */ }
    setState(next); setNow(Date.now()); setReadyKey(key);
  }, [key]);
  useEffect(() => {
    if (readyKey !== key || !userId) return;
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch { /* Storage restricted. */ }
  }, [key, userId, readyKey, state]);
  useEffect(() => {
    if (readyKey !== key || state.deadline === null) return;
    const tick = () => {
      const current = Date.now(); setNow(current);
      if (state.deadline !== null && current >= state.deadline && completedDeadline.current !== state.deadline) {
        completedDeadline.current = state.deadline;
        setState(previous => ({ ...previous, remaining: 0, deadline: null }));
        completeRef.current();
      }
    };
    // Deadline arithmetic remains correct even when background tabs throttle ticks.
    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
  }, [readyKey, key, state.deadline]);
  const selectDuration = (minutes: number) => setState({ minutes, remaining: minutes * 60, deadline: null });
  const start = (minutes = state.minutes) => { setNow(Date.now()); setState({ minutes, remaining: minutes * 60, deadline: Date.now() + minutes * 60000 }); };
  const toggle = () => {
    setNow(Date.now());
    setState(previous => previous.deadline === null
      ? { ...previous, deadline: Date.now() + (previous.remaining || previous.minutes * 60) * 1000 }
      : { ...previous, remaining: remainingSeconds(previous), deadline: null });
  };
  const visible = readyKey === key ? state : { minutes: 25, remaining: 1500, deadline: null };
  return { targetMinutes: visible.minutes, secondsRemaining: remainingSeconds(visible, now), isTimerRunning: visible.deadline !== null,
    selectDuration, start, toggle, reset: () => selectDuration(state.minutes) };
}

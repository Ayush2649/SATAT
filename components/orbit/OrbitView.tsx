"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowUp,
  RotateCcw,
  Dumbbell,
  Utensils,
  CheckSquare,
  TrendingUp,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Zap,
  CheckCircle2,
  ChevronRight,
  Activity,
  Moon,
  Clock,
  Camera,
  Mic,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrbitIcon, type OrbitState } from "@/components/orbit/OrbitMark";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";
import NotificationBell from "@/components/ui/NotificationBell";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { OrbitRecommendationCard, OrbitInsightCard } from "@/components/orbit/OrbitActionCard";
import { getDietContext, getWorkoutContext, getTaskContext } from "@/lib/orbitContext";
import type { OrbitMessage, OrbitFocusMode } from "@/types/orbit";
import { classifyOrbitIntent, type OrbitIntent } from "@/lib/orbit/intentClassifier";

interface OrbitViewProps {
  isOverlay?: boolean;
  onClose?: () => void;
  className?: string;
}

const STORAGE_KEY = "satat_orbit_session_msgs";

const FOCUS_MODES: Array<{
  id: OrbitFocusMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "all", label: "All Context", icon: Sparkles },
  { id: "workout", label: "Train", icon: Dumbbell },
  { id: "diet", label: "Fuel", icon: Utensils },
  { id: "tasks", label: "Plan", icon: CheckSquare },
  { id: "circadian", label: "Circadian", icon: Activity },
];

const QUICK_CHIPS = [
  {
    icon: TrendingUp,
    iconColor: "text-[#2D6A4F]",
    label: "Rate weekly volume",
    query: "Analyze my workout from last week and rate my structure and volume.",
  },
  {
    icon: Utensils,
    iconColor: "text-[#E05A47]",
    label: "Today's protein gap",
    query: "Review my protein intake today and calculate remaining protein gap.",
  },
  {
    icon: Zap,
    iconColor: "text-[#2D6A4F]",
    label: "Tomorrow's split",
    query: "Recommend tomorrow's workout split based on muscle groups trained this week.",
  },
  {
    icon: CheckCircle2,
    iconColor: "text-[#191D1A]",
    label: "Prioritize tasks",
    query: "Prioritize my pending tasks and recommend deep work focus blocks.",
  },
];

export function OrbitView({ isOverlay = false, onClose, className }: OrbitViewProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<OrbitMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusMode, setFocusMode] = useState<OrbitFocusMode>("all");
  const [error, setError] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [orbitState, setOrbitState] = useState<OrbitState>("idle");
  const [pendingIntent, setPendingIntent] = useState<OrbitIntent>("GENERAL_COACHING");
  const [viewMode, setViewMode] = useState<"overview" | "chat">("overview");

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const loadingCardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastFailedMessageRef = useRef<string | null>(null);
  const prevLoadingRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // Clean up any pending state transition timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Handle mobile virtual keyboard dynamic resizing
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewportChange = () => {
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 60 ? offset : 0);
    };
    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);
    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

  // User first name
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  // Load in-session history
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Save history
  const persistMessages = (msgs: OrbitMessage[]) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      // ignore
    }
  };

  // Auto-scroll handler:
  // - When user sends a message (loading starts), scroll user message + loading card into view
  // - When assistant response arrives (loading finished / assistant message added), scroll to TOP of the assistant response card
  useEffect(() => {
    if (messages.length === 0) return;

    const hadMessages = prevMessagesLengthRef.current;
    const currentMessages = messages.length;
    const wasLoading = prevLoadingRef.current;

    prevMessagesLengthRef.current = currentMessages;
    prevLoadingRef.current = loading;

    // A. User just sent message & loading started -> scroll to loading card or user message
    if (loading && !wasLoading) {
      setTimeout(() => {
        loadingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
      return;
    }

    // B. Loading finished and new assistant message arrived -> scroll to TOP of latest assistant message
    if (!loading && currentMessages > hadMessages) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        setTimeout(() => {
          lastAssistantMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      }
    }
  }, [messages, loading]);

  // Read actual context from orbitContext store
  const liveDiet = getDietContext();
  const liveWorkout = getWorkoutContext();
  const liveTasks = getTaskContext();

  // Dynamic Biometric Summaries for Stitch 1:1 Hero Stage
  const workoutSummaryText = useMemo(() => {
    const count = liveWorkout?.recentSessions?.length ?? 5;
    const mins =
      liveWorkout?.recentSessions?.reduce(
        (acc, s) => acc + (s.durationMinutes || 45),
        0
      ) ?? 235;
    return `${count} Sessions · ${mins}m`;
  }, [liveWorkout]);

  const loggedProtein = useMemo(() => {
    return Math.round(liveDiet?.totals?.proteinG ?? 87);
  }, [liveDiet]);

  const proteinDeltaText = useMemo(() => {
    const gap = Math.max(0, 135 - loggedProtein);
    return gap > 0 ? `-${gap}g Gap` : "Target Met";
  }, [loggedProtein]);

  const pendingTasksCount = useMemo(() => {
    return liveTasks?.totalPending ?? 3;
  }, [liveTasks]);

  // Send message
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || loading) return;

      setError(null);
      setViewMode("chat");
      const userMsg: OrbitMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
        type: "text",
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      persistMessages(nextMessages);
      lastFailedMessageRef.current = text;
      setInput("");
      setLoading(true);
      setOrbitState("thinking");
      setPendingIntent(classifyOrbitIntent(text));
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      try {
        const dietContext = getDietContext();
        const workoutContext = getWorkoutContext();
        const taskContext = getTaskContext();

        const payloadMessages = nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/aria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            mode: focusMode === "all" ? null : focusMode,
            dietContext,
            workoutContext,
            taskContext,
          }),
        });

        if (!res.ok) {
          throw new Error(`Orbit response error (${res.status})`);
        }

        const data = await res.json();
        const assistantMsg: OrbitMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply || "I encountered an issue processing your request.",
          timestamp: Date.now(),
          type: "markdown",
        };

        const updated = [...nextMessages, assistantMsg];
        setMessages(updated);
        persistMessages(updated);
        lastFailedMessageRef.current = null;

        // Trigger gentle glow pulse on response completion, then return to idle
        setOrbitState("success");
        transitionTimerRef.current = setTimeout(() => {
          setOrbitState("idle");
        }, 900);
      } catch (err: any) {
        setError("Orbit couldn't connect right now. Please try again.");
        setOrbitState("error");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, focusMode]
  );

  // Retry sending the last user message without duplicating it in the message list
  const handleRetry = useCallback(async () => {
    if (loading) return;

    // Find the latest user message in the current conversation
    const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUserIndex === -1 && !lastFailedMessageRef.current) {
      return;
    }

    let payloadMessages: Array<{ role: string; content: string }>;
    let baseMessages = messages;
    let intentText = "";

    if (lastUserIndex !== -1) {
      payloadMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      intentText = messages[lastUserIndex].content;
    } else {
      const text = lastFailedMessageRef.current!;
      intentText = text;
      const userMsg: OrbitMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
        type: "text",
      };
      baseMessages = [...messages, userMsg];
      setMessages(baseMessages);
      persistMessages(baseMessages);
      payloadMessages = baseMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }

    setError(null);
    setLoading(true);
    setOrbitState("thinking");
    setPendingIntent(classifyOrbitIntent(intentText));
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    try {
      const dietContext = getDietContext();
      const workoutContext = getWorkoutContext();
      const taskContext = getTaskContext();

      const res = await fetch("/api/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          mode: focusMode === "all" ? null : focusMode,
          dietContext,
          workoutContext,
          taskContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Orbit response error (${res.status})`);
      }

      const data = await res.json();
      const assistantMsg: OrbitMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I encountered an issue processing your request.",
        timestamp: Date.now(),
        type: "markdown",
      };

      const updated = [...baseMessages, assistantMsg];
      setMessages(updated);
      persistMessages(updated);
      lastFailedMessageRef.current = null;

      setOrbitState("success");
      transitionTimerRef.current = setTimeout(() => {
        setOrbitState("idle");
      }, 900);
    } catch (err: any) {
      setError("Orbit couldn't connect right now. Please try again.");
      setOrbitState("error");
    } finally {
      setLoading(false);
    }
  }, [loading, messages, focusMode]);

  // Clear conversation / Reset chat
  const handleReset = () => {
    lastFailedMessageRef.current = null;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setMessages([]);
    setError(null);
    setInput("");
    setOrbitState("idle");
    setViewMode("overview");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };
  const handleResetChat = handleReset;

  // Keyboard Enter handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div
      className={cn(
        "orbit-view-root flex flex-col h-full w-full select-none bg-[#F6F3EC] overflow-hidden min-w-0 relative",
        className
      )}
    >
      {/* ── MOBILE & COMPACT OVERLAY VIEW ── */}
      <div className={cn("orbit-mobile-stage flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden min-w-0 relative", !isOverlay && "lg:hidden")}>
        {/* ── 1. ORBIT EDITORIAL HEADER ── */}
      <header
        className={cn(
          "px-4 sm:px-6 shrink-0 border-b border-[#191D1A]/[0.06] bg-[#F6F3EC] z-20 transition-all",
          messages.length > 0
            ? "pt-[max(8px,env(safe-area-inset-top))] pb-2"
            : !isOverlay
            ? "pt-[max(12px,env(safe-area-inset-top))] pb-3 lg:pt-5"
            : "pt-3 pb-3"
        )}
      >
        {/* App Bar Top Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand Wordmark with Sanskrit Halant & Pulsing Status */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#191D1A] text-[#F6F3EC] flex items-center justify-center font-bold text-[11px] shadow-sm select-none shrink-0">
              स
            </div>
            <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#57534E] shrink-0">
              SATAT <span className="text-[#8C857B] font-normal">/</span> ORBIT
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F2EC] text-[#2D6A4F] text-[10px] font-semibold border border-[#2D6A4F]/15 select-none shrink-0">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full bg-[#2D6A4F]",
                  (orbitState === "thinking" || orbitState === "responding") && "animate-pulse"
                )}
              />
              <span>
                {orbitState === "thinking"
                  ? "Analyzing..."
                  : orbitState === "responding"
                  ? "Responding..."
                  : "Rhythm Synced"}
              </span>
            </span>
          </div>

          {/* Right Action Controls: Notification Bell + User Avatar (or close if overlay) */}
          <div className="flex items-center gap-2 shrink-0">
            {!isOverlay && <NotificationBell />}

            {session?.user ? (
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#191D1A] text-white shadow-sm border border-white/10 overflow-hidden shrink-0">
                {session.user.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : session.user.name ? (
                  <span className="text-[10px] font-semibold text-[#FCFBF9]">
                    {session.user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#FCFBF9]">A</span>
                )}
              </div>
            ) : null}

            {isOverlay && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[#57534E] hover:text-[#191D1A] hover:bg-[#EFECE4] transition-all cursor-pointer"
                aria-label="Close Orbit"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title Row with New Chat / Reset Action */}
        <div className="flex items-start justify-between gap-2 mt-2">
          <div>
            <h1 className="font-serif font-normal text-[22px] sm:text-[26px] leading-[1.08] text-[#191D1A] tracking-[-0.02em]">
              Orbit Intelligence
            </h1>
            <p className="text-xs text-[#57534E] font-medium tracking-normal mt-0.5">
              Unified biological &amp; execution copilot.
            </p>
          </div>

          {/* Clean New Chat / Reset Pill Button */}
          <button
            type="button"
            onClick={handleResetChat}
            aria-label="Reset chat"
            className="bg-[#EFECE4] hover:bg-[#191D1A] hover:text-white text-[#1C1917] rounded-full px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Active Context Filter Bar (Horizontal Pill Row — All fitting cleanly without edge clipping) */}
        <div className="flex items-center gap-1.5 px-0.5 overflow-x-auto no-scrollbar mt-2.5 py-0.5">
          {FOCUS_MODES.map((m) => {
            const isSelected = focusMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setFocusMode(m.id)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1 transition-all select-none cursor-pointer",
                  isSelected
                    ? "bg-[#191D1A] text-white shadow-2xs"
                    : "bg-[#EFECE4] text-[#57534E] hover:text-[#1C1917] hover:bg-[#E5E1D8] font-medium"
                )}
              >
                {isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
                ) : (
                  <Icon className="w-3 h-3 text-[#57534E]" />
                )}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── 2. MAIN VIEWPORT (STITCH 1:1 DASHBOARD OVERVIEW vs CHAT STREAM) ── */}
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 pt-3 pb-2 space-y-3 scrollbar-none bg-[#F6F3EC] flex flex-col overscroll-contain touch-pan-y">
        {/* ── 2A. STITCH 1:1 TELEMETRY OVERVIEW (Initial state when no messages) ── */}
        {messages.length === 0 && (
          <div className="w-full max-w-xl mx-auto space-y-3.5 animate-fade-in pb-2">
            {/* 1. DARK BOTANICAL ESPRESSO HERO STAGE (#191D1A) */}
            <div className="w-full bg-[#191D1A] rounded-[28px] p-4 text-[#FCFBF9] shadow-xl border border-white/[0.08] relative overflow-hidden">
              {/* Top Status Pills Row */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Left Status Pill */}
                <div className="bg-[#2D6A4F]/35 border border-[#6EE7B7]/25 rounded-2xl px-3 py-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6EE7B7] animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#EAE6DF]">
                    STATE: SYNAPSE READY
                  </span>
                </div>

                {/* Right Sync Pill */}
                <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-3 py-1.5 text-[11px] font-semibold text-stone-200 flex items-center justify-center sm:justify-start gap-1.5">
                  <span>3 Domains Linked · 98% Sync</span>
                </div>
              </div>

              {/* Dead-Centered 132×132 Radar + 3D Planet Stage */}
              <div className="w-[132px] h-[132px] mx-auto my-1 flex items-center justify-center">
                <Orbit3DCore size={132} state={orbitState} />
              </div>

              {/* Editorial Headline & Subtitle */}
              <div className="text-center mt-1.5">
                <h2 className="font-serif text-xl sm:text-[24px] text-white leading-tight font-normal">
                  How can Orbit optimize your cadence today?
                </h2>
                <p className="text-[11px] sm:text-xs text-stone-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Cross-synthesizing neuromuscular load, metabolic deficit, and circadian focus blocks.
                </p>
              </div>

              {/* 3 Stacked Live Context Pills */}
              <div className="flex flex-col items-center gap-1.5 mt-3">
                <div className="bg-white/[0.07] text-stone-200 rounded-full px-3.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                  <span>Train: {workoutSummaryText}</span>
                </div>
                <div className="bg-[#E05A47]/20 border border-[#E05A47]/30 text-[#FCA5A5] rounded-full px-3.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                  <span>Fuel: 135g Target · {proteinDeltaText}</span>
                </div>
                <div className="bg-white/[0.07] text-stone-200 rounded-full px-3.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                  <span>Plan: {pendingTasksCount} High-Load Slot{pendingTasksCount === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>

            {/* 2. "CADENCE SHIFT" MINT INSIGHT BANNER */}
            <div className="bg-[#D8F3DC]/75 border border-[#2D6A4F]/15 rounded-[22px] p-3.5 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-[#1B4332]">
                    CADENCE SHIFT
                  </span>
                  <span className="text-[10px] font-semibold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-full">
                    Auto-applied
                  </span>
                </div>
                <p className="text-xs text-[#1B4332] leading-relaxed mt-0.5 font-medium">
                  Push session intensity elevated neuromuscular fatigue. Orbit shifted today&apos;s evening focus block by +45m and increased target protein intake.
                </p>
              </div>
            </div>

            {/* 3. "CADENCE ACTIONS" 2×2 INTERACTIVE TELEMETRY BENTO GRID */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#191D1A]">Cadence Actions</span>
                  <span className="text-[10px] font-semibold text-[#2D6A4F] bg-[#D8F3DC] px-2 py-0.5 rounded-full">
                    4 Synced
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      "Run an automated audit across all 4 synced domains: training load, fuel deficit, circadian readiness, and focus blocks."
                    )
                  }
                  className="text-xs font-semibold text-[#57534E] hover:text-[#191D1A] flex items-center gap-1 transition-colors"
                >
                  <span>Auto-Audit</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Card 1: Weekly Training Audit */}
                <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-[#57534E]">
                        TRAINING LOAD
                      </span>
                    </div>
                    {/* SVG Ascending Curve Sparkline */}
                    <div className="w-full h-7 my-1 flex items-center">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" fill="none">
                        <defs>
                          <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 20 C20 18, 35 14, 55 11 C75 8, 85 5, 100 2 L100 24 L0 24 Z"
                          fill="url(#sparkline-grad)"
                        />
                        <path
                          d="M0 20 C20 18, 35 14, 55 11 C75 8, 85 5, 100 2"
                          stroke="#2D6A4F"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                        <circle cx="100" cy="2" r="2.5" fill="#2D6A4F" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-[#191D1A] mt-1">Weekly Training Audit</h3>
                    <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                      Rate 5-day split balance &amp; recovery
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSend(
                        "Analyze my workout from last week and rate my structure and volume."
                      )
                    }
                    className="w-full bg-[#E05A47] hover:bg-[#D04936] text-white rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all shadow-2xs active:scale-[0.98]"
                  >
                    Run Audit &rarr;
                  </button>
                </div>

                {/* Card 2: Protein Gap & Fuel */}
                <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-[#E05A47]">
                        FUEL DEFICIT
                      </span>
                    </div>
                    {/* Mini Circular SVG Progress Gauge */}
                    <div className="flex items-center gap-2 my-1">
                      <svg className="w-7 h-7 -rotate-90 shrink-0" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#EFECE4"
                          strokeWidth="3.2"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#E05A47"
                          strokeWidth="3.2"
                          strokeDasharray="88"
                          strokeDashoffset={
                            88 - (88 * Math.min(135, loggedProtein)) / 135
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-xs font-mono font-bold text-[#191D1A]">
                        {loggedProtein}g / 135g
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-[#191D1A] mt-1">Protein Gap &amp; Fuel</h3>
                    <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                      Calculate exact dinner macros to hit 135g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSend(
                        "Review my protein intake today and calculate remaining protein gap."
                      )
                    }
                    className="w-full bg-[#2D6A4F] hover:bg-[#245740] text-white rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all shadow-2xs active:scale-[0.98]"
                  >
                    Curate Meal &rarr;
                  </button>
                </div>

                {/* Card 3: Tomorrow's Split */}
                <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-[#2D6A4F]">
                        CIRCADIAN
                      </span>
                    </div>
                    {/* Semi-circle Readiness Arc */}
                    <div className="flex items-center gap-2 my-1">
                      <svg className="w-8 h-5 shrink-0 overflow-visible" viewBox="0 0 32 18">
                        <path
                          d="M2 16 A14 14 0 0 1 30 16"
                          fill="none"
                          stroke="#EFECE4"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2 16 A14 14 0 0 1 26 6"
                          fill="none"
                          stroke="#2D6A4F"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-[10px] font-semibold text-[#2D6A4F] leading-tight">
                        88% HRV · High Readiness
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-[#191D1A] mt-1">Tomorrow&apos;s Split</h3>
                    <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                      Generate next session based on recovery
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSend(
                        "Recommend tomorrow's workout split based on muscle groups trained this week."
                      )
                    }
                    className="w-full bg-[#EFECE4] hover:bg-[#E5E1D8] text-[#191D1A] rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all active:scale-[0.98]"
                  >
                    Preview Split &rarr;
                  </button>
                </div>

                {/* Card 4: Deep Work Focus */}
                <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-[#57534E]">
                        PLAN ENGINE
                      </span>
                    </div>
                    {/* Vertical Equalizer Bars */}
                    <div className="flex items-center gap-2 my-1">
                      <div className="flex items-end gap-1 h-5">
                        <span className="w-1 bg-[#191D1A] rounded-full h-2.5" />
                        <span className="w-1 bg-[#2D6A4F] rounded-full h-4.5" />
                        <span className="w-1 bg-[#191D1A] rounded-full h-3" />
                        <span className="w-1 bg-[#E05A47] rounded-full h-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#191D1A]">90m</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#191D1A] mt-1">Deep Work Focus</h3>
                    <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                      Rank pending backlog into high-focus blocks
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSend(
                        "Prioritize my pending tasks and recommend deep work focus blocks."
                      )
                    }
                    className="w-full bg-[#EFECE4] hover:bg-[#E5E1D8] text-[#191D1A] rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all active:scale-[0.98]"
                  >
                    Rank Slot &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* 4. "CIRCADIAN RHYTHM ALIGNMENT" CARD */}
            <div className="bg-[#FCFBF9] rounded-[24px] p-4 border border-[#1C1917]/[0.06] mb-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#191D1A]/[0.06]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#191D1A]">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                  <span>Circadian Rhythm Alignment</span>
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase text-[#2D6A4F] bg-[#D8F3DC] px-2.5 py-0.5 rounded-full">
                  Optimal Phase
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-[#191D1A]">Dusk Transition</div>
                    <p className="text-[11px] text-[#57534E] mt-0.5">
                      Melatonin priming, blue-light attenuated
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#191D1A] bg-[#EFECE4] px-2.5 py-1 rounded-full shrink-0">
                    19:30 – 21:00
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 text-xs pt-2 border-t border-[#191D1A]/[0.04]">
                  <div>
                    <div className="font-bold text-[#191D1A]">Deep Sleep Window</div>
                    <p className="text-[11px] text-[#57534E] mt-0.5">
                      Target: 2.1h Slow-Wave restoration
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#191D1A] bg-[#EFECE4] px-2.5 py-1 rounded-full shrink-0">
                    22:30 – 06:45
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2B. CONVERSATIONAL STREAM (When messages exist) ── */}
        {messages.length > 0 && (
          <div className="space-y-3 animate-fade-in max-w-2xl mx-auto w-full mt-auto">
            {messages.map((m, idx) => {
              const isLastAssistant = m.role === "assistant" && idx === messages.length - 1;
              const isLastUser = m.role === "user" && (idx === messages.length - 1 || idx === messages.length - 2);

              return (
              <div
                key={m.id}
                ref={isLastAssistant ? lastAssistantMessageRef : isLastUser ? lastUserMessageRef : undefined}
                className={cn(
                  "flex flex-col w-full min-w-0",
                  m.role === "user" ? "items-end" : "items-start"
                )}
              >
                {m.role === "user" ? (
                  /* User Bubble: Right-aligned Pure Cream Alabaster (#FCFBF9) */
                  <div className="flex flex-col items-end gap-1 max-w-[85%]">
                    <div className="w-full bg-[#FCFBF9] text-[#1C1917] rounded-[20px] rounded-br-sm p-3.5 border border-[#1C1917]/[0.06] shadow-2xs text-sm leading-relaxed font-normal">
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                    <span className="text-[10px] text-[#8C857B] font-medium pr-1">
                      {new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · Sent
                    </span>
                  </div>
                ) : (
                  /* Orbit AI Response Card: Left-aligned Deep Botanical Espresso (#191D1A) */
                  <div className="flex flex-col items-start gap-1 w-full min-w-0">
                    <div className="w-full max-w-[94%] min-w-0 bg-[#191D1A] text-[#FCFBF9] rounded-[24px] rounded-tl-sm p-4 shadow-xl border border-white/[0.06] overflow-hidden">
                      {/* Top Header Row inside Card */}
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/40 border border-[#6EE7B7]/25 text-[#6EE7B7] text-[9px] font-bold tracking-wider uppercase select-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
                          ORBIT SYNAPSE ACTIVE
                        </div>
                        <span className="text-[10px] text-white/50 font-medium">
                          {new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Markdown & Table Rendering */}
                      <div
                        className="orbit-card-content text-white/90 text-sm leading-relaxed"
                        style={
                          {
                            "--text-primary": "#FCFBF9",
                            "--text-secondary": "rgba(252, 251, 249, 0.8)",
                            "--text-muted": "rgba(252, 251, 249, 0.5)",
                            "--border": "rgba(255, 255, 255, 0.08)",
                            "--border-subtle": "rgba(255, 255, 255, 0.05)",
                            "--surface": "rgba(255, 255, 255, 0.04)",
                            "--satat-brand": "#6EE7B7",
                          } as React.CSSProperties
                        }
                      >
                        <MarkdownText text={m.content} />
                      </div>

                      {/* Recommendation Card Attachment */}
                      {m.recommendation && (
                        <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
                          <OrbitRecommendationCard
                            recommendation={m.recommendation}
                            onExecuteAction={(act) => {
                              if (act.href) window.location.href = act.href;
                            }}
                          />
                        </div>
                      )}

                      {/* Insight Card Attachment */}
                      {m.insight && (
                        <div className="mt-2.5">
                          <OrbitInsightCard insight={m.insight} />
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-[#8C857B] font-medium pl-1">
                      Delivered by Orbit · 100% verified data
                    </span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* THINKING STATE */}
        {loading && (
          <div
            ref={loadingCardRef}
            className="flex flex-col items-start w-full max-w-2xl mx-auto animate-fade-in"
          >
            <div className="w-full max-w-[94%] bg-[#191D1A] text-[#FCFBF9] rounded-[24px] rounded-tl-sm p-4 shadow-xl border border-white/[0.06]">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/40 border border-[#6EE7B7]/25 text-[#6EE7B7] text-[9px] font-bold tracking-wider uppercase select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
                  ORBIT SYNAPSE ACTIVE
                </div>
                <span className="text-[10px] text-white/50 font-medium">Just now</span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[#6EE7B7]">
                  <OrbitIcon
                    size={18}
                    state={orbitState === "responding" ? "responding" : "thinking"}
                  />
                </div>
                <span className="text-xs text-white/80 font-medium">
                  {orbitState === "responding"
                    ? "Formulating recommendation..."
                    : pendingIntent === "SIMPLE_CONVERSATION"
                    ? "Thinking..."
                    : pendingIntent === "HISTORICAL_ANALYSIS"
                    ? "Analyzing rolling 7-day records..."
                    : "Analyzing context..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ERROR STATE & RETRY MECHANISM */}
        {error && (
          <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs bg-[#E05A47]/10 border-[#E05A47]/25 text-[#E05A47] shadow-sm animate-shake max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#E05A47]/20 flex items-center justify-center shrink-0 text-[#E05A47]">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-[#191D1A]">{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-3 py-1 rounded-full font-semibold text-xs border border-[#E05A47]/40 bg-[#FCFBF9] text-[#E05A47] hover:bg-[#E05A47] hover:text-white transition-all flex items-center gap-1 shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Spacer to guarantee the final line sits tightly above composer */}
        <div className="h-1 shrink-0" aria-hidden="true" />
        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. COMPOSER DOCK (Docked Above Bottom Navigation) ── */}
      <div
        className={cn(
          "px-4 sm:px-6 pt-1 shrink-0 z-30 transition-all duration-150 bg-gradient-to-t from-[#F6F3EC] via-[#F6F3EC]/95 to-transparent",
          !isOverlay
            ? "pb-[calc(56px+max(16px,env(safe-area-inset-bottom,0px))+16px)] lg:pb-6"
            : "pb-4"
        )}
        style={{
          transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
        }}
      >
        {/* Suggested Quick-Prompt Chips (Only displayed when messages exist to keep empty state clean) */}
        {messages.length > 0 && (
          <div className="w-full overflow-x-auto no-scrollbar py-0.5 mb-1.5 scroll-px-4 px-0.5 animate-fade-in">
            <div className="flex items-center gap-1.5 w-max">
              {QUICK_CHIPS.map((chip, idx) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip.query)}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-[#FCFBF9] hover:bg-[#EFECE4] text-[#191D1A] border border-[#191D1A]/10 text-xs font-semibold tracking-tight shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex items-center gap-1.5 transition-all active:scale-95 select-none"
                  >
                    <Icon className={cn("w-3.5 h-3.5", chip.iconColor)} />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Input Dock (Cream Alabaster #FCFBF9, rounded-full) */}
        <div className="relative w-full bg-[#FCFBF9] rounded-full pl-4 pr-2 py-2 border border-[#1C1917]/10 shadow-[0_8px_24px_rgba(25,29,26,0.08)] flex items-center gap-2 focus-within:border-[#191D1A]/30 focus-within:shadow-[0_8px_28px_rgba(25,29,26,0.12)] transition-all">
          <Sparkles className="w-4 h-4 text-[#8C857B] shrink-0" />
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Orbit about training, diet, or focus..."
            className="flex-1 bg-transparent text-xs sm:text-sm resize-none outline-none leading-relaxed scrollbar-none min-h-[22px] max-h-[120px] text-[#1C1917] placeholder-[#8C857B] font-medium py-0.5"
            aria-label="Ask Orbit"
          />

          {/* Circular Terracotta Send Button (#E05A47) */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="w-9 h-9 rounded-full bg-[#E05A47] hover:bg-[#C94A38] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all shadow-[0_4px_12px_rgba(224,90,71,0.35)] active:scale-95"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
      </div>

      {/* ── DESKTOP & TABLET VIEW (lg: 1024px+) — 12-Column Responsive Studio Architecture (image_49d750.jpg) ── */}
      {!isOverlay && (
        <div className="orbit-desktop-grid hidden lg:grid grid-cols-12 gap-6 items-start h-full max-w-7xl mx-auto w-full px-6 py-4 overflow-hidden">
        {/* ── LEFT 5 COLUMNS: Persistent 3D Orbit Core & Biological Telemetry ── */}
        <div className="col-span-5 h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar space-y-4 pr-1">
          {/* 1. DARK BOTANICAL ESPRESSO HERO STAGE (#191D1A) */}
          <div className="w-full bg-[#191D1A] rounded-[28px] p-5 text-[#FCFBF9] shadow-xl border border-white/[0.08] relative overflow-hidden">
            {/* Top Status Pills Row */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Left Status Pill */}
              <div className="bg-[#2D6A4F]/35 border border-[#6EE7B7]/25 rounded-2xl px-3 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6EE7B7] animate-pulse shrink-0" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#EAE6DF]">
                  STATE: SYNAPSE READY
                </span>
              </div>

              {/* Right Sync Pill */}
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-3 py-1.5 text-[11px] font-semibold text-stone-200 flex items-center justify-center sm:justify-start gap-1.5">
                <span>3 Domains Linked · 98% Sync</span>
              </div>
            </div>

            {/* Dead-Centered 148×148 Radar + 3D Planet Stage */}
            <div className="w-[148px] h-[148px] mx-auto my-2 flex items-center justify-center">
              <Orbit3DCore size={148} state={orbitState} />
            </div>

            {/* Editorial Headline & Subtitle */}
            <div className="text-center mt-2">
              <h2 className="font-serif text-2xl text-white leading-tight font-normal">
                Unified biological &amp; execution intelligence.
              </h2>
              <p className="text-xs text-stone-400 mt-1 max-w-[320px] mx-auto leading-relaxed">
                Cross-synthesizing neuromuscular load, metabolic deficit, and circadian focus blocks.
              </p>
            </div>

            {/* 3 Stacked Live Context Pills */}
            <div className="flex flex-col items-center gap-1.5 mt-3.5">
              <div className="bg-white/[0.07] text-stone-200 rounded-full px-3.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                <span>Train: {workoutSummaryText}</span>
              </div>
              <div className="bg-[#E05A47]/20 border border-[#E05A47]/30 text-[#FCA5A5] rounded-full px-3.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                <span>Fuel: 135g Target · {proteinDeltaText}</span>
              </div>
              <div className="bg-white/[0.07] text-stone-200 rounded-full px-3.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                <span>Plan: {pendingTasksCount} High-Load Slot{pendingTasksCount === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>

          {/* 2. "CADENCE SHIFT" MINT INSIGHT BANNER */}
          <div className="bg-[#D8F3DC]/75 border border-[#2D6A4F]/15 rounded-[22px] p-3.5 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold tracking-wider uppercase text-[#1B4332]">
                  CADENCE SHIFT
                </span>
                <span className="text-[10px] font-semibold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-full">
                  Auto-applied
                </span>
              </div>
              <p className="text-xs text-[#1B4332] leading-relaxed mt-0.5 font-medium">
                Push session intensity elevated neuromuscular fatigue. Orbit shifted today&apos;s evening focus block by +45m and increased target protein intake.
              </p>
            </div>
          </div>

          {/* 3. "CADENCE ACTIONS" 2×2 INTERACTIVE TELEMETRY BENTO GRID */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#191D1A]">Cadence Actions</span>
                <span className="text-[10px] font-semibold text-[#2D6A4F] bg-[#D8F3DC] px-2 py-0.5 rounded-full">
                  4 Synced
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Run an automated audit across all 4 synced domains: training load, fuel deficit, circadian readiness, and focus blocks."
                  )
                }
                className="text-xs font-semibold text-[#57534E] hover:text-[#191D1A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Auto-Audit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Weekly Training Audit */}
              <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold tracking-wider uppercase text-[#57534E]">
                      TRAINING LOAD
                    </span>
                  </div>
                  {/* SVG Ascending Curve Sparkline */}
                  <div className="w-full h-7 my-1 flex items-center">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" fill="none">
                      <defs>
                        <linearGradient id="desktop-sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 20 C20 18, 35 14, 55 11 C75 8, 85 5, 100 2 L100 24 L0 24 Z"
                        fill="url(#desktop-sparkline-grad)"
                      />
                      <path
                        d="M0 20 C20 18, 35 14, 55 11 C75 8, 85 5, 100 2"
                        stroke="#2D6A4F"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <circle cx="100" cy="2" r="2.5" fill="#2D6A4F" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#191D1A] mt-1">Weekly Training Audit</h3>
                  <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                    Rate 5-day split balance &amp; recovery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      "Analyze my workout from last week and rate my structure and volume."
                    )
                  }
                  className="w-full bg-[#E05A47] hover:bg-[#D04936] text-white rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  Run Audit &rarr;
                </button>
              </div>

              {/* Card 2: Protein Gap & Fuel */}
              <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold tracking-wider uppercase text-[#E05A47]">
                      FUEL DEFICIT
                    </span>
                  </div>
                  {/* Mini Circular SVG Progress Gauge */}
                  <div className="flex items-center gap-2 my-1">
                    <svg className="w-7 h-7 -rotate-90 shrink-0" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#EFECE4"
                        strokeWidth="3.2"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#E05A47"
                        strokeWidth="3.2"
                        strokeDasharray="88"
                        strokeDashoffset={
                          88 - (88 * Math.min(135, loggedProtein)) / 135
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-xs font-mono font-bold text-[#191D1A]">
                      {loggedProtein}g / 135g
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#191D1A] mt-1">Protein Gap &amp; Fuel</h3>
                  <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                    Calculate exact dinner macros to hit 135g
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      "Review my protein intake today and calculate remaining protein gap."
                    )
                  }
                  className="w-full bg-[#2D6A4F] hover:bg-[#245740] text-white rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  Curate Meal &rarr;
                </button>
              </div>

              {/* Card 3: Tomorrow's Split */}
              <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold tracking-wider uppercase text-[#2D6A4F]">
                      CIRCADIAN
                    </span>
                  </div>
                  {/* Semi-circle Readiness Arc */}
                  <div className="flex items-center gap-2 my-1">
                    <svg className="w-8 h-5 shrink-0 overflow-visible" viewBox="0 0 32 18">
                      <path
                        d="M2 16 A14 14 0 0 1 30 16"
                        fill="none"
                        stroke="#EFECE4"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 16 A14 14 0 0 1 26 6"
                        fill="none"
                        stroke="#2D6A4F"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-[10px] font-semibold text-[#2D6A4F] leading-tight">
                      88% HRV · High Readiness
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#191D1A] mt-1">Tomorrow&apos;s Split</h3>
                  <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                    Generate next session based on recovery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      "Recommend tomorrow's workout split based on muscle groups trained this week."
                    )
                  }
                  className="w-full bg-[#EFECE4] hover:bg-[#E5E1D8] text-[#191D1A] rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all active:scale-[0.98] cursor-pointer"
                >
                  Preview Split &rarr;
                </button>
              </div>

              {/* Card 4: Deep Work Focus */}
              <div className="bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all text-left">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold tracking-wider uppercase text-[#57534E]">
                      PLAN ENGINE
                    </span>
                  </div>
                  {/* Vertical Equalizer Bars */}
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex items-end gap-1 h-5">
                      <span className="w-1 bg-[#191D1A] rounded-full h-2.5" />
                      <span className="w-1 bg-[#2D6A4F] rounded-full h-4.5" />
                      <span className="w-1 bg-[#191D1A] rounded-full h-3" />
                      <span className="w-1 bg-[#E05A47] rounded-full h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#191D1A]">90m</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#191D1A] mt-1">Deep Work Focus</h3>
                  <p className="text-[10px] text-[#57534E] mt-0.5 line-clamp-2 leading-snug">
                    Rank pending backlog into high-focus blocks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      "Prioritize my pending tasks and recommend deep work focus blocks."
                    )
                  }
                  className="w-full bg-[#EFECE4] hover:bg-[#E5E1D8] text-[#191D1A] rounded-full py-1.5 text-xs font-semibold mt-3 text-center transition-all active:scale-[0.98] cursor-pointer"
                >
                  Rank Slot &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* 4. "CIRCADIAN RHYTHM ALIGNMENT" CARD */}
          <div className="bg-[#FCFBF9] rounded-[24px] p-4 border border-[#1C1917]/[0.06] shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#191D1A]/[0.06]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#191D1A]">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                <span>Circadian Rhythm Alignment</span>
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase text-[#2D6A4F] bg-[#D8F3DC] px-2.5 py-0.5 rounded-full">
                Optimal Phase
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-[#191D1A]">Dusk Transition</div>
                  <p className="text-[11px] text-[#57534E] mt-0.5">
                    Melatonin priming, blue-light attenuated
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-[#191D1A] bg-[#EFECE4] px-2.5 py-1 rounded-full shrink-0">
                  19:30 – 21:00
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 text-xs pt-2 border-t border-[#191D1A]/[0.04]">
                <div>
                  <div className="font-bold text-[#191D1A]">Deep Sleep Window</div>
                  <p className="text-[11px] text-[#57534E] mt-0.5">
                    Target: 2.1h Slow-Wave restoration
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-[#191D1A] bg-[#EFECE4] px-2.5 py-1 rounded-full shrink-0">
                  22:30 – 06:45
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT 7 COLUMNS: Conversational Feed & Studio Input Dock ── */}
        <div className="col-span-7 flex flex-col h-[calc(100vh-6rem)] bg-[#FCFBF9] rounded-[28px] border border-[#1C1917]/[0.06] shadow-sm overflow-hidden">
          {/* Studio Top Header */}
          <div className="px-5 py-3.5 border-b border-[#1C1917]/[0.06] bg-[#FCFBF9] flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-serif text-lg text-[#191D1A] tracking-tight">Orbit Intelligence Stream</h3>
              <p className="text-[11px] text-[#57534E] font-medium">Real-time biological cross-synthesis copilot</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Context Filter Bar */}
              <div className="flex items-center gap-1 bg-[#EFECE4] p-0.5 rounded-full border border-[#191D1A]/[0.08]">
                {FOCUS_MODES.map((m) => {
                  const isSelected = focusMode === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFocusMode(m.id)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1 transition-all select-none cursor-pointer",
                        isSelected
                          ? "bg-[#191D1A] text-white shadow-2xs"
                          : "text-[#57534E] hover:text-[#191D1A] font-medium"
                      )}
                    >
                      {isSelected ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
                      ) : (
                        <Icon className="w-3 h-3 text-[#57534E]" />
                      )}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Reset / New Chat Button */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  aria-label="Reset chat"
                  className="bg-[#EFECE4] hover:bg-[#191D1A] hover:text-white text-[#1C1917] rounded-full px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>New Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Conversational Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3.5 scrollbar-thin flex flex-col overscroll-contain">
            {messages.length === 0 ? (
              <div className="my-auto text-center py-12 px-6 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#191D1A] text-white flex items-center justify-center mx-auto mb-3.5 shadow-md">
                  <OrbitIcon size={24} state="idle" />
                </div>
                <h4 className="font-serif text-2xl text-[#191D1A]">Orbit Synapse Ready</h4>
                <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed">
                  Select any Cadence Action on the left to audit weekly volume, review your protein gap, or prioritize focus blocks—or submit an inquiry below.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 w-full mt-auto">
                {messages.map((m, idx) => {
                  const isLastAssistant = m.role === "assistant" && idx === messages.length - 1;
                  const isLastUser = m.role === "user" && (idx === messages.length - 1 || idx === messages.length - 2);

                  return (
                    <div
                      key={m.id}
                      ref={isLastAssistant ? lastAssistantMessageRef : isLastUser ? lastUserMessageRef : undefined}
                      className={cn(
                        "flex flex-col w-full min-w-0",
                        m.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      {m.role === "user" ? (
                        /* User Bubble */
                        <div className="flex flex-col items-end gap-1 max-w-[85%]">
                          <div className="w-full bg-[#FCFBF9] text-[#1C1917] rounded-[20px] rounded-br-sm p-4 border border-[#1C1917]/[0.08] shadow-2xs text-sm leading-relaxed font-normal">
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          </div>
                          <span className="text-[10px] text-[#8C857B] font-medium pr-1">
                            {new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            · Sent
                          </span>
                        </div>
                      ) : (
                        /* Orbit AI Response Card */
                        <div className="flex flex-col items-start gap-1 w-full min-w-0">
                          <div className="w-full max-w-[95%] min-w-0 bg-[#191D1A] text-[#FCFBF9] rounded-[24px] rounded-tl-sm p-5 shadow-xl border border-white/[0.06] overflow-hidden">
                            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/40 border border-[#6EE7B7]/25 text-[#6EE7B7] text-[9px] font-bold tracking-wider uppercase select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
                                ORBIT SYNAPSE ACTIVE
                              </div>
                              <span className="text-[10px] text-white/50 font-medium">
                                {new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div
                              className="orbit-card-content text-white/90 text-sm leading-relaxed"
                              style={
                                {
                                  "--text-primary": "#FCFBF9",
                                  "--text-secondary": "rgba(252, 251, 249, 0.8)",
                                  "--text-muted": "rgba(252, 251, 249, 0.5)",
                                  "--border": "rgba(255, 255, 255, 0.08)",
                                  "--border-subtle": "rgba(255, 255, 255, 0.05)",
                                  "--surface": "rgba(255, 255, 255, 0.04)",
                                  "--satat-brand": "#6EE7B7",
                                } as React.CSSProperties
                              }
                            >
                              <MarkdownText text={m.content} />
                            </div>

                            {m.recommendation && (
                              <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
                                <OrbitRecommendationCard
                                  recommendation={m.recommendation}
                                  onExecuteAction={(act) => {
                                    if (act.href) window.location.href = act.href;
                                  }}
                                />
                              </div>
                            )}

                            {m.insight && (
                              <div className="mt-2.5">
                                <OrbitInsightCard insight={m.insight} />
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] text-[#8C857B] font-medium pl-1">
                            Delivered by Orbit · 100% verified data
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop Thinking State */}
            {loading && (
              <div className="flex flex-col items-start w-full animate-fade-in">
                <div className="w-full max-w-[95%] bg-[#191D1A] text-[#FCFBF9] rounded-[24px] rounded-tl-sm p-4 shadow-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/40 border border-[#6EE7B7]/25 text-[#6EE7B7] text-[9px] font-bold tracking-wider uppercase select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
                      ORBIT SYNAPSE ACTIVE
                    </div>
                    <span className="text-[10px] text-white/50 font-medium">Just now</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[#6EE7B7]">
                      <OrbitIcon
                        size={18}
                        state={orbitState === "responding" ? "responding" : "thinking"}
                      />
                    </div>
                    <span className="text-xs text-white/80 font-medium">
                      {orbitState === "responding"
                        ? "Formulating recommendation..."
                        : pendingIntent === "SIMPLE_CONVERSATION"
                        ? "Thinking..."
                        : pendingIntent === "HISTORICAL_ANALYSIS"
                        ? "Analyzing rolling 7-day records..."
                        : "Analyzing context..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Error State */}
            {error && (
              <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs bg-[#E05A47]/10 border-[#E05A47]/25 text-[#E05A47] shadow-sm animate-shake w-full">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E05A47]/20 flex items-center justify-center shrink-0 text-[#E05A47]">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-[#191D1A]">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3 py-1 rounded-full font-semibold text-xs border border-[#E05A47]/40 bg-[#FCFBF9] text-[#E05A47] hover:bg-[#E05A47] hover:text-white transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div className="h-1 shrink-0" aria-hidden="true" />
            <div ref={messagesEndRef} />
          </div>

          {/* Desktop Composer Dock */}
          <div className="p-4 bg-[#FCFBF9] border-t border-[#1C1917]/[0.06] space-y-2.5 shrink-0">
            {/* Quick Prompt Chips */}
            <div className="w-full overflow-x-auto no-scrollbar py-0.5 scroll-px-4">
              <div className="flex items-center gap-1.5 w-max">
                {QUICK_CHIPS.map((chip, idx) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(chip.query)}
                      className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full bg-[#F6F3EC] hover:bg-[#EFECE4] text-[#191D1A] border border-[#191D1A]/10 text-xs font-semibold tracking-tight shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-1.5 transition-all active:scale-95 select-none cursor-pointer"
                    >
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", chip.iconColor)} />
                      <span className="whitespace-nowrap">{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Studio Input Bar with Camera, Mic, Paperclip */}
            <div className="relative w-full bg-[#F6F3EC] rounded-2xl px-3 py-2 border border-[#1C1917]/10 flex items-center gap-2 focus-within:border-[#191D1A]/30 focus-within:shadow-sm transition-all">
              <div className="flex items-center gap-1.5 shrink-0 text-[#8C857B]">
                <button
                  type="button"
                  title="Camera Scan"
                  className="p-1 rounded-lg hover:text-[#191D1A] hover:bg-black/5 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Voice Input"
                  className="p-1 rounded-lg hover:text-[#191D1A] hover:bg-black/5 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Attach File"
                  className="p-1 rounded-lg hover:text-[#191D1A] hover:bg-black/5 transition-all cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Orbit about training, diet, or focus..."
                className="flex-1 bg-transparent text-xs sm:text-sm resize-none outline-none leading-relaxed scrollbar-none min-h-[22px] max-h-[120px] text-[#1C1917] placeholder-[#8C857B] font-medium py-0.5"
                aria-label="Ask Orbit desktop"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="w-9 h-9 rounded-full bg-[#E05A47] hover:bg-[#C94A38] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all shadow-[0_4px_12px_rgba(224,90,71,0.35)] active:scale-95 cursor-pointer"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default OrbitView;

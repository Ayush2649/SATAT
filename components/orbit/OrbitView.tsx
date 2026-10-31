"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowUp, RotateCcw, Dumbbell, Utensils, CheckSquare,
  TrendingUp, X, Sparkles, AlertCircle, RefreshCw, Zap, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrbitIcon, type OrbitState } from "@/components/orbit/OrbitMark";
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

const FOCUS_MODES: Array<{ id: OrbitFocusMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "diet", label: "Diet", icon: Utensils },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
];

const SUGGESTIONS = [
  {
    category: "workout" as const,
    icon: Dumbbell,
    label: "Workout Structure",
    query: "Help me structure today's workout based on my recent sessions.",
    sub: "Exercise plan & load distribution",
  },
  {
    category: "nutrition" as const,
    icon: Utensils,
    label: "Nutrition & Protein",
    query: "Review my nutrition today and suggest a high-protein dinner idea.",
    sub: "Macro targets & meal breakdown",
  },
  {
    category: "tasks" as const,
    icon: CheckSquare,
    label: "Deep Work Cadence",
    query: "Help me prioritize my pending tasks and plan deep work.",
    sub: "Task focus & timing flow",
  },
  {
    category: "momentum" as const,
    icon: TrendingUp,
    label: "Consistency Review",
    query: "Give me an honest assessment of my weekly consistency and momentum.",
    sub: "Rolling 7-day adherence check",
  },
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

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastFailedMessageRef = useRef<string | null>(null);

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

  // Greeting based on current hour
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return `Working late, ${firstName}`;
    if (h < 12) return `Good morning, ${firstName}`;
    if (h < 17) return `Good afternoon, ${firstName}`;
    if (h < 21) return `Good evening, ${firstName}`;
    return `Good night, ${firstName}`;
  }, [firstName]);

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

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, loading, scrollToBottom]);

  // Read actual context from orbitContext store
  const liveDiet = getDietContext();
  const liveWorkout = getWorkoutContext();
  const liveTasks = getTaskContext();

  const realMetrics = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];

    if (liveTasks && liveTasks.totalPending > 0) {
      items.push({
        label: "Tasks",
        value: `${liveTasks.totalPending} pending`,
      });
    }

    if (liveDiet && liveDiet.totals && liveDiet.totals.calories > 0) {
      items.push({
        label: "Nutrition",
        value: `${liveDiet.totals.calories} kcal logged`,
      });
    }

    if (liveWorkout && liveWorkout.recentSessions?.length > 0) {
      const todaySession = liveWorkout.recentSessions.find(
        (s) => s.date === new Date().toISOString().split("T")[0]
      );
      if (todaySession) {
        items.push({
          label: "Training",
          value: `${todaySession.durationMinutes || 45}m completed`,
        });
      }
    }

    return items;
  }, [liveDiet, liveWorkout, liveTasks]);

  // Send message
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || loading) return;

      setError(null);
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

  // Clear conversation
  const handleReset = () => {
    lastFailedMessageRef.current = null;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setMessages([]);
    setError(null);
    setOrbitState("idle");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

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
        "orbit-view-root flex flex-col h-full w-full max-w-4xl mx-auto select-none bg-[#F6F3EC] overflow-hidden min-w-0 relative",
        className
      )}
    >
      {/* ── 1. ORBIT EDITORIAL HEADER ── */}
      <header
        className={cn(
          "px-4 sm:px-6 pt-3 pb-3 shrink-0 border-b border-[#191D1A]/[0.06] bg-[#F6F3EC] z-20 transition-all",
          !isOverlay ? "lg:pt-5" : "pt-3"
        )}
      >
        {/* App Bar Top Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand Wordmark with Sanskrit Halant */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#191D1A] text-[#F6F3EC] flex items-center justify-center font-bold text-[11px] shadow-sm select-none">
              स
            </div>
            <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#57534E]">
              SATAT <span className="text-[#8C857B] font-normal">/</span> ORBIT
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Live AI Active Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FCFBF9] border border-[#191D1A]/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] select-none">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  orbitState === "error"
                    ? "bg-[#E05A47]"
                    : orbitState === "thinking" || orbitState === "responding"
                    ? "bg-[#2D6A4F] animate-pulse"
                    : "bg-[#2D6A4F]"
                )}
              />
              <span className="text-[11px] font-bold text-[#2D6A4F] tracking-wide uppercase">
                {orbitState === "thinking"
                  ? "Analyzing..."
                  : orbitState === "responding"
                  ? "Responding..."
                  : orbitState === "error"
                  ? "Offline"
                  : "AI Active"}
              </span>
            </div>

            {/* Clear conversation button */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-full text-xs font-medium text-[#57534E] hover:text-[#191D1A] hover:bg-[#EFECE4] transition-all flex items-center gap-1 border border-[#191D1A]/[0.08]"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            {!isOverlay && <NotificationBell />}

            {isOverlay && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[#57534E] hover:text-[#191D1A] hover:bg-[#EFECE4] transition-all"
                aria-label="Close Orbit"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title Row */}
        <div className="mt-2.5">
          <h1 className="font-serif text-[24px] sm:text-[28px] font-normal leading-[1.08] text-[#191D1A] tracking-[-0.02em]">
            Orbit Intelligence
          </h1>
          <p className="text-xs text-[#57534E] font-medium tracking-normal mt-0.5">
            Unified biological &amp; execution copilot.
          </p>
        </div>

        {/* Active Context Filter Bar (Horizontal Pill Row) */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 px-0.5 overflow-x-auto no-scrollbar py-0.5">
          {FOCUS_MODES.map((m) => {
            const isSelected = focusMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setFocusMode(m.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-all select-none",
                  isSelected
                    ? "bg-[#191D1A] text-white shadow-2xs"
                    : "bg-[#EFECE4] text-[#57534E] hover:text-[#1C1917] hover:bg-[#E5E1D8] font-medium"
                )}
              >
                {isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-[#57534E]" />
                )}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── 2. CONVERSATION VIEWPORT / MESSAGES SCROLL AREA ── */}
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 space-y-4 scrollbar-none bg-[#F6F3EC]">
        {/* EMPTY STATE */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-6 sm:py-10 max-w-lg mx-auto animate-fade-in">
            {/* Ambient Orbit Icon badge */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-[#191D1A]/10 bg-[#FCFBF9] text-[#191D1A] shadow-sm transition-transform hover:scale-105"
            >
              <OrbitIcon size={36} state={orbitState} />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#191D1A] tracking-tight">
              {greeting}
            </h2>

            <p className="text-xs sm:text-sm mt-2 leading-relaxed text-[#57534E] max-w-md">
              I&apos;m Orbit — your personal AI companion in SATAT. I understand your workouts,
              meals, tasks, and daily momentum.
            </p>

            {/* Real User Context Card (Never fabricated) */}
            {realMetrics.length > 0 ? (
              <div className="mt-5 p-3.5 rounded-2xl border border-[#191D1A]/[0.08] bg-[#FCFBF9] shadow-2xs w-full text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                    Today&apos;s Active Context
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {realMetrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border border-[#191D1A]/[0.08] bg-[#EFECE4] text-[#191D1A] flex items-center gap-1.5"
                    >
                      <span className="text-[#57534E] text-[10px] uppercase font-bold">{m.label}:</span>
                      <span>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs mt-3 text-[#8C857B]">
                Tell me what you&apos;re working on today and I&apos;ll help you organize the next step.
              </p>
            )}

            {/* Focus Area Capability Cards (Zero Emojis — Vector Icons Only) */}
            <div className="mt-6 w-full space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider block px-1 text-[#8C857B]">
                Start with a focus area
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTIONS.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(s.query)}
                      className="p-3.5 rounded-2xl border border-[#191D1A]/[0.08] bg-[#FCFBF9] hover:bg-[#F2EFE8] text-left transition-all active:scale-[0.98] group flex items-start gap-3 shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#EFECE4] text-[#191D1A] border border-[#191D1A]/[0.06] group-hover:bg-[#191D1A] group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold block text-[#191D1A] group-hover:text-[#2D6A4F] transition-colors">
                          {s.label}
                        </span>
                        <span className="text-[11px] block mt-0.5 text-[#57534E] line-clamp-1">
                          {s.sub}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MESSAGE HISTORY */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex flex-col w-full min-w-0", m.role === "user" ? "items-end" : "items-start")}
          >
            {m.role === "user" ? (
              /* User Bubble: Right-aligned Pure Cream Alabaster (#FCFBF9) */
              <div className="flex flex-col items-end gap-1 max-w-[85%]">
                <div className="w-full bg-[#FCFBF9] text-[#1C1917] rounded-[20px] rounded-br-sm p-3.5 border border-[#1C1917]/[0.06] shadow-2xs text-sm leading-relaxed font-normal">
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
                <span className="text-[10px] text-[#8C857B] font-medium pr-1">
                  {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · Sent
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
                      {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Markdown & Table Rendering */}
                  <div
                    className="orbit-card-content text-white/90 text-sm leading-relaxed"
                    style={{
                      "--text-primary": "#FCFBF9",
                      "--text-secondary": "rgba(252, 251, 249, 0.8)",
                      "--text-muted": "rgba(252, 251, 249, 0.5)",
                      "--border": "rgba(255, 255, 255, 0.08)",
                      "--border-subtle": "rgba(255, 255, 255, 0.05)",
                      "--surface": "rgba(255, 255, 255, 0.04)",
                      "--satat-brand": "#6EE7B7",
                    } as React.CSSProperties}
                  >
                    <MarkdownText text={m.content} />
                  </div>

                  {/* Future-Ready Recommendation Card Attachment */}
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

                  {/* Future-Ready Insight Card Attachment */}
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
        ))}

        {/* THINKING STATE */}
        {loading && (
          <div className="flex flex-col items-start w-full animate-fade-in">
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
                  <OrbitIcon size={18} state={orbitState === "responding" ? "responding" : "thinking"} />
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

        {/* ERROR STATE */}
        {error && (
          <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs bg-[#E05A47]/10 border-[#E05A47]/25 text-[#E05A47] shadow-sm animate-shake">
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

        {/* Spacer to guarantee the final line is never obscured by composer */}
        <div className="h-4 shrink-0" aria-hidden="true" />
        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. COMPOSER DOCK (Docked Above Bottom Navigation) ── */}
      <div
        className={cn(
          "px-4 sm:px-6 pt-2 shrink-0 z-30 transition-all duration-150 bg-gradient-to-t from-[#F6F3EC] via-[#F6F3EC]/95 to-transparent",
          !isOverlay
            ? "pb-[calc(56px+max(16px,env(safe-area-inset-bottom,0px))+16px)] lg:pb-6"
            : "pb-4"
        )}
        style={{
          transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
        }}
      >
        {/* Suggested Quick-Prompt Chips (Zero Emojis — Vector Icons Only) */}
        <div className="w-full overflow-x-auto no-scrollbar py-1 mb-2 scroll-px-4 px-0.5">
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
  );
}

export default OrbitView;

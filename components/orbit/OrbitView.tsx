"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserKey } from "@/lib/auth/userKey";
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
  Activity,
  Camera,
  Mic,
  Paperclip,
  Plus,
} from "lucide-react";
import { cn, todayString } from "@/lib/utils";
import { OrbitIcon, type OrbitState } from "@/components/orbit/OrbitMark";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";
import NotificationBell from "@/components/ui/NotificationBell";
import Logo from "@/components/ui/Logo";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { OrbitRecommendationCard, OrbitInsightCard } from "@/components/orbit/OrbitActionCard";
import { getDietContext, getWorkoutContext, getTaskContext } from "@/lib/orbitContext";
import type {
  OrbitMessage,
  OrbitFocusMode,
  OrbitEntityContext,
  OrbitActionExecuted,
} from "@/types/orbit";
import { classifyOrbitIntent, type OrbitIntent } from "@/lib/orbit/intentClassifier";
import { measureOrbitViewport, ORBIT_KEYBOARD_THRESHOLD } from "@/lib/orbit/viewport";

interface OrbitViewProps {
  isOverlay?: boolean;
  isOpen?: boolean;
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

export function OrbitView({ isOverlay = false, isOpen = true, onClose, className }: OrbitViewProps) {
  const { data: session } = useSession();
  const userId = getUserKey(session);
  const storageKey = userId ? `${STORAGE_KEY}:${encodeURIComponent(userId)}` : null;
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<OrbitMessage[]>([]);
  const [activeContext, setActiveContext] = useState<OrbitEntityContext>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusMode, setFocusMode] = useState<OrbitFocusMode>("all");
  const [error, setError] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [iosViewport, setIosViewport] = useState<{ top: number; height: number } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [orbitState, setOrbitState] = useState<OrbitState>("idle");
  const [pendingIntent, setPendingIntent] = useState<OrbitIntent>("GENERAL_COACHING");

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantMessageRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const loadingCardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialHeightRef = useRef<number>(typeof window !== "undefined" ? window.innerHeight : 0);
  const lastWidthRef = useRef<number>(typeof window !== "undefined" ? window.innerWidth : 0);
  const lastFailedMessageRef = useRef<string | null>(null);
  const prevLoadingRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);
  const wasOpenRef = useRef(isOpen);

  // Clean up any pending state transition timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-keyboard-open");
        document.body.removeAttribute("data-keyboard-open");
      }
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const scrollContainer = (
      container: HTMLDivElement | null,
      anchor: HTMLDivElement | null
    ) => {
      if (container) {
        if (typeof container.scrollTo === "function") {
          try {
            container.scrollTo({ top: container.scrollHeight, behavior });
            return;
          } catch {
            // Fall through to scrollTop / scrollIntoView
          }
        }
        container.scrollTop = container.scrollHeight;
        return;
      }
      if (anchor && typeof anchor.scrollIntoView === "function") {
        anchor.scrollIntoView({ behavior, block: "end" });
      }
    };

    scrollContainer(scrollContainerRef.current, messagesEndRef.current);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  const handleInputBlur = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }
    blurTimerRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        if (!inputRef.current || document.activeElement !== inputRef.current) {
          const stillResized = (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches) && !!window.visualViewport &&
            measureOrbitViewport({ baselineHeight: initialHeightRef.current, visualHeight: window.visualViewport.height, scale: window.visualViewport.scale }).keyboardOpen;
          setIsKeyboardActive(stillResized);
          if (!stillResized) {
            document.documentElement.removeAttribute("data-keyboard-open");
            document.body.removeAttribute("data-keyboard-open");
          }
          window.dispatchEvent(
            new CustomEvent("satat:keyboard-state", {
              detail: { open: stillResized, isOpen: stillResized },
            })
          );
        }
      }
    }, 120);
  }, []);

  // Handle mobile virtual keyboard dynamic resizing & bottom capsule dock coordination
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;

    initialHeightRef.current = window.innerHeight;
    lastWidthRef.current = window.innerWidth;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    let wasKeyboardOpen = false;
    let viewportFrame = 0;

    const handleViewportChange = () => {
      // WebKit may briefly report a zero viewport during rotation.
      if (!Number.isFinite(vv.height) || vv.height <= 0) return;
      const isMobile = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;

      if (!isMobile) {
        setViewportHeight(null);
        setIosViewport(null);
        setKeyboardOffset(0);
        setIsKeyboardActive(false);
        document.documentElement.removeAttribute("data-keyboard-open");
        document.body.removeAttribute("data-keyboard-open");
        return;
      }

      // Update baseline on orientation change (width change)
      if (window.innerWidth !== lastWidthRef.current) {
        lastWidthRef.current = window.innerWidth;
        initialHeightRef.current = window.innerHeight;
      }

      const headerHeight = window.innerWidth >= 768 && !isOverlay
        ? document.querySelector<HTMLElement>("[data-app-command-bar]")?.getBoundingClientRect().height ?? 64
        : 0;
      const { availableHeight, keyboardOpen, keyboardOffset: offset } = measureOrbitViewport({
        baselineHeight: initialHeightRef.current, visualHeight: vv.height, headerHeight, scale: vv.scale,
      });
      setKeyboardOffset(offset);
      setIsKeyboardActive(keyboardOpen);
      setViewportHeight(availableHeight);
      if (isIOS && !isOverlay && isOpen) {
        // WebKit can scroll both the page and overflow-hidden ancestors while
        // revealing a focused input. Keep only the message list scrollable.
        if (keyboardOpen || wasKeyboardOpen) {
          let ancestor = rootRef.current?.parentElement;
          while (ancestor && ancestor !== document.body) {
            if (ancestor.scrollTop) ancestor.scrollTop = 0;
            ancestor = ancestor.parentElement;
          }
          if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
        }
        setIosViewport({ top: vv.offsetTop + headerHeight, height: availableHeight });
      } else {
        setIosViewport(null);
      }
      wasKeyboardOpen = keyboardOpen;

      if (keyboardOpen) {
        document.documentElement.setAttribute("data-keyboard-open", "true");
        document.body.setAttribute("data-keyboard-open", "true");
      } else {
        document.documentElement.removeAttribute("data-keyboard-open");
        document.body.removeAttribute("data-keyboard-open");
      }

      window.dispatchEvent(
        new CustomEvent("satat:keyboard-state", {
          detail: { open: keyboardOpen, isOpen: keyboardOpen },
        })
      );

      if (keyboardOpen) {
        setTimeout(() => {
          scrollToBottom("auto");
        }, 60);
      }
    };

    const scheduleViewportChange = () => {
      cancelAnimationFrame(viewportFrame);
      viewportFrame = requestAnimationFrame(handleViewportChange);
    };
    vv.addEventListener("resize", scheduleViewportChange);
    vv.addEventListener("scroll", scheduleViewportChange);
    window.addEventListener("resize", scheduleViewportChange);
    window.addEventListener("scroll", scheduleViewportChange);
    handleViewportChange();

    return () => {
      cancelAnimationFrame(viewportFrame);
      vv.removeEventListener("resize", scheduleViewportChange);
      vv.removeEventListener("scroll", scheduleViewportChange);
      window.removeEventListener("resize", scheduleViewportChange);
      window.removeEventListener("scroll", scheduleViewportChange);
    };
  }, [isOpen, isOverlay, scrollToBottom]);

  // Load in-session history & jump to latest message on initial open
  useEffect(() => {
    try {
      requestRef.current?.abort();
      requestRef.current = null;
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      setLoading(false); setInput(""); setError(null); setOrbitState("idle"); setFocusMode("all");
      lastFailedMessageRef.current = null;
      setMessages([]);
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      const saved = storageKey ? sessionStorage.getItem(storageKey) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setTimeout(() => {
            scrollToBottom("auto");
          }, 50);
        }
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [scrollToBottom, storageKey]);

  // Save history
  const persistMessages = useCallback(
    (msgs: OrbitMessage[]) => {
      try {
        if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(msgs));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  // Scroll to bottom when overlay re-opens
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (justOpened && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom("auto");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, scrollToBottom]);

  // Auto-scroll to latest message whenever messages or loading indicator updates
  useEffect(() => {
    if (messages.length === 0 && !loading) {
      prevMessagesLengthRef.current = 0;
      prevLoadingRef.current = loading;
      return;
    }

    const hadMessages = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    prevLoadingRef.current = loading;

    const behavior: ScrollBehavior = hadMessages === 0 && !loading ? "auto" : "smooth";
    const timer = setTimeout(() => {
      scrollToBottom(behavior);
    }, 50);

    return () => clearTimeout(timer);
  }, [messages, loading, scrollToBottom]);

  const dispatchMutationRefreshEvents = useCallback((data: any) => {
    if (typeof window === "undefined" || !data) return;

    const executedList: OrbitActionExecuted[] = Array.isArray(data.actions_executed)
      ? data.actions_executed
      : Array.isArray(data.action_executed)
      ? data.action_executed
      : data.action_executed
      ? [data.action_executed]
      : [];

    for (const act of executedList) {
      if (!act || act.status !== "success") continue;
      const domain =
        act.domain ||
        (act.type === "UPSERT_MEAL" || act.type === "MODIFY_MEAL" || act.type === "DELETE_MEAL"
          ? "meals"
          : act.type === "START_WORKOUT" ||
            act.type === "UPDATE_WORKOUT" ||
            act.type === "UPDATE_WORKOUT_SET" ||
            act.type === "ADD_EXERCISE" ||
            act.type === "DELETE_EXERCISE" ||
            act.type === "COMPLETE_WORKOUT"
          ? "workouts"
          : act.type === "LOG_RITUAL"
          ? "rituals"
          : act.type === "UPDATE_SPRINT_PROGRESS"
          ? "sprints"
          : "tasks");

      window.dispatchEvent(
        new CustomEvent("satat:data-refresh", {
          detail: {
            domain,
            type: act.type,
            details: act.details,
          },
        })
      );
    }
  }, []);

  // Send message
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || loading || !userId) return;

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

      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const dietContext = getDietContext();
        const workoutContext = getWorkoutContext();
        const taskContext = getTaskContext();

        const payloadMessages = nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/aria", {
          signal: controller.signal,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            mode: focusMode === "all" ? null : focusMode,
            clientDate: todayString(),
            activeContext,
            dietContext,
            workoutContext,
            taskContext,
          }),
        });

        if (!res.ok) {
          throw new Error(`Orbit response error (${res.status})`);
        }

        const data = await res.json();
        if (controller.signal.aborted) return;

        if (data.activeContext) {
          setActiveContext((prev) => ({ ...prev, ...data.activeContext }));
        }

        dispatchMutationRefreshEvents(data);

        const assistantMsg: OrbitMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply || data.message || "I encountered an issue processing your request.",
          action_executed: data.action_executed ?? null,
          suggested_actions: data.suggested_actions ?? [],
          activeContext: data.activeContext,
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
        if (controller.signal.aborted || err?.name === "AbortError") return;
        setError("Orbit couldn't connect right now. Please try again.");
        setOrbitState("error");
      } finally {
        if (requestRef.current === controller) setLoading(false);
      }
    },
    [
      input,
      loading,
      messages,
      focusMode,
      userId,
      persistMessages,
      activeContext,
      dispatchMutationRefreshEvents,
    ]
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

    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const dietContext = getDietContext();
      const workoutContext = getWorkoutContext();
      const taskContext = getTaskContext();

        const res = await fetch("/api/aria", {
          signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          mode: focusMode === "all" ? null : focusMode,
          clientDate: todayString(),
          activeContext,
          dietContext,
          workoutContext,
          taskContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Orbit response error (${res.status})`);
      }

      const data = await res.json();
      if (controller.signal.aborted) return;

      if (data.activeContext) {
        setActiveContext((prev) => ({ ...prev, ...data.activeContext }));
      }

      dispatchMutationRefreshEvents(data);

      const assistantMsg: OrbitMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || data.message || "I encountered an issue processing your request.",
        action_executed: data.action_executed ?? null,
        suggested_actions: data.suggested_actions ?? [],
        activeContext: data.activeContext,
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
      if (controller.signal.aborted || err?.name === "AbortError") return;
      setError("Orbit couldn't connect right now. Please try again.");
      setOrbitState("error");
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, [loading, messages, focusMode, persistMessages, activeContext, dispatchMutationRefreshEvents]);

  // Clear conversation / Reset chat
  const handleReset = () => {
    requestRef.current?.abort();
    setLoading(false);
    lastFailedMessageRef.current = null;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setMessages([]);
    setError(null);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setOrbitState("idle");
    try {
      if (storageKey) sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };
  const handleResetChat = handleReset;
  const resetRef = useRef(handleReset);
  resetRef.current = handleReset;
  useEffect(() => {
    const reset = () => resetRef.current();
    window.addEventListener("satat:reset-orbit", reset);
    return () => {
      window.removeEventListener("satat:reset-orbit", reset);
      requestRef.current?.abort();
    };
  }, []);
  const query = searchParams?.get("q") || "";
  useEffect(() => {
    if (query) {
      setInput(query);
      inputRef.current?.focus();
    }
  }, [query]);

  // Keyboard Enter handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
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

  const hasConversation = messages.length > 0 || loading || !!error;

  return (
    <div
      ref={rootRef}
      className={cn("orbit-view-root orbit-chat flex flex-col h-full w-full max-w-none min-w-0 min-h-0 overflow-hidden relative", className)}
      data-empty={!hasConversation}
      data-keyboard-open={isKeyboardActive || keyboardOffset > 0}
      data-short={viewportHeight !== null && viewportHeight < 400}
      data-overlay={isOverlay}
      style={{
        "--orbit-visible-height": viewportHeight === null ? "100dvh" : `${viewportHeight}px`,
        "--orbit-keyboard-overlap": `${Math.max(0, keyboardOffset - ORBIT_KEYBOARD_THRESHOLD)}px`,
        ...(iosViewport
          ? { position: "fixed", top: iosViewport.top, left: "var(--orbit-shell-inset)", width: "calc(100% - var(--orbit-shell-inset))", height: iosViewport.height, maxHeight: iosViewport.height }
          : viewportHeight ? { height: viewportHeight, maxHeight: viewportHeight } : {}),
      } as React.CSSProperties & Record<"--orbit-visible-height" | "--orbit-keyboard-overlap", string>}
    >
      <h1 className="sr-only">Orbit</h1>
      {/* One compact breadcrumb header on phones; the shared app header handles larger screens. */}
      <header className={cn("orbit-chat-header", !isOverlay && "md:hidden")} aria-label="Orbit header">
        <div className="flex items-center gap-2 min-w-0">
          <Logo size={22} className="shrink-0" priority />
          <span className="text-sm whitespace-nowrap"><strong>SATAT</strong><span className="mx-1.5 opacity-50">/</span>Orbit</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={handleResetChat} aria-label="Reset chat" title="New Chat" className="orbit-chat-icon-button">
            <RotateCcw className="w-4 h-4" /><span className="sr-only">New Chat</span>
          </button>
          <NotificationBell />
          <span className="orbit-chat-avatar" aria-label={session?.user?.name || "Account"}>
            {session?.user?.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
            ) : (session?.user?.name?.charAt(0).toUpperCase() || "A")}
          </span>
          {isOverlay && onClose && <button type="button" onClick={onClose} aria-label="Close Orbit" className="orbit-chat-icon-button"><X className="w-4 h-4" /></button>}
        </div>
      </header>

      <div className="orbit-chat-workspace">
        {!hasConversation ? (
          <div className="orbit-chat-start">
            <div className="orbit-chat-start-inner">
              <div className="orbit-chat-welcome" aria-label="Orbit companion">
                <Orbit3DCore size={184} state={orbitState} />
              </div>
              <div className="orbit-chat-suggestions" aria-label="Suggested questions">
                {QUICK_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  return <button key={chip.label} type="button" disabled={loading} onClick={() => handleSend(chip.query)} className="orbit-chat-suggestion">
                    <Icon className="w-4 h-4 shrink-0" /><span>{chip.label}</span>
                  </button>;
                })}
              </div>
            </div>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="orbit-chat-messages" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" aria-busy={loading}>
            <div className="orbit-chat-transcript">
              {messages.map((m, idx) => {
                const isLastAssistant = m.role === "assistant" && idx === messages.length - 1;
                const isLastUser = m.role === "user" && (idx === messages.length - 1 || idx === messages.length - 2);
                return (
                  <article key={m.id} ref={isLastAssistant ? lastAssistantMessageRef : isLastUser ? lastUserMessageRef : undefined}
                    className={cn("orbit-chat-message", m.role === "user" ? "orbit-chat-message--user" : "orbit-chat-message--assistant")}
                    aria-label={m.role === "user" ? "You" : "Orbit"}>
                    {m.role === "user" ? <p className="orbit-chat-user-text">{m.content}</p> : <>
                      <div className="orbit-chat-response"><MarkdownText text={m.content} /></div>
                      {m.recommendation && <OrbitRecommendationCard recommendation={m.recommendation} onExecuteAction={(act) => { if (act.href) window.location.href = act.href; }} />}
                      {m.insight && <OrbitInsightCard insight={m.insight} />}
                      {m.suggested_actions && m.suggested_actions.length > 0 && isLastAssistant && (
                        <div className="orbit-chat-followups">{m.suggested_actions.map((act, index) => (
                          <button key={index} type="button" disabled={loading} onClick={() => handleSend(act.prompt)} className="orbit-chat-suggestion">{act.label}</button>
                        ))}</div>
                      )}
                    </>}
                  </article>
                );
              })}
              {loading && <div ref={loadingCardRef} className="orbit-chat-thinking" role="status">
                <OrbitIcon size={28} state={orbitState === "responding" ? "responding" : "thinking"} />
                <span>{pendingIntent === "HISTORICAL_ANALYSIS" ? "Reviewing your recent activity…" : "Thinking…"}</span>
              </div>}
              {error && <div className="orbit-chat-error" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
                <button type="button" onClick={handleRetry} disabled={loading} className="orbit-chat-suggestion"><RefreshCw className="w-3.5 h-3.5" />Retry</button>
              </div>}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <section className="orbit-chat-composer" aria-label="Message composer">
          <form className="orbit-chat-input-shell" onSubmit={(event) => { event.preventDefault(); handleSend(); }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Ask Orbit about training, diet, or focus..."
              aria-label={isDesktop ? "Ask Orbit desktop" : "Ask Orbit"}
              className="orbit-chat-input"
            />
            <div className="orbit-chat-input-actions">
              <details className="orbit-chat-tools">
                <summary className="orbit-chat-icon-button" aria-label="Chat options" title="Chat options"><Plus className="w-5 h-5" /></summary>
                <div className="orbit-chat-tools-menu">
                  <label className="orbit-chat-context-label">Context
                    <select aria-label="Conversation context" value={focusMode} onChange={(event) => setFocusMode(event.target.value as OrbitFocusMode)}>
                      {FOCUS_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
                    </select>
                  </label>
                  <button type="button" onClick={() => router.push("/dashboard/diet?action=scan")}><Camera className="w-4 h-4" />Camera Scan</button>
                  <button type="button" onClick={() => router.push("/dashboard/diet?action=voice")}><Mic className="w-4 h-4" />Voice Input</button>
                  <button type="button" disabled aria-label="File attachments are not available; use Camera Scan for meal photos"><Paperclip className="w-4 h-4" />Attach file</button>
                </div>
              </details>
              <button type="submit" disabled={!input.trim() || loading} aria-label="Send message" className="orbit-chat-send"><ArrowUp className="w-5 h-5" /></button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default OrbitView;

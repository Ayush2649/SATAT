"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import {
  Plus,
  FolderOpen,
  Trash2,
  CheckCircle2,
  Circle,
  Palette,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CalendarClock,
  History,
  Edit2,
  Flag,
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
} from "lucide-react";
import { cn, PROJECT_COLORS, todayString, localDateString } from "@/lib/utils";
import {
  getTasks,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjects,
  createProject,
  ensureStarterProject,
} from "@/lib/firestore";
import { useToast } from "@/components/ui/Toast";
import { setTaskContext, computeTaskContext } from "@/lib/orbitContext";
import { PlanPageSkeleton } from "@/components/ui/PageSkeletons";
import type { Task, Project, TaskPriority } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "schedule" | "history";

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; textClass: string; bgClass: string; energyLabel: string }
> = {
  high: {
    label: "High",
    textClass: "text-[#C94A38]",
    bgClass: "bg-rose-50 border border-rose-200/60",
    energyLabel: "High · Deep Focus",
  },
  medium: {
    label: "Medium",
    textClass: "text-amber-800",
    bgClass: "bg-amber-50 border border-amber-200/60",
    energyLabel: "Medium · Execution",
  },
  low: {
    label: "Low",
    textClass: "text-emerald-800",
    bgClass: "bg-emerald-50 border border-emerald-200/60",
    energyLabel: "Low · Admin",
  },
};

const DEFAULT_RITUALS = [
  { id: "deep_work", label: "Deep Work 90m", icon: "🧠" },
  { id: "creatine_hydration", label: "3g Creatine & Hydration", icon: "💧" },
  { id: "steps_zone2", label: "10k Steps / Zone 2", icon: "👟" },
  { id: "evening_winddown", label: "Evening Plan & Wind-Down", icon: "🌙" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekDates(anchor: string): string[] {
  const d = new Date(anchor + "T00:00:00");
  const day = d.getDay(); // 0 = Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return localDateString(dd);
  });
}

function weekLabel(weekDates: string[]): string {
  const first = new Date(weekDates[0] + "T00:00:00");
  const last = new Date(weekDates[6] + "T00:00:00");
  const fm = first.toLocaleDateString("en-IN", { month: "short" });
  const lm = last.toLocaleDateString("en-IN", { month: "short" });
  const y = first.getFullYear();
  return fm === lm ? `${fm} ${y}` : `${fm} – ${lm} ${y}`;
}

function shortDay(dateStr: string): number {
  return parseInt(dateStr.split("-")[2], 10);
}

function formatDateLabel(dateStr: string): string {
  const today = todayString();
  const d = new Date();
  const tomorrow = new Date(d);
  tomorrow.setDate(d.getDate() + 1);
  const yesterday = new Date(d);
  yesterday.setDate(d.getDate() - 1);
  if (dateStr === today) return "Today";
  if (dateStr === localDateString(tomorrow)) return "Tomorrow";
  if (dateStr === localDateString(yesterday)) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatGroupDate(dateStr: string): string {
  const today = todayString();
  const d = new Date();
  const yesterday = new Date(d);
  yesterday.setDate(d.getDate() - 1);
  if (dateStr === today) return "Today";
  if (dateStr === localDateString(yesterday)) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ts: number): string {
  return new Date(ts)
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function formatFocusTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function groupByCompletionDate(tasks: Task[]): [string, Task[]][] {
  const map: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    if (!t.completedAt) return;
    const date = localDateString(new Date(t.completedAt));
    if (!map[date]) map[date] = [];
    map[date].push(t);
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => [
      date,
      list.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    ]);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TaskBoard() {
  const { data: session } = useSession();
  const { firebaseUser, isReady } = useFirebaseAuth();
  const userId =
    firebaseUser?.uid ?? (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();
  const today = todayString();

  // ── State ──
  const [view, setView] = useState<ViewMode>("schedule");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekAnchor, setWeekAnchor] = useState(today);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // ── Feature A: Daily Non-Negotiable Rituals State ──
  const [rituals, setRituals] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`satat_rituals_${selectedDate}`);
      if (stored) {
        setRituals(JSON.parse(stored));
      } else {
        setRituals({});
      }
    } catch {
      setRituals({});
    }
  }, [selectedDate]);

  const toggleRitual = (ritualId: string) => {
    setRituals((prev) => {
      const updated = { ...prev, [ritualId]: !prev[ritualId] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`satat_rituals_${selectedDate}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const ritualCompletedCount = Object.values(rituals).filter(Boolean).length;

  // ── Feature B: Built-in Live Deep Focus Timer State (25m Pomodoro) ──
  const [focusSession, setFocusSession] = useState<{
    taskTitle: string;
    taskId: string | null;
    secondsLeft: number;
    isRunning: boolean;
  }>({
    taskTitle: "",
    taskId: null,
    secondsLeft: 25 * 60,
    isRunning: false,
  });

  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (focusSession.isRunning) {
      focusTimerRef.current = setInterval(() => {
        setFocusSession((prev) => {
          if (prev.secondsLeft <= 1) {
            toast("Focus block completed! Outstanding momentum 🎉", "success");
            return { ...prev, secondsLeft: 0, isRunning: false };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    } else if (focusTimerRef.current) {
      clearInterval(focusTimerRef.current);
    }
    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    };
  }, [focusSession.isRunning, toast]);

  const startFocusOnTask = (task: Task) => {
    setFocusSession({
      taskTitle: task.title,
      taskId: task.id,
      secondsLeft: 25 * 60,
      isRunning: true,
    });
    toast(`Deep focus locked: "${task.title}"`, "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFocusTimer = () => {
    setFocusSession((prev) => ({
      ...prev,
      taskTitle: prev.taskTitle || "Daily Execution Session",
      isRunning: !prev.isRunning,
    }));
  };

  const resetFocusTimer = () => {
    setFocusSession((prev) => ({
      ...prev,
      secondsLeft: 25 * 60,
      isRunning: false,
    }));
  };

  const completeFocusSession = async () => {
    if (focusSession.taskId) {
      const target = tasks.find((t) => t.id === focusSession.taskId);
      if (target && target.status === "pending") {
        await handleToggleTask(target);
      }
    } else {
      toast("Deep work session marked complete! 🌿", "success");
    }
    resetFocusTimer();
  };

  // ── Data loading ──
  useEffect(() => {
    if (!userId || !firebaseUser || !isReady) return;
    getProjects(userId)
      .then(async (ps) => {
        if (ps.length === 0) {
          const starter = await ensureStarterProject(userId);
          setProjects([starter]);
          setSelectedProject(starter.id);
        } else {
          setProjects(ps);
          setSelectedProject((prev) => prev || ps[0].id);
        }
      })
      .catch((err) => {
        console.error("Error loading projects:", err);
      });
  }, [userId, firebaseUser, isReady]);

  useEffect(() => {
    if (!userId || !selectedProject || !firebaseUser || !isReady) return;
    setLoading(true);
    let cancelled = false;

    Promise.all([getTasks(userId, selectedProject), getAllTasks(userId)])
      .then(([loaded, allTasks]) => {
        if (cancelled) return;
        setTasks(loaded);
        setTaskContext(computeTaskContext(allTasks, projects, todayString()));
      })
      .catch((err) => {
        if (!cancelled) console.error("Error loading tasks:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, selectedProject, projects, firebaseUser, isReady]);

  // ── Computed ──
  const weekDates = getWeekDates(weekAnchor);
  const activeProject = projects.find((p) => p.id === selectedProject);

  const tasksForDate = tasks.filter((t) => {
    if (t.status === "completed") return false;
    if (t.dueDate) return t.dueDate === selectedDate;
    return selectedDate === today;
  });

  const completedForDate = tasks.filter((t) => {
    if (t.status !== "completed") return false;
    if (t.dueDate) return t.dueDate === selectedDate;
    if (t.completedAt) return localDateString(new Date(t.completedAt)) === selectedDate;
    return false;
  });

  const overdueTasks =
    selectedDate === today
      ? tasks.filter((t) => t.dueDate && t.dueDate < today && t.status === "pending")
      : [];

  const pendingByDate: Record<string, number> = {};
  const doneByDate: Record<string, number> = {};
  weekDates.forEach((d) => {
    pendingByDate[d] = tasks.filter(
      (t) => t.status === "pending" && (t.dueDate ? t.dueDate === d : d === today)
    ).length;
    doneByDate[d] = tasks.filter((t) => {
      if (t.status !== "completed") return false;
      if (t.dueDate) return t.dueDate === d;
      if (t.completedAt) return localDateString(new Date(t.completedAt)) === d;
      return false;
    }).length;
  });

  const completedAllTime = tasks.filter((t) => t.status === "completed" && t.completedAt);
  const historyGroups = groupByCompletionDate(completedAllTime);

  // ── Handlers ──
  const openAddTask = () => setShowAddTask(true);

  const handleAddTask = async (
    title: string,
    desc: string,
    dueDate: string,
    priority: TaskPriority | "none"
  ) => {
    if (!title.trim() || !selectedProject) return;
    const newTask: Omit<Task, "id"> = {
      title: title.trim(),
      frequency: "daily",
      dueDate,
      status: "pending",
      projectId: selectedProject,
      userId,
      createdAt: Date.now(),
    };
    if (desc.trim()) newTask.description = desc.trim();
    if (priority !== "none") newTask.priority = priority;
    const created = await createTask(newTask);
    setTasks((prev) => [created, ...prev]);
    setShowAddTask(false);
    toast("Task added!", "success");
    getAllTasks(userId)
      .then((all) => setTaskContext(computeTaskContext(all, projects, todayString())))
      .catch(console.error);
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === "completed") updates.completedAt = Date.now();
    await updateTask(task.id, updates);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
    if (newStatus === "completed") toast("Task completed! 🎉", "success");
    getAllTasks(userId)
      .then((all) => setTaskContext(computeTaskContext(all, projects, todayString())))
      .catch(console.error);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast("Task deleted", "info");
    getAllTasks(userId)
      .then((all) => setTaskContext(computeTaskContext(all, projects, todayString())))
      .catch(console.error);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Partial<Task>;
    await updateTask(taskId, clean);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...clean } : t)));
    setEditingTask(null);
    toast("Task updated", "success");
    getAllTasks(userId)
      .then((all) => setTaskContext(computeTaskContext(all, projects, todayString())))
      .catch(console.error);
  };

  const handleAddProject = async (name: string, color: string) => {
    const p = await createProject(userId, name.trim(), color);
    setProjects((prev) => [...prev, p]);
    setSelectedProject(p.id);
    toast(`Workspace "${p.name}" created`, "success");
  };

  const navigateWeek = (dir: -1 | 1) => {
    const anchor = new Date(weekAnchor + "T00:00:00");
    anchor.setDate(anchor.getDate() + dir * 7);
    const newAnchor = localDateString(anchor);
    setWeekAnchor(newAnchor);
    const newWeek = getWeekDates(newAnchor);
    if (!newWeek.includes(selectedDate)) setSelectedDate(newWeek[0]);
  };

  const jumpToToday = () => {
    setWeekAnchor(today);
    setSelectedDate(today);
  };

  if (loading) {
    return <PlanPageSkeleton />;
  }

  return (
    <div className="w-full max-w-md mx-auto lg:max-w-5xl pb-24 animate-fade-in text-[#1C1917]">
      {/* ── 1. Top Editorial Header & Single Terracotta New Task Button ── */}
      <div className="flex items-center justify-between gap-3 mb-6 pt-1">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl text-[#1C1917] tracking-tight">
            Execution Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-1 font-sans">
            Design your daily rhythm, rituals, and deep work.
          </p>
        </div>
        <button
          onClick={openAddTask}
          type="button"
          className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> New task
        </button>
      </div>

      {/* ── 2. Workspaces Horizontal Strip (no-scrollbar) ── */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] mb-2 font-sans">
          Workspaces
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {projects.map((p) => {
            const active = selectedProject === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                type="button"
                aria-pressed={active}
                className={cn(
                  "inline-flex h-10 items-center gap-2 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer",
                  active
                    ? "bg-[#191D1A] text-white border-[#191D1A] shadow-xs"
                    : "bg-[#FCFBF9] text-[#57534E] hover:text-[#1C1917] border-[#1C1917]/[0.08]"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </button>
            );
          })}
          <button
            onClick={() => setShowAddProject(true)}
            type="button"
            className="inline-flex h-10 items-center gap-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border border-dashed border-[#1C1917]/20 text-[#57534E] hover:text-[#1C1917] bg-[#FCFBF9] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New workspace
          </button>
        </div>
      </div>

      {/* ── 3. Feature A: Daily Non-Negotiable Rituals Card ── */}
      <div className="bg-[#FCFBF9] rounded-3xl p-5 border border-[#1C1917]/[0.08] shadow-xs mb-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F] block">
              NON-NEGOTIABLES
            </span>
            <h3 className="font-serif italic text-xl text-[#1C1917] mt-0.5">
              Daily Rituals
            </h3>
          </div>
          <span className="text-xs font-bold text-[#2D6A4F] bg-[#D1FAE5] px-2.5 py-1 rounded-full">
            {ritualCompletedCount}/4 done
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#EFECE4] rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-[#2D6A4F] transition-all duration-300 rounded-full"
            style={{ width: `${(ritualCompletedCount / 4) * 100}%` }}
          />
        </div>

        {/* 2x2 Rituals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEFAULT_RITUALS.map((r) => {
            const isDone = !!rituals[r.id];
            return (
              <button
                key={r.id}
                onClick={() => toggleRitual(r.id)}
                type="button"
                className={cn(
                  "flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer",
                  isDone
                    ? "bg-[#D1FAE5]/30 border-[#2D6A4F]/25 text-[#1B4332]"
                    : "bg-[#F6F3EC]/70 hover:bg-[#F6F3EC] border-[#1C1917]/[0.05] text-[#1C1917]"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{r.icon}</span>
                  <span className="text-xs font-semibold truncate">{r.label}</span>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0",
                    isDone
                      ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                      : "border-[#1C1917]/20 bg-white"
                  )}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Feature B: Built-in Live Deep Focus Timer (25m Pomodoro) ── */}
      <div className="bg-[#141715] text-white rounded-3xl p-5 mb-5 shadow-xl border border-white/[0.08] relative overflow-hidden">
        {/* Soft matcha ambient wash */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#2D6A4F]/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E05A47] animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#E05A47]">
                DEEP FOCUS STUDIO
              </span>
            </div>
            <h4 className="font-serif italic text-xl text-white mt-1 truncate">
              {focusSession.taskTitle || "Select a task to enter flow"}
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              25-minute single-task focus block · zero distractions
            </p>
          </div>

          <div className="flex items-center gap-3 sm:self-center shrink-0">
            {/* Countdown Readout */}
            <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
              {formatFocusTime(focusSession.secondsLeft)}
            </span>

            {/* Play/Pause Toggle */}
            <button
              onClick={toggleFocusTimer}
              type="button"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
                focusSession.isRunning
                  ? "bg-stone-700 hover:bg-stone-600 text-white"
                  : "bg-[#E05A47] hover:bg-[#C94A38] text-white active:scale-95"
              )}
              title={focusSession.isRunning ? "Pause timer" : "Start focus"}
            >
              {focusSession.isRunning ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={resetFocusTimer}
              type="button"
              className="w-9 h-9 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Complete Button */}
            <button
              onClick={completeFocusSession}
              type="button"
              className="bg-[#2D6A4F] hover:bg-[#24543F] text-white rounded-full px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Mark done"
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        </div>
      </div>

      {/* ── No Project Selected State ── */}
      {!selectedProject ? (
        <div className="bg-[#FCFBF9] rounded-3xl p-8 border border-[#1C1917]/[0.08] text-center shadow-xs">
          <FolderOpen className="w-6 h-6 text-[#8C857B] mx-auto mb-2" />
          <p className="font-serif text-lg text-[#1C1917]">Choose a workspace to see its tasks</p>
          <button
            onClick={() => setShowAddProject(true)}
            className="bg-[#E05A47] text-white rounded-full px-4 py-2 text-xs font-semibold mt-3"
          >
            Create workspace
          </button>
        </div>
      ) : (
        <>
          {/* ── View Switcher (Schedule vs History) ── */}
          <div
            className="inline-flex gap-1 p-1 bg-[#EFECE4] rounded-full mb-5"
            role="tablist"
            aria-label="Task view"
          >
            {(
              [
                { id: "schedule" as ViewMode, icon: CalendarClock, label: "Schedule" },
                { id: "history" as ViewMode, icon: History, label: "History" },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                type="button"
                role="tab"
                aria-selected={view === id}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  view === id
                    ? "bg-[#191D1A] text-white shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917]"
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {view === "schedule" ? (
            <ScheduleView
              weekDates={weekDates}
              weekAnchor={weekAnchor}
              selectedDate={selectedDate}
              today={today}
              pendingByDate={pendingByDate}
              doneByDate={doneByDate}
              tasksForDate={tasksForDate}
              completedForDate={completedForDate}
              overdueTasks={overdueTasks}
              projectColor={activeProject?.color}
              onSelectDate={setSelectedDate}
              onNavigateWeek={navigateWeek}
              onJumpToToday={jumpToToday}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={setEditingTask}
              onAddTask={openAddTask}
              onFocus={startFocusOnTask}
              onQuickTemplate={(templateTitle, priority) =>
                handleAddTask(templateTitle, "Generated from Execution Studio", selectedDate, priority)
              }
            />
          ) : (
            <HistoryView
              groups={historyGroups}
              projectColor={activeProject?.color}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          )}
        </>
      )}

      {/* ── Body-Portaled Modals (z-[9999]) ── */}
      {showAddTask && (
        <AddTaskModal
          defaultDate={selectedDate}
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
        />
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleUpdateTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      {showAddProject && (
        <AddProjectModal
          onAdd={handleAddProject}
          onClose={() => setShowAddProject(false)}
        />
      )}
    </div>
  );
}

// ── Schedule View ─────────────────────────────────────────────────────────────
function ScheduleView({
  weekDates,
  weekAnchor,
  selectedDate,
  today,
  pendingByDate,
  doneByDate,
  tasksForDate,
  completedForDate,
  overdueTasks,
  projectColor,
  onSelectDate,
  onNavigateWeek,
  onJumpToToday,
  onToggle,
  onDelete,
  onEdit,
  onAddTask,
  onFocus,
  onQuickTemplate,
}: {
  weekDates: string[];
  weekAnchor: string;
  selectedDate: string;
  today: string;
  pendingByDate: Record<string, number>;
  doneByDate: Record<string, number>;
  tasksForDate: Task[];
  completedForDate: Task[];
  overdueTasks: Task[];
  projectColor?: string;
  onSelectDate: (d: string) => void;
  onNavigateWeek: (dir: -1 | 1) => void;
  onJumpToToday: () => void;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Task) => void;
  onAddTask: () => void;
  onFocus: (t: Task) => void;
  onQuickTemplate: (title: string, priority: TaskPriority) => void;
}) {
  const totalForDate = tasksForDate.length + overdueTasks.length;

  return (
    <>
      <section className="mb-5" aria-label="Schedule">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="font-serif italic text-2xl text-[#1C1917] truncate">
              {formatDateLabel(selectedDate)}
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              {totalForDate === 0
                ? completedForDate.length > 0
                  ? `${completedForDate.length} completed`
                  : "No tasks scheduled"
                : `${tasksForDate.length + overdueTasks.length} open${
                    completedForDate.length > 0 ? ` · ${completedForDate.length} completed` : ""
                  }`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedDate !== today && (
              <button
                onClick={onJumpToToday}
                type="button"
                className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Week navigation arrows */}
        <div className="flex items-center justify-between gap-2 py-1">
          <button
            onClick={() => onNavigateWeek(-1)}
            type="button"
            aria-label="Previous week"
            className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] flex items-center justify-center text-[#1C1917] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold tabular-nums text-[#57534E]">
            {weekLabel(weekDates)}
          </span>
          <button
            onClick={() => onNavigateWeek(1)}
            type="button"
            aria-label="Next week"
            className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] flex items-center justify-center text-[#1C1917] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Day Week Strip */}
        <div className="grid grid-cols-7 gap-1.5 mt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {weekDates.map((date, i) => {
            const isToday = date === today;
            const isSelected = date === selectedDate;
            const pending = pendingByDate[date] ?? 0;
            const done = doneByDate[date] ?? 0;

            return (
              <button
                key={date}
                onClick={() => onSelectDate(date)}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  "h-16 flex flex-col items-center justify-center gap-1 rounded-2xl border transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#191D1A] text-white border-[#191D1A] shadow-md"
                    : isToday
                    ? "bg-[#FCFBF9] text-[#1C1917] border-[#E05A47]"
                    : "bg-[#FCFBF9] text-[#57534E] hover:text-[#1C1917] border-[#1C1917]/[0.08]"
                )}
              >
                <span className="text-[10px] font-bold uppercase leading-none opacity-80">
                  {DAY_LABELS[i]}
                </span>
                <span className="text-sm font-bold leading-none tabular-nums">
                  {shortDay(date)}
                </span>
                {/* Dot indicators */}
                <div className="flex gap-1 h-1 mt-0.5">
                  {pending > 0 && (
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-[#E05A47]" : "bg-[#E05A47]"
                      )}
                    />
                  )}
                  {done > 0 && (
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-[#2D6A4F]" : "bg-[#2D6A4F]"
                      )}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Overdue Section (Today only) ── */}
      {overdueTasks.length > 0 && (
        <div className="mb-5 bg-rose-50/50 rounded-3xl p-4 border border-rose-200/60">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-[#C94A38] shrink-0" />
            <span className="text-xs font-bold text-[#C94A38] uppercase tracking-wider">
              Overdue Tasks · {overdueTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                isOverdue
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onFocus={onFocus}
                color={projectColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Pending Tasks ── */}
      {tasksForDate.length === 0 && overdueTasks.length === 0 ? (
        <div className="bg-[#FCFBF9] rounded-3xl p-8 border border-[#1C1917]/[0.08] text-center shadow-xs">
          <Sparkles className="w-7 h-7 text-[#2D6A4F] mx-auto mb-2 opacity-80" />
          <h3 className="font-serif italic text-2xl text-[#1C1917]">Your day is clear</h3>
          <p className="text-xs text-[#57534E] max-w-xs mx-auto mt-1 mb-5 leading-relaxed font-sans">
            Choose a quick deep work template or craft a custom task for this date.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onQuickTemplate("Deep Work Sprint (90m)", "high")}
              type="button"
              className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
            >
              + Deep Work Sprint (90m)
            </button>
            <button
              onClick={() => onQuickTemplate("Architecture & System Review", "medium")}
              type="button"
              className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
            >
              + System Review
            </button>
            <button
              onClick={() => onQuickTemplate("Daily Inbox & Admin Sweep", "low")}
              type="button"
              className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
            >
              + Admin Sweep
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasksForDate.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onFocus={onFocus}
              color={projectColor}
            />
          ))}
        </div>
      )}

      {/* ── Completed Tasks ── */}
      {completedForDate.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-[#1C1917]/[0.08]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
              Completed · {completedForDate.length}
            </p>
            <div className="h-px flex-1 bg-[#1C1917]/[0.08]" />
          </div>
          <div className="space-y-2">
            {completedForDate.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onFocus={onFocus}
                color={projectColor}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── History View ──────────────────────────────────────────────────────────────
function HistoryView({
  groups,
  projectColor,
  onToggle,
  onDelete,
}: {
  groups: [string, Task[]][];
  projectColor?: string;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="bg-[#FCFBF9] rounded-3xl p-8 border border-[#1C1917]/[0.08] text-center shadow-xs">
        <History className="w-6 h-6 text-[#8C857B] mx-auto mb-2" />
        <p className="font-serif text-lg text-[#1C1917]">No completed tasks yet</p>
        <p className="text-xs text-[#57534E] mt-1 font-sans">
          Check off your daily tasks to build compounding continuity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([date, taskList]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1C1917]">{formatGroupDate(date)}</p>
              <p className="text-xs text-[#57534E]">
                {taskList.length} task{taskList.length !== 1 ? "s" : ""} completed
              </p>
            </div>
          </div>

          <div className="space-y-2 ml-4 pl-4 border-l-2 border-[#1C1917]/10">
            {taskList.map((t) => (
              <HistoryTaskCard
                key={t.id}
                task={t}
                color={projectColor}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  onFocus,
  color,
  isOverdue = false,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Task) => void;
  onFocus?: (t: Task) => void;
  color?: string;
  isOverdue?: boolean;
}) {
  const done = task.status === "completed";
  const priority = task.priority;
  const today = todayString();
  const [completing, setCompleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const projectColor = color ?? "#E05A47";

  const handleToggle = () => {
    if (completing) return;
    if (done) {
      onToggle(task);
      return;
    }
    setCompleting(true);
    timerRef.current = setTimeout(() => {
      onToggle(task);
      setCompleting(false);
    }, 450);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3.5 bg-[#FCFBF9] rounded-2xl border border-[#1C1917]/[0.06] shadow-2xs transition-all",
        completing && "opacity-60 scale-[0.99]",
        isOverdue && !done && "bg-rose-50/40 border-rose-200/60",
        done && "opacity-60 bg-[#F6F3EC]"
      )}
    >
      {/* Circular Completion Checkbox */}
      <button
        onClick={handleToggle}
        disabled={completing}
        type="button"
        aria-label={`${done ? "Mark incomplete" : "Complete"}: ${task.title}`}
        aria-pressed={done}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer",
          done || completing
            ? "bg-[#2D6A4F] text-white"
            : isOverdue
            ? "border-2 border-[#C94A38] text-[#C94A38]"
            : "border-2 border-[#1C1917]/20 hover:border-[#E05A47] text-[#1C1917]/30"
        )}
      >
        {done || completing ? (
          <Check className="w-4 h-4 stroke-[3]" />
        ) : (
          <Circle className="w-4 h-4 fill-transparent" />
        )}
      </button>

      {/* Body — tap to edit */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => !done && onEdit(task)}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: projectColor }}
            aria-hidden="true"
          />
          <p
            className={cn(
              "text-xs sm:text-sm font-semibold truncate leading-tight",
              done ? "line-through text-[#8C857B]" : "text-[#1C1917]"
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 pl-3.5">
          {task.description && (
            <p className="text-[11px] text-[#57534E] truncate max-w-[160px] sm:max-w-[260px]">
              {task.description}
            </p>
          )}

          {/* Energy Badge */}
          {priority && !done && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                PRIORITY_CONFIG[priority].textClass,
                PRIORITY_CONFIG[priority].bgClass
              )}
            >
              <Flag className="w-2.5 h-2.5" />
              {PRIORITY_CONFIG[priority].energyLabel}
            </span>
          )}

          {isOverdue && task.dueDate && !done && (
            <span className="text-[10px] font-bold text-[#C94A38] bg-rose-100 px-2 py-0.5 rounded-full">
              Due {formatShortDate(task.dueDate)}
            </span>
          )}

          {task.dueDate && !isOverdue && !done && (
            <span className="text-[10px] text-[#8C857B] bg-[#EFECE4] px-2 py-0.5 rounded-full font-medium">
              {task.dueDate === today ? "Today" : formatShortDate(task.dueDate)}
            </span>
          )}

          {done && task.completedAt && (
            <span className="text-[10px] text-[#8C857B] font-mono">
              {formatTime(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!done && onFocus && (
          <button
            onClick={() => onFocus(task)}
            type="button"
            className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all"
            title="Start deep focus"
          >
            <Play className="w-3 h-3 fill-current text-[#E05A47]" /> Focus
          </button>
        )}

        {!done && (
          <button
            onClick={() => onEdit(task)}
            type="button"
            title="Edit task"
            aria-label={`Edit ${task.title}`}
            className="p-1.5 text-[#8C857B] hover:text-[#1C1917] rounded-full hover:bg-[#EFECE4] transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          type="button"
          title="Delete task"
          aria-label={`Delete ${task.title}`}
          className="p-1.5 text-[#8C857B] hover:text-[#C94A38] rounded-full hover:bg-rose-50 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── History Task Card ─────────────────────────────────────────────────────────
function HistoryTaskCard({
  task,
  color,
  onToggle,
  onDelete,
}: {
  task: Task;
  color?: string;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="bg-[#FCFBF9] rounded-2xl p-3 border border-[#1C1917]/[0.06] flex items-center justify-between gap-3 shadow-2xs"
      style={{ borderLeftColor: color ?? "#2D6A4F", borderLeftWidth: "3px" }}
    >
      <button
        onClick={() => onToggle(task)}
        type="button"
        aria-label={`Mark ${task.title} incomplete`}
        className="w-7 h-7 rounded-full bg-[#D1FAE5] text-[#2D6A4F] flex items-center justify-center shrink-0 cursor-pointer"
      >
        <Check className="w-4 h-4 stroke-[3]" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold line-through text-[#8C857B] truncate">
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-[10px] text-[#8C857B] mt-0.5">
            Scheduled {formatShortDate(task.dueDate)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.completedAt && (
          <span className="text-[10px] font-mono text-[#8C857B]">
            {formatTime(task.completedAt)}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          type="button"
          title="Delete task"
          aria-label={`Delete ${task.title}`}
          className="p-1.5 text-[#8C857B] hover:text-[#C94A38] transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Priority Selector ─────────────────────────────────────────────────────────
function PrioritySelector({
  value,
  onChange,
}: {
  value: TaskPriority | "none";
  onChange: (v: TaskPriority | "none") => void;
}) {
  const options: {
    id: TaskPriority | "none";
    label: string;
    textClass: string;
    bgActive: string;
  }[] = [
    { id: "none", label: "None", textClass: "text-[#57534E]", bgActive: "bg-[#EFECE4]" },
    { id: "low", label: "Low", textClass: "text-emerald-800", bgActive: "bg-emerald-50 border-emerald-200" },
    { id: "medium", label: "Medium", textClass: "text-amber-800", bgActive: "bg-amber-50 border-amber-200" },
    { id: "high", label: "High", textClass: "text-[#C94A38]", bgActive: "bg-rose-50 border-rose-200" },
  ];

  return (
    <div>
      <label className="text-xs font-bold text-[#1C1917] block mb-1.5">Priority</label>
      <div className="grid grid-cols-4 gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            type="button"
            aria-pressed={value === o.id}
            className={cn(
              "h-10 rounded-xl text-xs font-semibold capitalize transition-all border cursor-pointer",
              value === o.id
                ? `${o.textClass} ${o.bgActive} border-transparent shadow-2xs font-bold`
                : "bg-[#FCFBF9] text-[#57534E] hover:text-[#1C1917] border-[#1C1917]/10"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────────────
function AddTaskModal({
  defaultDate,
  onAdd,
  onClose,
}: {
  defaultDate: string;
  onAdd: (
    title: string,
    desc: string,
    dueDate: string,
    priority: TaskPriority | "none"
  ) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate);
  const [priority, setPriority] = useState<TaskPriority | "none">("none");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title, desc, dueDate, priority);
  };

  return (
    <Modal title="New task" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#1C1917] block mb-1">
            Task title *
          </label>
          <input
            autoFocus
            className="w-full bg-[#F6F3EC] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47]"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#1C1917] block mb-1">
            Notes (optional)
          </label>
          <textarea
            className="w-full bg-[#F6F3EC] rounded-2xl p-3 text-xs sm:text-sm font-medium text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47] resize-none"
            rows={2}
            placeholder="Add details..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#1C1917] block mb-1">
            Schedule for
          </label>
          <input
            type="date"
            className="w-full bg-[#F6F3EC] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47]"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <PrioritySelector value={priority} onChange={setPriority} />
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex-1 py-3 rounded-full text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white flex-1 py-3 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            Add task
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Task Modal ───────────────────────────────────────────────────────────
function EditTaskModal({
  task,
  onSave,
  onClose,
}: {
  task: Task;
  onSave: (id: string, updates: Partial<Task>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? todayString());
  const [priority, setPriority] = useState<TaskPriority | "none">(
    task.priority ?? "none"
  );

  const handleSave = () => {
    if (!title.trim()) return;
    const updates: Partial<Task> = {
      title: title.trim(),
      dueDate,
      description: desc.trim() || "",
    };
    if (priority !== "none") {
      updates.priority = priority;
    } else {
      updates.priority = null;
    }
    onSave(task.id, updates);
  };

  return (
    <Modal title="Edit task" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#1C1917] block mb-1">
            Task title *
          </label>
          <input
            autoFocus
            className="w-full bg-[#F6F3EC] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#1C1917] block mb-1">Notes</label>
          <textarea
            className="w-full bg-[#F6F3EC] rounded-2xl p-3 text-xs sm:text-sm font-medium text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47] resize-none"
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#1C1917] block mb-1">
            Scheduled for
          </label>
          <input
            type="date"
            className="w-full bg-[#F6F3EC] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47]"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <PrioritySelector value={priority} onChange={setPriority} />
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex-1 py-3 rounded-full text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white flex-1 py-3 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Project Modal ─────────────────────────────────────────────────────────
function AddProjectModal({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  return (
    <Modal title="New workspace" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#1C1917] block mb-1">
            Workspace name *
          </label>
          <input
            autoFocus
            className="w-full bg-[#F6F3EC] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47]"
            placeholder="e.g. Deep Work, Vitality, SATAT Ops"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onAdd(name, color)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5 mb-2">
            <Palette className="w-3.5 h-3.5" /> Workspace Color
          </label>
          <div className="flex gap-2.5 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                type="button"
                aria-label={`Select project color ${c}`}
                aria-pressed={color === c}
                className="w-9 h-9 rounded-full border-2 transition-transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "#1C1917" : "transparent",
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex-1 py-3 rounded-full text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onAdd(name, color)}
            disabled={!name.trim()}
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white flex-1 py-3 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Body-Portaled Modal Wrapper (z-[9999] + body scroll locking) ─────────────
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#191D1A]/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-[#FCFBF9] text-[#1C1917] rounded-[32px] w-full max-w-md p-6 shadow-2xl border border-[#1C1917]/10 animate-slide-up max-h-[90dvh] my-auto overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1C1917]/[0.06]">
          <h3 className="font-serif italic text-2xl text-[#1C1917]">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] flex items-center justify-center text-[#1C1917] cursor-pointer transition-colors"
            aria-label={`Close ${title}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

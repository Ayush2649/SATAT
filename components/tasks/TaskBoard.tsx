"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
  CheckSquare,
  Sparkles,
  Sunrise,
  Sun,
  Moon,
  Calendar,
  Clock,
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

// ── Deterministic Task Photo Matcher (100% Sharp Aesthetic Imagery) ───────────
export function resolveTaskThumbnail(title: string = "", projectName: string = ""): string {
  const q = `${title} ${projectName}`.toLowerCase();
  if (/code|api|bug|refactor|build|test|sprint|dailyos|system|backend|frontend|dev|git/i.test(q)) {
    return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=75";
  }
  if (/dsa|graph|dp|leetcode|interview|algorithm|study|prep|math|book|read/i.test(q)) {
    return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=75";
  }
  if (/design|ui|stitch|token|figma|css|frontend|visual|brand|mockup/i.test(q)) {
    return "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=300&q=75";
  }
  if (/video|youtube|record|content|bit by bit|script|audio|podcast|mic/i.test(q)) {
    return "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300&q=75";
  }
  if (/workout|gym|run|step|cardio|creatine|health|stretch|lift|walk|jog/i.test(q)) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=75";
  }
  return "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=300&q=75";
}

// ── Non-Negotiable Rituals Blueprint (ZERO Emojis, Photo-Backed) ───────────────
interface RitualDef {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  pendingSubtitle: string;
  doneSubtitle: string;
  photoUrl: string;
}

const RITUAL_DEFS: RitualDef[] = [
  {
    id: "deep_work_90",
    title: "90m Deep Work",
    category: "COGNITIVE",
    categoryColor: "text-[#2D6A4F]",
    pendingSubtitle: "90m target block",
    doneSubtitle: "Morning Block · Done",
    photoUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=200&q=75",
  },
  {
    id: "creatine_water",
    title: "3g Creatine & 3L Water",
    category: "CELLULAR FUEL",
    categoryColor: "text-[#2D6A4F]",
    pendingSubtitle: "Daily supplementation",
    doneSubtitle: "Hydration Logged",
    photoUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=200&q=75",
  },
  {
    id: "steps_zone2",
    title: "8,000 Steps & Zone 2",
    category: "MOVEMENT",
    categoryColor: "text-[#57534E]",
    pendingSubtitle: "Active movement",
    doneSubtitle: "8,000 / 8,000 steps",
    photoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=75",
  },
  {
    id: "evening_journal",
    title: "Evening Journal & Plan",
    category: "RESTORATION",
    categoryColor: "text-[#57534E]",
    pendingSubtitle: "Scheduled · 21:30",
    doneSubtitle: "Reflection Complete",
    photoUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=200&q=75",
  },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Date Helpers ──────────────────────────────────────────────────────────────
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
  const searchParams = useSearchParams();
  const today = todayString();

  // ── State ──
  const [view, setView] = useState<ViewMode>("schedule");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekAnchor, setWeekAnchor] = useState(today);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Auto-open new task modal if query param ?action=new is set
  useEffect(() => {
    if (searchParams?.get("action") === "new") {
      setShowAddTask(true);
    }
  }, [searchParams]);

  // ── Feature A: Daily Non-Negotiable Rituals State (Persisted in localStorage) ──
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

  const completedRitualsCount = Object.values(rituals).filter(Boolean).length;

  // ── Feature B: Circadian Deep Work Flow Instrument State ──
  const [targetMinutes, setTargetMinutes] = useState<25 | 50 | 90>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [activeFocusTask, setActiveFocusTask] = useState<{
    id: string;
    title: string;
    project: string;
  } | null>(null);

  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Switch timer duration cleanly when user clicks duration capsule
  const handleSelectDuration = (m: 25 | 50 | 90) => {
    setTargetMinutes(m);
    setSecondsRemaining(m * 60);
    setIsTimerRunning(false);
  };

  useEffect(() => {
    if (isTimerRunning) {
      focusTimerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            toast("Circadian deep work block completed! Outstanding momentum.", "success");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (focusTimerRef.current) {
      clearInterval(focusTimerRef.current);
    }
    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    };
  }, [isTimerRunning, toast]);

  const toggleFlowTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const resetFlowTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(targetMinutes * 60);
  };

  const startFocusOnTask = (task: Task) => {
    setActiveFocusTask({
      id: task.id,
      title: task.title,
      project: projects.find((p) => p.id === task.projectId)?.name || activeProject?.name || "Workspace",
    });
    setSecondsRemaining(targetMinutes * 60);
    setIsTimerRunning(true);
    toast(`Deep focus locked: "${task.title}"`, "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Data loading ──
  useEffect(() => {
    if (!userId || !firebaseUser || !isReady) return;
    getProjects(userId)
      .then((ps) => {
        setProjects(ps);
        if (ps.length > 0) {
          setSelectedProject((prev) => (ps.some((p) => p.id === prev) ? prev : ps[0].id));
        } else {
          setSelectedProject("");
        }
      })
      .catch((err) => {
        console.error("Error loading projects:", err);
      });
  }, [userId, firebaseUser, isReady]);

  useEffect(() => {
    if (!userId || !firebaseUser || !isReady) return;
    setLoading(true);
    let cancelled = false;

    if (!selectedProject) {
      getAllTasks(userId)
        .then((all) => {
          if (cancelled) return;
          setAllTasks(all);
          setTasks([]);
        })
        .catch(console.error)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    Promise.all([getTasks(userId, selectedProject), getAllTasks(userId)])
      .then(([loaded, all]) => {
        if (cancelled) return;
        setTasks(loaded);
        setAllTasks(all);
        setTaskContext(computeTaskContext(all, projects, todayString()));
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

  const projectPendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTasks.forEach((t) => {
      if (t.status === "pending" && t.projectId) {
        counts[t.projectId] = (counts[t.projectId] || 0) + 1;
      }
    });
    return counts;
  }, [allTasks]);

  const tasksForDate = tasks.filter((t) => {
    if (selectedProject && t.projectId !== selectedProject) return false;
    if (t.status === "completed") return false;
    if (t.dueDate) return t.dueDate === selectedDate;
    return selectedDate === today;
  });

  const nextPendingTask =
    tasksForDate[0] ||
    tasks.find((t) => (!selectedProject || t.projectId === selectedProject) && t.status === "pending");

  const completedForDate = tasks.filter((t) => {
    if (selectedProject && t.projectId !== selectedProject) return false;
    if (t.status !== "completed") return false;
    if (t.dueDate) return t.dueDate === selectedDate;
    if (t.completedAt) return localDateString(new Date(t.completedAt)) === selectedDate;
    return false;
  });

  const overdueTasks =
    selectedDate === today
      ? tasks.filter(
          (t) =>
            (!selectedProject || t.projectId === selectedProject) &&
            t.dueDate &&
            t.dueDate < today &&
            t.status === "pending"
        )
      : [];

  const pendingByDate: Record<string, number> = {};
  const doneByDate: Record<string, number> = {};
  weekDates.forEach((d) => {
    pendingByDate[d] = tasks.filter(
      (t) =>
        (!selectedProject || t.projectId === selectedProject) &&
        t.status === "pending" &&
        (t.dueDate ? t.dueDate === d : d === today)
    ).length;
    doneByDate[d] = tasks.filter((t) => {
      if (selectedProject && t.projectId !== selectedProject) return false;
      if (t.status !== "completed") return false;
      if (t.dueDate) return t.dueDate === d;
      if (t.completedAt) return localDateString(new Date(t.completedAt)) === d;
      return false;
    }).length;
  });

  const completedAllTime = tasks.filter(
    (t) =>
      (!selectedProject || t.projectId === selectedProject) &&
      t.status === "completed" &&
      t.completedAt
  );
  const historyGroups = groupByCompletionDate(completedAllTime);

  // History stats
  const totalCompleted = completedAllTime.length;
  const estimatedFocusHours = (totalCompleted * 0.42).toFixed(1);
  const completionRatePct = tasks.length > 0
    ? Math.round((totalCompleted / tasks.length) * 100)
    : 85;

  // ── Handlers ──
  const openAddTask = () => {
    if (projects.length === 0) {
      setShowAddProject(true);
      toast("Create a workspace first to anchor your tasks", "info");
      return;
    }
    setShowAddTask(true);
  };

  const handleAddTask = async (
    title: string,
    desc: string,
    dueDate: string,
    priority: TaskPriority | "none",
    targetProjectId?: string
  ) => {
    const projId = targetProjectId || selectedProject;
    if (!title.trim() || !projId) return;
    const newTask: Omit<Task, "id"> = {
      title: title.trim(),
      frequency: "daily",
      dueDate,
      status: "pending",
      projectId: projId,
      userId,
      createdAt: Date.now(),
    };
    if (desc.trim()) newTask.description = desc.trim();
    if (priority !== "none") newTask.priority = priority;
    const created = await createTask(newTask);
    if (projId === selectedProject) {
      setTasks((prev) => [created, ...prev]);
    }
    setAllTasks((prev) => [created, ...prev]);
    setShowAddTask(false);
    toast("Task added!", "success");
    getAllTasks(userId)
      .then((all) => {
        setAllTasks(all);
        setTaskContext(computeTaskContext(all, projects, todayString()));
      })
      .catch(console.error);
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === "completed") updates.completedAt = Date.now();
    await updateTask(task.id, updates);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
    setAllTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
    if (newStatus === "completed") toast("Task completed! 🎉", "success");
    getAllTasks(userId)
      .then((all) => {
        setAllTasks(all);
        setTaskContext(computeTaskContext(all, projects, todayString()));
      })
      .catch(console.error);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast("Task deleted", "info");
    getAllTasks(userId)
      .then((all) => {
        setAllTasks(all);
        setTaskContext(computeTaskContext(all, projects, todayString()));
      })
      .catch(console.error);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Partial<Task>;
    await updateTask(taskId, clean);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...clean } : t)));
    setAllTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...clean } : t)));
    setEditingTask(null);
    toast("Task updated", "success");
    getAllTasks(userId)
      .then((all) => {
        setAllTasks(all);
        setTaskContext(computeTaskContext(all, projects, todayString()));
      })
      .catch(console.error);
  };

  const handleAddProject = async (name: string, color: string) => {
    const p = await createProject(userId, name.trim(), color);
    setProjects((prev) => [...prev, p]);
    setSelectedProject(p.id);
    setShowAddProject(false);
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

  // Flow dial progress
  const flowProgress = (targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60);

  if (loading) {
    return <PlanPageSkeleton />;
  }

  return (
    <div className="w-full max-w-md mx-auto lg:max-w-5xl pb-28 animate-fade-in text-[#1C1917]">
      {/* ── 1. Top Editorial Header & Workspace Pills (image_cc501e.jpg) ── */}
      <div className="flex items-start justify-between pt-1 pb-3">
        <div>
          <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-[#57534E] flex items-center gap-1.5">
            <span>STUDIO V2.4</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
            <span>PLAN · CADENCE</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1917] tracking-tight leading-none mt-1">
            Execution Studio
          </h1>
          <p className="text-xs text-[#57534E] mt-1.5 max-w-[240px] leading-relaxed">
            Design your daily rhythm, rituals, and deep work.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddProject(true)}
            type="button"
            aria-label="New Project"
            className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] rounded-full px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Workspace
          </button>

          <button
            onClick={openAddTask}
            type="button"
            aria-label="New task"
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        /* ── Zero-Project Empty State Invitation Card ── */
        <div className="bg-[#FCFBF9] rounded-[28px] p-8 border border-[#1C1917]/[0.06] text-center shadow-xs my-6">
          <div className="w-14 h-14 rounded-2xl bg-[#EFECE4] text-[#2D6A4F] flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-7 h-7 stroke-[2]" />
          </div>
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#2D6A4F] block">
            WORKSPACES ARCHITECTURE
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] mt-1 mb-2">
            Create your first project workspace
          </h2>
          <p className="text-xs text-[#57534E] max-w-sm mx-auto mb-6 leading-relaxed">
            Daily rhythm and deep work are anchored to projects. Define your core domain—whether work, research, or personal mastery—to begin tracking focus blocks.
          </p>
          <button
            onClick={() => setShowAddProject(true)}
            type="button"
            aria-label="Create First Project"
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create First Project</span>
          </button>
        </div>
      ) : (
        <>
          {/* ── 2. Workspaces Horizontal Pill Bar (no-scrollbar) ── */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 mb-4">
            {projects.map((p) => {
              const active = selectedProject === p.id;
              const count = projectPendingCounts[p.id] || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  type="button"
                  aria-pressed={active}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs inline-flex items-center gap-2 shrink-0 transition-all cursor-pointer",
                    active
                      ? "bg-[#191D1A] text-white font-semibold shadow-xs"
                      : "bg-[#EFECE4] text-[#1C1917] hover:bg-[#E4DFD3] font-medium"
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: active ? "#6EE7B7" : p.color }}
                  />
                  <span>{p.name}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#1C1917]/10 text-[#57534E]"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setShowAddProject(true)}
              type="button"
              aria-label="New Project"
              className="rounded-full px-3.5 py-1.5 text-xs font-medium shrink-0 border border-dashed border-[#1C1917]/25 text-[#57534E] hover:text-[#1C1917] bg-[#FCFBF9] transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Workspace
            </button>
          </div>

      {/* ── 3. Hero Card: "Circadian Deep Work" Flow Instrument (image_cc501e.jpg) ── */}
      <div className="relative rounded-[28px] overflow-hidden bg-[#191D1A] text-[#FCFBF9] p-5 shadow-xl mb-6 border border-white/[0.06]">
        {/* Subtle Moody Desk Photo Background Overlay */}
        <img
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=70"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity pointer-events-none"
        />

        {/* Top Row: Circadian Deep Work Pill & Duration Selector */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
          <div className="bg-[#2D6A4F]/40 border border-[#6EE7B7]/25 text-[#6EE7B7] rounded-full px-3 py-1 text-[9px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
            <span>CIRCADIAN DEEP WORK</span>
          </div>

          <div className="bg-white/[0.08] p-0.5 rounded-full inline-flex items-center text-[11px]">
            {([25, 50, 90] as const).map((mins) => (
              <button
                key={mins}
                onClick={() => handleSelectDuration(mins)}
                type="button"
                className={cn(
                  "px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer",
                  targetMinutes === mins
                    ? "bg-[#2D6A4F] text-white shadow-xs"
                    : "text-stone-400 hover:text-white"
                )}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Main Body: Col 7 Text + Col 5 SVG Flow Dial */}
        <div className="relative z-10 grid grid-cols-12 gap-3 items-center">
          {/* Left Column: Active Task & Controls */}
          <div className="col-span-7 flex flex-col justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-white leading-snug line-clamp-2">
                {activeFocusTask?.title || nextPendingTask?.title || `No pending tasks in ${activeProject?.name || "workspace"}`}
              </h2>
              <p className="text-[11px] text-stone-300 mt-1.5 flex items-center gap-1.5">
                <span>{activeFocusTask?.project || activeProject?.name || "Workspace"}</span>
                <span className="text-[#2D6A4F]">●</span>
                <span>High Cognitive Load</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 mt-4">
              <button
                onClick={toggleFlowTimer}
                type="button"
                className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Flow</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Enter Flow State</span>
                  </>
                )}
              </button>

              <button
                onClick={resetFlowTimer}
                type="button"
                title="Reset timer"
                className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-stone-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Circular SVG Flow Dial */}
          <div className="col-span-5 flex items-center justify-end">
            <div className="w-28 h-28 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 108 108">
                {/* Outer Track Circle */}
                <circle
                  cx="54"
                  cy="54"
                  r="46"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="7"
                  fill="none"
                />
                {/* Progress Arc */}
                <circle
                  cx="54"
                  cy="54"
                  r="46"
                  stroke="#6EE7B7"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="289"
                  strokeDashoffset={289 - flowProgress * 289}
                  transform="rotate(-90 54 54)"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-lg font-bold text-white leading-none">
                  {formatFocusTime(secondsRemaining)}
                </span>
                <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-stone-400 mt-1">
                  FLOW
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. 2×2 Photo-Backed "NON-NEGOTIABLE RITUALS" Bento Grid (ZERO Emojis!) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
            NON-NEGOTIABLE RITUALS
          </span>
          <span className="bg-[#D1FAE5] text-[#1B4332] rounded-full px-3 py-0.5 text-[10px] font-bold">
            {completedRitualsCount} of {RITUAL_DEFS.length} Completed · 24d Streak
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {RITUAL_DEFS.map((ritual) => {
            const isDone = !!rituals[ritual.id];
            return (
              <div
                key={ritual.id}
                onClick={() => toggleRitual(ritual.id)}
                className="bg-[#FCFBF9] rounded-[24px] p-3.5 border border-[#1C1917]/[0.06] shadow-2xs flex flex-col justify-between cursor-pointer transition-all hover:border-[#1C1917]/15 active:scale-[0.99]"
              >
                {/* Top Row: Left Photo + Right Check Circle */}
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl overflow-hidden shadow-2xs bg-[#EFECE4] shrink-0">
                    <img
                      src={ritual.photoUrl}
                      alt={ritual.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5",
                      isDone
                        ? "bg-[#2D6A4F] text-white"
                        : "border-2 border-stone-300 text-transparent"
                    )}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

                {/* Bottom Info: Category + Title + Subtitle */}
                <div className="mt-3">
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-wider uppercase block",
                      ritual.categoryColor
                    )}
                  >
                    {ritual.category}
                  </span>
                  <h4 className="font-bold text-sm text-[#1C1917] leading-snug mt-0.5">
                    {ritual.title}
                  </h4>
                  <p className="text-[11px] text-[#8C857B] mt-1 truncate">
                    {isDone ? ritual.doneSubtitle : ritual.pendingSubtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Switcher + Date Navigator Strip (image_cc501e.jpg) ── */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div
          className="inline-flex gap-1 p-1 bg-[#EFECE4] rounded-full"
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
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Date Navigator Pill */}
        <div className="inline-flex items-center gap-1 bg-[#FCFBF9] border border-[#1C1917]/[0.06] rounded-full px-2 py-1 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => navigateWeek(-1)}
            type="button"
            aria-label="Previous week"
            className="w-6 h-6 rounded-full hover:bg-[#EFECE4] flex items-center justify-center text-[#57534E] cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-[#1C1917] font-bold px-1 tabular-nums">
            {formatShortDate(selectedDate)}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            type="button"
            aria-label="Next week"
            className="w-6 h-6 rounded-full hover:bg-[#EFECE4] flex items-center justify-center text-[#57534E] cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 6. VIEW 1: Schedule Mode OR VIEW 2: History Mode ── */}
      {view === "schedule" ? (
        <>
          {/* 7-Day Week Strip */}
          <div className="bg-[#FCFBF9] rounded-[24px] p-2.5 border border-[#1C1917]/[0.06] grid grid-cols-7 gap-1 mb-4 shadow-2xs">
            {weekDates.map((date, i) => {
              const isToday = date === today;
              const isSelected = date === selectedDate;
              const pending = pendingByDate[date] ?? 0;
              const done = doneByDate[date] ?? 0;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  type="button"
                  aria-pressed={isSelected}
                  className={cn(
                    "py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative",
                    isSelected
                      ? "bg-[#191D1A] text-white shadow-md font-bold"
                      : isToday
                      ? "bg-[#F6F3EC] text-[#1C1917] font-semibold"
                      : "text-[#57534E] hover:bg-[#F6F3EC]"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase leading-none opacity-80">
                    {DAY_LABELS[i]}
                  </span>
                  <span className="text-sm font-bold leading-none tabular-nums mt-1.5">
                    {shortDay(date)}
                  </span>
                  {/* Bottom indicator dot */}
                  <div className="flex gap-1 h-1 mt-1.5">
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                    )}
                    {!isSelected && pending > 0 && (
                      <span className="w-1 h-1 rounded-full bg-[#E05A47]" />
                    )}
                    {!isSelected && done > 0 && (
                      <span className="w-1 h-1 rounded-full bg-[#2D6A4F]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Overdue Tasks Banner (if any) */}
          {overdueTasks.length > 0 && (
            <div className="mb-4 bg-rose-50/60 rounded-3xl p-4 border border-rose-200/70">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-[#C94A38] shrink-0" />
                <span className="text-xs font-bold text-[#C94A38] uppercase tracking-wider">
                  Overdue · {overdueTasks.length} tasks
                </span>
              </div>
              <div className="space-y-2.5">
                {overdueTasks.map((t) => (
                  <TaskCardItem
                    key={t.id}
                    task={t}
                    projectName={activeProject?.name}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={setEditingTask}
                    onFocus={startFocusOnTask}
                    isOverdue
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Tasks List */}
          {tasksForDate.length === 0 && overdueTasks.length === 0 ? (
            <div className="bg-[#FCFBF9] rounded-[28px] p-8 border border-[#1C1917]/[0.06] text-center shadow-xs">
              <Sparkles className="w-7 h-7 text-[#2D6A4F] mx-auto mb-2 opacity-80" />
              <h3 className="font-serif italic text-2xl text-[#1C1917]">
                No tasks in {activeProject?.name || "this workspace"} for this date
              </h3>
              <p className="text-xs text-[#57534E] max-w-xs mx-auto mt-1 mb-5 leading-relaxed">
                Schedule high-cognitive deep work or execution tasks to maintain cadence.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={openAddTask}
                  type="button"
                  className="bg-[#E05A47] hover:bg-[#C94A38] text-white px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task to {activeProject?.name || "Workspace"}
                </button>
                <button
                  onClick={() =>
                    handleAddTask(
                      "Deep Work Sprint (90m)",
                      "Cognitive deep work",
                      selectedDate,
                      "high",
                      selectedProject
                    )
                  }
                  type="button"
                  className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                >
                  + Deep Work Sprint (90m)
                </button>
                <button
                  onClick={() =>
                    handleAddTask(
                      "Architecture & System Review",
                      "Code review",
                      selectedDate,
                      "medium",
                      selectedProject
                    )
                  }
                  type="button"
                  className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                >
                  + System Review
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksForDate.map((t) => (
                <TaskCardItem
                  key={t.id}
                  task={t}
                  projectName={activeProject?.name}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={setEditingTask}
                  onFocus={startFocusOnTask}
                />
              ))}
            </div>
          )}

          {/* Completed Tasks For Selected Date */}
          {completedForDate.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-[#1C1917]/[0.08]" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
                  Completed · {completedForDate.length}
                </p>
                <div className="h-px flex-1 bg-[#1C1917]/[0.08]" />
              </div>
              <div className="space-y-2.5">
                {completedForDate.map((t) => (
                  <TaskCardItem
                    key={t.id}
                    task={t}
                    projectName={activeProject?.name}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={setEditingTask}
                    onFocus={startFocusOnTask}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── VIEW 2: History Mode ("Execution Archive" — image_cc4fd8.jpg) ── */
        <div className="space-y-5">
          {/* Execution Velocity Hero Card */}
          <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[28px] p-5 shadow-xl border border-white/[0.06]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-stone-300">
                {new Date().toLocaleString("en-US", { month: "long" }).toUpperCase()} EXECUTION ARCHIVE
              </span>
              <span className="bg-[#2D6A4F]/60 text-[#6EE7B7] rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                ✓ {completionRatePct}% COMPLETION
              </span>
            </div>

            {/* 3-Column Metrics Row */}
            <div className="grid grid-cols-3 gap-2.5 text-center my-4">
              <div className="bg-white/[0.04] rounded-2xl py-2.5 px-2">
                <div className="text-xl font-bold text-white mt-1">{totalCompleted}</div>
                <div className="font-serif italic text-sm text-stone-300">items done</div>
              </div>
              <div className="bg-white/[0.06] rounded-2xl py-2.5 px-2 border border-white/[0.06]">
                <div className="text-xl font-bold text-[#E05A47] mt-1">{estimatedFocusHours}</div>
                <div className="font-serif italic text-sm text-stone-300">focus hrs</div>
              </div>
              <div className="bg-white/[0.04] rounded-2xl py-2.5 px-2">
                <div className="text-xl font-bold text-[#6EE7B7] mt-1">24</div>
                <div className="font-serif italic text-sm text-stone-300">day streak</div>
              </div>
            </div>

            <p className="text-xs text-stone-300 flex items-center gap-2 pt-3 border-t border-white/[0.08]">
              Orbit auto-logged {totalCompleted} circadian flow blocks with zero context switching.
            </p>
          </div>

          {/* Chronological Date-Grouped Archive Cards */}
          {historyGroups.length === 0 ? (
            <div className="bg-[#FCFBF9] rounded-[28px] p-8 border border-[#1C1917]/[0.06] text-center shadow-xs">
              <History className="w-6 h-6 text-[#8C857B] mx-auto mb-2" />
              <p className="font-serif text-lg text-[#1C1917]">No completed tasks yet</p>
              <p className="text-xs text-[#57534E] mt-1">
                Complete daily focus blocks to build compounding momentum.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {historyGroups.map(([date, taskList]) => (
                <div key={date}>
                  {/* Date Header Row */}
                  <div className="flex items-center justify-between mb-2.5 mt-2">
                    <h3 className="font-serif text-xl text-[#1C1917]">
                      {formatGroupDate(date)}
                    </h3>
                    <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-3 py-1 text-[10px] font-semibold">
                      {taskList.length} tasks · {taskList.length * 25}m deep focus
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5">
                    {taskList.map((task) => {
                      const thumb = resolveTaskThumbnail(task.title, activeProject?.name);
                      return (
                        <div
                          key={task.id}
                          className="bg-[#FCFBF9] rounded-[24px] p-3.5 border border-[#1C1917]/[0.06] shadow-2xs flex items-center gap-3.5"
                        >
                          {/* Left Photo with Green Checkmark Badge */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden relative shrink-0 shadow-2xs bg-[#EFECE4]">
                            <img
                              src={thumb}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          </div>

                          {/* Middle Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-[#1C1917] truncate leading-tight">
                                {task.title}
                              </p>
                              {task.completedAt && (
                                <span className="text-[11px] font-mono text-[#8C857B] shrink-0">
                                  {formatTime(task.completedAt)}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="bg-[#EFECE4] text-[#1C1917] rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                                {activeProject?.name || "Workspace"}
                              </span>
                              {task.priority && (
                                <span className="bg-[#FADCD5]/80 text-[#C94A38] rounded-full px-2 py-0.5 text-[10px] font-bold">
                                  {task.priority === "high" ? "High Impact" : "Execution"}
                                </span>
                              )}
                              <span className="bg-[#D1FAE5] text-[#1B4332] rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                                ⏱ 25m Logged
                              </span>
                            </div>
                          </div>

                          {/* Action */}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            type="button"
                            className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Editorial Footer Quote */}
          <div className="text-center py-6 pt-8">
            <p className="font-serif italic text-base text-[#57534E]">
              &ldquo;Consistency compounds quietly.&rdquo;
            </p>
            <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#8C857B] mt-1">
              DAILY RITUAL ARCHIVE
            </p>
          </div>
        </div>
      )}
        </>
      )}

      {/* ── 7. VIEW 3: Portaled "Schedule Deep Work or Task" Composer (image_cc4f9d.jpg) ── */}
      {showAddTask && (
        <TaskComposerModal
          defaultDate={selectedDate}
          projects={projects}
          selectedProjectId={selectedProject}
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskComposerModal
          defaultDate={editingTask.dueDate || selectedDate}
          initialTask={editingTask}
          projects={projects}
          selectedProjectId={editingTask.projectId || selectedProject}
          onSave={(updates) => handleUpdateTask(editingTask.id, updates)}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <AddProjectModal
          onAdd={handleAddProject}
          onClose={() => setShowAddProject(false)}
        />
      )}
    </div>
  );
}

// ── Photo-Backed Scheduled Task Card Component (image_cc501e.jpg) ──────────────
function TaskCardItem({
  task,
  projectName,
  onToggle,
  onDelete,
  onEdit,
  onFocus,
  isOverdue = false,
}: {
  task: Task;
  projectName?: string;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Task) => void;
  onFocus: (t: Task) => void;
  isOverdue?: boolean;
}) {
  const done = task.status === "completed";
  const priority = task.priority;
  const thumb = resolveTaskThumbnail(task.title, projectName);

  const energyLabel =
    priority === "high"
      ? "MORNING DEEP"
      : priority === "medium"
      ? "AFTERNOON"
      : "EVENING RESTORATION";

  return (
    <div
      className={cn(
        "bg-[#FCFBF9] rounded-[24px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs flex items-center gap-3.5 transition-all",
        done && "opacity-60 bg-[#F6F3EC]",
        isOverdue && !done && "border-rose-200/80 bg-rose-50/30"
      )}
    >
      {/* Left Photo (w-14 h-14) */}
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-2xs bg-[#EFECE4]">
        <img
          src={thumb}
          alt={task.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Middle Info */}
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => !done && onEdit(task)}
      >
        <p className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B] truncate">
          {energyLabel} · {projectName ? projectName.toUpperCase() : "WORKSPACE"}
        </p>
        <h3
          className={cn(
            "font-sans font-bold text-[15px] text-[#1C1917] leading-snug line-clamp-1 mt-0.5",
            done && "line-through text-[#8C857B]"
          )}
        >
          {task.title}
        </h3>

        {/* Meta Pills Row: Never let "High Impact" wrap */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {priority === "high" && (
            <span className="whitespace-nowrap rounded-lg px-2 py-0.5 text-[10px] font-bold bg-[#FADCD5]/80 text-[#C94A38]">
              High Impact
            </span>
          )}
          {priority === "medium" && (
            <span className="whitespace-nowrap rounded-lg px-2 py-0.5 text-[10px] font-medium bg-[#EFECE4] text-[#57534E]">
              Medium Execution
            </span>
          )}
          {priority === "low" && (
            <span className="whitespace-nowrap rounded-lg px-2 py-0.5 text-[10px] font-medium bg-[#EFECE4] text-[#57534E]">
              Light Admin
            </span>
          )}
          <span className="text-[11px] font-mono text-[#8C857B] whitespace-nowrap">
            {task.dueDate ? formatShortDate(task.dueDate) : "Today"}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!done && (
          <button
            onClick={() => onFocus(task)}
            type="button"
            className="bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-full px-3 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Focus on task"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>Focus</span>
          </button>
        )}

        <button
          onClick={() => onToggle(task)}
          type="button"
          aria-label={done ? "Mark incomplete" : "Complete task"}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
            done
              ? "bg-[#2D6A4F] text-white"
              : "bg-[#EFECE4] hover:bg-[#2D6A4F] hover:text-white text-[#57534E]"
          )}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

// ── Portaled "Schedule Deep Work or Task" Composer Modal (image_cc4f9d.jpg bottom half) ──
function TaskComposerModal({
  defaultDate,
  initialTask,
  projects,
  selectedProjectId,
  onAdd,
  onSave,
  onClose,
}: {
  defaultDate: string;
  initialTask?: Task;
  projects: Project[];
  selectedProjectId: string;
  onAdd?: (
    title: string,
    desc: string,
    dueDate: string,
    priority: TaskPriority | "none",
    projectId?: string
  ) => void;
  onSave?: (updates: Partial<Task>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [desc, setDesc] = useState(initialTask?.description ?? "");
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? defaultDate);
  const [priority, setPriority] = useState<TaskPriority | "none">(
    initialTask?.priority ?? "high"
  );
  const [activeProjectId, setActiveProjectId] = useState(
    initialTask?.projectId ?? selectedProjectId
  );
  const [focusBlocks, setFocusBlocks] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const activeProjectName =
    projects.find((p) => p.id === activeProjectId)?.name || "Workspace";

  // Real-time matched photograph preview
  const matchedPhoto = useMemo(
    () => resolveTaskThumbnail(title, activeProjectName),
    [title, activeProjectName]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    if (initialTask && onSave) {
      onSave({
        title: title.trim(),
        description: desc.trim() || "",
        dueDate,
        priority: priority === "none" ? null : priority,
        projectId: activeProjectId,
      });
    } else if (onAdd) {
      onAdd(title.trim(), desc.trim(), dueDate, priority, activeProjectId);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#191D1A]/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center sm:p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Schedule Deep Work or Task"
        className="relative w-full max-w-lg bg-[#FCFBF9] text-[#1C1917] rounded-t-[32px] sm:rounded-[32px] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#1C1917]/10 animate-slide-up"
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-6 pt-5 pb-3 bg-[#FCFBF9] border-b border-[#1C1917]/[0.06] flex items-start justify-between gap-3">
          <div>
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-[#2D6A4F] block">
              EXECUTION ARCHITECTURE
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] mt-0.5 leading-tight">
              {initialTask ? "Edit Deep Work Task" : "Schedule Deep Work or Task"}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* 1. Task Objective Input Box with Live Matched Thumbnail */}
          <div className="bg-[#F6F3EC] rounded-[22px] p-3.5 flex items-center justify-between gap-3 border border-[#1C1917]/[0.06]">
            <div className="min-w-0 flex-1">
              <label className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block">
                TASK OBJECTIVE
              </label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                aria-label="Task title"
                className="w-full bg-transparent text-sm font-bold text-[#1C1917] focus:outline-none mt-1 placeholder:text-stone-400 placeholder:font-normal"
              />
              <div className="text-[11px] text-[#57534E] flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                <span>
                  Cognitive Load:{" "}
                  {priority === "high"
                    ? "High Focus"
                    : priority === "medium"
                    ? "Medium Execution"
                    : "Light Admin"}
                </span>
              </div>
            </div>

            {/* Live Auto-Matched Photo Preview */}
            <div className="w-14 h-14 rounded-2xl overflow-hidden relative shrink-0 shadow-2xs bg-[#EFECE4]">
              <img
                src={matchedPhoto}
                alt="Matched"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-[#2D6A4F]/90 text-white text-[8px] font-bold text-center py-0.5">
                ✓ Matched
              </div>
            </div>
          </div>

          {/* Optional Notes Input (Preserves Test & Integration Contracts) */}
          <div>
            <label className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block mb-1">
              NOTES (OPTIONAL)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Add key deliverables, links, or execution context..."
              rows={2}
              className="w-full bg-[#F6F3EC] rounded-2xl p-3 text-xs text-[#1C1917] border border-[#1C1917]/[0.06] focus:outline-none focus:border-[#E05A47] resize-none"
            />
          </div>

          {/* 2. Domain Workspace Selector Pills */}
          <div>
            <label className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block mb-1.5">
              DOMAIN WORKSPACE
            </label>
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
              {projects.map((p) => {
                const active = activeProjectId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProjectId(p.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      active
                        ? "bg-[#191D1A] text-white shadow-xs"
                        : "bg-[#EFECE4] text-[#57534E] hover:text-[#1C1917]"
                    )}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Circadian Energy Window / Priority (3 Columns) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B]">
                CIRCADIAN ENERGY WINDOW
              </span>
              <span className="text-[10px] text-[#2D6A4F] font-bold">
                Optimal Window Matched
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Morning Deep */}
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all cursor-pointer",
                  priority === "high"
                    ? "bg-[#FADCD5]/80 border-[#E05A47]/40 text-[#991B1B] shadow-2xs font-bold"
                    : "bg-[#F6F3EC] border-[#1C1917]/[0.06] text-[#57534E] hover:text-[#1C1917]"
                )}
              >
                <Sunrise className="w-4 h-4 mx-auto mb-1 text-[#E05A47]" />
                <p className="text-xs font-bold leading-tight">Morning Deep</p>
                <p className="text-[10px] opacity-75 mt-0.5">High Load</p>
              </button>

              {/* Afternoon Execution */}
              <button
                type="button"
                onClick={() => setPriority("medium")}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all cursor-pointer",
                  priority === "medium"
                    ? "bg-[#FEF3C7] border-[#F59E0B]/40 text-[#92400E] shadow-2xs font-bold"
                    : "bg-[#F6F3EC] border-[#1C1917]/[0.06] text-[#57534E] hover:text-[#1C1917]"
                )}
              >
                <Sun className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <p className="text-xs font-bold leading-tight">Afternoon</p>
                <p className="text-[10px] opacity-75 mt-0.5">Med Load</p>
              </button>

              {/* Evening Restoration / Admin */}
              <button
                type="button"
                onClick={() => setPriority("low")}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all cursor-pointer",
                  priority === "low"
                    ? "bg-[#E0F2E9] border-[#2D6A4F]/40 text-[#1B4332] shadow-2xs font-bold"
                    : "bg-[#F6F3EC] border-[#1C1917]/[0.06] text-[#57534E] hover:text-[#1C1917]"
                )}
              >
                <Moon className="w-4 h-4 mx-auto mb-1 text-[#2D6A4F]" />
                <p className="text-xs font-bold leading-tight">Evening</p>
                <p className="text-[10px] opacity-75 mt-0.5">Low Load</p>
              </button>
            </div>
          </div>

          {/* 4. Assigned Slot & Focus Target 2-Column Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Assigned Slot */}
            <div className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.06]">
              <span className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> ASSIGNED SLOT
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-[#1C1917] mt-1.5 focus:outline-none"
              />
            </div>

            {/* Focus Target Stepper */}
            <div className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> FOCUS TARGET
                </span>
                <p className="text-xs font-bold text-[#1C1917] mt-1">
                  {focusBlocks * 25} min
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white rounded-full p-0.5 shadow-2xs border border-[#1C1917]/[0.06]">
                <button
                  type="button"
                  onClick={() => setFocusBlocks((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[#57534E] hover:bg-[#EFECE4] cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-bold px-1 tabular-nums">
                  {focusBlocks}
                </span>
                <button
                  type="button"
                  onClick={() => setFocusBlocks((prev) => Math.min(6, prev + 1))}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[#57534E] hover:bg-[#EFECE4] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-3.5 text-sm font-semibold shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {initialTask ? "Save Changes →" : "Schedule into Today's Rhythm →"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-[#8C857B] hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Add Project / Workspace Modal ─────────────────────────────────────────────
function AddProjectModal({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#191D1A]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New workspace"
        className="relative bg-[#FCFBF9] text-[#1C1917] rounded-[32px] w-full max-w-md p-6 shadow-2xl border border-[#1C1917]/10 animate-slide-up"
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1C1917]/[0.06]">
          <h3 className="font-serif italic text-2xl text-[#1C1917]">New Workspace</h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] flex items-center justify-center text-[#1C1917] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#1C1917] block mb-1">
              Workspace Name *
            </label>
            <input
              autoFocus
              className="w-full bg-[#F6F3EC] rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#1C1917] border border-[#1C1917]/10 focus:outline-none focus:border-[#E05A47]"
              placeholder="e.g. SATAT Ops, Core System, Vitality"
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
                  aria-label={`Select color ${c}`}
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
              Create Workspace
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

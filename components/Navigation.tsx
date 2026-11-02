"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  CheckSquare,
  Dumbbell,
  Utensils,
  LogOut,
  User,
  LayoutDashboard,
  Settings,
  Plus,
  Menu,
  Search,
  Zap,
  Camera,
  RotateCcw,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "@/components/ui/NotificationBell";
import TrackSheet from "@/components/navigation/TrackSheet";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";
import { OrbitLauncherBadge } from "@/components/orbit/OrbitLauncherBadge";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import { getProjects } from "@/lib/firestore";
import type { Project } from "@/types";
import Logo from "@/components/Logo";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { firebaseUser, isReady } = useFirebaseAuth();
  const userId = firebaseUser?.uid ?? (session?.user as any)?.id ?? session?.user?.email ?? "";

  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTrackSheet, setShowTrackSheet] = useState(false);
  const [dpError, setDpError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load user projects dynamically for WORKSPACES rail
  useEffect(() => {
    if (!userId || !firebaseUser || !isReady) return;
    let cancelled = false;
    getProjects(userId)
      .then((ps) => {
        if (!cancelled) setProjects(ps);
      })
      .catch((err) => {
        console.warn("[Navigation] Could not load projects for rail:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, firebaseUser, isReady]);

  // Global Orbit trigger
  useEffect(() => {
    const handleOrbitTrigger = () => {
      if (pathname !== "/dashboard/orbit") {
        router.push("/dashboard/orbit");
      }
    };
    window.addEventListener("satat:open-orbit", handleOrbitTrigger);
    return () => window.removeEventListener("satat:open-orbit", handleOrbitTrigger);
  }, [pathname, router]);

  // Global Cmd+K / Ctrl+K shortcut for command search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [showProfileMenu]);

  // Breadcrumb / Mobile section label
  const getSectionName = () => {
    if (pathname === "/dashboard") return "Today";
    if (pathname?.startsWith("/dashboard/tasks")) return "Plan";
    if (pathname?.startsWith("/dashboard/workout")) return "Train";
    if (pathname?.startsWith("/dashboard/diet")) return "Fuel";
    if (pathname?.startsWith("/dashboard/orbit")) return "Orbit";
    if (pathname?.startsWith("/dashboard/settings")) return "Settings";
    return "";
  };

  const getMobileSection = getSectionName;

  // Context-aware CTA button configuration
  const getContextCTA = () => {
    if (pathname === "/dashboard") {
      return {
        label: "+ Quick Track",
        icon: Plus,
        action: () => setShowTrackSheet(true),
      };
    }
    if (pathname?.startsWith("/dashboard/tasks")) {
      return {
        label: "+ New Task",
        icon: Plus,
        action: () => router.push("/dashboard/tasks?action=new"),
      };
    }
    if (pathname?.startsWith("/dashboard/workout")) {
      return {
        label: "+ Quick Track",
        icon: Plus,
        action: () => setShowTrackSheet(true),
      };
    }
    if (pathname?.startsWith("/dashboard/diet")) {
      return {
        label: "+ Scan Meal",
        icon: Camera,
        action: () => router.push("/dashboard/diet?action=scan"),
      };
    }
    if (pathname?.startsWith("/dashboard/orbit")) {
      return {
        label: "↻ New Chat",
        icon: RotateCcw,
        action: () => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("satat:reset-orbit"));
          }
        },
      };
    }
    return {
      label: "+ Quick Track",
      icon: Plus,
      action: () => setShowTrackSheet(true),
    };
  };

  const contextCTA = getContextCTA();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/orbit?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      searchInputRef.current?.blur();
    }
  };

  // Nav item descriptors
  const navItems = [
    {
      href: "/dashboard",
      label: "Today",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/tasks",
      label: "Plan · Execution",
      shortLabel: "Plan",
      icon: CheckSquare,
      isActive: pathname?.startsWith("/dashboard/tasks"),
    },
    {
      href: "/dashboard/workout",
      label: "Train · Studio",
      shortLabel: "Train",
      icon: Dumbbell,
      isActive: pathname?.startsWith("/dashboard/workout"),
    },
    {
      href: "/dashboard/diet",
      label: "Fuel · Nutrition",
      shortLabel: "Fuel",
      icon: Utensils,
      isActive: pathname?.startsWith("/dashboard/diet"),
    },
    {
      href: "/dashboard/orbit",
      label: "Orbit AI",
      shortLabel: "Orbit",
      isOrbit: true,
      isActive: pathname?.startsWith("/dashboard/orbit"),
    },
  ];

  return (
    <>
      {/* ── 1. RESPONSIVE LEFT NAVIGATION RAIL (Tablet md:w-[76px], Desktop lg:w-[240px], Collapsible) ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-[#F6F3EC] border-r border-[#1C1917]/[0.08] transition-all duration-200 select-none",
          collapsed ? "w-[76px]" : "w-[76px] lg:w-[240px]"
        )}
      >
        {/* Top Brand Row */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1C1917]/[0.06] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setCollapsed(!collapsed)}
              type="button"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle navigation drawer"
              className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#1C1917] transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className={cn("items-center gap-2", collapsed ? "hidden" : "hidden lg:flex")}>
              <span className="font-serif font-bold text-xl tracking-tight text-[#1C1917]">
                SATAT
              </span>
              <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-2 py-0.5 text-[10px] font-bold">
                OS v2.4
              </span>
            </div>
          </div>
          <div className={cn(collapsed ? "flex mx-auto" : "flex lg:hidden")}>
            <Logo size={24} className="rounded-md" priority />
          </div>
        </div>

        {/* Primary Navigation Stack */}
        <nav className="px-3 py-3 space-y-1.5 flex-1 overflow-y-auto no-scrollbar" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isOrbit = item.isOrbit;

            // Inactive Orbit styling vs normal inactive
            const inactiveClass = isOrbit
              ? "bg-[#191D1A] text-[#FCFBF9] hover:bg-[#2D6A4F] shadow-2xs"
              : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFECE4]/70";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.isActive ? "page" : undefined}
                title={item.label}
                className={cn(
                  "rounded-full transition-all duration-200 flex items-center group relative",
                  collapsed
                    ? "w-11 h-11 mx-auto justify-center"
                    : "w-11 h-11 mx-auto lg:w-full lg:h-auto lg:px-4 lg:py-2.5 lg:justify-start lg:gap-3",
                  item.isActive
                    ? "bg-[#2D6A4F] text-white font-semibold shadow-[0_4px_12px_rgba(45,106,79,0.28)]"
                    : inactiveClass
                )}
              >
                {/* Icon */}
                <div className="shrink-0 flex items-center justify-center">
                  {isOrbit ? (
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Orbit3DCore size="sm" state="idle" />
                    </div>
                  ) : (
                    Icon && (
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          item.isActive ? "stroke-[2.4]" : "stroke-[1.8]"
                        )}
                        aria-hidden="true"
                      />
                    )
                  )}
                </div>

                {/* Expanded Label */}
                <span
                  className={cn(
                    "text-xs tracking-tight truncate",
                    collapsed ? "hidden" : "hidden lg:inline"
                  )}
                >
                  {item.label}
                </span>

                {/* Subtle active indicator dot when collapsed */}
                {item.isActive && (collapsed || undefined) && (
                  <span className="absolute -right-1 top-1 w-2 h-2 rounded-full bg-[#6EE7B7] lg:hidden ring-2 ring-[#F6F3EC]" />
                )}
              </Link>
            );
          })}

          {/* Dynamic WORKSPACES Section (Only visible on Desktop when expanded) */}
          <div
            className={cn(
              "pt-5 mt-4 border-t border-[#1C1917]/[0.06] space-y-1.5",
              collapsed ? "hidden" : "hidden lg:block px-1"
            )}
          >
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B]">
                WORKSPACES
              </span>
              <Link
                href="/dashboard/tasks?action=new_project"
                className="text-[10px] font-semibold text-[#2D6A4F] hover:underline"
              >
                + New
              </Link>
            </div>

            {projects.length > 0 ? (
              projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/tasks?project=${p.id}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFECE4]/60 transition-colors truncate"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || "#2D6A4F" }}
                  />
                  <span className="truncate">{p.name}</span>
                </Link>
              ))
            ) : (
              <Link
                href="/dashboard/tasks?action=new_project"
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#8C857B] hover:text-[#1C1917] transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>+ New Workspace</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Bottom Status Card & User Bar */}
        <div className="mt-auto p-3 shrink-0 border-t border-[#1C1917]/[0.06] space-y-2">
          {/* Bottom Streak Status Card */}
          <div
            className={cn(
              "bg-[#FCFBF9] border border-[#1C1917]/[0.06] rounded-2xl p-2.5 shadow-2xs flex items-center gap-2.5",
              collapsed ? "justify-center" : "justify-center lg:justify-start"
            )}
          >
            <div className="w-7 h-7 rounded-xl bg-[#E0F2E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-[#2D6A4F] fill-[#2D6A4F]" />
            </div>
            <div className={cn("min-w-0", collapsed ? "hidden" : "hidden lg:block")}>
              <div className="text-[11px] font-bold text-[#1C1917] truncate">All Systems Synced</div>
              <div className="text-[10px] text-[#8C857B] truncate">Circadian Flow Online</div>
            </div>
          </div>

          {/* User Profile Area */}
          {session?.user && (
            <div
              className={cn(
                "flex items-center justify-between p-1.5 rounded-2xl hover:bg-black/5 transition-colors",
                collapsed ? "justify-center" : "justify-center lg:justify-between"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#191D1A] text-white flex items-center justify-center overflow-hidden shrink-0">
                  {session.user.image && !dpError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-full h-full object-cover"
                      onError={() => setDpError(true)}
                    />
                  ) : (
                    <span className="text-[11px] font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || "A"}
                    </span>
                  )}
                </div>
                <div className={cn("min-w-0", collapsed ? "hidden" : "hidden lg:block")}>
                  <p className="text-xs font-semibold text-[#1C1917] truncate">
                    {session.user.name?.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-[#8C857B] truncate">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                aria-label="Sign out"
                className={cn(
                  "p-1.5 rounded-lg text-[#E05A47] hover:bg-[#E05A47]/10 transition-colors shrink-0",
                  collapsed ? "hidden" : "hidden lg:flex"
                )}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── 2. UNIFIED STICKY TOP COMMAND BAR ON TABLET & DESKTOP (md: & lg:) ── */}
      <header
        className={cn(
          "hidden md:flex h-16 px-4 md:px-8 items-center justify-between gap-4 border-b border-[#1C1917]/[0.06] bg-[#F6F3EC]/90 backdrop-blur-md fixed top-0 right-0 z-30 transition-all duration-200",
          collapsed ? "left-[76px]" : "left-[76px] lg:left-[240px]"
        )}
      >
        {/* Left: Breadcrumbs + Status indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs tracking-tight">
            <span className="font-bold tracking-tight text-[#1C1917]">SATAT</span>
            {getSectionName() && (
              <>
                <span className="text-[#8C857B] font-light">/</span>
                <span className="font-semibold text-[#1C1917]">{getSectionName()}</span>
              </>
            )}
          </div>
          <span className="bg-[#E0F2E9] text-[#2D6A4F] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
            <span>Synced</span>
          </span>
        </div>

        {/* Center: YouTube-style Rounded-Full Command & Orbit Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-[460px] mx-auto items-center"
        >
          <div className="w-full bg-[#FCFBF9] border border-[#1C1917]/[0.08] hover:border-[#1C1917]/[0.16] focus-within:border-[#2D6A4F] rounded-full px-4 py-2 flex items-center justify-between gap-2.5 text-xs text-[#8C857B] shadow-2xs transition-colors">
            <Search className="w-3.5 h-3.5 text-[#8C857B] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search habits, nutrition, cadence or ask Orbit..."
              className="bg-transparent text-[#1C1917] placeholder-[#8C857B] focus:outline-hidden text-xs flex-1 min-w-0"
            />
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#8C857B] bg-[#EFECE4] border border-[#1C1917]/[0.08] rounded px-1.5 py-0.5 shrink-0 select-none">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>
        </form>

        {/* Right: Context CTA + OrbitLauncherBadge + NotificationBell + Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Context-aware primary Terracotta CTA */}
          <button
            type="button"
            onClick={contextCTA.action}
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>{contextCTA.label}</span>
          </button>

          {/* Rounded-square 3D Orbit Launcher Badge */}
          <OrbitLauncherBadge size="md" tooltipPosition="bottom" />

          {/* Bell */}
          <NotificationBell />

          {/* User Avatar & Dropdown */}
          {session?.user ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu((v) => !v)}
                type="button"
                title="Account menu"
                aria-label="Open account menu"
                aria-expanded={showProfileMenu}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[#191D1A] text-white shadow-xs border border-white/10 transition-transform active:scale-95 overflow-hidden"
              >
                {session.user.image && !dpError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setDpError(true)}
                  />
                ) : session.user.name ? (
                  <span className="text-xs font-semibold text-[#FCFBF9]">
                    {session.user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="w-4 h-4 text-[#8C857B]" />
                )}
              </button>

              {/* Profile dropdown */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50 animate-scale-in bg-[#FCFBF9] border border-[#1C1917]/[0.08] shadow-lg"
                >
                  <div className="px-4 py-3 border-b border-[#1C1917]/[0.06]">
                    <p className="text-xs font-semibold text-[#1C1917] truncate">
                      {session.user.name}
                    </p>
                    <p className="text-[11px] text-[#8C857B] truncate mt-0.5">
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-[#57534E] hover:bg-black/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings & Profile</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-[#E05A47] hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#191D1A] text-white/60 border border-white/10">
              <User className="w-4 h-4 text-[#8C857B]" />
            </div>
          )}
        </div>
      </header>

      {/* ── 3. MOBILE TOP HEADER (SATAT / <Section>, bell, avatar — STRICTLY md:hidden) ── */}
      {pathname !== "/dashboard/orbit" && (
        <header className="app-mobile-header md:hidden">
          <div className="app-mobile-context flex items-center gap-2">
            <Logo size={22} className="rounded-md" priority />
            <div className="app-mobile-page-title flex items-center gap-1.5 text-sm tracking-tight">
              <span className="font-bold tracking-tight text-[var(--text-primary)]">SATAT</span>
              {getMobileSection() && (
                <>
                  <span className="text-[#8C857B] font-light">/</span>
                  <span className="font-semibold text-[var(--text-primary)]">{getMobileSection()}</span>
                </>
              )}
            </div>
          </div>

          <div className="app-mobile-actions flex items-center gap-2">
            {/* Top Header Orbit 3D Emblem Badge */}
            {pathname !== "/dashboard/orbit" && (
              <OrbitLauncherBadge size="md" tooltipPosition="bottom" />
            )}

            <NotificationBell />
            {session?.user ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setShowProfileMenu((v) => !v)}
                  type="button"
                  title="Account menu"
                  aria-label="Open account menu"
                  aria-expanded={showProfileMenu}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-[#191D1A] text-white shadow-sm border border-white/10 transition-transform active:scale-95 overflow-hidden"
                >
                  {session.user.image && !dpError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-full h-full rounded-full object-cover"
                      onError={() => setDpError(true)}
                    />
                  ) : session.user.name ? (
                    <span className="text-xs font-semibold text-[#FCFBF9]">
                      {session.user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-4 h-4 text-[#8C857B]" />
                  )}
                </button>

                {/* Profile dropdown */}
                {showProfileMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50 animate-scale-in"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-dialog)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {session.user.name}
                      </p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {session.user.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings & Profile</span>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-red-500/10"
                      style={{ color: "var(--error)" }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#191D1A] text-white/60 border border-white/10">
                <User className="w-4 h-4 text-[#8C857B]" />
              </div>
            )}
          </div>
        </header>
      )}

      {/* ── 4. MOBILE BOTTOM FLOATING CAPSULE DOCK (STRICTLY md:hidden) ── */}
      <nav
        className="fixed left-1/2 -translate-x-1/2 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 w-[calc(100vw-28px)] max-w-[390px] sm:max-w-[460px] h-[62px] rounded-full bg-[#191D1A]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_14px_34px_rgba(0,0,0,0.32)] px-2.5 flex items-center md:hidden"
        aria-label="Primary navigation"
      >
        <div className="grid grid-cols-5 items-center justify-items-center w-full h-full">
          {/* 1. Today */}
          <Link
            href="/dashboard"
            aria-label="Today"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            className={cn(
              "w-[64px] sm:w-[72px] h-[44px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 select-none shrink-0",
              pathname === "/dashboard"
                ? "bg-[#2D6A4F] text-white shadow-[0_4px_12px_rgba(45,106,79,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <LayoutDashboard
              className={cn(
                "w-[18px] h-[18px]",
                pathname === "/dashboard" ? "stroke-[2.2]" : "stroke-[1.75]"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[10px] leading-none tracking-tight",
                pathname === "/dashboard" ? "font-semibold" : "font-medium"
              )}
            >
              Today
            </span>
          </Link>

          {/* 2. Plan */}
          <Link
            href="/dashboard/tasks"
            aria-label="Plan"
            aria-current={pathname?.startsWith("/dashboard/tasks") ? "page" : undefined}
            className={cn(
              "w-[64px] sm:w-[72px] h-[44px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 select-none shrink-0",
              pathname?.startsWith("/dashboard/tasks")
                ? "bg-[#2D6A4F] text-white shadow-[0_4px_12px_rgba(45,106,79,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <CheckSquare
              className={cn(
                "w-[18px] h-[18px]",
                pathname?.startsWith("/dashboard/tasks") ? "stroke-[2.2]" : "stroke-[1.75]"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[10px] leading-none tracking-tight",
                pathname?.startsWith("/dashboard/tasks") ? "font-semibold" : "font-medium"
              )}
            >
              Plan
            </span>
          </Link>

          {/* 3. Quick Track FAB (Terracotta Clay #E05A47) */}
          <div className="flex items-center justify-center w-full h-full select-none">
            <button
              type="button"
              onClick={() => setShowTrackSheet(true)}
              aria-label="Quick track"
              className="w-11 h-11 rounded-full bg-[#E05A47] hover:bg-[#C94A38] active:scale-95 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(224,90,71,0.45)] transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.4]" />
              <span className="sr-only">Track</span>
            </button>
          </div>

          {/* 4. Train */}
          <Link
            href="/dashboard/workout"
            aria-label="Train"
            aria-current={pathname?.startsWith("/dashboard/workout") ? "page" : undefined}
            className={cn(
              "w-[64px] sm:w-[72px] h-[44px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 select-none shrink-0",
              pathname?.startsWith("/dashboard/workout")
                ? "bg-[#2D6A4F] text-white shadow-[0_4px_12px_rgba(45,106,79,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Dumbbell
              className={cn(
                "w-[18px] h-[18px]",
                pathname?.startsWith("/dashboard/workout") ? "stroke-[2.2]" : "stroke-[1.75]"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[10px] leading-none tracking-tight",
                pathname?.startsWith("/dashboard/workout") ? "font-semibold" : "font-medium"
              )}
            >
              Train
            </span>
          </Link>

          {/* 5. Fuel */}
          <Link
            href="/dashboard/diet"
            aria-label="Fuel"
            aria-current={pathname?.startsWith("/dashboard/diet") ? "page" : undefined}
            className={cn(
              "w-[64px] sm:w-[72px] h-[44px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 select-none shrink-0",
              pathname?.startsWith("/dashboard/diet")
                ? "bg-[#2D6A4F] text-white shadow-[0_4px_12px_rgba(45,106,79,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Utensils
              className={cn(
                "w-[18px] h-[18px]",
                pathname?.startsWith("/dashboard/diet") ? "stroke-[2.2]" : "stroke-[1.75]"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[10px] leading-none tracking-tight",
                pathname?.startsWith("/dashboard/diet") ? "font-semibold" : "font-medium"
              )}
            >
              Fuel
            </span>
          </Link>
        </div>
      </nav>

      {/* Quick Track Sheet Modal */}
      <TrackSheet isOpen={showTrackSheet} onClose={() => setShowTrackSheet(false)} />
    </>
  );
}

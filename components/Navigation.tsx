"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  CheckSquare, Dumbbell, Utensils, LogOut, User,
  LayoutDashboard, Settings, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "@/components/ui/NotificationBell";
import TrackSheet from "@/components/navigation/TrackSheet";
import { OrbitMark } from "@/components/orbit/OrbitMark";
import Logo from "@/components/Logo";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTrackSheet, setShowTrackSheet] = useState(false);
  const [dpError, setDpError] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle global satat:open-orbit event by navigating to /dashboard/orbit
  useEffect(() => {
    const handleOrbitTrigger = () => {
      if (pathname !== "/dashboard/orbit") {
        router.push("/dashboard/orbit");
      }
    };
    window.addEventListener("satat:open-orbit", handleOrbitTrigger);
    return () => window.removeEventListener("satat:open-orbit", handleOrbitTrigger);
  }, [pathname, router]);

  // Close profile menu on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [showProfileMenu]);

  // Determine current page section for mobile top bar (SATAT / <Section>)
  const getMobileSection = () => {
    if (pathname === "/dashboard") return "Today";
    if (pathname?.startsWith("/dashboard/tasks")) return "Plan";
    if (pathname?.startsWith("/dashboard/workout")) return "Train";
    if (pathname?.startsWith("/dashboard/diet")) return "Fuel";
    if (pathname?.startsWith("/dashboard/orbit")) return "Orbit";
    if (pathname?.startsWith("/dashboard/settings")) return "Settings";
    return "";
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="app-shell-sidebar hidden lg:flex">
        {/* Logo */}
        <div className="app-shell-brand">
          <Logo size={28} className="rounded-lg" priority />
          <span className="app-shell-brand-name font-bold tracking-tight">satat</span>
        </div>

        {/* Quick Track Action Button */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowTrackSheet(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--brand-subtle)",
              color: "var(--brand)",
              border: "1px solid color-mix(in srgb, var(--brand) 25%, transparent)",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Track</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="app-shell-nav" aria-label="Primary navigation">
          <div className="app-shell-nav-list px-2 space-y-1">
            <Link
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={cn("app-shell-nav-link", pathname === "/dashboard" && "is-active")}
            >
              <LayoutDashboard className="app-shell-nav-icon" aria-hidden="true" />
              <span>Today</span>
            </Link>

            <Link
              href="/dashboard/tasks"
              aria-current={pathname?.startsWith("/dashboard/tasks") ? "page" : undefined}
              className={cn("app-shell-nav-link", pathname?.startsWith("/dashboard/tasks") && "is-active")}
            >
              <CheckSquare className="app-shell-nav-icon" aria-hidden="true" />
              <span>Plan</span>
            </Link>

            <Link
              href="/dashboard/workout"
              aria-current={pathname?.startsWith("/dashboard/workout") ? "page" : undefined}
              className={cn("app-shell-nav-link", pathname?.startsWith("/dashboard/workout") && "is-active")}
            >
              <Dumbbell className="app-shell-nav-icon" aria-hidden="true" />
              <span>Train</span>
            </Link>

            <Link
              href="/dashboard/diet"
              aria-current={pathname?.startsWith("/dashboard/diet") ? "page" : undefined}
              className={cn("app-shell-nav-link", pathname?.startsWith("/dashboard/diet") && "is-active")}
            >
              <Utensils className="app-shell-nav-icon" aria-hidden="true" />
              <span>Fuel</span>
            </Link>

            <Link
              href="/dashboard/orbit"
              aria-current={pathname?.startsWith("/dashboard/orbit") ? "page" : undefined}
              className={cn("app-shell-nav-link", pathname?.startsWith("/dashboard/orbit") && "is-active")}
            >
              <OrbitMark size={18} className="app-shell-nav-icon" />
              <span>Orbit</span>
            </Link>

            <Link
              href="/dashboard/settings"
              aria-current={pathname?.startsWith("/dashboard/settings") ? "page" : undefined}
              className={cn("app-shell-nav-link", pathname?.startsWith("/dashboard/settings") && "is-active")}
            >
              <Settings className="app-shell-nav-icon" aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* User section */}
        {session?.user && (
          <div className="app-shell-account-area">
            <div className="app-shell-account">
              {session.user.image ? (
                <Image src={session.user.image} alt="" width={32} height={32} className="rounded-full" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
                >
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="app-shell-account-name truncate">{session.user.name?.split(" ")[0]}</p>
                <p className="app-shell-account-email truncate">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                aria-label="Sign out"
                className="btn-icon p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "var(--error)" }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile top header (SATAT / <Section>, notification bell, and dark-circle profile) ── */}
      <header className="app-mobile-header lg:hidden">
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

        <div className="app-mobile-actions flex items-center gap-2.5">
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

      {/* ── Mobile bottom navigation (SATAT Stitch Theme: Today, Plan, Track FAB, Train, Fuel) ── */}
      <nav
        className="fixed left-1/2 -translate-x-1/2 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 w-[calc(100vw-28px)] max-w-[390px] sm:max-w-[460px] md:max-w-[560px] lg:max-w-[640px] h-[62px] rounded-full bg-[#191D1A]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_14px_34px_rgba(0,0,0,0.32)] px-2.5 flex items-center lg:hidden"
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

import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { getUserKey } from "@/lib/auth/userKey";
import { PRELAUNCH_EXEMPT_USER_IDS } from "@/lib/onboarding/constants";
import NotificationSettings from "@/components/settings/NotificationSettings";
import HealthSyncSettings from "@/components/settings/HealthSyncSettings";
import OnboardingSetupSettings from "@/components/settings/OnboardingSetupSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import AccountPrivacySettings from "@/components/settings/AccountPrivacySettings";
import { Bell, Watch, Sliders, Palette, User, Shield } from "lucide-react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = getUserKey(session);

  const isDev = process.env.NODE_ENV === "development";
  const isExplicitAllowed = process.env.ALLOW_DEV_RESET === "true";
  const isExempt = userId ? PRELAUNCH_EXEMPT_USER_IDS.includes(userId) : false;
  const adminIds = process.env.ADMIN_USER_IDS
    ? process.env.ADMIN_USER_IDS.split(",").map((s) => s.trim())
    : [];
  const isAdmin = userId ? adminIds.includes(userId) : false;

  const isDevAuthorized = isDev || isExplicitAllowed || isExempt || isAdmin;

  return (
    <div className="w-full max-w-none space-y-6 py-1 animate-fade-in select-none">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] dark:text-[#6E7872]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#34D399]" />
            SYSTEM CALIBRATION
          </div>
          <h1 className="page-title text-2xl sm:text-3xl font-serif tracking-tight text-[#1C1917] dark:text-[#F4F1EA] mt-0.5">
            Settings & Profile
          </h1>
          <p className="page-description text-xs mt-1 text-[#57534E] dark:text-[#9CA39E]">
            Personal operating parameters · Natural circadian rhythm & biometric calibration
          </p>
        </div>
      </div>

      {/* ── 12-Column Responsive Studio Bento Architecture ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* ── LEFT 5 COLUMNS: Identity, Appearance, & Biometrics Setup ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Profile Identity Card */}
          <div className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-5 border border-[#1C1917]/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] dark:text-[#6E7872] mb-3">
              PROFILE IDENTITY
            </div>
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User Avatar"}
                  width={56}
                  height={56}
                  className="rounded-2xl shrink-0 border border-[#1C1917]/10 dark:border-white/10 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-base font-bold bg-[#2D6A4F]/10 dark:bg-[#1E4D38]/40 text-[#2D6A4F] dark:text-[#34D399] border border-[#2D6A4F]/20">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold truncate text-[#1C1917] dark:text-[#F4F1EA]">
                    {session?.user?.name || "Practitioner"}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#E6F4ED] dark:bg-[#13221B] text-[#2D6A4F] dark:text-[#6EE7B7] border border-[#2D6A4F]/20 shrink-0">
                    Active
                  </span>
                </div>
                <p className="text-xs truncate text-[#57534E] dark:text-[#9CA39E] mt-0.5">
                  {session?.user?.email || "Google Account Connected"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8C857B] dark:text-[#6E7872]">
                    <Shield className="w-3 h-3 text-[#2D6A4F] dark:text-[#34D399]" /> Google SSO
                  </span>
                  <span className="text-stone-300 dark:text-white/20">·</span>
                  <span className="text-[10px] font-semibold text-[#8C857B] dark:text-[#6E7872]">
                    Circadian Telemetry Synced
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Interface Appearance Card (3-column visual theme selector) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Palette className="w-4 h-4 text-[#2D6A4F] dark:text-[#34D399]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#9CA39E]">
                Interface Appearance
              </h2>
            </div>
            <AppearanceSettings />
          </div>

          {/* Card 3: SATAT Setup & Biometrics Calibration Card with #E05A47 CTA */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Sliders className="w-4 h-4 text-[#2D6A4F] dark:text-[#34D399]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#9CA39E]">
                Biometrics Calibration
              </h2>
            </div>
            <OnboardingSetupSettings isDevAuthorized={isDevAuthorized} />
          </div>
        </div>

        {/* ── RIGHT 7 COLUMNS: Reminders, Connected Devices, & Privacy/SignOut ── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 4: Notifications & Circadian Reminders Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Bell className="w-4 h-4 text-[#2D6A4F] dark:text-[#34D399]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#9CA39E]">
                Notifications & Circadian Reminders
              </h2>
            </div>
            <NotificationSettings />
          </div>

          {/* Card 5: Connected Devices & Health Sync Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Watch className="w-4 h-4 text-[#2D6A4F] dark:text-[#34D399]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#9CA39E]">
                Connected Devices & Health Sync
              </h2>
            </div>
            <HealthSyncSettings />
          </div>

          {/* Card 6: Data Privacy & Sign Out Card */}
          <AccountPrivacySettings />
        </div>
      </div>
    </div>
  );
}

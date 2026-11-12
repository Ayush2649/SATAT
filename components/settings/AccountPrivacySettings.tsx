"use client";

import { signOut } from "next-auth/react";
import { ShieldCheck, LogOut, Lock, Download } from "lucide-react";
import { useState } from "react";

export default function AccountPrivacySettings() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/" });
    window.location.href = "/";
  };

  return (
    <div className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-5 sm:p-6 border border-[#1C1917]/[0.06] dark:border-white/[0.07] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F] dark:text-[#34D399]" />
          <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F4F1EA]">
            Data Ownership & Privacy
          </h3>
        </div>
        <span className="bg-[#EFECE4] dark:bg-[#1C221E] text-[#57534E] dark:text-[#9CA39E] text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-[#1C1917]/[0.05] dark:border-white/[0.08]">
          <Lock className="w-3 h-3 text-[#2D6A4F] dark:text-[#34D399]" />
          Zero Third-Party Tracking
        </span>
      </div>

      <p className="text-xs text-[#57534E] dark:text-[#9CA39E] leading-relaxed">
        All biometrics, circadian telemetry, and nutrition records are strictly private to your Google account and encrypted at rest in Firestore. SATAT never sells personal biometric telemetry.
      </p>

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#1C1917]/[0.05] dark:border-white/[0.06]">
        <div className="text-[11px] text-[#8C857B] dark:text-[#6E7872]">
          Session authenticated via Google OAuth
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#E05A47] hover:bg-red-500/10 border border-[#E05A47]/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{signingOut ? "Signing Out..." : "Sign Out of SATAT"}</span>
        </button>
      </div>
    </div>
  );
}

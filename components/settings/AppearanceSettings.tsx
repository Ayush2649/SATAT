"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Laptop } from "lucide-react";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-2xl p-4 flex gap-2 animate-pulse bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.06] dark:border-white/[0.07]">
        <div className="h-10 flex-1 bg-black/5 dark:bg-white/5 rounded-xl" />
        <div className="h-10 flex-1 bg-black/5 dark:bg-white/5 rounded-xl" />
        <div className="h-10 flex-1 bg-black/5 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  const options = [
    { id: "dark", label: "Dark (Nocturnal)", icon: Moon },
    { id: "light", label: "Light (Sunlit)", icon: Sun },
    { id: "system", label: "System", icon: Laptop },
  ];

  const handleSelect = (id: string) => {
    setTheme(id);
    if (typeof window !== "undefined") {
      const isDark =
        id === "dark" ||
        (id === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    }
  };

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.06] dark:border-white/[0.07] shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
          Interface Appearance
        </h3>
        <p className="text-xs mt-0.5 text-[#57534E] dark:text-[#9CA39E]">
          Switch between Sunlit Stone (Light) and Nocturnal Botanical (Dark) editorial modes.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map(({ id, label, icon: Icon }) => {
          const isSelected = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-[#2D6A4F]/10 dark:bg-[#1E4D38] border border-[#2D6A4F] dark:border-[#34D399]/40 text-[#2D6A4F] dark:text-[#6EE7B7] shadow-sm"
                  : "bg-[#EFECE4]/60 dark:bg-[#1C221E] border border-[#1C1917]/[0.06] dark:border-white/[0.06] text-[#57534E] dark:text-[#9CA39E] hover:border-[#1C1917]/20 dark:hover:border-white/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

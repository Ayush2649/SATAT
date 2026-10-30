import React, { useState } from "react";
import { X, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

// ── TYPES & HELPERS ─────────────────────────────────────────────────────────────
export type CardioActivity =
  | "walking"
  | "running"
  | "cycling"
  | "swimming"
  | "rowing"
  | "elliptical";

export interface CardioLog {
  id?: string;
  activity: CardioActivity;
  durationMinutes: number;
  caloriesBurned: number;
  distanceKm?: number;
}

interface CardioMetaItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  met: number;
}

export const CARDIO_META: Record<CardioActivity, CardioMetaItem> = {
  walking: { label: "Walking", icon: Flame, unit: "km", met: 3.5 },
  running: { label: "Running", icon: Flame, unit: "km", met: 8.0 },
  cycling: { label: "Cycling", icon: Flame, unit: "km", met: 6.0 },
  swimming: { label: "Swimming", icon: Flame, unit: "km", met: 7.0 },
  rowing: { label: "Rowing", icon: Flame, unit: "km", met: 6.0 },
  elliptical: { label: "Elliptical", icon: Flame, unit: "km", met: 5.0 },
};

export function calcCardioCals(
  activity: CardioActivity,
  durationMinutes: number,
  bodyWeightKg: number
): number {
  const met = CARDIO_META[activity]?.met ?? 4.0;
  // Calories = MET * 3.5 * weight (kg) / 200 * duration (min)
  return Math.round(((met * 3.5 * bodyWeightKg) / 200) * durationMinutes);
}

interface AddCardioModalProps {
  bodyWeightKg: number;
  onAdd: (log: Omit<CardioLog, "id">) => void;
  onClose: () => void;
}

// ── ADD CARDIO MODAL COMPONENT ──────────────────────────────────────────────────
export function AddCardioModal({
  bodyWeightKg,
  onAdd,
  onClose,
}: AddCardioModalProps) {
  const [activity, setActivity] = useState<CardioActivity>("walking");
  const [duration, setDuration] = useState("20");
  const [distance, setDistance] = useState("");

  const meta = CARDIO_META[activity];
  const durationNum = parseFloat(duration) || 0;
  const estCals =
    durationNum > 0 ? calcCardioCals(activity, durationNum, bodyWeightKg) : 0;

  const handleAdd = () => {
    if (!duration || durationNum <= 0) return;
    const log: Omit<CardioLog, "id"> = {
      activity,
      durationMinutes: durationNum,
      caloriesBurned: estCals,
    };
    const parsedDist = parseFloat(distance);
    if (!Number.isNaN(parsedDist) && parsedDist > 0) {
      log.distanceKm = parsedDist;
    }
    onAdd(log);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative rounded-[28px] shadow-2xl w-full max-w-sm p-6 bg-[#FCFBF9] border border-[#1C1917]/[0.08] animate-slide-up text-[#1C1917]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-[#1C1917]">
            Add Cardio & Zone 2
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C857B] hover:text-[#1C1917] p-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activity picker */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block mb-2">
            SELECT ACTIVITY
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CARDIO_META) as CardioActivity[])
              .slice(0, 6)
              .map((act) => {
                const m = CARDIO_META[act];
                const Icon = m.icon;
                const isSelected = activity === act;
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActivity(act)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                        : "bg-[#F6F3EC] text-[#1C1917] border-transparent hover:border-[#1C1917]/10"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Duration + Distance */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block mb-1">
              DURATION (MIN)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-xl py-2 px-3 text-sm font-bold text-[#1C1917] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block mb-1">
              DISTANCE ({meta.unit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              placeholder="optional"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-xl py-2 px-3 text-sm font-bold text-[#1C1917] outline-none"
            />
          </div>
        </div>

        {/* Burn preview */}
        {estCals > 0 && (
          <div className="bg-[#FADCD5]/70 border border-[#E05A47]/20 rounded-2xl p-2.5 mb-4 flex items-center gap-2 text-xs font-bold text-[#C94A38]">
            <Flame className="w-4 h-4 text-[#E05A47]" />
            <span>🔥 ~{estCals} kcal estimated burn</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-2.5 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!duration || durationNum <= 0}
            className="flex-1 bg-[#2D6A4F] text-white rounded-full py-2.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            Add Cardio
          </button>
        </div>
      </div>
    </div>
  );
}
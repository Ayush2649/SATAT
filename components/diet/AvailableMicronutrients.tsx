import React from "react";
import type { MealEntry } from "@/types";

export default function AvailableMicronutrients({ meal }: { meal: MealEntry }) {
  const values = meal.scanReview?.micronutrients;
  if (!values) return null;
  const labels = { vitaminAMcg: "Vitamin A (µg)", vitaminCMg: "Vitamin C (mg)", calciumMg: "Calcium (mg)", ironMg: "Iron (mg)", potassiumMg: "Potassium (mg)" };
  const present = (Object.keys(labels) as (keyof typeof labels)[]).filter(key => typeof values[key] === "number" && Number.isFinite(values[key]) && values[key]! >= 0);
  if (!present.length) return null;
  return <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--satat-text-secondary)]">{present.map(key => <div key={key} className="flex gap-1"><dt>{labels[key]}</dt><dd>{values[key]!.toFixed(1)}</dd></div>)}</dl>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Plus, X } from "lucide-react";
import { INDIAN_FOOD_DATABASE } from "@/lib/ai/nutrition/database";
import { componentGrams, RECIPE_NAMES, recipeNutrition, replaceComponent, summarizeComponents, UNKNOWN_MICROS, type ScanComponent, type Nutrition, type NutrientKey, type ScanSuggestion } from "@/lib/nutrition/scan-review";

const nutrientLabels: Record<NutrientKey, string> = { vitaminAMcg: "Vitamin A (µg)", vitaminCMg: "Vitamin C (mg)", calciumMg: "Calcium (mg)", ironMg: "Iron (mg)", potassiumMg: "Potassium (mg)" };
const fields: { key: keyof Nutrition; label: string }[] = [{ key: "calories", label: "Calories" }, { key: "proteinG", label: "Protein (g)" }, { key: "carbsG", label: "Carbs (g)" }, { key: "fatG", label: "Fat (g)" }];
const inputClass = "mt-1 w-full min-w-0 rounded-xl border border-[var(--satat-border-strong)] bg-[var(--satat-surface)] px-3 py-2.5 text-sm text-[var(--satat-text-primary)]";

type EditingFood = { row: ScanComponent; index: number | null; suggestionId?: string };

export default function ScanComponentEditor({ rows, onChange, onEditingChange, suggestions = [], onSuggestionsChange, variant = "light" }: {
  variant?: "dark" | "light";
  rows: ScanComponent[];
  suggestions?: ScanSuggestion[];
  onSuggestionsChange?: (suggestions: ScanSuggestion[]) => void;
  onChange: (rows: ScanComponent[]) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const dark = variant === "dark";
  const [editing, setEditing] = useState<EditingFood | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const isEditing = editing !== null;

  useEffect(() => {
    onEditingChange?.(isEditing);
    return () => onEditingChange?.(false);
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    if (!isEditing) return;
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLInputElement>("input")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isEditing]);

  const close = () => {
    onEditingChange?.(false);
    setEditing(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  };
  const open = (button: HTMLButtonElement, row: ScanComponent, index: number | null, suggestionId?: string) => {
    onEditingChange?.(true);
    openerRef.current = button;
    setEditing({ row, index, suggestionId });
  };
  const save = () => {
    if (!editing || !summarizeComponents([editing.row]).complete) return;
    const next = { ...editing.row, reviewNote: undefined, confirmed: true };
    onChange(editing.index === null ? [...rows, next] : rows.map(row => row.id === next.id ? next : row));
    if (editing.suggestionId) onSuggestionsChange?.(suggestions.filter(item => item.id !== editing.suggestionId));
    close();
  };

  return (
    <section aria-label="Review meal components" className={cn("space-y-3", dark ? "text-white" : "text-[var(--satat-text-primary)]")}>
      <div className="flex items-center justify-between gap-3">
        <h4 className={dark ? "text-[9px] font-bold uppercase tracking-[0.12em] text-white/60" : "font-serif text-xl"}>{dark ? "Plate components detected" : "Your meal"}</h4>
        <span className={cn("text-[10px]", dark ? "text-white/60" : "text-[var(--satat-text-muted)]")}>Tap to edit</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {rows.map((row, index) => {
          const needsInfo = !!row.reviewNote || !summarizeComponents([row]).complete;
          return (
            <button key={row.id} type="button" disabled={isEditing} aria-label={`Edit ${row.name || "food"}`} aria-expanded={editing?.row.id === row.id} aria-controls="scan-food-editor"
              onClick={event => open(event.currentTarget, row, index)}
              className={cn("inline-flex max-w-full items-center gap-1.5 border px-3 py-2 text-left", dark ? "min-h-9 rounded-full border-white/[0.15] bg-white/[0.08] text-[11px] hover:border-white/40" : "min-h-11 rounded-2xl border-[var(--satat-border-strong)] bg-[var(--satat-bg)] text-sm hover:border-[var(--satat-sage)]")}>
              <span className="min-w-0 break-words"><span className="font-semibold">{row.name || "Unnamed food"}</span><span className={cn("ml-1", dark ? "text-[10px] text-white/70" : "text-xs text-[var(--satat-text-secondary)]")}>{row.amount} {row.unit}</span>{needsInfo && <span className="ml-1.5 text-xs text-[var(--satat-brand)]">Check</span>}</span>
              <Pencil aria-hidden="true" className={cn("h-3 w-3 shrink-0", dark ? "text-white/60" : "text-[var(--satat-text-muted)]")} />
            </button>
          );
        })}
        <button type="button" disabled={isEditing} onClick={event => open(event.currentTarget, { id: crypto.randomUUID(), name: "", amount: "", unit: "g", per100g: null, micros: { ...UNKNOWN_MICROS }, source: "Choose a food reference or enter nutrition", confirmed: false, portionSource: "user" }, null)}
          className={cn("inline-flex items-center gap-1.5 border border-dashed px-3 py-2 font-semibold", dark ? "min-h-9 rounded-full border-white/30 text-[11px] text-white/80" : "min-h-11 rounded-2xl border-[var(--satat-sage)] text-sm text-[var(--satat-sage)]")}>
          <Plus aria-hidden="true" className="h-4 w-4" /> Add food
        </button>
      </div>
      {suggestions.length > 0 && <div className="space-y-2 text-xs" aria-label="Possible missing dishes">
        <p className={dark ? "text-white/75" : "text-[var(--satat-text-secondary)]"}>Anything missing? {suggestions.length} possible {suggestions.length === 1 ? "dish" : "dishes"} to check.</p>
        {suggestions.slice(0, 1).map(item => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--satat-border)] px-3 py-2">
          <span className="min-w-0 flex-1 break-words">{item.label}</span>
          <button type="button" disabled={isEditing} aria-label={`Already included: ${item.name}`} onClick={() => onSuggestionsChange?.(suggestions.filter(other => other.id !== item.id))} className="min-h-11 underline">Already included</button>
          <button type="button" disabled={isEditing} aria-label={`Add missing ${item.name}`} onClick={event => open(event.currentTarget, replaceComponent({ id: crypto.randomUUID(), name: item.name, amount: String(item.quantity), unit: item.unit, per100g: null, micros: { ...UNKNOWN_MICROS }, source: "", confirmed: false, portionSource: "user" }, item.name), null, item.id)} className={cn("min-h-11 font-semibold", dark ? "text-white" : "text-[var(--satat-sage)]")}>Add dish</button>
        </div>)}
      </div>}
      {editing && (
        <div id="scan-food-editor" ref={panelRef} role="region" aria-label={editing.index === null ? "Add food" : "Edit dish"} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }} className="rounded-2xl border border-[var(--satat-border-strong)] bg-[var(--satat-bg)] p-4 space-y-4 text-[var(--satat-text-primary)]">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-sm">{editing.index === null ? "Add a food" : "Edit dish"}</h4>
            <button type="button" aria-label="Close food editor" onClick={close} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--satat-surface-inset)]"><X className="h-4 w-4" /></button>
          </div>
          {editing.row.reviewNote && <p role="status" className="text-xs text-[var(--satat-brand)]">{editing.row.reviewNote}</p>}
          <FoodForm row={editing.row} index={editing.index ?? rows.length} onChange={row => setEditing({ ...editing, row })} />
          <div className="flex items-center justify-between gap-3">
            {editing.index !== null ? <button type="button" className="text-xs text-[var(--satat-brand)] underline" onClick={() => { onChange(rows.filter(row => row.id !== editing.row.id)); close(); }}>Remove dish</button> : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={close} className="min-h-11 px-3 text-sm">Cancel</button>
              <button type="button" onClick={save} disabled={!summarizeComponents([editing.row]).complete} className="min-h-11 rounded-full bg-[var(--satat-sage)] px-4 text-sm font-semibold text-white disabled:opacity-40">{editing.index === null ? "Add food" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FoodForm({ row, index, onChange }: { row: ScanComponent; index: number; onChange: (row: ScanComponent) => void }) {
  const update = (_id: string, change: Partial<ScanComponent>) => onChange({ ...row, ...change, confirmed: false });
  const missingNutrition = !row.per100g || fields.some(field => !Number.isFinite(row.per100g?.[field.key]));
  return (
    <div className="space-y-3">
      <datalist id="scan-food-references">{Array.from(new Set([...RECIPE_NAMES, ...INDIAN_FOOD_DATABASE.map(food => food.name)])).map(name => <option key={name} value={name} />)}</datalist>
      <label className="block text-xs font-medium">Dish<input aria-label={`Food ${index + 1} name`} list="scan-food-references" value={row.name} onChange={event => onChange(replaceComponent(row, event.target.value))} className={inputClass} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium">Amount<input type="number" min="0.1" step="any" aria-label={`Food ${index + 1} amount`} value={row.amount} onChange={event => update(row.id, { amount: event.target.value, portionSource: "user" })} className={inputClass} /></label>
        <label className="text-xs font-medium">Unit<select aria-label={`Food ${index + 1} unit`} value={row.unit} onChange={event => update(row.id, { unit: event.target.value, portionSource: "user" })} className={inputClass}>{Array.from(new Set([row.unit, "g", "ml", "piece", "bowl", "serving"])).map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></label>
      </div>
      {row.unit === "g" && <button type="button" onClick={() => update(row.id, { amount: String(Math.max(0, Number(row.amount) || 0) + 50), portionSource: "user" })} className="rounded-full border border-[var(--satat-border-strong)] bg-[var(--satat-surface)] px-3 py-1.5 text-xs">+ 50 g</button>}
      {missingNutrition && <p className="text-xs text-[var(--satat-brand)]">Choose a matching food or enter its nutrition below.</p>}
      <details open={missingNutrition} className="text-[var(--satat-text-secondary)]">
        <summary className="cursor-pointer text-xs underline">Nutrition &amp; recipe details</summary>
        <div className="space-y-3 pt-3">
      <p className="text-xs">{row.portionSource === "photo" ? "Photo estimate — replace with weighed grams when available." : "Your amount — kept without another AI guess."}{!["g", "ml"].includes(row.unit) && componentGrams(row) !== null ? ` Reference conversion: approximately ${Math.round(componentGrams(row)!)} g. Use grams if your bowl or piece differs.` : ""}{row.unit === "ml" ? " Liquids use an approximate 1 ml = 1 g conversion; weigh dense liquids for a better estimate." : ""}</p>
      <p className="text-[11px] leading-relaxed">{row.source}{row.sourceUrl && <> · <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="underline">Ingredient source</a></>}</p>
      {row.recipe && <details><summary className="text-xs underline cursor-pointer">Edit recipe ingredients, oil and cooked yield</summary><div className="space-y-2 pt-2">
        <p className="text-xs">Illustrative starting recipe, not your measured recipe. Add missing ingredients before using it. Cooked yield includes water gain/loss; this is not the weight of your serving.</p>
        {row.recipe.ingredients.map((ingredient, ingredientIndex) => <label key={ingredientIndex} className="block text-xs">{ingredient.name} (g)<input aria-label={`Food ${index + 1} recipe ingredient ${ingredientIndex + 1} grams`} type="number" min="0" step="any" value={ingredient.grams} onChange={event => {
          const recipe = { ...row.recipe!, ingredients: row.recipe!.ingredients.map((item, position) => position === ingredientIndex ? { ...item, grams: event.target.value } : item) };
          update(row.id, { recipe, per100g: recipeNutrition(recipe), confirmed: false, portionSource: "user" });
        }} className={inputClass} /><span className="block text-[10px] mt-1">{ingredient.source}</span></label>)}
        <label className="block text-xs">Cooked batch yield (g)<input aria-label={`Food ${index + 1} cooked batch yield`} type="number" min="1" step="any" value={row.recipe.yieldGrams} onChange={event => { const recipe = { ...row.recipe!, yieldGrams: event.target.value }; update(row.id, { recipe, per100g: recipeNutrition(recipe), confirmed: false }); }} className={inputClass} /></label>
        <div className="flex flex-wrap gap-3"><button type="button" className="text-xs underline" onClick={() => { const recipe = { ...row.recipe!, ingredients: row.recipe!.ingredients.slice(0, -1) }; update(row.id, { recipe, per100g: recipeNutrition(recipe), confirmed: false }); }}>Remove last recipe ingredient</button><button type="button" className="text-xs underline" onClick={() => update(row.id, { recipe: undefined, source: "User-entered nutrition — enter values from your label", confirmed: false })}>Use label nutrition instead</button></div>
        <button type="button" className="text-xs underline" onClick={() => { const recipe = { ...row.recipe!, ingredients: [...row.recipe!.ingredients, { name: "Additional ingredient", grams: "", per100g: { calories: NaN, proteinG: NaN, carbsG: NaN, fatG: NaN }, source: "Enter ingredient nutrition from its label below" }] }; update(row.id, { recipe, per100g: null, confirmed: false }); }}>Add recipe ingredient</button>
        {row.recipe.ingredients.map((ingredient, ingredientIndex) => ingredient.source.startsWith("Enter ingredient") && <div key={ingredientIndex} className="grid grid-cols-2 gap-2"><label className="text-xs col-span-2">Ingredient name<input value={ingredient.name} aria-label={`Food ${index + 1} added ingredient name`} onChange={event => { const recipe = { ...row.recipe!, ingredients: row.recipe!.ingredients.map((item, i) => i === ingredientIndex ? { ...item, name: event.target.value } : item) }; update(row.id, { recipe, confirmed: false }); }} className={inputClass} /></label>{fields.map(field => <label key={field.key} className="text-xs">{field.label} / 100 g<input aria-label={`Food ${index + 1} added ingredient ${field.key}`} type="number" min="0" step="any" value={Number.isFinite(ingredient.per100g[field.key]) ? ingredient.per100g[field.key] : ""} onChange={event => { const recipe = { ...row.recipe!, ingredients: row.recipe!.ingredients.map((item, i) => i === ingredientIndex ? { ...item, per100g: { ...item.per100g, [field.key]: event.target.value.trim() ? Number(event.target.value) : NaN } } : item) }; update(row.id, { recipe, per100g: recipeNutrition(recipe), confirmed: false }); }} className={inputClass} /></label>)}</div>)}
      </div></details>}
      {!row.recipe && <details open={!row.per100g}><summary className="text-xs underline cursor-pointer">Enter nutrition from a label / recipe</summary><p className="text-xs mt-2">Values per 100 g prepared food. Enter 0 explicitly for absent nutrients. Blank means unknown.</p><div className="grid grid-cols-2 gap-2 mt-2">{fields.map(field => <label key={field.key} className="text-xs">{field.label}<input aria-label={`Food ${index + 1} ${field.label} per 100g`} type="number" min="0" step="any" value={row.per100g && Number.isFinite(row.per100g[field.key]) ? row.per100g[field.key] : ""} onChange={event => update(row.id, { per100g: { calories: NaN, proteinG: NaN, carbsG: NaN, fatG: NaN, ...row.per100g, [field.key]: event.target.value.trim() ? Number(event.target.value) : NaN }, source: "User-entered nutrition · check label and cooked/raw basis", micros: { ...UNKNOWN_MICROS }, confirmed: false })} className={inputClass} /></label>)}</div></details>}
      <details><summary className="text-xs underline cursor-pointer">Optional vitamins/minerals from a label or source</summary><p className="text-xs mt-2">Per 100 g prepared food, in the units shown. Leave missing data blank; it is not zero.</p><label className="block text-xs mt-2">Nutrient source / label reference<input aria-label={`Food ${index + 1} nutrient source`} value={row.nutrientSource || ""} onChange={event => update(row.id, { nutrientSource: event.target.value, confirmed: false })} className={inputClass} /></label><div className="grid grid-cols-2 gap-2 mt-2">{(Object.keys(nutrientLabels) as NutrientKey[]).map(key => <label key={key} className="text-xs">{nutrientLabels[key]}<input aria-label={`Food ${index + 1} ${nutrientLabels[key]}`} type="number" min="0" step="any" value={row.micros[key] ?? ""} onChange={event => update(row.id, { micros: { ...row.micros, [key]: event.target.value.trim() && Number(event.target.value) >= 0 && Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : null }, confirmed: false })} className={inputClass} /></label>)}</div></details>
        </div>
      </details>
    </div>
  );
}

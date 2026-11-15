/** A hint such as "no egg" must never add an egg to the meal. */
export function includesIngredient(hint: string, ingredient: string): boolean {
  const clauses = hint.toLowerCase().split(/[,;.!?]|\bbut\b/);
  return clauses.some(clause => new RegExp(`\\b(?:${ingredient})\\b`, "i").test(clause)
    && !new RegExp(`\\b(?:no|without|skip|avoid|exclude|not)\\s+(?:\\w+\\s+){0,2}(?:${ingredient})\\b`, "i").test(clause));
}

export type IngredientRow = { id: string; text: string; included: boolean };

export function newRowId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newIngredientRow(): IngredientRow {
  return { id: newRowId(), text: "", included: true };
}

/** Split stored ingredients into editable rows (one line = one item on Whisk). */
export function ingredientRowsFromString(s: string): IngredientRow[] {
  const trimmed = s.trim();
  if (!trimmed) return [newIngredientRow()];
  const lines = s.split(/\r?\n/).map((l) => l.replace(/^\s*[-•*]\s*/, "").trim());
  const nonEmpty = lines.filter(Boolean);
  if (nonEmpty.length === 0) return [newIngredientRow()];
  return nonEmpty.map((text) => ({ id: newRowId(), text, included: true }));
}

export function ingredientsStringFromRows(rows: IngredientRow[]): string {
  return rows.filter((r) => r.included && r.text.trim()).map((r) => r.text.trim()).join("\n");
}

/** Strip auto-added step numbers; one row per direction step. */
export function directionRowsFromString(s: string): string[] {
  const raw = s.trim();
  if (!raw) return [""];
  const lines = s.split(/\r?\n/).map((l) => l.replace(/^\s*\d+[\.\)]\s*/, "").trim());
  const filtered = lines.filter(Boolean);
  return filtered.length ? filtered : [""];
}

/** Persist with numbered lines for readability and Whisk. */
export function directionsStringFromRows(rows: string[]): string {
  const trimmed = rows.map((r) => r.trim()).filter(Boolean);
  if (trimmed.length === 0) return "";
  return trimmed.map((t, i) => `${i + 1}. ${t}`).join("\n");
}

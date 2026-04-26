import { RECIPE_MAKE_PROGRESS_STORAGE_BASE, scopedStorageKey } from "./userStorage";

export type RecipeCookSource = "my" | "friend";

export type RecipeMakeProgressRow = {
  timesMade: number;
  /** Checked ingredient line indices (0-based), gather phase. */
  checkedIngredients: number[];
  /** Checked direction step indices (0-based). */
  checkedSteps: number[];
};

type RecipeMakeProgressFile = {
  v: 1;
  byKey: Record<string, RecipeMakeProgressRow>;
};

export function recipeCookProgressStorageKey(userId: string): string {
  return scopedStorageKey(userId, RECIPE_MAKE_PROGRESS_STORAGE_BASE);
}

export function recipeCookProgressKey(source: RecipeCookSource, recipeId: string): string {
  return `${source}:${recipeId}`;
}

export function parseDirectionSteps(directions: string): string[] {
  if (!directions?.trim()) return [];
  return directions
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);
}

/** One pantry item per line (same rules as recipe editor). */
export function parseIngredientLines(ingredients: string): string[] {
  if (!ingredients?.trim()) return [];
  return ingredients
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeCheckedIndices(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is number => typeof x === "number" && Number.isInteger(x) && x >= 0))].sort(
    (a, b) => a - b
  );
}

function normalizeRow(raw: unknown): RecipeMakeProgressRow {
  if (!raw || typeof raw !== "object") return { timesMade: 0, checkedIngredients: [], checkedSteps: [] };
  const o = raw as Record<string, unknown>;
  const timesMade =
    typeof o.timesMade === "number" && Number.isFinite(o.timesMade) ? Math.max(0, Math.floor(o.timesMade)) : 0;
  const checkedSteps = normalizeCheckedIndices(o.checkedSteps);
  const checkedIngredients = normalizeCheckedIndices(o.checkedIngredients);
  return { timesMade, checkedIngredients, checkedSteps };
}

export function loadRecipeMakeProgress(storageKey: string): Record<string, RecipeMakeProgressRow> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const f = parsed as Partial<RecipeMakeProgressFile>;
    if (f.v === 1 && f.byKey && typeof f.byKey === "object") {
      return Object.fromEntries(Object.entries(f.byKey).map(([k, v]) => [k, normalizeRow(v)]));
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, normalizeRow(v)])
    );
  } catch {
    return {};
  }
}

export function persistRecipeMakeProgress(storageKey: string, data: Record<string, RecipeMakeProgressRow>): void {
  const file: RecipeMakeProgressFile = { v: 1, byKey: data };
  localStorage.setItem(storageKey, JSON.stringify(file));
}

export function updateRecipeMakeProgress(
  storageKey: string,
  key: string,
  updater: (prev: RecipeMakeProgressRow) => RecipeMakeProgressRow
): void {
  const all = loadRecipeMakeProgress(storageKey);
  const prev = all[key] ?? { timesMade: 0, checkedIngredients: [], checkedSteps: [] };
  all[key] = updater(prev);
  persistRecipeMakeProgress(storageKey, all);
}

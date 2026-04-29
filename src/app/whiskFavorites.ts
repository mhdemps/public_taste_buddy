import { WHISK_FAVORITES_STORAGE_BASE, scopedStorageKey } from "./userStorage";

type WhiskFavoritesFile = {
  v: 1;
  keys: string[];
};

export function whiskFavoritesStorageKey(userId: string): string {
  return scopedStorageKey(userId, WHISK_FAVORITES_STORAGE_BASE);
}

export function loadWhiskFavorites(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(whiskFavoritesStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && (parsed as WhiskFavoritesFile).v === 1) {
      const keys = (parsed as WhiskFavoritesFile).keys;
      if (Array.isArray(keys)) {
        return new Set(keys.filter((k): k is string => typeof k === "string"));
      }
    }
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((k): k is string => typeof k === "string"));
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function persist(userId: string, keys: Set<string>) {
  const payload: WhiskFavoritesFile = { v: 1, keys: [...keys] };
  localStorage.setItem(whiskFavoritesStorageKey(userId), JSON.stringify(payload));
}

/** Returns the updated set (new instance). */
export function toggleWhiskFavorite(userId: string, cookKey: string): Set<string> {
  const next = new Set(loadWhiskFavorites(userId));
  if (next.has(cookKey)) next.delete(cookKey);
  else next.add(cookKey);
  persist(userId, next);
  return next;
}


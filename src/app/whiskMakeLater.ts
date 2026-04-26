import { WHISK_MAKE_LATER_STORAGE_BASE, scopedStorageKey } from "./userStorage";

type WhiskMakeLaterFile = {
  v: 1;
  keys: string[];
};

export function whiskMakeLaterStorageKey(userId: string): string {
  return scopedStorageKey(userId, WHISK_MAKE_LATER_STORAGE_BASE);
}

export function loadWhiskMakeLater(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(whiskMakeLaterStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && (parsed as WhiskMakeLaterFile).v === 1) {
      const keys = (parsed as WhiskMakeLaterFile).keys;
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
  const payload: WhiskMakeLaterFile = { v: 1, keys: [...keys] };
  localStorage.setItem(whiskMakeLaterStorageKey(userId), JSON.stringify(payload));
}

/** Returns the updated set (new instance). */
export function toggleWhiskMakeLater(userId: string, cookKey: string): Set<string> {
  const next = new Set(loadWhiskMakeLater(userId));
  if (next.has(cookKey)) next.delete(cookKey);
  else next.add(cookKey);
  persist(userId, next);
  return next;
}

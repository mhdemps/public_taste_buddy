/** Same fields as the API `TasteProfileRow` — local duplicate to avoid circular imports. */
export type ProfileRowCache = {
  id: string;
  display_name: string | null;
  buddy_color_index: number;
  buddy_body_key: string | null;
  buddy_eye_key: string | null;
  buddy_hat_key: string | null;
  buddy_smile_key: string | null;
  favorite_food: string | null;
  personality: string | null;
  specialty: string | null;
  allergies: string | null;
  recipes_given: string | null;
  updated_at: string;
};

const CACHE_KEY_PREFIX = "tasteBuddyProfileRowCacheV1:";

function cacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId.trim().toLowerCase()}`;
}

/** Device backup for taste profile row — covers Vercel /tmp and multi-instance serverless (stale GET after a good POST). */
export function readCachedProfile(userId: string): ProfileRowCache | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const p = JSON.parse(raw) as ProfileRowCache;
    if (p && typeof p === "object" && typeof p.id === "string" && typeof p.updated_at === "string") {
      return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeCachedProfile(userId: string, row: ProfileRowCache): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(row));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearCachedProfile(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {
    /* ignore */
  }
}

function updatedAtTime(row: ProfileRowCache): number {
  const t = new Date(row.updated_at || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Use whichever copy is newer by `updated_at` (client cache after save vs API). */
export function pickNewerProfile(a: ProfileRowCache, b: ProfileRowCache): ProfileRowCache {
  return updatedAtTime(a) >= updatedAtTime(b) ? a : b;
}

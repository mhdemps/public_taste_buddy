/** Current profile (JSON API row id) — not secret; device-local. */
export const ACTIVE_PROFILE_ID_STORAGE_KEY = "tasteBuddyActiveProfileId";

/** Legacy session key; choose profile replays the wink on each visit. Kept for older clients. */
export const SIGN_IN_INTRO_SESSION_STORAGE_KEY = "tasteBuddySignInIntroSession";

/** Base keys — always scope with {@link scopedStorageKey} and the active profile id. */
export const BUDDIES_STORAGE_BASE = "tasteBuddyBuddies";
export const FRIEND_RECIPES_STORAGE_BASE = "tasteBuddyFriendRecipes";
export const PARTY_PLANS_STORAGE_BASE = "tasteBuddyPartyPlans";
export const MY_RECIPES_STORAGE_BASE = "tasteBuddyMyRecipes";
/** Per-recipe times-made + in-progress step checks (cook mode). */
export const RECIPE_MAKE_PROGRESS_STORAGE_BASE = "tasteBuddyRecipeMakeProgress";
/** Whisk hub: recipes flagged to cook later (bookmark). */
export const WHISK_MAKE_LATER_STORAGE_BASE = "tasteBuddyWhiskMakeLater";

/** Unscoped keys from before profiles; first read per area copies into `base:userId`. */
const LEGACY_MIGRATION_KEYS = [
  MY_RECIPES_STORAGE_BASE,
  FRIEND_RECIPES_STORAGE_BASE,
  PARTY_PLANS_STORAGE_BASE,
  BUDDIES_STORAGE_BASE,
] as const;

export function scopedStorageKey(userId: string, base: string): string {
  return `${base}:${userId}`;
}

function normalizeProfileIdForStorage(id: string): string {
  return id.trim().toLowerCase();
}

/**
 * Profile ids the user removed on this browser. Survives API failures and re-fetches
 * (e.g. serverless JSON); clearing requires site data / this key removed.
 */
export const LOCALLY_REMOVED_PROFILE_IDS_KEY = "tasteBuddyLocallyRemovedProfileIds";

function readLocallyRemovedIdSet(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCALLY_REMOVED_PROFILE_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .filter((x): x is string => typeof x === "string")
        .map((x) => normalizeProfileIdForStorage(x))
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

/** Remember that this profile was deleted / hidden on this device. */
export function recordProfileRemovedLocally(profileId: string): void {
  const id = normalizeProfileIdForStorage(profileId);
  if (!id) return;
  try {
    const next = readLocallyRemovedIdSet();
    next.add(id);
    localStorage.setItem(LOCALLY_REMOVED_PROFILE_IDS_KEY, JSON.stringify([...next]));
  } catch {
    /* ignore */
  }
}

export function isProfileRemovedLocally(profileId: string): boolean {
  return readLocallyRemovedIdSet().has(normalizeProfileIdForStorage(profileId));
}

export function filterOutLocallyRemovedProfiles<T extends { id: string }>(rows: T[]): T[] {
  const removed = readLocallyRemovedIdSet();
  if (removed.size === 0) return rows;
  return rows.filter((r) => !removed.has(normalizeProfileIdForStorage(r.id)));
}

/**
 * Full local teardown for a profile: tombstone (hide everywhere on this device) + storage buckets + legacy keys.
 */
export function purgeProfileFromThisDevice(profileId: string): void {
  recordProfileRemovedLocally(profileId);
  clearDeviceDataForProfile(profileId);
}

/**
 * Remove this profile’s device-local recipes, buddies, party plans, cook progress, etc.
 * Also drops legacy unscoped keys so a new profile cannot inherit old data.
 * Scans all `localStorage` keys so mismatched UUID casing or extra keys are still removed.
 */
export function clearDeviceDataForProfile(userId: string): void {
  const want = normalizeProfileIdForStorage(userId);
  if (!want) return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("tasteBuddy")) continue;
      const colon = k.lastIndexOf(":");
      if (colon === -1) continue;
      const keyId = k.slice(colon + 1);
      if (normalizeProfileIdForStorage(keyId) === want) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) {
      localStorage.removeItem(k);
    }
    for (const key of LEGACY_MIGRATION_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // private mode / quota
  }
}

/** Current profile (JSON API row id) — not secret; device-local. */
export const ACTIVE_PROFILE_ID_STORAGE_KEY = "tasteBuddyActiveProfileId";

/** Cleared on sign-out so the sign-in wink plays again after “Switch profile”. */
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

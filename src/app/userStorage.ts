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

export function scopedStorageKey(userId: string, base: string): string {
  return `${base}:${userId}`;
}

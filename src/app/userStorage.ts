/** Base keys — always scope with {@link scopedStorageKey} and the signed-in user id. */
export const BUDDIES_STORAGE_BASE = "tasteBuddyBuddies";
export const FRIEND_RECIPES_STORAGE_BASE = "tasteBuddyFriendRecipes";
export const PARTY_PLANS_STORAGE_BASE = "tasteBuddyPartyPlans";
export const MY_RECIPES_STORAGE_BASE = "tasteBuddyMyRecipes";

export function scopedStorageKey(userId: string, base: string): string {
  return `${base}:${userId}`;
}

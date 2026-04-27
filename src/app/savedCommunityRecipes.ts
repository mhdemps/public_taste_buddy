import { FRIEND_RECIPES_STORAGE_BASE, scopedStorageKey } from "./userStorage";

const LEGACY_FRIEND_RECIPES_KEY = "tasteBuddyFriendRecipes";

export type SavedCommunityRecipeEntry = {
  id: string;
  /** Present when this row was saved from the taste wall (public recipe id). */
  wallRecipeId?: string;
  buddyId?: string;
  friendName: string;
  recipeName: string;
  allergies: string;
  accommodates?: string;
  ingredients: string;
  directions: string;
  notes: string;
  /** Copied from wall post when saved from the taste wall. */
  recipe_photo?: string;
  savedAt: string;
};

export function loadSavedCommunityRecipes(storageKey: string): SavedCommunityRecipeEntry[] {
  try {
    let raw = localStorage.getItem(storageKey);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_FRIEND_RECIPES_KEY);
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        raw = legacy;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is SavedCommunityRecipeEntry =>
          !!row &&
          typeof row === "object" &&
          typeof (row as SavedCommunityRecipeEntry).id === "string"
      )
      .map((row) => {
        const r = row as SavedCommunityRecipeEntry & { wallRecipeId?: unknown; recipe_photo?: unknown };
        return {
          ...r,
          allergies: typeof r.allergies === "string" ? r.allergies : "",
          accommodates: typeof r.accommodates === "string" ? r.accommodates : "",
          wallRecipeId: typeof r.wallRecipeId === "string" ? r.wallRecipeId : undefined,
          buddyId: typeof r.buddyId === "string" ? r.buddyId : undefined,
          recipe_photo: typeof r.recipe_photo === "string" && r.recipe_photo.startsWith("data:image/") ? r.recipe_photo : undefined,
        };
      });
  } catch {
    return [];
  }
}

export function sortSavedCommunityRecipesNewestFirst(list: SavedCommunityRecipeEntry[]) {
  return [...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function persistSavedCommunityRecipes(storageKey: string, list: SavedCommunityRecipeEntry[]) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

/** Removes legacy rows copied from the Buddy Board (wall); persists if anything was dropped. */
export function purgeWallSourcedSavedRecipes(userId: string): SavedCommunityRecipeEntry[] {
  const key = scopedStorageKey(userId, FRIEND_RECIPES_STORAGE_BASE);
  const list = loadSavedCommunityRecipes(key);
  const filtered = list.filter((r) => !r.wallRecipeId);
  if (filtered.length !== list.length) {
    persistSavedCommunityRecipes(key, filtered);
  }
  return filtered;
}

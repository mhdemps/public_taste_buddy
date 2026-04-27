import type { PublicRecipeRow } from "../lib/communityApi";
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

export function savedWallRecipeLocalId(wallRecipeId: string): string {
  return `wall-saved-${wallRecipeId}`;
}

export function upsertWallRecipeInSaved(
  userId: string,
  recipe: PublicRecipeRow,
  authorDisplayName: string
): SavedCommunityRecipeEntry {
  const storageKey = scopedStorageKey(userId, FRIEND_RECIPES_STORAGE_BASE);
  const list = loadSavedCommunityRecipes(storageKey);
  const id = savedWallRecipeLocalId(recipe.id);
  const photo =
    recipe.photo_data_url?.startsWith("data:image/") ? recipe.photo_data_url : undefined;
  const entry: SavedCommunityRecipeEntry = {
    id,
    wallRecipeId: recipe.id,
    friendName: authorDisplayName,
    recipeName: recipe.recipe_name.trim(),
    allergies: recipe.allergies.trim(),
    accommodates: recipe.accommodates?.trim() ?? "",
    ingredients: recipe.ingredients.trim(),
    directions: recipe.directions.trim(),
    notes: recipe.notes.trim(),
    recipe_photo: photo,
    savedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((r) => r.id === id || r.wallRecipeId === recipe.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...entry, savedAt: new Date().toISOString() };
  } else {
    list.push(entry);
  }
  persistSavedCommunityRecipes(storageKey, list);
  return entry;
}

export function removeWallRecipeFromSaved(userId: string, wallRecipeId: string): void {
  const storageKey = scopedStorageKey(userId, FRIEND_RECIPES_STORAGE_BASE);
  const list = loadSavedCommunityRecipes(storageKey).filter(
    (r) => r.wallRecipeId !== wallRecipeId && r.id !== savedWallRecipeLocalId(wallRecipeId)
  );
  persistSavedCommunityRecipes(storageKey, list);
}

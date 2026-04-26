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

export function appendWallRecipeToSaved(
  userId: string,
  row: PublicRecipeRow,
  authorDisplayName: string
): "saved" | "duplicate" {
  const key = scopedStorageKey(userId, FRIEND_RECIPES_STORAGE_BASE);
  const list = loadSavedCommunityRecipes(key);
  if (list.some((r) => r.wallRecipeId === row.id)) return "duplicate";
  const entry: SavedCommunityRecipeEntry = {
    id: `recipe-${Date.now()}`,
    wallRecipeId: row.id,
    friendName: authorDisplayName.trim() || "Community member",
    recipeName: row.recipe_name,
    allergies: row.allergies,
    accommodates: row.accommodates ?? "",
    ingredients: row.ingredients,
    directions: row.directions,
    notes: row.notes,
    recipe_photo: row.photo_data_url && row.photo_data_url.startsWith("data:image/") ? row.photo_data_url : undefined,
    savedAt: new Date().toISOString(),
  };
  list.push(entry);
  persistSavedCommunityRecipes(key, list);
  return "saved";
}

export function savedWallRecipeIdsForUser(userId: string): Set<string> {
  const key = scopedStorageKey(userId, FRIEND_RECIPES_STORAGE_BASE);
  const list = loadSavedCommunityRecipes(key);
  return new Set(
    list.map((r) => r.wallRecipeId).filter((id): id is string => typeof id === "string" && id.length > 0)
  );
}

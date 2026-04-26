import {
  filterOutLocallyRemovedProfiles,
  isProfileRemovedLocally,
} from "../app/userStorage";

export type TasteProfileRow = {
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
  parties_attended: number | null;
  recipes_given: string | null;
  updated_at: string;
};

export type PublicRecipeRow = {
  id: string;
  user_id: string;
  source_local_id: string | null;
  recipe_name: string;
  allergies: string;
  /** Comma-separated allergen tag ids this recipe avoids (e.g. gluten, dairy). */
  accommodates?: string;
  ingredients: string;
  directions: string;
  notes: string;
  /** Optional JPEG data URL from the author (shown on the taste wall). */
  photo_data_url?: string | null;
  created_at: string;
};

export type TasteProfileUpsert = {
  id: string;
  display_name: string;
  buddy_color_index: number;
  buddy_body_key?: string | null;
  buddy_eye_key?: string | null;
  buddy_hat_key?: string | null;
  buddy_smile_key?: string | null;
  favorite_food?: string | null;
  personality?: string | null;
  specialty?: string | null;
  allergies?: string | null;
  parties_attended?: number | null;
  recipes_given?: string | null;
};

/**
 * Local dev: use relative `/api` so Vite proxies to `server/index.js` (same origin — no CORS).
 * Do not use a bare `http://127.0.0.1:3001` default in the browser: `localhost:5173` → `127.0.0.1:3001`
 * is cross-origin and often surfaces as "Failed to fetch" even when the API is up.
 * Production: set `VITE_API_ORIGIN` to your hosted API (no trailing slash), then rebuild.
 */

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, "") ?? "";
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`Empty API response (HTTP ${response.status}).`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const isHtml = /<!DOCTYPE|NOT_FOUND|page could not be found/i.test(text);
    if (isHtml) {
      throw new Error(
        `API route returned HTML instead of JSON (HTTP ${response.status}). ` +
          "On Vercel, deploy the serverless `api/` route (Node, not Edge) and keep `data/**` in the function. " +
          "You can also set VITE_API_ORIGIN to a separate JSON API and rebuild."
      );
    }
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Not JSON (HTTP ${response.status}): ${preview}`);
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<{ data: T; error: Error | null }> {
  try {
    const headers = new Headers(init?.headers ?? undefined);
    const hasBody = init?.body != null && init.body !== "";
    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
    const payload = await parseJsonResponse<T | { error?: string }>(response);
    if (!response.ok) {
      const message =
        typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : response.statusText || "Request failed.";
      return { data: null as T, error: new Error(message) };
    }
    return { data: payload as T, error: null };
  } catch (error) {
    return {
      data: null as T,
      error: error instanceof Error ? error : new Error("Could not reach the local JSON API."),
    };
  }
}

export async function fetchCommunityProfiles(): Promise<{ data: TasteProfileRow[]; error: Error | null }> {
  const { data, error } = await requestJson<TasteProfileRow[]>("/profiles");
  return { data: filterOutLocallyRemovedProfiles(data ?? []), error };
}

/** Creates a new profile row (device-local JSON API). */
export async function createProfile(options?: {
  display_name?: string;
}): Promise<{ data: TasteProfileRow | null; error: Error | null }> {
  const raw = options?.display_name;
  const display_name = typeof raw === "string" ? raw.trim().slice(0, 80) : "";
  return requestJson<TasteProfileRow>("/profiles", {
    method: "POST",
    body: JSON.stringify({ display_name }),
  });
}

export async function fetchProfileByUserId(
  userId: string
): Promise<{ data: TasteProfileRow | null; error: Error | null }> {
  if (isProfileRemovedLocally(userId)) {
    return { data: null, error: null };
  }
  return requestJson<TasteProfileRow | null>(`/profiles/${encodeURIComponent(userId)}`);
}

export async function upsertMyProfile(payload: TasteProfileUpsert): Promise<{ error: Error | null }> {
  const { error } = await requestJson<TasteProfileRow>(`/profiles/${encodeURIComponent(payload.id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return { error };
}

export async function deleteMyProfile(userId: string): Promise<{ error: Error | null }> {
  const id = userId.trim();
  if (!id) {
    return { error: new Error("Missing profile id.") };
  }
  const { error } = await requestJson<{ ok: boolean }>(`/profiles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return { error };
}

export async function fetchPublicRecipesForUser(
  userId: string
): Promise<{ data: PublicRecipeRow[]; error: Error | null }> {
  if (isProfileRemovedLocally(userId)) {
    return { data: [], error: null };
  }
  const { data, error } = await requestJson<PublicRecipeRow[]>(`/public-recipes/user/${encodeURIComponent(userId)}`);
  return { data: data ?? [], error };
}

export async function fetchWallRecipes(limit = 48): Promise<{ data: PublicRecipeRow[]; error: Error | null }> {
  const { data, error } = await requestJson<PublicRecipeRow[]>(`/public-recipes?limit=${encodeURIComponent(String(limit))}`);
  const rows = data ?? [];
  return {
    data: rows.filter((r) => !isProfileRemovedLocally(r.user_id)),
    error,
  };
}

export async function insertPublicRecipe(row: {
  user_id: string;
  source_local_id: string;
  recipe_name: string;
  allergies: string;
  accommodates?: string;
  ingredients: string;
  directions: string;
  notes: string;
  photo_data_url?: string | null;
}): Promise<{ error: Error | null }> {
  const { error } = await requestJson<PublicRecipeRow>("/public-recipes", {
    method: "POST",
    body: JSON.stringify({
      user_id: row.user_id,
      source_local_id: row.source_local_id,
      recipe_name: row.recipe_name,
      allergies: row.allergies,
      accommodates: row.accommodates ?? "",
      ingredients: row.ingredients,
      directions: row.directions,
      notes: row.notes,
      photo_data_url: row.photo_data_url && row.photo_data_url.startsWith("data:image/") ? row.photo_data_url : "",
    }),
  });
  return { error };
}

/** Attach or replace the wall cover image for a recipe you already posted (same user only). */
export async function updatePublicRecipePhoto(
  recipeId: string,
  userId: string,
  photo_data_url: string
): Promise<{ error: Error | null }> {
  const { error } = await requestJson<PublicRecipeRow>(`/public-recipes/${encodeURIComponent(recipeId)}`, {
    method: "PUT",
    body: JSON.stringify({
      user_id: userId,
      photo_data_url:
        photo_data_url && photo_data_url.startsWith("data:image/") ? photo_data_url : "",
    }),
  });
  return { error };
}

export async function deletePublicRecipe(recipeId: string, userId: string): Promise<{ error: Error | null }> {
  const { error } = await requestJson<{ ok: boolean }>(
    `/public-recipes/${encodeURIComponent(recipeId)}?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  return { error };
}

export async function findPublicRecipeBySourceId(
  userId: string,
  sourceLocalId: string
): Promise<{ data: PublicRecipeRow | null; error: Error | null }> {
  if (isProfileRemovedLocally(userId)) {
    return { data: null, error: null };
  }
  return requestJson<PublicRecipeRow | null>(
    `/public-recipes/user/${encodeURIComponent(userId)}/source/${encodeURIComponent(sourceLocalId)}`
  );
}

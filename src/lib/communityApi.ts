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
  /** Public “taste mood” line + longer sharing note (quote + detail). */
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
    const status = response.status;
    const vercelHints =
      status === 405 || status === 401
        ? " On Vercel: redeploy with latest `vercel.json` and `api/profiles/upsert.js` (saves use POST `/api/profiles/upsert` so routing is not tied to dynamic `[id]`). " +
          "Rewrites must send `/api/*` to serverless, not `index.html`. " +
          "Deployment Protection can still return empty 401/405 — try disabling for previews. " +
          "Locally use `npm run dev` so `/api` proxies to port 3001."
        : "";
    throw new Error(`Empty API response (HTTP ${status}).${vercelHints}`);
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

/** Some Vercel layouts only wire up collection routes; subpaths return HTML 404. Fall back to list endpoints when we see that. */
function isRoutingOrHtml404Error(err: Error | null): boolean {
  if (!err) return false;
  return /HTML instead of JSON|HTTP 404|Not JSON/i.test(err.message);
}

function normalizeProfileIdForLookup(id: string): string {
  return id.trim().toLowerCase();
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
      /** Same-origin `/api` on Vercel: send cookies so Deployment Protection can authorize POST (omit when API is another origin). */
      credentials: API_ORIGIN ? "omit" : "include",
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

/** Buddy defaults for POST /profiles — must match `DEFAULT_NEW_PROFILE_BUDDY` in `api/core.mjs`. */
const NEW_PROFILE_BUDDY_BODY = {
  buddy_color_index: 2,
  buddy_body_key: "orange",
  buddy_eye_key: "open",
  buddy_hat_key: "chef",
  buddy_smile_key: "smile",
} as const;

/** Creates a new profile row (device-local JSON API). */
export async function createProfile(options?: {
  display_name?: string;
}): Promise<{ data: TasteProfileRow | null; error: Error | null }> {
  const raw = options?.display_name;
  const display_name = typeof raw === "string" ? raw.trim().slice(0, 80) : "";
  return requestJson<TasteProfileRow>("/profiles", {
    method: "POST",
    body: JSON.stringify({ display_name, ...NEW_PROFILE_BUDDY_BODY }),
  });
}

export async function fetchProfileByUserId(
  userId: string
): Promise<{ data: TasteProfileRow | null; error: Error | null }> {
  if (isProfileRemovedLocally(userId)) {
    return { data: null, error: null };
  }
  const direct = await requestJson<TasteProfileRow | null>(`/profiles/${encodeURIComponent(userId)}`);
  if (!direct.error) return direct;
  if (!isRoutingOrHtml404Error(direct.error)) return direct;
  const { data, error } = await fetchCommunityProfiles();
  if (error) return { data: null, error };
  const want = normalizeProfileIdForLookup(userId);
  const row = data.find((p) => normalizeProfileIdForLookup(p.id) === want) ?? null;
  return { data: row, error: null };
}

export async function upsertMyProfile(
  payload: TasteProfileUpsert
): Promise<{ data: TasteProfileRow | null; error: Error | null }> {
  // Static `/profiles/upsert` (not `/profiles/:id`) — Vercel often returns 405 on POST to `api/profiles/[id].js` with SPA output.
  const { data, error } = await requestJson<TasteProfileRow>("/profiles/upsert", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { data: error ? null : data, error };
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
  const direct = await requestJson<PublicRecipeRow[]>(`/public-recipes/user/${encodeURIComponent(userId)}`);
  if (!direct.error) {
    return { data: direct.data ?? [], error: null };
  }
  if (!isRoutingOrHtml404Error(direct.error)) {
    return { data: [], error: direct.error };
  }
  const { data, error } = await fetchWallRecipes(200);
  if (error) return { data: [], error };
  const uid = userId.trim();
  return { data: data.filter((r) => r.user_id === uid), error: null };
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
  const direct = await requestJson<PublicRecipeRow | null>(
    `/public-recipes/user/${encodeURIComponent(userId)}/source/${encodeURIComponent(sourceLocalId)}`
  );
  if (!direct.error) return direct;
  if (!isRoutingOrHtml404Error(direct.error)) return direct;
  const { data, error } = await fetchPublicRecipesForUser(userId);
  if (error) return { data: null, error };
  const row = data.find((r) => r.source_local_id === sourceLocalId) ?? null;
  return { data: row, error: null };
}

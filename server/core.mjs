import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { text } from "node:stream/consumers";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** In Vercel functions, bundled `__dirname` is not the repo root; `cwd` is the function bundle root with includeFiles. */
const rootDir = process.env.VERCEL ? process.cwd() : path.resolve(__dirname, "..");

/** Vercel serverless has a read-only project FS; keep JSON in /tmp (seeded from repo `data/`). */
const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "taste-buddy-data") : path.join(rootDir, "data");
const profilesPath = path.join(DATA_DIR, "profiles.json");
const publicRecipesPath = path.join(DATA_DIR, "public_recipes.json");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  /** Browsers may request these on preflight when the page and API are different origins. */
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Origin, X-Requested-With",
};

function sendJson(res, statusCode, payload) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      res.setHeader(k, v);
    }
    res.status(statusCode).json(payload);
    return;
  }
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(payload));
}

/** Vercel Node runtime expects Web `fetch(request)`; use this instead of raw `http` res. */
function toFetchResponse(statusCode, payload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

async function ensureDataFile(filePath, seedFileName) {
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await readFile(filePath, "utf8");
    return;
  } catch {
    const seedPath = path.join(rootDir, "data", seedFileName);
    try {
      const seed = await readFile(seedPath, "utf8");
      await writeFile(filePath, seed, "utf8");
    } catch {
      await writeFile(filePath, "[]\n", "utf8");
    }
  }
}

async function readJsonArray(filePath, seedFileName) {
  await ensureDataFile(filePath, seedFileName);
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

const BACKDROP_MIGRATED_V2 = "backdrop_migrated_v2";
const BUDDY_BACKDROP_MAX_V2 = 20;

function migrateBuddyBackdropIndices(rows) {
  let changed = false;
  const next = rows.map((p) => {
    if (p[BACKDROP_MIGRATED_V2]) return p;
    changed = true;
    let c = Math.floor(Number(p.buddy_color_index)) || 0;
    if (c >= 6 && c <= 26) c -= 6;
    if (c < 0) c = 0;
    if (c > BUDDY_BACKDROP_MAX_V2) c = BUDDY_BACKDROP_MAX_V2;
    return { ...p, buddy_color_index: c, [BACKDROP_MIGRATED_V2]: true };
  });
  return { rows: next, changed };
}

async function readProfilesWithBackdropMigration() {
  const rows = await readJsonArray(profilesPath, "profiles.json");
  const { rows: next, changed } = migrateBuddyBackdropIndices(rows);
  if (changed) {
    await writeJsonArray(profilesPath, next);
  }
  return next;
}

async function writeJsonArray(filePath, rows) {
  await ensureDataFile(filePath, path.basename(filePath));
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

async function readBody(req) {
  const raw = (await text(req)).trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readJsonBodyFromFetch(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function sortByDateDesc(rows, key) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(a[key] ?? 0).getTime();
    const bTime = new Date(b[key] ?? 0).getTime();
    return bTime - aTime;
  });
}

/**
 * @param {() => Promise<Record<string, unknown>>} getBody lazy; only called for routes that need JSON body
 * @returns {Promise<{ status: number, payload: unknown } | null>}
 */
async function routeProfiles(method, pathname, getBody) {
  if (method === "GET" && pathname === "/api/profiles") {
    const profiles = sortByDateDesc(await readProfilesWithBackdropMigration(), "updated_at");
    return { status: 200, payload: profiles };
  }

  if (method === "POST" && pathname === "/api/profiles") {
    const profiles = await readProfilesWithBackdropMigration();
    const id = randomUUID();
    const now = new Date().toISOString();
    const nextProfile = {
      id,
      display_name: "New profile",
      buddy_color_index: 0,
      backdrop_migrated_v2: true,
      buddy_body_key: "purple",
      buddy_eye_key: "open",
      buddy_hat_key: "none",
      buddy_smile_key: "smile",
      favorite_food: null,
      personality: null,
      specialty: null,
      allergies: null,
      parties_attended: null,
      recipes_given: null,
      updated_at: now,
    };
    profiles.push(nextProfile);
    await writeJsonArray(profilesPath, profiles);
    return { status: 201, payload: nextProfile };
  }

  const profileByIdMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);
  if (!profileByIdMatch) return null;

  const profileId = decodeURIComponent(profileByIdMatch[1]);
  if (method === "GET") {
    const profiles = await readProfilesWithBackdropMigration();
    const profile = profiles.find((row) => row.id === profileId) ?? null;
    return { status: 200, payload: profile };
  }

  if (method === "PUT") {
    const body = await getBody();
    const b = body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const profiles = await readProfilesWithBackdropMigration();
    const existing = profiles.find((row) => row.id === profileId) ?? null;
    /** @param {string} k @param {unknown} fromExisting */
    const pick = (k, fromExisting) => (k in b ? b[k] : fromExisting);
    const nextProfile = {
      id: profileId,
      display_name: pick("display_name", existing?.display_name) ?? null,
      buddy_color_index: (() => {
        if ("buddy_color_index" in b) {
          const n = Math.floor(Number(b.buddy_color_index));
          return Number.isFinite(n) ? n : 0;
        }
        return existing?.buddy_color_index ?? 0;
      })(),
      backdrop_migrated_v2: true,
      buddy_body_key: pick("buddy_body_key", existing?.buddy_body_key) ?? null,
      // If the client omits the key (e.g. JSON.stringify dropped undefined), keep stored value; default to "open".
      buddy_eye_key: (() => {
        if ("buddy_eye_key" in b) {
          return b.buddy_eye_key == null || b.buddy_eye_key === "" ? null : String(b.buddy_eye_key);
        }
        if (existing?.buddy_eye_key != null && existing.buddy_eye_key !== "") {
          return String(existing.buddy_eye_key);
        }
        return "open";
      })(),
      buddy_hat_key: pick("buddy_hat_key", existing?.buddy_hat_key) ?? null,
      buddy_smile_key: pick("buddy_smile_key", existing?.buddy_smile_key) ?? null,
      favorite_food: pick("favorite_food", existing?.favorite_food) ?? null,
      personality: pick("personality", existing?.personality) ?? null,
      specialty: pick("specialty", existing?.specialty) ?? null,
      allergies: pick("allergies", existing?.allergies) ?? null,
      parties_attended: (() => {
        if ("parties_attended" in b) {
          return b.parties_attended;
        }
        return existing?.parties_attended ?? null;
      })(),
      recipes_given: pick("recipes_given", existing?.recipes_given) ?? null,
      updated_at: new Date().toISOString(),
    };
    const nextProfiles = profiles.filter((row) => row.id !== profileId);
    nextProfiles.push(nextProfile);
    await writeJsonArray(profilesPath, nextProfiles);
    return { status: 200, payload: nextProfile };
  }

  return null;
}

/**
 * @param {() => Promise<Record<string, unknown>>} getBody
 * @returns {Promise<{ status: number, payload: unknown } | null>}
 */
async function routePublicRecipes(method, pathname, searchParams, getBody) {
  if (method === "GET" && pathname === "/api/public-recipes") {
    const limit = Number.parseInt(searchParams.get("limit") ?? "48", 10);
    const recipes = sortByDateDesc(await readJsonArray(publicRecipesPath, "public_recipes.json"), "created_at");
    return { status: 200, payload: recipes.slice(0, Number.isNaN(limit) ? 48 : limit) };
  }

  const userRecipesMatch = pathname.match(/^\/api\/public-recipes\/user\/([^/]+)$/);
  if (method === "GET" && userRecipesMatch) {
    const userId = decodeURIComponent(userRecipesMatch[1]);
    const recipes = sortByDateDesc(await readJsonArray(publicRecipesPath, "public_recipes.json"), "created_at").filter(
      (row) => row.user_id === userId
    );
    return { status: 200, payload: recipes };
  }

  const sourceMatch = pathname.match(/^\/api\/public-recipes\/user\/([^/]+)\/source\/([^/]+)$/);
  if (method === "GET" && sourceMatch) {
    const userId = decodeURIComponent(sourceMatch[1]);
    const sourceLocalId = decodeURIComponent(sourceMatch[2]);
    const recipes = await readJsonArray(publicRecipesPath, "public_recipes.json");
    const recipe = recipes.find((row) => row.user_id === userId && row.source_local_id === sourceLocalId) ?? null;
    return { status: 200, payload: recipe };
  }

  if (method === "POST" && pathname === "/api/public-recipes") {
    const body = await getBody();
    const recipes = await readJsonArray(publicRecipesPath, "public_recipes.json");
    const duplicate = recipes.find(
      (row) => row.user_id === body.user_id && body.source_local_id && row.source_local_id === body.source_local_id
    );
    if (duplicate) {
      return { status: 409, payload: { error: "That recipe is already on the wall." } };
    }
    const rawPhoto = body.photo_data_url;
    const photo_data_url =
      typeof rawPhoto === "string" && rawPhoto.startsWith("data:image/") && rawPhoto.length <= 1_500_000
        ? rawPhoto
        : "";
    const nextRecipe = {
      id: randomUUID(),
      user_id: body.user_id,
      source_local_id: body.source_local_id ?? null,
      recipe_name: body.recipe_name ?? "",
      allergies: body.allergies ?? "",
      accommodates: body.accommodates ?? "",
      ingredients: body.ingredients ?? "",
      directions: body.directions ?? "",
      notes: body.notes ?? "",
      photo_data_url,
      created_at: new Date().toISOString(),
    };
    recipes.push(nextRecipe);
    await writeJsonArray(publicRecipesPath, recipes);
    return { status: 201, payload: nextRecipe };
  }

  const recipeByIdMatch = pathname.match(/^\/api\/public-recipes\/([^/]+)$/);
  if (method === "PUT" && recipeByIdMatch) {
    const recipeId = decodeURIComponent(recipeByIdMatch[1]);
    const body = await getBody();
    const userId = body.user_id;
    if (typeof userId !== "string" || !userId.trim()) {
      return { status: 400, payload: { error: "user_id required." } };
    }
    const recipes = await readJsonArray(publicRecipesPath, "public_recipes.json");
    const idx = recipes.findIndex((row) => row.id === recipeId && row.user_id === userId);
    if (idx < 0) {
      return { status: 404, payload: { error: "Recipe not found." } };
    }
    const rawPhoto = body.photo_data_url;
    if (typeof rawPhoto !== "string") {
      return { status: 400, payload: { error: "photo_data_url required." } };
    }
    let photo_data_url = recipes[idx].photo_data_url ?? "";
    if (rawPhoto === "") {
      photo_data_url = "";
    } else if (rawPhoto.startsWith("data:image/") && rawPhoto.length <= 1_500_000) {
      photo_data_url = rawPhoto;
    } else {
      return { status: 400, payload: { error: "Invalid or oversized photo_data_url." } };
    }
    const updated = { ...recipes[idx], photo_data_url };
    recipes[idx] = updated;
    await writeJsonArray(publicRecipesPath, recipes);
    return { status: 200, payload: updated };
  }

  const deleteMatch = pathname.match(/^\/api\/public-recipes\/([^/]+)$/);
  if (method === "DELETE" && deleteMatch) {
    const recipeId = decodeURIComponent(deleteMatch[1]);
    const userId = searchParams.get("userId");
    const recipes = await readJsonArray(publicRecipesPath, "public_recipes.json");
    const exists = recipes.some((row) => row.id === recipeId && row.user_id === userId);
    if (!exists) {
      return { status: 404, payload: { error: "Recipe not found." } };
    }
    const nextRecipes = recipes.filter((row) => !(row.id === recipeId && row.user_id === userId));
    await writeJsonArray(publicRecipesPath, nextRecipes);
    return { status: 200, payload: { ok: true } };
  }

  return null;
}

/**
 * @param {() => Promise<Record<string, unknown>>} getBody
 */
async function dispatchApi(method, pathname, searchParams, getBody) {
  const profilesResult = await routeProfiles(method, pathname, getBody);
  if (profilesResult) return profilesResult;
  const recipesResult = await routePublicRecipes(method, pathname, searchParams, getBody);
  if (recipesResult) return recipesResult;
  return null;
}

function normalizePublicPathname(pathname) {
  if (pathname.startsWith("/api/_entry/")) {
    return "/api/" + pathname.slice("/api/_entry/".length);
  }
  if (pathname === "/api/_entry") {
    return "/api";
  }
  return pathname;
}

/**
 * Vercel Node runtime: export `default: { fetch }` so the handler is actually invoked.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function handleApiFetch(request) {
  const u = new URL(request.url);
  let pathname = normalizePublicPathname(u.pathname);
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.replace(/\/+$/, "") || "/";
  }
  // Some hosts forward the path after `/api` only; reattach so routes match.
  if (!pathname.startsWith("/api") && pathname !== "/") {
    if (
      pathname === "/health" ||
      pathname.startsWith("/profiles") ||
      pathname.startsWith("/public-recipes")
    ) {
      pathname = "/api" + pathname;
    }
  }
  const searchParams = u.searchParams;
  const method = request.method;

  if (method === "OPTIONS") {
    return toFetchResponse(200, { ok: true });
  }

  let bodyCache;
  const lazyBody = async () => {
    bodyCache ??= await readJsonBodyFromFetch(request);
    return bodyCache;
  };

  try {
    if (pathname === "/api/health") {
      return toFetchResponse(200, { ok: true });
    }
    const result = await dispatchApi(method, pathname, searchParams, lazyBody);
    if (result) {
      return toFetchResponse(result.status, result.payload);
    }
    return toFetchResponse(404, { error: "Not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return toFetchResponse(500, { error: message });
  }
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @param {string} [requestUrl] full URL path + search, e.g. /api/profiles?x=1
 */
export async function handleApiRequest(req, res, requestUrl) {
  const urlString = requestUrl ?? req.url;
  if (!urlString) {
    sendJson(res, 400, { error: "Missing request URL." });
    return;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    const url = new URL(urlString, "http://localhost");
    let pathname = normalizePublicPathname(url.pathname);
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.replace(/\/+$/, "") || "/";
    }
    if (pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    let bodyCache;
    const lazyBody = async () => {
      bodyCache ??= await readBody(req);
      return bodyCache;
    };

    const result = await dispatchApi(req.method, pathname, url.searchParams, lazyBody);
    if (result) {
      sendJson(res, result.status, result.payload);
      return;
    }
    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    sendJson(res, 500, { error: message });
  }
}

export async function ensureLocalDataFiles() {
  await ensureDataFile(profilesPath, "profiles.json");
  await ensureDataFile(publicRecipesPath, "public_recipes.json");
}

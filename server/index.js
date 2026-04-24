import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const profilesPath = path.join(dataDir, "profiles.json");
const publicRecipesPath = path.join(dataDir, "public_recipes.json");
const port = Number.parseInt(process.env.PORT ?? process.env.LOCAL_API_PORT ?? "3001", 10);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

async function ensureDataFile(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]\n", "utf8");
  }
}

async function readJsonArray(filePath) {
  await ensureDataFile(filePath);
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
  const rows = await readJsonArray(profilesPath);
  const { rows: next, changed } = migrateBuddyBackdropIndices(rows);
  if (changed) {
    await writeJsonArray(profilesPath, next);
  }
  return next;
}

async function writeJsonArray(filePath, rows) {
  await ensureDataFile(filePath);
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sortByDateDesc(rows, key) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(a[key] ?? 0).getTime();
    const bTime = new Date(b[key] ?? 0).getTime();
    return bTime - aTime;
  });
}

async function handleProfiles(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/profiles") {
    const profiles = sortByDateDesc(await readProfilesWithBackdropMigration(), "updated_at");
    return sendJson(res, 200, profiles);
  }

  if (req.method === "POST" && pathname === "/api/profiles") {
    const profiles = await readProfilesWithBackdropMigration();
    const id = randomUUID();
    const now = new Date().toISOString();
    const nextProfile = {
      id,
      display_name: "New profile",
      buddy_color_index: 0,
      backdrop_migrated_v2: true,
      buddy_body_key: "purple",
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
    return sendJson(res, 201, nextProfile);
  }

  const profileByIdMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);
  if (!profileByIdMatch) return false;

  const profileId = decodeURIComponent(profileByIdMatch[1]);
  if (req.method === "GET") {
    const profiles = await readProfilesWithBackdropMigration();
    const profile = profiles.find((row) => row.id === profileId) ?? null;
    return sendJson(res, 200, profile);
  }

  if (req.method === "PUT") {
    const body = await readBody(req);
    const profiles = await readProfilesWithBackdropMigration();
    const nextProfile = {
      id: profileId,
      display_name: body.display_name ?? null,
      buddy_color_index: body.buddy_color_index ?? 0,
      backdrop_migrated_v2: true,
      buddy_body_key: body.buddy_body_key ?? null,
      buddy_hat_key: body.buddy_hat_key ?? null,
      buddy_smile_key: body.buddy_smile_key ?? null,
      favorite_food: body.favorite_food ?? null,
      personality: body.personality ?? null,
      specialty: body.specialty ?? null,
      allergies: body.allergies ?? null,
      parties_attended: body.parties_attended ?? null,
      recipes_given: body.recipes_given ?? null,
      updated_at: new Date().toISOString(),
    };
    const nextProfiles = profiles.filter((row) => row.id !== profileId);
    nextProfiles.push(nextProfile);
    await writeJsonArray(profilesPath, nextProfiles);
    return sendJson(res, 200, nextProfile);
  }

  return false;
}

async function handlePublicRecipes(req, res, pathname, searchParams) {
  if (req.method === "GET" && pathname === "/api/public-recipes") {
    const limit = Number.parseInt(searchParams.get("limit") ?? "48", 10);
    const recipes = sortByDateDesc(await readJsonArray(publicRecipesPath), "created_at");
    return sendJson(res, 200, recipes.slice(0, Number.isNaN(limit) ? 48 : limit));
  }

  const userRecipesMatch = pathname.match(/^\/api\/public-recipes\/user\/([^/]+)$/);
  if (req.method === "GET" && userRecipesMatch) {
    const userId = decodeURIComponent(userRecipesMatch[1]);
    const recipes = sortByDateDesc(await readJsonArray(publicRecipesPath), "created_at").filter((row) => row.user_id === userId);
    return sendJson(res, 200, recipes);
  }

  const sourceMatch = pathname.match(/^\/api\/public-recipes\/user\/([^/]+)\/source\/([^/]+)$/);
  if (req.method === "GET" && sourceMatch) {
    const userId = decodeURIComponent(sourceMatch[1]);
    const sourceLocalId = decodeURIComponent(sourceMatch[2]);
    const recipes = await readJsonArray(publicRecipesPath);
    const recipe = recipes.find((row) => row.user_id === userId && row.source_local_id === sourceLocalId) ?? null;
    return sendJson(res, 200, recipe);
  }

  if (req.method === "POST" && pathname === "/api/public-recipes") {
    const body = await readBody(req);
    const recipes = await readJsonArray(publicRecipesPath);
    const duplicate = recipes.find(
      (row) => row.user_id === body.user_id && body.source_local_id && row.source_local_id === body.source_local_id
    );
    if (duplicate) {
      return sendJson(res, 409, { error: "That recipe is already on the wall." });
    }
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
      created_at: new Date().toISOString(),
    };
    recipes.push(nextRecipe);
    await writeJsonArray(publicRecipesPath, recipes);
    return sendJson(res, 201, nextRecipe);
  }

  const deleteMatch = pathname.match(/^\/api\/public-recipes\/([^/]+)$/);
  if (req.method === "DELETE" && deleteMatch) {
    const recipeId = decodeURIComponent(deleteMatch[1]);
    const userId = searchParams.get("userId");
    const recipes = await readJsonArray(publicRecipesPath);
    const exists = recipes.some((row) => row.id === recipeId && row.user_id === userId);
    if (!exists) {
      return sendJson(res, 404, { error: "Recipe not found." });
    }
    const nextRecipes = recipes.filter((row) => !(row.id === recipeId && row.user_id === userId));
    await writeJsonArray(publicRecipesPath, nextRecipes);
    return sendJson(res, 200, { ok: true });
  }

  return false;
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Missing request URL." });
    return;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }
    if ((await handleProfiles(req, res, url.pathname)) !== false) return;
    if ((await handlePublicRecipes(req, res, url.pathname, url.searchParams)) !== false) return;
    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    sendJson(res, 500, { error: message });
  }
});

await ensureDataFile(profilesPath);
await ensureDataFile(publicRecipesPath);

server.listen(port, () => {
  console.log(`JSON API listening on port ${port}`);
});

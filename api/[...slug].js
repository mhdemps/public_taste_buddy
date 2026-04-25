import { handleApiFetch } from "../server/core.mjs";

/**
 * Vercel Node: `export default { fetch }` (Web Request/Response).
 * Catch-all `api/[...slug].js` serves `/api/*` (e.g. `/api/profiles`).
 * Runtime must be Node (see `vercel.json` functions): `../server/core.mjs` uses `node:fs`.
 */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

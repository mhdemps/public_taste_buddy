import { handleApiFetch } from "../server/core.mjs";

/**
 * Vercel Node: `export default { fetch }` (Web Request/Response).
 * Catch-all file `api/[...slug].js` serves `/api/*` (e.g. `/api/profiles`).
 */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

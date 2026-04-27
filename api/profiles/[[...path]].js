import { handleApiFetch } from "../core.mjs";

/**
 * Single entry for `/api/profiles` and `/api/profiles/:id`.
 * Vercel cannot combine `api/profiles.js` with `api/profiles/[id].js` — the file wins
 * and dynamic child routes never run (PUT after POST returned HTML 404).
 */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

import { handleApiFetch } from "../../server/core.mjs";

/**
 * Vercel Node runtime invokes Web-standard `fetch(request)` (see Vercel Node.js docs).
 * A rewrite sends /api/profiles → /api/_entry/profiles so the SPA never swallows API paths.
 */
export default {
  fetch: handleApiFetch,
};

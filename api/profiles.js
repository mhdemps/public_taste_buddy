import { handleApiFetch } from "./core.mjs";

/** GET/POST `/api/profiles` — use this file (not `profiles/index.js`) so Vercel matches `/api/profiles` without a trailing slash. */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

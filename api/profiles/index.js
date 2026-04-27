import { handleApiFetch } from "../core.mjs";

/** GET/POST `/api/profiles` — use `index.js` inside this folder (not `api/profiles.js`) so `/api/profiles/:id` can use `[id].js`. */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

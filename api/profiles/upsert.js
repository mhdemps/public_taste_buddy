import { handleApiFetch } from "../core.mjs";

/** POST `/api/profiles/upsert` — static route so Vercel reliably invokes Node (avoids 405 on dynamic `[id]` + SPA). */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

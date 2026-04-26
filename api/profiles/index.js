import { handleApiFetch } from "../../server/core.mjs";

/** Direct route for GET/POST `/api/profiles` (avoids rewrite + POST issues on Vercel). */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

import { handleApiFetch } from "../../server/core.mjs";

/** PUT/DELETE `/api/public-recipes/:recipeId` (single segment only; not `/user/...`). */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

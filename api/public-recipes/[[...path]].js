import { handleApiFetch } from "../core.mjs";

/**
 * `/api/public-recipes`, `/api/public-recipes/:id`, `/api/public-recipes/user/...`, etc.
 * Same Vercel limitation as profiles: do not pair `public-recipes.js` with a `public-recipes/` folder.
 */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

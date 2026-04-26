import { handleApiFetch } from "../../core.mjs";

/** GET `/api/public-recipes/user/:userId` */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

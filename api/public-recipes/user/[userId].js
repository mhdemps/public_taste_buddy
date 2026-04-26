import { handleApiFetch } from "../../../server/core.mjs";

/** GET `/api/public-recipes/user/:userId` */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

import { handleApiFetch } from "../../server/core.mjs";

/** Direct route for GET/PUT/DELETE `/api/profiles/:id`. */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

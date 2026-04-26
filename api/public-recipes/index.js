import { handleApiFetch } from "../../server/core.mjs";

/** GET/POST `/api/public-recipes` */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

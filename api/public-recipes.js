import { handleApiFetch } from "./core.mjs";

/** GET/POST `/api/public-recipes` — flat name so Vercel matches the path reliably. */
export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

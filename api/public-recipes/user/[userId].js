import { handleApiFetch } from "../../core.mjs";

export default {
  async fetch(request) {
    return handleApiFetch(request);
  },
};

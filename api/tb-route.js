import { handleApiFetch } from "../server/core.mjs";

/**
 * Vercel: some static+Vite deployments do not register `api/[...slug].js` reliably.
 * All `/api/*` traffic is rewritten here (see vercel.json); we rebuild the path for the router.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/tb-route") {
      const tb = url.searchParams.get("tbpath") ?? "";
      const rest = tb.replace(/^\/+/, "");
      const segments = rest.split("/").filter(Boolean).map(encodeURIComponent);
      const innerPath = segments.length ? "/api/" + segments.join("/") : "/api/";
      const sp = new URLSearchParams(url.searchParams);
      sp.delete("tbpath");
      const qs = sp.toString();
      const inner = new URL(innerPath + (qs ? `?${qs}` : ""), url.origin);
      return handleApiFetch(new Request(inner, request));
    }
    return handleApiFetch(request);
  },
};

import { handleApiRequest } from "../../server/core.mjs";

/**
 * Vercel invokes this at /api/_entry/*. A rewrite sends /api/profiles → /api/_entry/profiles
 * so routing always hits a real serverless entry (avoids SPA fallback eating /api/*).
 */
export default async function handler(req, res) {
  const raw = req.url || "";
  const u = new URL(raw, "http://localhost");
  let pathname = u.pathname;
  if (pathname.startsWith("/api/_entry/")) {
    pathname = "/api/" + pathname.slice("/api/_entry/".length);
  } else if (pathname === "/api/_entry") {
    pathname = "/api";
  }
  const requestUrl = pathname + u.search;
  await handleApiRequest(req, res, requestUrl);
}

import { handleApiRequest } from "../server/core.mjs";

/**
 * Vercel serverless: routes all /api/* here. `req.url` is usually the full path + query.
 */
export default async function handler(req, res) {
  let requestUrl = req.url || "";
  if (!requestUrl.startsWith("/api")) {
    const seg = req.query?.slug;
    const pathPart = Array.isArray(seg) ? seg.join("/") : seg ?? "";
    const q = typeof req.url === "string" && req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    requestUrl = `/api/${pathPart}${q}`;
  }
  await handleApiRequest(req, res, requestUrl);
}

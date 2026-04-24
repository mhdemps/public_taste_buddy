import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(path.join(root, "assets", "chef display.svg"), "utf8");
let inner = src
  .replace(/<\?xml[^>]*>\s*/u, "")
  .replace(/viewBox="0 0 300 300"/u, 'viewBox="108 38 92 162" preserveAspectRatio="xMidYMid meet"')
  .replace(/\.cls-1/gu, ".f1")
  .replace(/\.cls-2/gu, ".f2")
  .replace(/class="cls-1"/gu, 'class="f1"')
  .replace(/class="cls-2"/gu, 'class="f2"');

inner = inner.replace(
  /<svg id="Layer_3" data-name="Layer 3" xmlns="http:\/\/www.w3.org\/2000\/svg" /u,
  "<svg xmlns=\"http://www.w3.org/2000/svg\" "
);

const m = inner.match(/^<svg[^>]*>([\s\S]*)<\/svg>\s*$/u);
const body = (m ? m[1] : inner).trim();

const out = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#ff3a00"/>
  <svg x="2.5" y="2.5" width="27" height="27" viewBox="108 38 92 162" preserveAspectRatio="xMidYMid meet">
${body}
  </svg>
</svg>
`;

writeFileSync(path.join(root, "public", "favicon.svg"), out, "utf8");

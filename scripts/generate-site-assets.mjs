import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const normalizeUrl = value => String(value || "").trim().replace(/\/+$/, "");
const siteUrl = normalizeUrl(process.env.VITE_SITE_URL || "https://circadian.app");

const robots = `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
  </url>
</urlset>
`;

fs.writeFileSync(path.join(publicDir, "robots.txt"), robots);
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);

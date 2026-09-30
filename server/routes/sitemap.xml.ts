/**
 * Deployed-app (Nitro) half of `/sitemap.xml` — `src/lib/sitemap.ts` is the
 * single source of truth, shared with the vite dev middleware
 * (`sitemapPlugin` in `vite.config.ts`).
 *
 * Registered automatically: vite.config.ts sets `serverDir: "./server"` and
 * Nitro v3 scans `<serverDir>/routes/**` for handlers like this one. The exact
 * `/sitemap.xml` route wins over the TanStack Start catch-all, and the PWA
 * middleware (`server/middleware/grok-pwa.ts`) passes non-document paths
 * (`.xml`) straight through untouched.
 */
import { SITEMAP_XML } from "../../src/lib/sitemap.ts";

export default function sitemapRoute() {
  return new Response(SITEMAP_XML, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
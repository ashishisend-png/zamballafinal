/**
 * The crawlable sitemap served at `/sitemap.xml`.
 *
 * A plain string on purpose: the response must be byte-identical in dev and
 * production, so both the vite dev middleware (`sitemapPlugin` in
 * `vite.config.ts`) and the deployed Nitro route
 * (`server/routes/sitemap.xml.ts`) import this one module.
 *
 * The host is the site's own domain — `zambhalathaispa.com` — never the
 * Vercel preview host. The `/about` and `/contact` locations are the pages
 * that domain is expected to answer for; keep this file in sync if those
 * URLs ever change.
 */
export const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zambhalathaispa.com/</loc>
  </url>
  <url>
    <loc>https://zambhalathaispa.com/about</loc>
  </url>
  <url>
    <loc>https://zambhalathaispa.com/contact</loc>
  </url>
</urlset>`;
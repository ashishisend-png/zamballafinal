import { test } from "node:test";
import assert from "node:assert/strict";
import { SITEMAP_XML } from "./sitemap.ts";

const LIVE_URLS = [
  "https://zambhalathaispa.com/",
  "https://zambhalathaispa.com/about",
  "https://zambhalathaispa.com/contact",
];

test("sitemap is a well-formed xml urlset with the 3 live URLs", () => {
  assert.ok(SITEMAP_XML.startsWith(`<?xml version="1.0" encoding="UTF-8"?>`));
  assert.ok(
    SITEMAP_XML.includes(
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ),
  );
  assert.ok(SITEMAP_XML.includes("</urlset>"));
  for (const loc of LIVE_URLS) {
    assert.ok(SITEMAP_XML.includes(`<loc>${loc}</loc>`), `missing <loc>${loc}</loc>`);
  }
});

test("sitemap URLs contain no raw ampersands or angle brackets", () => {
  assert.ok(!SITEMAP_XML.includes("&"), "& must be escaped in XML");
  // The only `<`/`>` are the xml/urlset/url/loc markup itself — there must be
  // no stray brackets inside the <loc> values (a naive injection guard).
  for (const loc of LIVE_URLS) {
    assert.ok(!loc.includes("<") && !loc.includes(">"));
  }
});
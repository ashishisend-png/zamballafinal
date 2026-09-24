/**
 * QA: reveal-on-scroll. Every `.reveal` starts hidden, each must gain
 * `reveal-shown` as the page is scrolled to the bottom (IntersectionObserver),
 * smooth anchor scrolling must be on, treatment cards must keep their 3-up
 * layout after being wrapped, and the console must stay clean.
 */
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
// Ignore the known dev-only autofill/caret-color hydration artifact (see
  // verify-splash.mjs) so the suite only fails on genuine errors.
  const isAutofillArtifact = (text) =>
    typeof text === "string" &&
    text.includes("didn't match the client") &&
    (text.includes("caret-color") || text.includes("style={{}}"));
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !isAutofillArtifact(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => {
    const text = String(e);
    if (!isAutofillArtifact(text)) errors.push(text);
  });

await page.goto("http://127.0.0.1:8080/", { waitUntil: "load" });
// The opening splash covers the page — wait for it to lift before auditing.
await page
  .waitForSelector("#splash", { state: "detached", timeout: 6000 })
  .catch(() => {});
await page.waitForTimeout(800);

const total = await page.locator(".reveal").count();
const hiddenAtTop = await page.evaluate(
  () => document.querySelectorAll(".reveal:not(.reveal-shown)").length,
);

// Step-scroll to the bottom so IntersectionObserver fires for every section.
// `behavior: "instant"` overrides the site's smooth scrolling so each step
// actually lands (otherwise every call interrupts the previous animation).
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight + 500; y += 450) {
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 110));
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
});
await page.waitForTimeout(700);

const hiddenAfter = await page.evaluate(
  () => document.querySelectorAll(".reveal:not(.reveal-shown)").length,
);
const stillHidden = await page.evaluate(() =>
  [...document.querySelectorAll(".reveal:not(.reveal-shown)")].map((el) => {
    const section = el.closest("section, footer");
    return `${section?.id || section?.tagName}#${el.className}`;
  }),
);
const scrollBehavior = await page.evaluate(
  () => getComputedStyle(document.documentElement).scrollBehavior,
);
const scrollPadding = await page.evaluate(
  () => getComputedStyle(document.documentElement).scrollPaddingTop,
);

// Treatment cards (wrapped in .reveal) must keep their 3-up row widths.
const cardWidths = await page.evaluate(() =>
  [...document.querySelectorAll("#menu .reveal")].map((el) =>
    Math.round(el.getBoundingClientRect().width),
  ),
);
const threeUp = cardWidths.length >= 7 && cardWidths.every((w) => w >= 300 && w <= 420);

await page.close();
await browser.close();

const verdict = {
  total,
  hiddenAtTop,
  hiddenAfter,
  stillHidden,
  scrollBehavior,
  scrollPadding,
  cardWidths,
  threeUp,
  consoleErrors: errors,
};
console.log(JSON.stringify(verdict, null, 2));

const pass =
  total > 0 &&
  hiddenAtTop >= 1 &&
  hiddenAfter === 0 &&
  scrollBehavior === "smooth" &&
  threeUp &&
  errors.length === 0;
process.exit(pass ? 0 : 1);
/**
 * QA: the AI chat dock must stay anchored bottom-right while the page scrolls,
 * and open a panel that is docked above the launcher. Verifies computed
 * `position: fixed`, bounding boxes across scroll offsets, panel behaviour and
 * console cleanliness, on desktop and mobile. Screenshots → ./screenshots/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "http://127.0.0.1:8080/";
const SHOTS = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "screenshots",
);
mkdirSync(SHOTS, { recursive: true });

const LAUNCHER = "[data-ai-chat-launcher]";
const PANEL = "[data-ai-chat-panel]";

const inViewport = (b, v) =>
  !!b &&
  b.x >= -1 &&
  b.x + b.width <= v.w + 1 &&
  b.y >= -1 &&
  b.y + b.height <= v.h + 1;

const bottomRight = (b, v) =>
  !!b && v.w - (b.x + b.width) <= 24 && v.h - (b.y + b.height) <= 24;

async function audit(browser, viewport, tag) {
  const page = await browser.newPage({ viewport });
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

  await page.goto(BASE, { waitUntil: "load" });
  // The opening splash covers the page — wait for it to lift before auditing.
  await page
    .waitForSelector("#splash", { state: "detached", timeout: 6000 })
    .catch(() => {});
  await page.waitForTimeout(900); // silly fonts + entrance animation

  const launcher = page.locator(LAUNCHER).first();
  const position = await launcher.evaluate((el) => getComputedStyle(el).position);
  const nameShown = (await launcher.innerText()).includes("Zambhala");

  // Scroll: top → middle → bottom, launcher must not move out of its corner.
  const boxes = [];
  for (const where of ["top", "middle", "bottom"]) {
    await page.evaluate((w) => {
      if (w === "top") window.scrollTo(0, 0);
      else if (w === "middle") window.scrollTo(0, document.body.scrollHeight * 0.5);
      else window.scrollTo(0, document.body.scrollHeight);
    }, where);
    await page.waitForTimeout(200);
    boxes.push({ where, box: await launcher.boundingBox() });
  }
  await page.screenshot({ path: path.join(SHOTS, `dock-${tag}-scrolled.png`) });

  const v = { w: viewport.width, h: viewport.height };
  const fixed = position === "fixed";
  const anchored = boxes.every((s) => bottomRight(s.box, v));
  const alwaysInView = boxes.every((s) => inViewport(s.box, v));

  // Open the chat at the bottom of the page; panel must be visible + docked.
  await launcher.click();
  await page.waitForTimeout(600);
  const panelCount = await page.locator(PANEL).count();
  const panel = panelCount ? await page.locator(PANEL).boundingBox() : null;
  const panelInView = inViewport(panel, v);
  const launcherAtOpen = await launcher.boundingBox();
  const panelAboveLauncher = panel && launcherAtOpen && panel.y + panel.height <= launcherAtOpen.y + 4;
  const greeting = panelCount
    ? (await page.locator(PANEL).innerText()).includes("Welcome to Zambhala")
    : false;
  const chipCount = panelCount ? await page.locator(PANEL).locator("button").count() : 0;
  const panelStyle = panelCount
    ? await page.locator(PANEL).evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          maxHeight: cs.maxHeight,
          height: cs.height,
          position: cs.position,
          bottom: cs.bottom,
          right: cs.right,
          overflow: cs.overflow,
        };
      })
    : null;
  await page.screenshot({ path: path.join(SHOTS, `dock-${tag}-open.png`) });

  await page.close();
  return {
    viewport: `${viewport.width}x${viewport.height}`,
    position,
    fixed,
    nameShown,
    anchoredEverywhere: anchored,
    alwaysInView,
    panelOpens: panelCount > 0,
    panelInView,
    panelAboveLauncher,
    greeting,
    chips: chipCount,
    panelBox: panel && {
      x: Math.round(panel.x),
      y: Math.round(panel.y),
      w: Math.round(panel.width),
      h: Math.round(panel.height),
    },
    launcherBoxAtOpen: launcherAtOpen && {
      y: Math.round(launcherAtOpen.y),
      h: Math.round(launcherAtOpen.height),
    },
    panelStyle,
    consoleErrors: errors,
  };
}

const browser = await chromium.launch();
const results = [];
for (const [w, h] of [
  [1280, 800],
  [390, 844],
]) {
  results.push(await audit(browser, { width: w, height: h }, `${w}x${h}`));
}
await browser.close();
console.log(JSON.stringify(results, null, 2));

const bad = results.some(
  (r) =>
    !r.fixed ||
    !r.anchoredEverywhere ||
    !r.alwaysInView ||
    !r.panelOpens ||
    !r.panelInView ||
    !r.panelAboveLauncher ||
    !r.greeting ||
    r.consoleErrors.length > 0,
);
process.exit(bad ? 1 : 0);
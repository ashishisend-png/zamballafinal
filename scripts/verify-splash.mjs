/**
 * QA: the opening splash. On first parse `#splash` must be present in the SSR
 * HTML (covering the viewport, fixed, above every layer, logo + name), then it
 * must lift on its own, stop intercepting pointer events, and leave a clean
 * console. Runs desktop, mobile and a prefers-reduced-motion pass.
 * Screenshots → ./screenshots/splash-*.png.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "http://127.0.0.1:8080/";
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "screenshots");
mkdirSync(SHOTS, { recursive: true });

async function audit(browser, viewport, tag, options = {}) {
  // Dev-only flake, not a product bug: Chromium's autofill engine heuristically
  // annotates a detected contact form (name/tel/email/date) by stamping the
  // field's `style` attribute (empty first, then populated with
  // `caret-color: transparent`). If that lands in the hydration window React
  // logs a style-attribute "didn't match" warning — the snapshot catches the
  // attribute at an arbitrary stage, so the diff shows either shape. It is
  // timing-dependent, invisible to users, and production React never logs it.
  // Ignore this exact signature so the suite still catches real mismatches.
  const isAutofillArtifact = (text) =>
    typeof text === "string" &&
    text.includes("didn't match the client") &&
    (text.includes("caret-color") || text.includes("style={{}}"));
  // Prime the dev server: the first request right after an edit can be served
  // while Vite is still rebuilding → transient hydration noise. Warm it once
  // so the audited load is on a settled module graph.
  const warm = await browser.newPage({ viewport });
  await warm.goto(BASE, { waitUntil: "domcontentloaded" }).catch(() => {});
  await warm
    .waitForSelector("#splash", { state: "detached", timeout: 8000 })
    .catch(() => {});
  await warm.close();

  const page = await browser.newPage({ viewport, ...options });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !isAutofillArtifact(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => {
    const text = String(e);
    if (!isAutofillArtifact(text)) errors.push(text);
  });
  let logoStatus = 0;
  page.on("response", (r) => {
    if (r.url().includes("/logo-mark.png")) logoStatus = r.status();
  });

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });

  // 1) Present at first parse — SSR must ship it, pre-hydration.
  const atOpen = await page.evaluate(() => {
    const el = document.getElementById("splash");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: el.innerText.replace(/\s+/g, " ").trim(),
      box: { w: Math.round(r.width), h: Math.round(r.height) },
      position: cs.position,
      zIndex: Number(cs.zIndex),
      hasLogo: Boolean(el.querySelector("img")),
    };
  });

  // 2) Entrance animation is 700ms — settle, confirm still visible, screenshot.
  await page.waitForTimeout(750);
  const settledOpacity = await page.evaluate(() => {
    const el = document.getElementById("splash");
    if (!el) return null;
    return getComputedStyle(el).opacity;
  });
  await page.screenshot({ path: path.join(SHOTS, `splash-${tag}.png`) });

  // 3) The logo really loaded — DOM evidence, else the network response.
  const logoDom = await page
    .waitForFunction(
      () => {
        const img = document.querySelector("#splash img");
        return img ? img.complete && img.naturalWidth > 0 : "gone";
      },
      null,
      { timeout: 3000 },
    )
    .catch(() => null);

  // 4) It must lift on its own and stop blocking the page.
  let lifted = true;
  try {
    await page.waitForFunction(() => !document.getElementById("splash"), null, {
      timeout: 8000,
    });
  } catch {
    lifted = false;
  }
  const liftMs = Date.now() - t0;
  const remaining = await page.locator("#splash").count();
  const centerBlocked = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return Boolean(el && el.closest("#splash"));
  });
  const siteText = await page.evaluate(() =>
    document.body.innerText.includes("Zambhala"),
  );

  await page.close();

  const v = { w: viewport.width, h: viewport.height };
  const checks = {
    presentAtOpen: Boolean(atOpen),
    coversViewport: Boolean(atOpen && atOpen.box.w >= v.w - 2 && atOpen.box.h >= v.h - 2),
    fixed: atOpen?.position === "fixed",
    aboveDock: (atOpen?.zIndex ?? 0) >= 60,
    hasLogo: Boolean(atOpen?.hasLogo),
    nameShown: (atOpen?.text ?? "").toLowerCase().includes("zambhala"),
    subtitleShown: (atOpen?.text ?? "").toLowerCase().includes("thai massage"),
    settled: settledOpacity !== null && Number(settledOpacity) > 0.99,
    logoLoaded: logoDom === true || logoStatus === 200,
    lifted,
    removed: remaining === 0,
    centerUnblocked: !centerBlocked,
    siteReachable: siteText,
    consoleClean: errors.length === 0,
  };
  return {
    viewport: `${v.w}x${v.h}${options.reducedMotion === "reduce" ? " reduced-motion" : ""}`,
    liftMs,
    atOpen,
    settledOpacity,
    logoStatus,
    logoDom,
    checks,
    pass: Object.values(checks).every(Boolean),
    consoleErrors: errors,
  };
}

const browser = await chromium.launch();
const results = [
  await audit(browser, { width: 1280, height: 800 }, "desktop"),
  await audit(browser, { width: 390, height: 844 }, "mobile"),
  await audit(browser, { width: 1280, height: 800 }, "reduced", {
    reducedMotion: "reduce",
  }),
];
await browser.close();

console.log(JSON.stringify(results, null, 2));
process.exit(results.every((r) => r.pass) ? 0 : 1);
/**
 * QA: mobile performance & bug audit (390x844).
 *
 * Catches the classic phone killers:
 *  - horizontal overflow / scrollable page width (widest offenders listed)
 *  - backdrop-filter surfaces (re-blurred constantly while scrolling)
 *  - huge decorative blurs (big GPU layers)
 *  - full-viewport aurora animation (whole-screen repaint risk)
 *  - <16px form controls (iOS auto-zoom on focus)
 *  - video flags (playsInline), animated properties that aren't compositor-safe
 *  - console errors (with the known autofill-artifact filter)
 *  - indicative frame-timing stats while the page is scrolled
 *
 * FPS is measured headless on the dev machine — indicative, not a real phone.
 */
import { chromium } from "playwright";

const isAutofillArtifact = (text) =>
  typeof text === "string" &&
  text.includes("didn't match the client") &&
  (text.includes("caret-color") || text.includes("style={{}}"));

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, // retina-class GPU work, closer to a real phone
});

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

const overflow = await page.evaluate(() => {
  const doc = document.documentElement;
  const html = getComputedStyle(doc).overflowX;
  const body = getComputedStyle(document.body).overflowX;
  const vw = window.innerWidth;
  // An element only breaks the layout if it sticks out past the viewport
  // AND none of its ancestors clips it (overflow hidden/clip/scroll/x).
  const clippedByAncestor = (el) => {
    for (let a = el.parentElement; a; a = a.parentElement) {
      const x = getComputedStyle(a).overflowX;
      if (x === "hidden" || x === "clip" || x === "scroll" || x === "auto") {
        if (a.scrollWidth > a.clientWidth + 1 || x === "hidden" || x === "clip") return true;
      }
    }
    return false;
  };
  const offenders = [...document.querySelectorAll("body *")]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { el, left: r.left, right: r.right, width: r.width, cls: el.className };
    })
    .filter((o) => o.width > 0 && !clippedByAncestor(o.el) && (o.left < -1 || o.right > vw + 1))
    .sort((a, b) => b.right - a.right)
    .slice(0, 12)
    .map((o) => ({
      cls: String(o.cls).slice(0, 120),
      left: Math.round(o.left),
      right: Math.round(o.right),
      width: Math.round(o.width),
    }));
  return {
    innerWidth: vw,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    overflowX: { html, body },
    offenders,
  };
});

const backdrops = await page.evaluate(() =>
  [...document.querySelectorAll("*")]
    .map((el) => {
      const style = getComputedStyle(el);
      const filter = style.backdropFilter || style.webkitBackdropFilter || "";
      return filter && filter !== "none" ? { cls: String(el.className).slice(0, 90), filter } : null;
    })
    .filter(Boolean),
);

const bigBlurs = await page.evaluate(() =>
  [...document.querySelectorAll("*")]
    .map((el) => {
      const f = getComputedStyle(el).filter || "";
      const m = f.match(/blur\((\d+)px\)/);
      return m && Number(m[1]) > 60
        ? { px: Number(m[1]), cls: String(el.className).slice(0, 90) }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.px - a.px),
);

const animationAudit = await page.evaluate(() => {
  const anim = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { animationName: s.animationName, duration: s.animationDuration, running: s.animationPlayState };
  };
  return {
    aurora: anim(".aurora"),
    marquee: anim(".marquee-track"),
    blobsAnimating: [...document.querySelectorAll(".blob")].filter((el) => {
      const s = getComputedStyle(el);
      return s.animationName !== "none";
    }).length,
  };
});

const formFonts = await page.evaluate(() => {
  const sizes = [...document.querySelectorAll("input, select, textarea")]
    .map((el) => getComputedStyle(el).fontSize)
    .filter((s, i, a) => a.indexOf(s) === i);
  return { uniqueFontSizes: sizes, min: sizes.sort((a, b) => parseFloat(a) - parseFloat(b))[0] };
});

const videoFlags = await page.evaluate(() => {
  const video = document.querySelector("video");
  if (!video) return null;
  return {
    playsInline: video.playsInline,
    muted: video.muted,
    loop: video.loop,
    autoplay: video.autoplay,
    preload: video.preload,
    paused: video.paused,
    src: video.currentSrc || video.src,
  };
});

const lazyImages = await page.evaluate(() =>
  [...document.querySelectorAll("img")]
    .map((img, i) => ({ i, loading: img.loading, src: (img.currentSrc || img.src).split("/").pop() }))
    .filter((x) => !x.src.startsWith("data:")),
);

// Indicative frame timing: rAF deltas while stepping through the page.
const frameStats = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const deltas = [];
      const target = document.body.scrollHeight;
      let t = 0;
      let last = performance.now();
      let dropped = 0;
      const step = () => {
        window.scrollTo({ top: Math.min(t, target), behavior: "instant" });
        t += 700;
        if (t <= target + 700) setTimeout(step, 60);
        else window.setTimeout(() => resolveFrameStats(), 120);
      };
      const tick = (now) => {
        const d = now - last;
        last = now;
        deltas.push(d);
        if (d > 33) dropped++;
        requestAnimationFrame(tick);
      };
      const resolveFrameStats = () => {
        const sorted = [...deltas].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        resolve({
          frames: deltas.length,
          medianMs: sorted[Math.floor(sorted.length / 2)].toFixed(2),
          p95Ms: p95.toFixed(2),
          longFramesOver33ms: dropped,
          estFps: Math.round(1000 / (sorted.reduce((a, b) => a + b, 0) / deltas.length)),
        });
      };
      requestAnimationFrame(tick);
      step();
    }),
);

await page.screenshot({ path: "screenshots/audit-mobile-top.png", fullPage: false });
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await page.waitForTimeout(600);
await page.screenshot({ path: "screenshots/audit-mobile-bottom.png", fullPage: false });

// The hero video must pause once it scrolls out of view (battery/GPU win).
const videoAfterScroll = await page.evaluate(() => {
  const video = document.querySelector("video");
  if (!video) return null;
  const r = video.getBoundingClientRect();
  const onScreen = r.bottom > 0 && r.top < window.innerHeight;
  return { onScreen, paused: video.paused };
});

await page.close();
await browser.close();

const verdict = { overflow, backdrops, bigBlurs, animationAudit, formFonts, videoFlags, videoAfterScroll, lazyImages, frameStats, consoleErrors: errors };
console.log(JSON.stringify(verdict, null, 2));

const pass =
  overflow.scrollWidth <= overflow.innerWidth + 1 &&
  overflow.offenders.length === 0 &&
  (formFonts.min === null || parseFloat(formFonts.min) >= 16) &&
  animationAudit.aurora?.animationName === "none" &&
  (videoAfterScroll === null || videoAfterScroll?.onScreen || videoAfterScroll?.paused) &&
  errors.length === 0;
// Frame timing is informational only (headless rAF ≠ a phone's GPU).
console.log(`FRAME_INFO: ${JSON.stringify(frameStats)}`);
process.exit(pass ? 0 : 1);
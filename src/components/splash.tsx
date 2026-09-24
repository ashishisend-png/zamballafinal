import { useEffect, useState } from "react";

/**
 * Opening splash — the logo + name over the ink backdrop while the site
 * finishes opening. Rendered by SSR, so it covers the page from the very
 * first paint (no flash of content before hydration). It lifts after a short
 * brand beat, then is removed from the DOM.
 */

/** Hold the splash at least this long after React mounts. */
const MIN_MS = 1500;
/** Fade-out duration + margin, then the node is removed from the DOM. */
const FADE_MS = 600;

export function Splash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    // Lift after the brand beat. We intentionally do NOT gate on `window
    // load` — that event hangs on slow assets (e.g. the hero video) and would
    // hold the splash long past the moment the page is usable. A single
    // setTimeout always fires, so the page can never stay trapped behind it.
    const fadeTimer = window.setTimeout(() => {
      setPhase("fade");
      window.setTimeout(() => setPhase("gone"), FADE_MS);
    }, MIN_MS);
    return () => window.clearTimeout(fadeTimer);
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      id="splash"
      role="status"
      aria-label="Loading Zambhala Thai Massage"
      className={`splash${phase === "fade" ? " splash-fade" : ""}`}
    >
      <div className="splash-inner">
        <img src="/logo-mark.png" alt="" className="splash-logo" />
        <p className="splash-name">Zambhala</p>
        <p className="splash-sub">Thai Massage</p>
        <div className="splash-bar" aria-hidden />
      </div>
    </div>
  );
}

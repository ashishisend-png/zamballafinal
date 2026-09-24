import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Render the same markup on the server and the first client render, then honour
  // prefers-reduced-motion in an effect — the poster frame stands in for the loop.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (motion.matches) {
        el.pause();
        el.currentTime = 0;
      } else {
        void el.play().catch(() => {});
      }
    };
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);

  return (
    <section id="top" className="relative isolate min-h-dvh overflow-hidden">
      <video
        ref={videoRef}
        src="/hero.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Bamboo water fountain and candle beside a still spa pool"
        className="absolute inset-0 size-full object-cover object-[68%_50%] sm:object-center"
      />
      <div className="absolute inset-0 bg-linear-to-b from-ink/55 via-ink/45 to-ink" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob blob-slow absolute -left-24 bottom-8 size-96 rounded-full bg-gold/15 blur-[120px]" />
        <div className="blob blob-slower absolute right-[-7rem] bottom-0 size-[26rem] rounded-full bg-moss/50 blur-[110px]" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-24 bottom-0 -z-10 rounded-r-[2.5rem] bg-linear-to-r from-ink/75 via-ink/35 to-transparent backdrop-blur-md"
        />
        <p className="stagger-in text-xs tracking-[0.32em] text-gold uppercase">{t.hero.eyebrow}</p>
        <h1
          className="stagger-in mt-4 max-w-3xl font-display text-5xl leading-[0.95] text-cream sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          {t.hero.title}
        </h1>
        <p
          className="stagger-in mt-5 max-w-lg text-base leading-relaxed text-cream-muted sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          {t.hero.body}
        </p>
        <div
          className="stagger-in mt-8 flex flex-wrap items-center gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <Button asChild size="lg">
            <a href="#booking">{t.hero.primaryCta}</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#menu">{t.hero.secondaryCta}</a>
          </Button>
        </div>
        <div
          className="glass-chip stagger-in mt-10 inline-flex flex-wrap items-center gap-x-6 gap-y-2 rounded-full px-5 py-2.5 text-sm text-cream-muted"
          style={{ animationDelay: "320ms" }}
        >
          <span className="inline-flex items-center gap-1.5 text-gold">
            <Star className="size-4 fill-gold" />
            {t.hero.rating}
          </span>
          <span>{t.hero.oils}</span>
          <span>{t.hero.walkIns}</span>
        </div>
      </div>
    </section>
  );
}

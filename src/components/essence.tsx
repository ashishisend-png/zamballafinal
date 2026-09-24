import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";

export function Essence() {
  const { t } = useI18n();

  return (
    <section id="essence" className="relative isolate overflow-hidden bg-ink/70 py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob blob-slower absolute top-10 left-[-10rem] size-[26rem] rounded-full bg-moss/60 blur-[120px]" />
        <div className="blob blob-slow absolute right-[-8rem] bottom-0 size-[24rem] rounded-full bg-gold/10 blur-[110px]" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative">
          <div aria-hidden className="absolute -inset-6 rounded-3xl bg-gold/10 blur-[70px]" />
          <div className="glass relative overflow-hidden rounded-xl">
          <img
            src="/massage.jpg"
            alt={t.essence.imageAlt}
            className="aspect-4/5 w-full object-cover sm:aspect-4/3"
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/25" />
          </div>
        </Reveal>
        <Reveal delay={140}>
          <p className="text-xs tracking-[0.28em] text-gold uppercase">{t.essence.eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl text-cream sm:text-5xl">{t.essence.title}</h2>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-cream-muted">
            {t.essence.body1}
          </p>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-cream-muted">
            {t.essence.body2}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

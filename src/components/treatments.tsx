import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";
import { categoryIds, treatments, type Category, type Treatment } from "@/lib/spa";

const images: Record<string, string> = {
  thai: "/massage.jpg",
  oil: "/oils.jpg",
  deep: "/room.jpg",
  sport: "/sport.jpg",
  combo: "/massage.jpg",
  reflex: "/reflex.jpg",
  pregnancy: "/pregnancy.jpg",
};

export function Treatments({
  onBook,
}: {
  onBook: (treatment: Treatment, duration: number) => void;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Category>("all");
  const [durations, setDurations] = useState<Record<string, number>>(() =>
    Object.fromEntries(treatments.map((x) => [x.id, x.durations[1] ?? x.durations[0]])),
  );

  const visible = filter === "all" ? treatments : treatments.filter((x) => x.category === filter);

  return (
    <section id="menu" className="relative isolate overflow-hidden bg-forest/70 py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob blob-slow absolute -top-24 inset-x-0 mx-auto size-[32rem] rounded-full bg-gold/15 blur-[120px]" />
        <div className="blob blob-slower absolute right-[-10rem] bottom-0 size-[28rem] rounded-full bg-moss/60 blur-[120px]" />
        <div className="blob absolute left-[-8rem] top-1/3 size-[24rem] rounded-full bg-forest/70 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs tracking-[0.28em] text-gold uppercase">{t.menu.eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl text-cream sm:text-5xl">{t.menu.title}</h2>
        <p className="mt-3 max-w-xl text-cream-muted">{t.menu.body}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {categoryIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={
                filter === id
                  ? "h-10 rounded-full bg-gold px-4 text-xs tracking-[0.16em] text-ink uppercase"
                  : "glass-field h-10 rounded-full px-4 text-xs tracking-[0.16em] text-cream-muted uppercase hover:border-gold/50 hover:text-gold"
              }
            >
              {t.categories[id]}
            </button>
          ))}
        </div>

        {/* Flex rather than grid so a trailing partial row centres itself — the
            card count changes with the category filter, so the orphan is not
            always the same one. gap-5 is 1.25rem; the widths subtract it back out. */}
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          {visible.map((treatment, index) => {
            const duration = durations[treatment.id] ?? treatment.durations[0];
            const price = treatment.prices[duration];
            const copy = t.treatments[treatment.id];
            return (
              <Reveal
                key={treatment.id}
                delay={(index % 3) * 90}
                className="w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
              >
                <article className="glass glass-hover card-shine group flex h-full w-full flex-col overflow-hidden rounded-xl">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={images[treatment.id]}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-forest/70 via-transparent to-transparent"
                  />
                  <span className="glass-chip absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] tracking-[0.16em] text-gold uppercase">
                    {copy.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-2xl text-cream">{copy.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-cream-muted">
                    {copy.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {treatment.durations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurations((prev) => ({ ...prev, [treatment.id]: d }))}
                        className={
                          duration === d
                            ? "glass-chip h-9 rounded-md px-3 text-xs text-gold ring-1 ring-gold/45"
                            : "glass-field h-9 rounded-md px-3 text-xs text-cream-muted hover:border-gold/50 hover:text-gold"
                        }
                      >
                        {t.menu.minutesShort(d)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="font-display text-3xl text-gold">{t.price(price)}</p>
                    <Button size="lg" onClick={() => onBook(treatment, duration)}>
                      {t.menu.book}
                    </Button>
                  </div>
                </div>
              </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

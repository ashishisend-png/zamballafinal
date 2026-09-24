import { useI18n } from "@/lib/i18n";

export function Marquee() {
  const { t } = useI18n();
  const phrase = t.marquee.phrase;
  const items = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="border-y border-cream/10 bg-ink/45 py-3 backdrop-blur-md">
      <div className="marquee-track flex w-max items-center whitespace-nowrap">
        {[0, 1].map((half) =>
          items.map((i) => (
            <span key={`${half}-${i}`} className="flex items-center">
              <span className="px-4 text-xs tracking-[0.35em] text-gold uppercase">
                {phrase}
              </span>
              <span aria-hidden className="text-gold/50">
                ✦
              </span>
            </span>
          )),
        )}
      </div>
    </div>
  );
}
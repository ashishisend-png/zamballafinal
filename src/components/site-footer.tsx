import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";
import { to12h } from "@/lib/time";
import { contact, hours, treatments } from "@/lib/spa";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer id="visit" className="relative isolate overflow-hidden border-t border-cream/10 bg-ink py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob blob-slow absolute top-[-8rem] inset-x-0 mx-auto size-[30rem] rounded-full bg-gold/10 blur-[120px]" />
        <div className="blob blob-slower absolute bottom-[-6rem] left-[-6rem] size-[24rem] rounded-full bg-moss/60 blur-[110px]" />
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-3">
        <Reveal>
          <img
            src="/logo-mark.png"
            alt=""
            className="glass-chip size-24 rounded-full object-cover ring-1 ring-gold/45"
          />
          <p className="mt-4 font-display text-2xl text-gold">Zambhala</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-cream-muted">
            {t.footer.tagline}
          </p>
        </Reveal>
        <Reveal delay={90}>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">{t.footer.treatments}</p>
          <ul className="mt-4 space-y-2">
            {treatments.map((treatment) => (
              <li key={treatment.id}>
                <a href="#menu" className="text-sm text-cream-muted hover:text-gold">
                  {t.treatments[treatment.id].name}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={180} className="space-y-4 text-sm text-cream-muted">
          <p className="text-xs tracking-[0.2em] text-gold uppercase">{t.footer.visit}</p>
          <p className="flex items-start gap-2 whitespace-pre-line">
            <MapPin className="mt-0.5 size-4 text-gold" />
            {contact.address}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 text-gold" />
            <a href={`tel:${contact.phone}`} className="hover:text-gold">
              {contact.phone}
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="size-4 text-gold" />
            <a href={`mailto:${contact.email}`} className="hover:text-gold">
              {contact.email}
            </a>
          </p>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 text-gold" />
            <div>
              {hours.map((h) => (
                <p key={h.id}>
                  {t.hours[h.id]}: {to12h(h.time)}
                </p>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
      <p className="mx-auto mt-12 max-w-6xl px-4 text-xs tracking-[0.16em] text-cream-muted/70 uppercase sm:px-6">
        {t.footer.closing}
      </p>
    </footer>
  );
}

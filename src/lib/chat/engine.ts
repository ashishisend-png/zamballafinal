/**
 * Built-in AI assistant for the Zambhala site.
 *
 * A small, keyword-grounded engine that answers questions about the real
 * treatments, prices, hours, location, contact and booking flow — all drawn
 * from `spa.ts` + the i18n dictionary, so replies stay correct in both en and
 * pt and can never drift from what is on the page. No network, no key:
 * `answer(question, lang)` is pure and easily testable (see engine.test.ts).
 * Later, swap this module for a live LLM call without touching the UI.
 */
import {
  contact,
  hours,
  timeSlots,
  treatments,
  type TreatmentId,
} from "../spa.ts";
import { dictionaries, type Dictionary, type Lang } from "../i18n/dictionary.ts";
import { to12h } from "../time.ts";

/** Lowercase + fold diacritics so "ó", "é" and a missing cedilla all match. */
const fold = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** Match a short token as a whole word ("pe" must not match inside "people"). */
const wholeWord = (q: string, word: string) =>
  new RegExp(`(^|[^a-z0-9])${word}($|[^a-z0-9])`).test(q);

const anyWord = (q: string, words: string[]) =>
  words.some((w) => wholeWord(q, w));

const includesAny = (q: string, phrases: string[]) =>
  phrases.some((p) => q.includes(p));

/** Per-treatment keywords (folded), EN + PT. Order of `treatments` wins. */
const TREATMENT_KEYS: Record<TreatmentId, string[]> = {
  thai: ["thai", "tailandes"],
  oil: ["hot oil", "oleo quente", "oil massage", "massagem de oleo"],
  deep: ["deep", "tecido profundo", "profundo", "tissue"],
  sport: ["sport", "desport", "athlet", "atleta", "trein"],
  combo: ["combina", "combo", "harmon", "harmonia"],
  reflex: ["reflex", "foot", "feet", "pe", "pes"],
  pregnancy: ["pregnan", "gravidez", "gestant", "mae"],
};

const priceLine = (tr: (typeof treatments)[number], t: Dictionary) =>
  tr.durations
    .map((d) => `${t.menu.minutesShort(d)} · ${t.price(tr.prices[d])}`)
    .join(" · ");

const findTreatment = (tr: (typeof treatments)[number], t: Dictionary) => {
  const info = t.treatments[tr.id];
  return `${info.name} — ${t.categories[tr.category]}.\n${info.description}\n\n${priceLine(tr, t)}`;
};

/** Reply for the question, or null when nothing matched. */
export function answer(question: string, lang: Lang): string | null {
  const t = dictionaries[lang];
  const q = fold(question?.trim() ?? "");
  if (!q) return null;

  if (anyWord(q, ["thank", "obrigad", "gracias"])) return t.chat.thanksReply;
  if (anyWord(q, ["bye", "goodbye", "tchau", "adeus", "ate logo"]))
    return t.chat.byeReply;

  // A specific treatment beats the generic menu. Short tokens ("pe", "pes")
  // must match as whole words — `open` contains "pe", which would otherwise
  // answer "when are you open?" with Foot Reflexology.
  for (const tr of treatments) {
    const keys = TREATMENT_KEYS[tr.id];
    if (keys.some((k) => (k.length <= 3 ? wholeWord(q, k) : includesAny(q, [k])))) {
      return findTreatment(tr, t);
    }
  }

  if (includesAny(q, ["treatment", "massag", "tratament", "menu", "servic", "offer"])) {
    const lines = treatments
      .map((tr) => `\u2022 ${t.treatments[tr.id].name} — ${t.treatments[tr.id].tag}`)
      .join("\n");
    return `${t.chat.treatmentsIntro}\n${lines}\n\n${t.chat.treatmentsHint}`;
  }

  if (includesAny(q, ["price", "cost", "quanto", "preco", "value", "custa"])) {
    const lines = treatments
      .map((tr) => `\u2022 ${t.treatments[tr.id].name} — ${priceLine(tr, t)}`)
      .join("\n");
    return `${t.chat.pricesIntro}\n${lines}`;
  }

  if (includesAny(q, ["how long", "duration", "durac", "longest", "length", "minute"])) {
    const lines = treatments
      .map((tr) => `\u2022 ${t.treatments[tr.id].name} — ${tr.durations.join(" · ")} min`)
      .join("\n");
    return `${t.chat.lengthsIntro}\n${lines}`;
  }

  if (anyWord(q, ["walk"]) || includesAny(q, ["sem marca"]))
    return t.chat.walkInsIntro;

  if (includesAny(q, ["book", "reserva", "agend", "schedul", "ritual", "first visit"])) {
    return `${t.chat.bookHowTo}\n\n${t.chat.timesIntro} ${timeSlots.map(to12h).join(", ")}`;
  }

  if (includesAny(q, ["hour", "hora", "horari", "open", "close", "abre", "fecha", "when are you"])) {
    const lines = hours
      .map((h) => `\u2022 ${t.hours[h.id]}: ${to12h(h.time)}`)
      .join("\n");
    return `${t.chat.hoursIntro}\n${lines}`;
  }

  if (includesAny(q, ["where", "address", "located", "morada", "enderec", "localiza"])) {
    return `${t.chat.locationIntro} ${contact.address}.`;
  }

  if (includesAny(q, ["phone", "call", "email", "mail", "contact", "telefone", "ligar", "contato"])) {
    return `${t.chat.contactIntro}\n\u2022 ${contact.phone}\n\u2022 ${contact.email}`;
  }

  if (includesAny(q, ["oil", "oleo", "organic", "organico", "botanic"])) {
    return t.chat.oilsIntro;
  }

  if (includesAny(q, ["zambhala", "essence", "essencia", "about", "sobre", "sanctuary", "santuario", "philosoph", "filosof", "who are you"])) {
    return t.chat.essenceIntro;
  }

  if (anyWord(q, ["hi", "hello", "hey", "ola", "oi", "bom dia", "boa tarde"]))
    return t.chat.greeting;

  return null;
}
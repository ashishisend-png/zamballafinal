/**
 * Every user-facing string in the site, in each supported language.
 *
 * `en` is the source of truth: `Dictionary = typeof en`, and every other
 * language is declared as a `Dictionary`, so a missing or misspelled key is a
 * typecheck failure rather than an English word leaking into a translated page.
 */

import type { Category, HoursId, TreatmentId } from "@/lib/spa";

/**
 * Prices are plain numbers in `spa.ts`; each locale writes the euro its own way
 * — symbol first in English, trailing after a non-breaking space in Portuguese
 * (the space is non-breaking so an amount never wraps away from its symbol).
 */
const euroLeading = (amount: number) => `\u20ac${amount}`;
const euroTrailing = (amount: number) => `${amount}\u00a0\u20ac`;

export const languages = ["en", "pt"] as const;

export type Lang = (typeof languages)[number];

/** Shown inside the switch itself — each label is in its own language. */
export const languageNames: Record<Lang, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  pt: { short: "PT", full: "Português" },
};

const en = {
  /** `<html lang>` and the tag screen readers announce the document in. */
  htmlLang: "en",
  /** Money, formatted the way this language writes it. */
  price: euroLeading,
  meta: {
    description:
      "Zambhala Thai Massage — a sanctuary of authentic Thai healing. Traditional massage, hot oil, and recovery rituals.",
  },
  languageSwitch: {
    label: "Change language",
  },
  nav: {
    essence: "Essence",
    treatments: "Treatments",
    book: "Book",
    bookRitual: "Book Now",
    openMenu: "Open menu",
    wordmarkSub: "Thai Massage",
  },
  hero: {
    eyebrow: "Authentic Thai healing",
    title: "The art of Thai relaxation.",
    body: "A quiet sanctuary where ancestral massage, warm oils, and unhurried attention restore the body to itself.",
    primaryCta: "Book your experience",
    secondaryCta: "View the menu",
    rating: "4.9 excellence",
    oils: "Organic oils · 100% botanical",
    walkIns: "Walk-ins welcome",
  },
  marquee: {
    phrase: "ZAMBHALA  ·  DEEP RELAXATION  ·  ANCIENT HEALING  ·  ",
  },
  essence: {
    eyebrow: "Our essence",
    title: "A sanctuary of authentic healing.",
    body1:
      "Zambhala was built as a pause from the outside world — teak, low light, and therapists trained in Thai temple sequences. Each treatment is a choreography of pressure, stretch, and breath.",
    body2:
      "Named for abundance and ease, the house offers traditional Thai work alongside oil rituals and recovery sessions. Nothing hurried. Nothing ornamental for its own sake.",
    imageAlt: "Traditional Thai massage with focused pressure",
  },
  menu: {
    eyebrow: "Our menu",
    title: "Treatments",
    body: "Personalized sessions designed to restore natural balance. Choose a length — the price updates as you do.",
    book: "Book",
    minutesShort: (n: number) => `${n} min`,
  },
  chat: {
    label: "AI Guide",
    name: "Zambhala Guide",
    open: "Open the AI guide",
    close: "Close the AI guide",
    send: "Send message",
    placeholder: "Ask about treatments, prices, hours…",
    greeting:
      "Welcome to Zambhala — I'm your guide. Ask me about treatments, prices, opening hours, how to book, or what makes Thai massage special.",
    chipsTitle: "Try asking:",
    chipPrices: "Prices",
    chipTreatments: "Treatments",
    chipHours: "Hours & location",
    chipBook: "How to book",
    waitLabel: "Thinking",
    unknown:
      "I don't have that detail yet — try treatments, prices, hours, location, or how to book.",
    pricesIntro: "Here are our treatments and prices:",
    treatmentsIntro: "Our full menu:",
    treatmentsHint:
      "Ask me about any of these for details — for example “deep tissue” or “pregnancy”.",
    lengthsIntro: "Session lengths:",
    bookHowTo:
      "Booking is easy: scroll to the booking form, pick a treatment, a duration, and a time, then add your name and phone. Your reservation is saved on this device and we confirm by phone.",
    timesIntro: "Available times:",
    hoursIntro: "We are open:",
    locationIntro: "You'll find us at",
    contactIntro: "You can reach us at:",
    walkInsIntro: "Walk-ins are welcome whenever a therapist is free.",
    oilsIntro: "Our oils are 100% botanical and organic.",
    essenceIntro:
      "Zambhala is a quiet house of gold, teak, and low light — traditional Thai massage, warm oil rituals, and unhurried care, named for abundance and ease.",
    byeReply: "Take care — relax well. 🙏",
    thanksReply: "Glad I could help. Ask me anything else, anytime.",
  },
  categories: {
    all: "All",
    relaxing: "Relaxing",
    firm: "Firm",
    recovery: "Recovery",
  } satisfies Record<Category, string>,
  treatments: {
    thai: {
      name: "Traditional Thai Massage",
      tag: "Ancestral",
      description:
        "A full-body sequence of rhythmic pressure and assisted stretching, drawn from temple traditions. Restores flow through the Sen lines.",
    },
    oil: {
      name: "Hot Oil Massage",
      tag: "Relaxing",
      description:
        "Warm botanical oils and long, flowing strokes. Built for deep quiet — the mind unclenches as the tissue softens.",
    },
    deep: {
      name: "Deep Tissue",
      tag: "Most requested",
      description:
        "Slow, focused work into chronic holding patterns. For desks, long travel, and the kind of tension that has a name.",
    },
    sport: {
      name: "Sport Recovery",
      tag: "Recovery",
      description:
        "Targeted work for athletes and anyone training hard. Improves range, eases fatigue, and prepares the body to move again.",
    },
    combo: {
      name: "Harmony Combination",
      tag: "Signature",
      description:
        "Thai stretching fused with warm-oil work. Firm where you need it, silk where you don’t — our most complete ritual.",
    },
    reflex: {
      name: "Foot Reflexology",
      tag: "Balance",
      description:
        "Precise work on the reflex maps of the feet. A compact session that still rearranges how the whole body feels.",
    },
    pregnancy: {
      name: "Pregnancy Massage",
      tag: "Gentle",
      description:
        "Side-lying, carefully adapted techniques for expectant guests. Softens the back, hips, and restless mind.",
    },
  } satisfies Record<TreatmentId, { name: string; tag: string; description: string }>,
  booking: {
    eyebrow: "Reserve",
    title: "Start your journey.",
    body: "Choose a ritual, a length, and a time. We will hold the room and confirm by phone. Walk-ins are welcome when a therapist is free.",
    treatment: "Treatment",
    duration: "Duration",
    date: "Date",
    time: "Time",
    name: "Full name",
    phone: "Phone",
    email: "Email (optional)",
    notes: "Notes",
    notesPlaceholder: "Pressure preference, first visit, pregnancy week…",
    durationOption: (minutes: number, price: number) =>
      `${minutes} minutes — ${euroLeading(price)}`,
    missingFields: "Please add your name, phone, and a date.",
    submit: "Confirm booking",
    heldTitle: "Held for you",
    heldBody: "Reservations stay on this device so you can review them anytime.",
    heldEmpty: "No reservations yet. Choose a ritual to begin.",
    fallbackTreatment: "Treatment",
    minutesShort: (n: number) => `${n} min`,
    confirmTitle: "Your room is held",
    confirmBody: (treatment: string, date: string, time: string) =>
      `${treatment} on ${date} at ${time}. We will confirm by phone shortly.`,
    close: "Close",
  },
  footer: {
    tagline: "Traditional Thai massage in a quiet house of gold, teak, and unhurried care.",
    treatments: "Treatments",
    visit: "Visit",
    closing: "Relaxation is the doorway to healing.",
  },
  hours: {
    everyday: "Every day",
  } satisfies Record<HoursId, string>,
};

export type Dictionary = typeof en;

const pt: Dictionary = {
  htmlLang: "pt",
  price: euroTrailing,
  meta: {
    description:
      "Zambhala Thai Massage — um santuário de cura tailandesa autêntica. Massagem tradicional, óleo quente e rituais de recuperação.",
  },
  languageSwitch: {
    label: "Mudar de idioma",
  },
  nav: {
    essence: "Essência",
    treatments: "Tratamentos",
    book: "Reservar",
    bookRitual: "Reservar Agora",
    openMenu: "Abrir menu",
    wordmarkSub: "Massagem Tailandesa",
  },
  hero: {
    eyebrow: "Cura tailandesa autêntica",
    title: "A arte do relaxamento tailandês.",
    body: "Um santuário tranquilo onde a massagem ancestral, os óleos quentes e a atenção sem pressas devolvem o corpo a si mesmo.",
    primaryCta: "Reserve a sua experiência",
    secondaryCta: "Ver o menu",
    rating: "4,9 de excelência",
    oils: "Óleos orgânicos · 100% botânicos",
    walkIns: "Aceitamos sem marcação",
  },
  marquee: {
    phrase: "ZAMBHALA  ·  RELAXAMENTO PROFUNDO  ·  CURA ANCESTRAL  ·  ",
  },
  essence: {
    eyebrow: "A nossa essência",
    title: "Um santuário de cura autêntica.",
    body1:
      "O Zambhala nasceu como uma pausa do mundo lá fora — teca, luz baixa e terapeutas formados nas sequências dos templos tailandeses. Cada tratamento é uma coreografia de pressão, alongamento e respiração.",
    body2:
      "Com um nome que evoca abundância e leveza, a casa oferece trabalho tailandês tradicional a par de rituais de óleo e sessões de recuperação. Nada apressado. Nada decorativo só por decorar.",
    imageAlt: "Massagem tailandesa tradicional com pressão focada",
  },
  menu: {
    eyebrow: "O nosso menu",
    title: "Tratamentos",
    body: "Sessões personalizadas para restaurar o equilíbrio natural. Escolha a duração — o preço acompanha a sua escolha.",
    book: "Reservar",
    minutesShort: (n: number) => `${n} min`,
  },
  chat: {
    label: "Guia de IA",
    name: "Guia Zambhala",
    open: "Abrir o guia de IA",
    close: "Fechar o guia de IA",
    send: "Enviar mensagem",
    placeholder: "Pergunte sobre tratamentos, preços, horários…",
    greeting:
      "Bem-vindo(a) ao Zambhala — sou o seu guia. Pergunte-me sobre tratamentos, preços, horários, como reservar ou o que torna a massagem tailandesa especial.",
    chipsTitle: "Tente perguntar:",
    chipPrices: "Preços",
    chipTreatments: "Tratamentos",
    chipHours: "Horários e local",
    chipBook: "Como reservar",
    waitLabel: "A pensar",
    unknown:
      "Ainda não tenho essa informação — tente tratamentos, preços, horários, localização ou como reservar.",
    pricesIntro: "Estes são os nossos tratamentos e preços:",
    treatmentsIntro: "O nosso menu completo:",
    treatmentsHint:
      "Pergunte-me por qualquer um deles para mais detalhes — por exemplo “tecido profundo” ou “gravidez”.",
    lengthsIntro: "Durações das sessões:",
    bookHowTo:
      "Reservar é fácil: desça até ao formulário de reserva, escolha o tratamento, a duração e a hora, e adicione o seu nome e telefone. A reserva fica guardada neste dispositivo e confirmamos por telefone.",
    timesIntro: "Horas disponíveis:",
    hoursIntro: "Estamos abertos:",
    locationIntro: "Encontra-nos em",
    contactIntro: "Pode falar connosco em:",
    walkInsIntro: "Aceitamos visitas sem marcação sempre que houver terapeuta livre.",
    oilsIntro: "Os nossos óleos são 100% botânicos e orgânicos.",
    essenceIntro:
      "O Zambhala é uma casa tranquila de ouro, teca e luz baixa — massagem tailandesa tradicional, rituais de óleo quente e cuidado sem pressas, com um nome que evoca abundância e leveza.",
    byeReply: "Até já — descanse bem. 🙏",
    thanksReply: "Com muito gosto. Pergunte-me o que quiser, sempre.",
  },
  categories: {
    all: "Todos",
    relaxing: "Relaxante",
    firm: "Firme",
    recovery: "Recuperação",
  },
  treatments: {
    thai: {
      name: "Massagem Tailandesa Tradicional",
      tag: "Ancestral",
      description:
        "Uma sequência de corpo inteiro com pressão rítmica e alongamentos assistidos, herdada das tradições dos templos. Devolve o fluxo às linhas Sen.",
    },
    oil: {
      name: "Massagem com Óleo Quente",
      tag: "Relaxante",
      description:
        "Óleos botânicos mornos e movimentos longos e contínuos. Feita para o silêncio profundo — a mente solta-se enquanto o tecido amolece.",
    },
    deep: {
      name: "Tecido Profundo",
      tag: "Mais pedida",
      description:
        "Trabalho lento e focado nos padrões de tensão crónica. Para secretárias, viagens longas e aquele tipo de tensão que já tem nome.",
    },
    sport: {
      name: "Recuperação Desportiva",
      tag: "Recuperação",
      description:
        "Trabalho dirigido a atletas e a quem treina a sério. Aumenta a amplitude, alivia a fadiga e prepara o corpo para voltar a mover-se.",
    },
    combo: {
      name: "Combinação Harmonia",
      tag: "Assinatura",
      description:
        "Alongamento tailandês fundido com trabalho de óleo morno. Firme onde precisa, seda onde não precisa — o nosso ritual mais completo.",
    },
    reflex: {
      name: "Reflexologia dos Pés",
      tag: "Equilíbrio",
      description:
        "Trabalho preciso sobre os mapas reflexos dos pés. Uma sessão curta que, ainda assim, reorganiza a forma como todo o corpo se sente.",
    },
    pregnancy: {
      name: "Massagem de Gravidez",
      tag: "Suave",
      description:
        "Técnicas cuidadosamente adaptadas, em decúbito lateral, para futuras mães. Suaviza as costas, as ancas e a mente inquieta.",
    },
  },
  booking: {
    eyebrow: "Reservar",
    title: "Comece a sua jornada.",
    body: "Escolha um ritual, uma duração e uma hora. Reservamos a sala e confirmamos por telefone. Também aceitamos sem marcação sempre que houver terapeuta disponível.",
    treatment: "Tratamento",
    duration: "Duração",
    date: "Data",
    time: "Hora",
    name: "Nome completo",
    phone: "Telefone",
    email: "Email (opcional)",
    notes: "Notas",
    notesPlaceholder: "Preferência de pressão, primeira visita, semana de gravidez…",
    durationOption: (minutes: number, price: number) =>
      `${minutes} minutos — ${euroTrailing(price)}`,
    missingFields: "Indique o seu nome, telefone e uma data.",
    submit: "Confirmar reserva",
    heldTitle: "Reservado para si",
    heldBody:
      "As reservas ficam guardadas neste dispositivo para poder consultá-las quando quiser.",
    heldEmpty: "Ainda não há reservas. Escolha um ritual para começar.",
    fallbackTreatment: "Tratamento",
    minutesShort: (n: number) => `${n} min`,
    confirmTitle: "A sua sala está reservada",
    confirmBody: (treatment: string, date: string, time: string) =>
      `${treatment} a ${date} às ${time}. Confirmamos por telefone em breve.`,
    close: "Fechar",
  },
  footer: {
    tagline:
      "Massagem tailandesa tradicional numa casa tranquila de ouro, teca e cuidado sem pressas.",
    treatments: "Tratamentos",
    visit: "Visite-nos",
    closing: "O relaxamento é a porta para a cura.",
  },
  hours: {
    everyday: "Todos os dias",
  },
};

export const dictionaries: Record<Lang, Dictionary> = { en, pt };

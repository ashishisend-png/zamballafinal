/**
 * Server-side validation for a booking submitted from the public form.
 *
 * The booking endpoint is anonymous — no auth, no session, nothing a determined
 * sender cannot replay — so everything that later reaches an email is re-derived
 * or re-checked here rather than trusted. In particular:
 *
 * - ids, durations and times must exist in `spa.ts`, so a request can never
 *   invent a treatment or a price;
 * - free text is length-capped and stripped of control characters, so a name or
 *   phone can never carry a newline into a mail header (`Reply-To`, subject);
 * - dates must be real and inside a sane window, so the inbox cannot be filled
 *   with bookings for the year 3000.
 *
 * Pure and `now`-injectable on purpose — see `mail.test.ts`. Nothing here
 * touches the network or `process.env`.
 */
import { timeSlots, treatments, type TreatmentId } from "../spa.ts";
import { languages, type Lang } from "../i18n/dictionary.ts";

export type BookingRequest = {
  treatmentId: TreatmentId;
  duration: number;
  /** `YYYY-MM-DD`, validated as a real calendar date. */
  date: string;
  /** `HH:MM`, always one of `timeSlots`. */
  time: string;
  name: string;
  phone: string;
  /** Empty string when the guest left the optional field blank. */
  email: string;
  notes: string;
  /** The language the guest is reading the site in — staff call back in it. */
  lang: Lang;
};

export type ParseResult =
  { ok: true; value: BookingRequest } | { ok: false; field: string; reason: string };

/** Max accepted length per free-text field, in characters. */
export const LIMITS = { name: 80, phone: 32, email: 120, notes: 600 } as const;

/** Furthest ahead a booking may be placed. */
export const MAX_DAYS_AHEAD = 365;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+().\-\s]+$/;
const DAY_MS = 86_400_000;

const asString = (v: unknown) => (typeof v === "string" ? v : "");

/** Single-line field: every control character (newlines included) collapses. */
const cleanLine = (v: unknown, max: number) =>
  asString(v)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);

/** Multi-line field: newlines survive, other control characters do not. */
const cleanText = (v: unknown, max: number) =>
  asString(v)
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]+/g, " ")
    .trim()
    .slice(0, max);

/** True only for a date string that round-trips — rejects `2026-02-30`. */
function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const utcDay = (d: Date) => Math.floor(d.getTime() / DAY_MS);

/**
 * Validate an untrusted payload into a `BookingRequest`.
 *
 * `now` defaults to the wall clock and is injected by the tests. The past-date
 * check allows one day of slack: the server runs in UTC while guests pick dates
 * in Lisbon time, and rejecting "today" for someone an hour the other side of
 * midnight would be a bug they cannot work around.
 */
export function parseBookingRequest(raw: unknown, now: Date = new Date()): ParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, field: "body", reason: "expected an object" };
  }
  const input = raw as Record<string, unknown>;

  const treatment = treatments.find((x) => x.id === input.treatmentId);
  if (!treatment) {
    return { ok: false, field: "treatmentId", reason: "unknown treatment" };
  }

  const duration = Number(input.duration);
  if (!treatment.durations.includes(duration)) {
    return { ok: false, field: "duration", reason: "not offered for this treatment" };
  }

  const time = asString(input.time);
  if (!timeSlots.includes(time)) {
    return { ok: false, field: "time", reason: "not a bookable slot" };
  }

  const date = asString(input.date);
  if (!isRealDate(date)) {
    return { ok: false, field: "date", reason: "expected a real YYYY-MM-DD date" };
  }
  const day = utcDay(new Date(`${date}T00:00:00Z`));
  const today = utcDay(now);
  if (day < today - 1) {
    return { ok: false, field: "date", reason: "is in the past" };
  }
  if (day > today + MAX_DAYS_AHEAD) {
    return { ok: false, field: "date", reason: "is too far ahead" };
  }

  const name = cleanLine(input.name, LIMITS.name);
  if (name.length < 2) {
    return { ok: false, field: "name", reason: "is required" };
  }

  const phone = cleanLine(input.phone, LIMITS.phone);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6 || !PHONE_RE.test(phone)) {
    return { ok: false, field: "phone", reason: "is not a usable phone number" };
  }

  // Optional: blank is fine, malformed is not — it becomes the Reply-To.
  const email = cleanLine(input.email, LIMITS.email);
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, field: "email", reason: "is not a valid address" };
  }

  const lang = asString(input.lang) as Lang;
  if (!languages.includes(lang)) {
    return { ok: false, field: "lang", reason: "unknown language" };
  }

  return {
    ok: true,
    value: {
      treatmentId: treatment.id,
      duration,
      date,
      time,
      name,
      phone,
      email,
      notes: cleanText(input.notes, LIMITS.notes),
      lang,
    },
  };
}

/**
 * Renders the notification the spa receives when a booking is submitted.
 *
 * This is **staff-facing internal mail, not site copy**, so unlike everything in
 * `components/` it is written in English here rather than pulled from the
 * dictionary — the one exception to the "all user-facing text lives in i18n"
 * rule. The guest's own language is carried in the body so whoever calls back
 * knows which language to open with, and the treatment name is looked up from
 * the dictionary so it always matches what the guest actually saw on the page.
 *
 * Prices and durations are re-read from `spa.ts` rather than taken from the
 * request: the browser never gets to state what a booking costs.
 *
 * Pure — no env, no network. See `mail.test.ts`.
 */
import { contact, treatments } from "../spa.ts";
import { dictionaries, languageNames } from "../i18n/dictionary.ts";
import { to12h } from "../time.ts";
import type { BookingRequest } from "./booking-request.ts";

export type RenderedEmail = { subject: string; html: string; text: string };

/** Every value interpolated into the HTML body goes through this. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** `2026-10-12` -> `Mon, 12 Oct 2026`. UTC-pinned so it never drifts a day. */
export function formatBookingDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** The price the guest was shown, re-derived from `spa.ts`. */
export function priceFor(booking: BookingRequest): number | null {
  const treatment = treatments.find((x) => x.id === booking.treatmentId);
  return treatment?.prices[booking.duration] ?? null;
}

type Row = { label: string; value: string; href?: string };

function rows(booking: BookingRequest): Row[] {
  const name = dictionaries.en.treatments[booking.treatmentId].name;
  const price = priceFor(booking);
  const out: Row[] = [
    { label: "Guest", value: booking.name },
    { label: "Phone", value: booking.phone, href: `tel:${booking.phone.replace(/[^0-9+]/g, "")}` },
  ];
  if (booking.email) {
    out.push({ label: "Email", value: booking.email, href: `mailto:${booking.email}` });
  }
  out.push(
    {
      label: "Treatment",
      value: `${name} · ${booking.duration} min${price === null ? "" : ` · €${price}`}`,
    },
    { label: "When", value: `${formatBookingDate(booking.date)} at ${to12h(booking.time)}` },
    { label: "Speaks", value: languageNames[booking.lang].full },
  );
  if (booking.notes) out.push({ label: "Notes", value: booking.notes });
  return out;
}

export function buildBookingNotification(booking: BookingRequest): RenderedEmail {
  const treatmentName = dictionaries.en.treatments[booking.treatmentId].name;
  const subject =
    `New booking · ${booking.name} · ${treatmentName} · ` +
    `${formatBookingDate(booking.date)} ${to12h(booking.time)}`;

  const table = rows(booking)
    .map(({ label, value, href }) => {
      const shown = escapeHtml(value).replace(/\n/g, "<br />");
      const cell = href
        ? `<a href="${escapeHtml(href)}" style="color:#c8a86b">${shown}</a>`
        : shown;
      return (
        `<tr>` +
        `<td style="padding:6px 16px 6px 0;color:#7c8b80;font-size:13px;` +
        `text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${label}</td>` +
        `<td style="padding:6px 0;color:#12211a;font-size:15px">${cell}</td>` +
        `</tr>`
      );
    })
    .join("");

  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;` +
    `background:#f6f4ef;padding:24px">` +
    `<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">` +
    `<p style="margin:0 0 4px;color:#c8a86b;font-size:12px;letter-spacing:.24em;` +
    `text-transform:uppercase">Zambhala Thai Massage</p>` +
    `<h1 style="margin:0 0 20px;font-size:21px;color:#12211a">New booking request</h1>` +
    `<table style="border-collapse:collapse;width:100%">${table}</table>` +
    `<p style="margin:24px 0 0;color:#7c8b80;font-size:13px;line-height:1.6">` +
    `Reply to this email to reach the guest directly` +
    `${booking.email ? "" : " (no address given — call them back)"}. ` +
    `Sent automatically from the booking form at ${escapeHtml(contact.email)}.</p>` +
    `</div></div>`;

  const text = [
    "New booking request — Zambhala Thai Massage",
    "",
    ...rows(booking).map(({ label, value }) => `${label}: ${value}`),
  ].join("\n");

  return { subject, html, text };
}

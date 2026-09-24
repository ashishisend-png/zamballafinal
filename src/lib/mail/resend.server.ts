/**
 * Outbound email over Resend's HTTP API — server-only.
 *
 * Plain `fetch`, no SDK and no SMTP client, because the app deploys to Vercel:
 * a serverless function opening an SMTP socket is slow, frequently blocked, and
 * would add a dependency for one POST. Swapping providers (SendGrid, Postmark)
 * means changing `send()` and nothing else — callers only see `MailOutcome`.
 *
 * Configuration is env-only and never reaches the browser (no `VITE_` prefix):
 *
 *   RESEND_API_KEY     required. Server-side secret, set in Vercel.
 *   BOOKING_FROM_EMAIL required. Must be on a domain verified in Resend,
 *                      e.g. `Zambhala Thai Massage <bookings@zambhalathai.com>`.
 *   BOOKING_NOTIFY_TO  optional. Comma-separated inboxes; defaults to the
 *                      public address in `spa.ts` so a missing var still lands
 *                      somewhere real rather than silently nowhere.
 *
 * With `RESEND_API_KEY` or `BOOKING_FROM_EMAIL` absent this reports
 * `unconfigured` instead of throwing — a preview or a fresh clone must still
 * serve the booking form, it just cannot deliver from it.
 */
import { contact } from "../spa.ts";
import { env } from "../env.server.ts";

const ENDPOINT = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export type MailOutcome =
  | { ok: true; id: string | null }
  | { ok: false; reason: "unconfigured" | "rejected" | "network"; detail: string };

export type MailMessage = {
  subject: string;
  html: string;
  text: string;
  /** Where a human reply goes — the guest, not the spa. */
  replyTo?: string;
};

if (typeof window !== "undefined") {
  throw new Error(
    "@/lib/mail/resend.server is server-only. Send mail from a createServerFn " +
      "handler (dynamic import), never from a component or browser fetch.",
  );
}

/** Recipients for booking notifications, in order of preference. */
export function notifyRecipients(): string[] {
  const configured = env("BOOKING_NOTIFY_TO");
  const list = (configured ?? contact.email)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [contact.email];
}

/** What is missing before mail can be sent — `[]` when fully configured. */
export function missingMailConfig(): string[] {
  const missing: string[] = [];
  if (!env("RESEND_API_KEY")) missing.push("RESEND_API_KEY");
  if (!env("BOOKING_FROM_EMAIL")) missing.push("BOOKING_FROM_EMAIL");
  return missing;
}

export async function send(message: MailMessage): Promise<MailOutcome> {
  const missing = missingMailConfig();
  if (missing.length > 0) {
    return { ok: false, reason: "unconfigured", detail: `missing ${missing.join(", ")}` };
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env("BOOKING_FROM_EMAIL"),
        to: notifyRecipients(),
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // Timeout or DNS/TLS failure. The message never left.
    return { ok: false, reason: "network", detail: String(err) };
  }

  if (!response.ok) {
    // Resend returns JSON errors, but never assume it on a failure path.
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      reason: "rejected",
      detail: `${response.status} ${detail.slice(0, 400)}`,
    };
  }

  const body = (await response.json().catch(() => null)) as { id?: string } | null;
  return { ok: true, id: body?.id ?? null };
}

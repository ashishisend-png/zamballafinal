/**
 * The app's one server function: email the spa when a booking is submitted.
 *
 * Auth is off in this app, so this endpoint is deliberately anonymous and must
 * defend itself — `parseBookingRequest` re-validates every field against
 * `spa.ts` and the limiter caps how often one caller can trigger mail. It
 * returns a coarse result on purpose: the browser learns whether its booking
 * reached the inbox, never why not. Detail goes to the server log, where Vercel
 * shows it and a guest cannot.
 *
 * Bookings still live in `localStorage` (see `spa.ts`) — this notifies, it does
 * not persist. Adding a database would mean writing here too, not instead.
 *
 * `@tanstack/react-start/server` and `../mail/resend.server.ts` are imported
 * dynamically inside the handler so no server-only module is pulled into the
 * client bundle by this file, which `booking.tsx` imports.
 */
import { createServerFn } from "@tanstack/react-start";
import { createRateLimiter, clientIp } from "../mail/rate-limit.ts";

/** Per-IP cap. Generous for a real guest, useless for a script. */
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export type NotifyResult = {
  ok: boolean;
  /** Coarse, client-safe. Never carries provider or validation detail. */
  reason?: "invalid" | "rate-limited" | "unconfigured" | "failed";
};

export const notifyBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<NotifyResult> => {
    const [{ getRequest }, { parseBookingRequest }, { buildBookingNotification }, mailer] =
      await Promise.all([
        import("@tanstack/react-start/server"),
        import("../mail/booking-request.ts"),
        import("../mail/booking-email.ts"),
        import("../mail/resend.server.ts"),
      ]);

    const request = getRequest();
    const ip = clientIp((name) => request?.headers.get(name));
    if (!limiter.check(ip).allowed) {
      console.warn("[booking] rate-limited", ip);
      return { ok: false, reason: "rate-limited" };
    }

    const parsed = parseBookingRequest(data);
    if (!parsed.ok) {
      console.warn(`[booking] rejected: ${parsed.field} ${parsed.reason}`);
      return { ok: false, reason: "invalid" };
    }

    const { subject, html, text } = buildBookingNotification(parsed.value);
    const outcome = await mailer.send({
      subject,
      html,
      text,
      // Staff hit reply and reach the guest, not the no-reply sender.
      replyTo: parsed.value.email || undefined,
    });

    if (!outcome.ok) {
      console.error(`[booking] mail ${outcome.reason}: ${outcome.detail}`);
      return { ok: false, reason: outcome.reason === "unconfigured" ? "unconfigured" : "failed" };
    }

    console.info(`[booking] notified ${mailer.notifyRecipients().join(", ")} (${outcome.id})`);
    return { ok: true };
  });

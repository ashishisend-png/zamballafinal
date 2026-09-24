import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseBookingRequest, LIMITS } from "./booking-request.ts";
import { buildBookingNotification, escapeHtml, formatBookingDate } from "./booking-email.ts";
import { createRateLimiter, clientIp } from "./rate-limit.ts";
import { missingMailConfig, notifyRecipients, send } from "./resend.server.ts";
import { contact } from "../spa.ts";

/** Fixed clock so date-window assertions never depend on the day tests run. */
const NOW = new Date("2026-10-01T12:00:00Z");

const valid = {
  treatmentId: "thai",
  duration: 90,
  date: "2026-10-12",
  time: "13:30",
  name: "Ana Silva",
  phone: "+351 912 345 678",
  email: "ana@example.com",
  notes: "Prefers firm pressure",
  lang: "pt",
};

const parse = (over: Record<string, unknown> = {}) =>
  parseBookingRequest({ ...valid, ...over }, NOW);

describe("parseBookingRequest", () => {
  it("accepts a well-formed booking", () => {
    const result = parse();
    assert.ok(result.ok);
    assert.equal(result.value.treatmentId, "thai");
    assert.equal(result.value.duration, 90);
    assert.equal(result.value.lang, "pt");
  });

  it("rejects a treatment that is not on the menu", () => {
    const result = parse({ treatmentId: "hot-stone" });
    assert.equal(result.ok, false);
  });

  it("rejects a duration the treatment does not offer", () => {
    // Pregnancy is 60/90 only — 120 exists for other treatments.
    assert.equal(parse({ treatmentId: "pregnancy", duration: 120 }).ok, false);
    assert.equal(parse({ treatmentId: "pregnancy", duration: 90 }).ok, true);
  });

  it("rejects a time that is not a bookable slot", () => {
    assert.equal(parse({ time: "03:15" }).ok, false);
  });

  it("rejects impossible and out-of-window dates", () => {
    assert.equal(parse({ date: "2026-02-30" }).ok, false);
    assert.equal(parse({ date: "2020-01-01" }).ok, false);
    assert.equal(parse({ date: "2030-01-01" }).ok, false);
  });

  it("allows a day of slack around today for timezone skew", () => {
    assert.equal(parse({ date: "2026-09-30" }).ok, true);
    assert.equal(parse({ date: "2026-09-29" }).ok, false);
  });

  it("strips control characters so a name cannot forge a mail header", () => {
    const result = parse({ name: "Ana\r\nBcc: victim@example.com" });
    assert.ok(result.ok);
    assert.ok(!result.value.name.includes("\n"));
    assert.ok(!result.value.name.includes("\r"));
  });

  it("caps free text at the documented limits", () => {
    const result = parse({ notes: "x".repeat(5000) });
    assert.ok(result.ok);
    assert.equal(result.value.notes.length, LIMITS.notes);
  });

  it("keeps newlines inside notes", () => {
    const result = parse({ notes: "Line one\nLine two" });
    assert.ok(result.ok);
    assert.equal(result.value.notes, "Line one\nLine two");
  });

  it("treats email as optional but validates it when given", () => {
    assert.equal(parse({ email: "" }).ok, true);
    assert.equal(parse({ email: "not-an-address" }).ok, false);
  });

  it("requires a phone with real digits", () => {
    assert.equal(parse({ phone: "12" }).ok, false);
    assert.equal(parse({ phone: "call me" }).ok, false);
  });

  it("rejects an unknown language", () => {
    assert.equal(parse({ lang: "fr" }).ok, false);
  });
});

describe("buildBookingNotification", () => {
  const booking = parse();
  assert.ok(booking.ok);
  const mail = buildBookingNotification(booking.value);

  it("subjects the mail with guest, treatment and slot", () => {
    assert.ok(mail.subject.includes("Ana Silva"));
    assert.ok(mail.subject.includes("Traditional Thai Massage"));
    assert.ok(mail.subject.includes("1:30 PM"));
    assert.ok(!mail.subject.includes("\n"));
  });

  it("prices from spa.ts rather than from the request", () => {
    assert.ok(mail.html.includes("€70"));
    assert.ok(mail.text.includes("90 min"));
  });

  it("names the guest's language so staff call back in it", () => {
    assert.ok(mail.text.includes("Português"));
  });

  it("escapes guest input into the HTML body", () => {
    const hostile = parse({ name: "<script>alert(1)</script>" });
    assert.ok(hostile.ok);
    const out = buildBookingNotification(hostile.value);
    assert.ok(!out.html.includes("<script>"));
    assert.ok(out.html.includes("&lt;script&gt;"));
  });

  it("formats the date in UTC so it never slips a day", () => {
    assert.equal(escapeHtml("a & b"), "a &amp; b");
    assert.ok(formatBookingDate("2026-10-12").includes("12 Oct 2026"));
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit, then blocks until the window rolls", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    assert.equal(limiter.check("a", 0).allowed, true);
    assert.equal(limiter.check("a", 100).allowed, true);

    const blocked = limiter.check("a", 200);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfterMs, 800);

    assert.equal(limiter.check("a", 1101).allowed, true);
  });

  it("keeps callers in separate buckets", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    assert.equal(limiter.check("a", 0).allowed, true);
    assert.equal(limiter.check("b", 0).allowed, true);
    assert.equal(limiter.check("a", 0).allowed, false);
  });

  it("evicts the least recently seen key instead of growing forever", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 1);
    limiter.check("c", 2);
    // "a" was evicted, so its next request looks like a first one.
    assert.equal(limiter.check("a", 3).allowed, true);
  });

  it("reads the original client from x-forwarded-for", () => {
    const headers = new Map([["x-forwarded-for", "203.0.113.7, 70.41.3.18"]]);
    assert.equal(
      clientIp((n) => headers.get(n)),
      "203.0.113.7",
    );
    assert.equal(
      clientIp(() => null),
      "unknown",
    );
  });
});

/** Put one env var back exactly as it was, absent included. */
function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("mail configuration", () => {
  it("reports exactly which env vars are missing", () => {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.BOOKING_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.BOOKING_FROM_EMAIL;
    assert.deepEqual(missingMailConfig(), ["RESEND_API_KEY", "BOOKING_FROM_EMAIL"]);

    process.env.RESEND_API_KEY = "re_test";
    assert.deepEqual(missingMailConfig(), ["BOOKING_FROM_EMAIL"]);

    restore("RESEND_API_KEY", key);
    restore("BOOKING_FROM_EMAIL", from);
  });

  it("falls back to the public address when no inbox is configured", () => {
    const before = process.env.BOOKING_NOTIFY_TO;
    delete process.env.BOOKING_NOTIFY_TO;
    assert.deepEqual(notifyRecipients(), [contact.email]);

    process.env.BOOKING_NOTIFY_TO = "a@x.com, b@x.com";
    assert.deepEqual(notifyRecipients(), ["a@x.com", "b@x.com"]);
    restore("BOOKING_NOTIFY_TO", before);
  });
});

describe("send", () => {
  /** Run `fn` with mail configured and `fetch` stubbed; always restores both. */
  async function withStub(
    reply: () => Promise<Response>,
    fn: (calls: { url: string; init: RequestInit }[]) => Promise<void>,
  ) {
    const saved = {
      key: process.env.RESEND_API_KEY,
      from: process.env.BOOKING_FROM_EMAIL,
      to: process.env.BOOKING_NOTIFY_TO,
      fetch: globalThis.fetch,
    };
    process.env.RESEND_API_KEY = "re_test";
    process.env.BOOKING_FROM_EMAIL = "Zambhala <bookings@example.com>";
    process.env.BOOKING_NOTIFY_TO = "spa@example.com";

    const calls: { url: string; init: RequestInit }[] = [];
    globalThis.fetch = (async (url: string | URL | Request, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return reply();
    }) as typeof fetch;

    try {
      await fn(calls);
    } finally {
      globalThis.fetch = saved.fetch;
      restore("RESEND_API_KEY", saved.key);
      restore("BOOKING_FROM_EMAIL", saved.from);
      restore("BOOKING_NOTIFY_TO", saved.to);
    }
  }

  const message = { subject: "s", html: "<p>h</p>", text: "t", replyTo: "ana@example.com" };

  it("posts the message to Resend with the configured sender and inbox", async () => {
    await withStub(
      async () => new Response(JSON.stringify({ id: "abc" }), { status: 200 }),
      async (calls) => {
        const outcome = await send(message);
        assert.deepEqual(outcome, { ok: true, id: "abc" });
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, "https://api.resend.com/emails");

        const headers = calls[0].init.headers as Record<string, string>;
        assert.equal(headers.Authorization, "Bearer re_test");

        const body = JSON.parse(String(calls[0].init.body));
        assert.equal(body.from, "Zambhala <bookings@example.com>");
        assert.deepEqual(body.to, ["spa@example.com"]);
        assert.equal(body.reply_to, "ana@example.com");
        assert.equal(body.subject, "s");
      },
    );
  });

  it("omits reply_to when the guest gave no address", async () => {
    await withStub(
      async () => new Response("{}", { status: 200 }),
      async (calls) => {
        await send({ subject: "s", html: "h", text: "t" });
        assert.ok(!("reply_to" in JSON.parse(String(calls[0].init.body))));
      },
    );
  });

  it("reports a provider rejection with its status", async () => {
    await withStub(
      async () => new Response('{"message":"domain not verified"}', { status: 403 }),
      async () => {
        const outcome = await send(message);
        assert.equal(outcome.ok, false);
        assert.equal(outcome.reason, "rejected");
        assert.ok(outcome.detail.includes("403"));
        assert.ok(outcome.detail.includes("domain not verified"));
      },
    );
  });

  it("reports a transport failure instead of throwing", async () => {
    await withStub(
      async () => {
        throw new Error("getaddrinfo ENOTFOUND");
      },
      async () => {
        const outcome = await send(message);
        assert.equal(outcome.ok, false);
        assert.equal(outcome.reason, "network");
      },
    );
  });

  it("never calls the provider when the key is missing", async () => {
    const saved = { key: process.env.RESEND_API_KEY, fetch: globalThis.fetch };
    delete process.env.RESEND_API_KEY;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      const outcome = await send(message);
      assert.equal(outcome.ok, false);
      assert.equal(outcome.reason, "unconfigured");
      assert.equal(called, false);
    } finally {
      globalThis.fetch = saved.fetch;
      restore("RESEND_API_KEY", saved.key);
    }
  });
});

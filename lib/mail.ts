/**
 * Shared SMTP plumbing for the two routes that send mail: the commission
 * inquiry form (`/api/inquiry`) and the footer newsletter capture
 * (`/api/subscribe`).
 *
 * This exists so both routes read the same env vars, apply the same header
 * sanitising, and fail the same way. Two hand-rolled copies of a nodemailer
 * setup is how one endpoint silently keeps working while the other returns a
 * false success for months.
 *
 * Required env vars — see `.env.example`:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_EMAIL
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
};

/**
 * Reads and validates SMTP configuration.
 *
 * Returns `null` rather than throwing so each route can decide its own
 * response. Both currently answer 503, because reporting success for mail that
 * was never sent is the one failure mode that loses leads without any signal.
 */
export function getSmtpConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !CONTACT_EMAIL) {
    console.error(
      "[mail] SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, " +
        "SMTP_FROM, CONTACT_EMAIL. See .env.example."
    );
    return null;
  }

  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    user: SMTP_USER,
    /**
     * Whitespace stripped deliberately.
     *
     * Google presents an App Password as four space-separated groups
     * ("abcd efgh ijkl mnop"), and it is nearly always pasted in that form.
     * Gmail's SMTP server rejects it with a 535 that reads as a wrong password,
     * which sends you looking at the account rather than the string. The
     * password itself is the 16 characters without the spaces.
     */
    pass: SMTP_PASS.replace(/\s+/g, ""),
    from: SMTP_FROM,
    to: CONTACT_EMAIL,
  };
}

export function createTransport(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS.
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    /**
     * Explicit timeouts.
     *
     * Without them nodemailer inherits the OS socket defaults, which on a
     * silently dropped connection is minutes. Both routes are capped at
     * `maxDuration = 30`, so a stalled handshake burns the entire budget and
     * the function is killed before it can answer — the visitor gets a dead
     * request rather than an error they can act on. These three cover the
     * stages that actually stall: TCP connect, the 220 greeting, and
     * mid-session silence.
     */
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

/* ──────────────────────────── error reporting ───────────────────────────── */

type SmtpError = Error & {
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
};

/**
 * Formats an SMTP failure as a single flat string.
 *
 * The string is the point. Both routes previously did
 * `console.error("...failed:", { code, response, ... })`, and Next's
 * structured dev logger serialises a trailing object argument to `{}` — so
 * every SMTP failure in this project was recorded as
 * `[inquiry] SMTP send failed: {}`. The handler was correct, the error was
 * caught, and the one detail needed to fix it was dropped on the floor, which
 * is indistinguishable from having no error handling at all. Interpolating into
 * the message string survives every logger.
 */
export function describeSmtpError(error: unknown, config: SmtpConfig): string {
  const err = error as SmtpError;

  const parts = [
    `code=${err?.code ?? "none"}`,
    `command=${err?.command ?? "none"}`,
    `responseCode=${err?.responseCode ?? "none"}`,
    `response=${err?.response ?? "none"}`,
    `message=${err?.message ?? String(error)}`,
    `transport=${config.user}@${config.host}:${config.port}`,
    `to=${config.to}`,
  ];

  const hint = smtpHint(err);
  if (hint) parts.push(`hint=${hint}`);

  return parts.join(" | ");
}

/**
 * Maps the failures whose cause is not guessable from the message text.
 *
 * The TLS case is here because it cost a full debugging session: the message
 * says "self-signed certificate in certificate chain", which reads like a
 * problem with Gmail's certificate, and the same credentials authenticate
 * perfectly from a plain `node` script in the same shell. The actual cause is
 * local and has nothing to do with the code.
 */
function smtpHint(err: SmtpError): string | null {
  const message = err?.message ?? "";

  if (/self-signed certificate|unable to verify the first certificate|unable to get local issuer/i.test(message)) {
    return (
      "TLS interception, not a mail problem. An antivirus or corporate proxy " +
      "(AVG/Avast Mail Shield, ESET, Kaspersky, Bitdefender) is terminating the " +
      "SMTP connection and re-signing it with a private root that lives in the OS " +
      "certificate store but not in Node's bundled CA list. Start the server with " +
      "NODE_USE_SYSTEM_CA=1 so Node reads the OS store. Never 'fix' this with " +
      "NODE_TLS_REJECT_UNAUTHORIZED=0 or tls.rejectUnauthorized:false — that " +
      "disables certificate verification process-wide, including for real MITM."
    );
  }

  if (err?.code === "EAUTH") {
    return (
      "Credentials rejected. For Gmail, SMTP_PASS must be a 16-character App " +
      "Password rather than the account password, and App Passwords are revoked " +
      "when the account password changes or 2FA is reconfigured."
    );
  }

  if (err?.code === "ECONNECTION" || err?.code === "ETIMEDOUT" || err?.code === "ESOCKET") {
    return (
      "Could not establish or hold the connection. Check that outbound 587/465 is " +
      "open from the host — many providers block SMTP egress by default."
    );
  }

  if (err?.responseCode === 550 || err?.responseCode === 553) {
    return (
      "The server rejected the sender. Gmail requires the From address to be the " +
      "authenticated account or a verified 'Send mail as' alias."
    );
  }

  return null;
}

/* ─────────────────────────────── sanitising ─────────────────────────────── */

/**
 * Strips CR/LF so user input placed in a header (subject, replyTo) cannot
 * inject additional SMTP headers. Never put unsanitised input in a header.
 */
export function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Deliberately permissive. Full RFC 5322 validation is not worth it here: the
 * only address that matters is one a human will reply to, and rejecting a valid
 * unusual address costs more than accepting an invalid one that simply bounces.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

/* ────────────────────────────── rate limiting ───────────────────────────── */

/** Bounds memory if a single host is flooded with unique spoofed IPs. */
const MAX_TRACKED_KEYS = 5000;

/**
 * In-memory fixed-window limiter.
 *
 * Understand its limits before relying on it: state is per server instance, so
 * on serverless the effective ceiling is `max × live instances` and it resets on
 * every cold start. Adequate for blunting bots on a low-volume studio site;
 * move to Redis/Upstash if this ever needs to be authoritative.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  let warnedAboutUnknown = false;

  return function rateLimit(key: string): { ok: boolean; retryAfter: number } {
    /**
     * Never limit in development.
     *
     * Locally there is no proxy, so `clientKey` cannot distinguish requests and
     * returns "unknown" for all of them — every submission lands in one bucket.
     * At `max: 5` that means the sixth test submission of the hour is refused,
     * and the 429 reads to the developer exactly like a broken mailer. Bots are
     * not the threat model on localhost.
     */
    if (process.env.NODE_ENV !== "production") return { ok: true, retryAfter: 0 };

    /**
     * Fail open when the client cannot be identified.
     *
     * On Vercel or behind Cloudflare `x-forwarded-for` is always present. Its
     * absence means the app is running without a trusted proxy, in which case
     * every visitor shares the "unknown" bucket and the limiter stops being a
     * spam control and becomes a self-inflicted outage on the lead funnel: five
     * enquiries site-wide per hour and the form is shut for everyone. Counting
     * is worse than not counting here. The honeypot and field validation do not
     * depend on network trust and still apply.
     */
    if (key === "unknown") {
      if (!warnedAboutUnknown) {
        warnedAboutUnknown = true;
        console.warn(
          "[mail] rate limiting disabled: no x-forwarded-for/x-real-ip on inbound " +
            "requests, so clients cannot be told apart. Put the app behind a proxy " +
            "that sets these headers to re-enable it."
        );
      }
      return { ok: true, retryAfter: 0 };
    }

    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      if (hits.size >= MAX_TRACKED_KEYS) {
        for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
        if (hits.size >= MAX_TRACKED_KEYS) hits.clear();
      }
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, retryAfter: 0 };
    }

    entry.count += 1;
    if (entry.count > max) {
      return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { ok: true, retryAfter: 0 };
  };
}

/**
 * Client IP.
 *
 * `x-forwarded-for` is client-supplied and trivially spoofed, so this is only
 * meaningful behind a proxy that overwrites it (Vercel, Cloudflare, nginx with
 * real_ip). Without one the limiter is best-effort; the honeypot and field
 * validation are the defences that do not depend on network trust.
 */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

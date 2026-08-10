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
  });
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

  return function rateLimit(key: string): { ok: boolean; retryAfter: number } {
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

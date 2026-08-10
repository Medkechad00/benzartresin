import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * Commission inquiry handler.
 *
 * Fails loudly by design: if SMTP is not configured this returns 503 rather
 * than a false success, so a misconfigured deploy surfaces immediately instead
 * of silently discarding leads. (An earlier version of this file had the whole
 * mail block commented out and returned `{ success: true }` unconditionally.)
 *
 * Required env vars — see `.env.example`:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_EMAIL
 */

export const runtime = "nodejs";

/**
 * Vercel's default serverless function timeout is 10s on Hobby. An SMTP
 * handshake plus TLS upgrade plus send against Gmail occasionally exceeds that
 * on a cold start, and the failure mode is the worst one available: the mail
 * is sent but the function is killed before responding, so the visitor sees an
 * error and submits again. 30s is comfortably above the observed worst case.
 */
export const maxDuration = 30;

/**
 * Never cache this route. It is a POST handler, so Next would not cache it
 * anyway, but being explicit prevents a future `revalidate` on a parent
 * segment from silently applying here.
 */
export const dynamic = "force-dynamic";

type InquiryPayload = {
  name?: string;
  email?: string;
  phone?: string;
  wood?: string;
  woodOther?: string;
  resin?: string;
  resinOther?: string;
  dimensions?: string;
  shape?: string;
  shapeOther?: string;
  spaceType?: string;
  spaceTypeOther?: string;
  shippingCountry?: string;
  budget?: string;
  location?: string;
  message?: string;
  /** Locale the form was submitted from, so replies can match the language. */
  locale?: string;
  /** Slug of the piece the visitor came from, via /inquiry?ref=<slug>. */
  ref?: string;
  /** Honeypot — must stay empty. Not rendered to real users. */
  website?: string;
};

/* ────────────────────────────── rate limiting ───────────────────────────── */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;
/** Bounds memory use if a single host is flooded with unique spoofed IPs. */
const MAX_TRACKED_IPS = 5000;

/**
 * In-memory fixed-window limiter.
 *
 * Deliberately simple, and worth understanding its limits: state is per server
 * instance, so on a multi-instance or serverless deployment the effective limit
 * is MAX_PER_WINDOW × instances, and it resets on cold start. That is adequate
 * for a low-volume studio site whose real goal is blunting bots, but if this
 * ever needs to be strict, move it to Redis / Upstash rather than trusting this.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    if (hits.size >= MAX_TRACKED_IPS) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
      if (hits.size >= MAX_TRACKED_IPS) hits.clear();
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Client IP.
 *
 * `x-forwarded-for` is client-supplied and trivially spoofed, so this is only
 * meaningful behind a proxy that overwrites it (Vercel, Cloudflare, nginx with
 * real_ip). Without such a proxy the limiter is best-effort; the honeypot and
 * field validation are the defences that do not depend on network trust.
 */
function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/* ─────────────────────────────── formatting ─────────────────────────────── */

/** Strips CR/LF so user input cannot inject extra SMTP headers. */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Merges a select value with its free-text "Other" answer so the email reads
 * "Other — reclaimed cedar" instead of a bare "other".
 */
function withOther(value: string | undefined, other: string | undefined): string {
  if (!value) return "";
  if (value !== "other") return value;
  return other?.trim() ? `Other — ${other.trim()}` : "Other (unspecified)";
}

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: "Too many enquiries from this address. Please try again later, or email us directly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: InquiryPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real users never see this field, so anything in it is a bot.
  // Returns 200 so the bot cannot distinguish rejection from success.
  if (body.website && body.website.trim() !== "") {
    console.warn("[inquiry] honeypot triggered — discarding submission");
    return NextResponse.json({ success: true, message: "Inquiry sent successfully." });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !phone || !message) {
    return NextResponse.json(
      { success: false, message: "Name, email, phone, and details are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, message: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  // Loose on purpose — international formats vary enormously, and rejecting a
  // real customer's number is far more costly than accepting a malformed one.
  if (phone.replace(/[^\d]/g, "").length < 6) {
    return NextResponse.json(
      { success: false, message: "Please provide a valid phone number." },
      { status: 400 }
    );
  }

  if (name.length > 200 || email.length > 320 || message.length > 5000) {
    return NextResponse.json({ success: false, message: "Submission too large." }, { status: 413 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !CONTACT_EMAIL) {
    console.error(
      "[inquiry] SMTP is not configured — refusing to report a false success. " +
        "Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_EMAIL. See .env.example."
    );
    return NextResponse.json(
      {
        success: false,
        message: "Our enquiry system is temporarily unavailable. Please email us directly and we will respond right away.",
      },
      { status: 503 }
    );
  }

  const port = Number(SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 upgrades via STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Referring piece", body.ref ?? ""],
    ["Wood preference", withOther(body.wood, body.woodOther)],
    ["Resin style", withOther(body.resin, body.resinOther)],
    ["Dimensions", body.dimensions ?? ""],
    ["Shape", withOther(body.shape, body.shapeOther)],
    ["Space type", withOther(body.spaceType, body.spaceTypeOther)],
    ["Shipping country", body.shippingCountry ?? ""],
    ["Budget range", body.budget ?? ""],
    ["City", body.location ?? ""],
    ["Site language", body.locale ?? ""],
  ].filter(([, v]) => v.trim().length > 0) as [string, string][];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(label)}</td><td style="padding:4px 0;"><strong>${escapeHtml(value)}</strong></td></tr>`
    )
    .join("");

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: CONTACT_EMAIL,
      // Lets the studio hit Reply and reach the customer directly.
      replyTo: `${headerSafe(name)} <${headerSafe(email)}>`,
      subject: `New table enquiry — ${headerSafe(name)}${body.ref ? ` (${headerSafe(body.ref)})` : ""}`,
      text: [...rows.map(([l, v]) => `${l}: ${v}`), "", "Details:", message].join("\n"),
      html: `
        <h2 style="font-family:sans-serif;">New table enquiry</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">${htmlRows}</table>
        <h3 style="font-family:sans-serif;">Details</h3>
        <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(message)}</p>
      `,
    });

    return NextResponse.json({ success: true, message: "Inquiry sent successfully." });
  } catch (error) {
    console.error("[inquiry] Failed to send:", error);
    return NextResponse.json(
      { success: false, message: "We could not send your enquiry. Please try again or email us directly." },
      { status: 502 }
    );
  }
}

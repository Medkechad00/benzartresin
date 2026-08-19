import { NextResponse } from "next/server";
import {
  clientKey,
  createRateLimiter,
  createTransport,
  describeSmtpError,
  escapeHtml,
  getSmtpConfig,
  headerSafe,
  isValidEmail,
} from "@/lib/mail";
import {
  OTHER_OPTION_ID,
  optionLabel,
  type InquiryOptionField,
} from "@/lib/inquiry-schema";

/**
 * Commission inquiry handler.
 *
 * Fails loudly by design: if SMTP is not configured this returns 503 rather
 * than a false success, so a misconfigured deploy surfaces immediately instead
 * of silently discarding leads. (An earlier version of this file had the whole
 * mail block commented out and returned `{ success: true }` unconditionally.)
 *
 * SMTP setup, sanitising, and rate limiting live in `lib/mail.ts`, shared with
 * the newsletter route so the two can never drift apart.
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
  extraNotes?: string;
};

/* ────────────────────────────── rate limiting ───────────────────────────── */

const rateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

/* ─────────────────────────────── formatting ─────────────────────────────── */

/**
 * Renders a select answer for the notification email.
 *
 * Two jobs: turn the submitted id into a readable English label, and fold in
 * the free-text answer when the visitor chose "Other". Without the lookup the
 * studio received raw ids — "privateDining", "5000to8000" — which are fine as
 * data and poor as something a human reads over morning coffee.
 */
function formatSelection(
  field: InquiryOptionField,
  value: string | undefined,
  other: string | undefined
): string {
  if (!value) return "";
  if (value !== OTHER_OPTION_ID) return optionLabel(field, value);
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

  /**
   * Honeypot.
   *
   * This block used to return a fake success and drop the submission, on the
   * reasoning that only a bot can fill a field no human can see. That reasoning
   * was wrong in practice, and it cost real commissions.
   *
   * The field was named `website` and carried `autocomplete="off"`. No major
   * password manager honours that attribute, and `website` is exactly the key
   * they map to the URL of a saved login — so the field was being autofilled on
   * page load. Because the form's reset does not clear its state, one autofill
   * poisoned every subsequent submission in the session. The visitor got the
   * confirmation screen every time and the studio received nothing.
   *
   * So the honeypot no longer decides anything by itself; it annotates. A
   * commission enquiry is worth several thousand and a spam email costs a moment
   * to delete, and that asymmetry means this signal must never be the thing that
   * stops delivery. The flag travels in the subject line so the studio can
   * filter on it.
   */
  const honeypot = (body.extraNotes ?? "").trim();
  const flaggedAsSpam = honeypot !== "";

  if (flaggedAsSpam) {
    console.warn(
      "[inquiry] honeypot filled — delivering anyway, flagged as suspected spam. " +
        `value=${JSON.stringify(honeypot.slice(0, 120))} ` +
        "(a URL or an email address here almost always means autofill, not a bot)"
    );
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

  if (!isValidEmail(email)) {
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

  const smtp = getSmtpConfig();

  if (!smtp) {
    return NextResponse.json(
      {
        success: false,
        message: "Our enquiry system is temporarily unavailable. Please email us directly and we will respond right away.",
      },
      { status: 503 }
    );
  }

  const transporter = createTransport(smtp);

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Referring piece", body.ref ?? ""],
    ["Wood preference", formatSelection("wood", body.wood, body.woodOther)],
    ["Resin style", formatSelection("resin", body.resin, body.resinOther)],
    ["Dimensions", body.dimensions ?? ""],
    ["Shape", formatSelection("shape", body.shape, body.shapeOther)],
    ["Space type", formatSelection("spaceType", body.spaceType, body.spaceTypeOther)],
    ["Shipping country", body.shippingCountry ?? ""],
    ["Budget range", formatSelection("budget", body.budget, undefined)],
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
      from: smtp.from,
      to: smtp.to,
      replyTo: `${headerSafe(name)} <${headerSafe(email)}>`,
      subject: `${flaggedAsSpam ? "[SUSPECTED SPAM] " : ""}New table enquiry — ${headerSafe(name)}${body.ref ? ` (${headerSafe(body.ref)})` : ""}`,
      text: [
        ...(flaggedAsSpam
          ? ["NOTE: the hidden anti-spam field was filled. Usually browser autofill on a genuine enquiry — check before discarding.", ""]
          : []),
        ...rows.map(([l, v]) => `${l}: ${v}`),
        "",
        "Details:",
        message,
      ].join("\n"),
      html: `
        ${
          flaggedAsSpam
            ? `<p style="font-family:sans-serif;font-size:13px;background:#FFF4D6;border-left:3px solid #E4B028;padding:10px 12px;margin:0 0 16px;">The hidden anti-spam field was filled on this submission. That is usually browser autofill on a genuine enquiry rather than a bot — read it before discarding.</p>`
            : ""
        }
        <h2 style="font-family:sans-serif;">New table enquiry</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">${htmlRows}</table>
        <h3 style="font-family:sans-serif;">Details</h3>
        <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(message)}</p>
      `,
    });

    return NextResponse.json({ success: true, message: "Inquiry sent successfully." });
  } catch (error) {
    const err = error as Error & { code?: string };

    console.error(`[inquiry] SMTP send failed: ${describeSmtpError(error, smtp)}`);

    /**
     * Preserve the lead.
     *
     * Previously the catch block logged the transport error and nothing else, so
     * a failed send destroyed the submission: the visitor was told to email us
     * instead, most never do, and the studio had no record that anyone tried.
     * This log line is the only remaining copy of the enquiry, so it is written
     * in full and in one piece, ready to be recovered by hand.
     */
    console.error(
      `[inquiry] UNSENT LEAD — recover manually: ${JSON.stringify({
        receivedAt: new Date().toISOString(),
        ...Object.fromEntries(rows),
        details: message,
      })}`
    );

    return NextResponse.json(
      {
        success: false,
        message:
          err.code === "ECONNECTION"
            ? "Our mail server is unreachable. Please try again or email us directly at " + smtp.to + "."
            : "We could not send your enquiry. Please try again or email us directly at " + smtp.to + ".",
      },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  addressNameSafe,
  clientKey,
  createRateLimiter,
  createTransport,
  describeSmtpError,
  getSmtpConfig,
  headerSafe,
  isValidEmail,
  readJsonBody,
  redactEmail,
  redactPhone,
  rejectUnsafeRequest,
  str,
} from "@/lib/mail";
import {
  OTHER_OPTION_ID,
  optionLabel,
  type InquiryOptionField,
} from "@/lib/inquiry-schema";
import { buildInquiryEmail } from "@/lib/inquiry-email";
import { BASE_URL, SITE } from "@/lib/site-config";

/**
 * Commission inquiry handler.
 *
 * Fails loudly by design: if SMTP is not configured this returns 503 rather
 * than a false success, so a misconfigured deploy surfaces immediately instead
 * of silently discarding leads. (An earlier version of this file had the whole
 * mail block commented out and returned `{ success: true }` unconditionally.)
 *
 * SMTP setup, sanitising, and rate limiting live in `lib/mail.ts`, shared with
 * the newsletter route so the two can never drift apart. The notification's
 * subject, HTML and plain-text bodies are built together in
 * `lib/inquiry-email.ts` — previously they were assembled separately here, which
 * is how a field gets added to one and forgotten in the others.
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

/**
 * Field length caps.
 *
 * Every field the studio ever reads is bounded, not just the three that were.
 * `phone`, `dimensions`, `shippingCountry`, `locale`, `ref`, `shape` and
 * `shapeOther` previously had no maximum at all, and all of them are
 * interpolated into the notification email — so a multi-megabyte `dimensions`
 * value went straight into the studio's inbox.
 */
const LIMITS = {
  name: 200,
  email: 320,
  phone: 40,
  dimensions: 300,
  shape: 60,
  shapeOther: 200,
  shippingCountry: 100,
  message: 5000,
  locale: 10,
  ref: 120,
  honeypot: 200,
} as const;

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
  /**
   * Origin, content type and size, before anything else.
   *
   * See `rejectUnsafeRequest`: without a `Content-Type` requirement both routes
   * were callable cross-origin with no preflight, which let any third-party page
   * make its visitors send mail to the studio from their own IPs — bypassing the
   * rate limiter below, since it keys on the client address.
   */
  const unsafe = rejectUnsafeRequest(req);
  if (unsafe) return unsafe;

  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: "Too many enquiries from this address. Please try again later, or email us directly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await readJsonBody(req);
  if (!body) {
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
  const honeypot = str(body.extraNotes, LIMITS.honeypot);
  const flaggedAsSpam = honeypot !== "";

  if (flaggedAsSpam) {
    /**
     * The value itself is no longer logged.
     *
     * The comment above explains that password managers autofill this field —
     * which means whatever they filled it with came out of the visitor's
     * credential store. Writing that to a log is the one thing this field must
     * never do. Its length is enough to tell autofill from a bot.
     */
    console.warn(
      `[inquiry] honeypot filled (${honeypot.length} chars) — delivering anyway, ` +
        "flagged as suspected spam. A filled value here is almost always password-" +
        "manager autofill rather than a bot."
    );
  }

  const name = str(body.name, LIMITS.name);
  const email = str(body.email, LIMITS.email);
  const phone = str(body.phone, LIMITS.phone);
  const message = str(body.message, LIMITS.message);

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

  /**
   * Specification rows for the notification.
   *
   * Contact details are no longer in this list — they are rendered as a
   * dedicated panel at the top of the email, because replying is the only action
   * the message exists to prompt and burying the address in a table of eleven
   * grey rows worked against that.
   *
   * Empty answers are dropped rather than rendered blank, so a visitor who
   * skipped the optional fields produces a short email instead of a page of
   * labels with nothing beside them.
   */
  const rows = (
    [
      ["Dimensions", str(body.dimensions, LIMITS.dimensions)],
      [
        "Shape",
        formatSelection(
          "shape",
          str(body.shape, LIMITS.shape) || undefined,
          str(body.shapeOther, LIMITS.shapeOther) || undefined
        ),
      ],
      ["Shipping country", str(body.shippingCountry, LIMITS.shippingCountry)],
      ["Site language", str(body.locale, LIMITS.locale)],
    ] as [string, string][]
  )
    .filter(([, v]) => v.trim().length > 0)
    .map(([label, value]) => ({ label, value }));

  const ref = str(body.ref, LIMITS.ref) || undefined;

  const { subject, html, text } = buildInquiryEmail({
    name,
    email,
    phone,
    message,
    rows,
    ref,
    flaggedAsSpam,
    baseUrl: BASE_URL,
  });

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: smtp.to,
      /**
       * Structured, not a concatenated string.
       *
       * This was `` `${headerSafe(name)} <${headerSafe(email)}>` ``. `headerSafe`
       * strips CR/LF but not commas or angle brackets, and nodemailer parses
       * `replyTo` as an address LIST — so a visitor named
       * `attacker@evil.com, X` silently added themselves as a second recipient
       * of the studio's reply. Passing the parts separately lets nodemailer do
       * the quoting, and `addressNameSafe` removes the delimiters as well.
       */
      replyTo: { name: addressNameSafe(name), address: email },
      subject: headerSafe(subject),
      text,
      html,
    });

    return NextResponse.json({ success: true, message: "Inquiry sent successfully." });
  } catch (error) {
    const err = error as Error & { code?: string };

    console.error(`[inquiry] SMTP send failed: ${describeSmtpError(error, smtp)}`);

    /**
     * Preserve the lead, without copying the visitor's personal data into the
     * log store.
     *
     * The catch block originally logged nothing but the transport error, so a
     * failed send destroyed the submission outright. The fix for that was to log
     * the whole enquiry — which swapped a lead-loss bug for a privacy one: name,
     * email, phone and the full free-text message went into Vercel's runtime log
     * and any drain attached to it, under retention the form never disclosed and
     * outside any deletion workflow.
     *
     * This keeps what the studio needs to notice a lost lead and reconcile it
     * against a later enquiry — a timestamp, the field shape, the referenced
     * piece, and enough of the contact details to match — without the log
     * becoming the personal data itself.
     */
    console.error(
      `[inquiry] UNSENT LEAD — a submission was lost. ${JSON.stringify({
        receivedAt: new Date().toISOString(),
        emailHint: redactEmail(email),
        phoneHint: redactPhone(phone),
        ref: ref ?? "",
        fieldsProvided: rows.map(({ label }) => label),
        messageLength: message.length,
      })}`
    );

    /**
     * The recipient address is no longer echoed back.
     *
     * Both 502 branches interpolated `smtp.to` into the client-visible message,
     * so anyone who could make the send fail learned `CONTACT_EMAIL` — which by
     * design is NOT the public brand address but the private inbox the studio
     * actually reads. `SITE.email` is the address already published on the
     * contact page, which is what a visitor should be told to write to.
     */
    return NextResponse.json(
      {
        success: false,
        message:
          err.code === "ECONNECTION"
            ? `Our mail server is unreachable. Please try again or email us directly at ${SITE.email}.`
            : `We could not send your enquiry. Please try again or email us directly at ${SITE.email}.`,
      },
      { status: 502 }
    );
  }
}

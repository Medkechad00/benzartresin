import { NextResponse } from "next/server";
import {
  clientKey,
  createRateLimiter,
  createTransport,
  escapeHtml,
  getSmtpConfig,
  headerSafe,
  isValidEmail,
} from "@/lib/mail";

/**
 * Footer newsletter capture.
 *
 * The footer form previously called `preventDefault()` and did nothing else —
 * every address typed into it was discarded on submit, with the UI giving no
 * indication either way. This route delivers those addresses to the studio
 * inbox (`CONTACT_EMAIL`) over the same SMTP transport as the inquiry form.
 *
 * Deliberately NOT a mailing-list integration. There is no list provider, no
 * double opt-in, and no unsubscribe mechanism here, so this notifies the studio
 * of interest rather than subscribing anyone to anything automated. Before this
 * is used for actual bulk sending it needs a real provider and a confirmed
 * opt-in — that is a GDPR requirement, not a preference.
 */

export const runtime = "nodejs";

/** Same 30s headroom as the inquiry route: Gmail's handshake is the slow part. */
export const maxDuration = 30;

export const dynamic = "force-dynamic";

/**
 * Tighter than the inquiry limiter. A newsletter field is a single input with
 * no friction, which makes it the more attractive of the two to a bot, and
 * there is no legitimate reason to submit it repeatedly.
 */
const rateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
});

type SubscribePayload = {
  email?: string;
  /** Locale the form was submitted from, so replies can match the language. */
  locale?: string;
  /** Honeypot — must stay empty. Not rendered to real users. */
  website?: string;
};

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: SubscribePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real users never see this field, so anything in it is a bot.
  // Returns 200 so the bot cannot distinguish rejection from success.
  if (body.website && body.website.trim() !== "") {
    console.warn("[subscribe] honeypot triggered — discarding submission");
    return NextResponse.json({ success: true, message: "Subscribed." });
  }

  const email = (body.email ?? "").trim();

  if (!email) {
    return NextResponse.json(
      { success: false, message: "Please enter your email address." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  const smtp = getSmtpConfig();

  if (!smtp) {
    return NextResponse.json(
      { success: false, message: "Sign-up is temporarily unavailable. Please email us directly." },
      { status: 503 }
    );
  }

  const locale = (body.locale ?? "").trim();
  const transporter = createTransport(smtp);

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: smtp.to,
      replyTo: headerSafe(email),
      subject: `New studio sign-up — ${headerSafe(email)}`,
      text: [
        `Email: ${email}`,
        locale ? `Site language: ${locale}` : "",
        "",
        "Submitted from the footer sign-up form.",
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <h2 style="font-family:sans-serif;">New studio sign-up</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 12px 4px 0;color:#666;">Email</td>
            <td style="padding:4px 0;"><strong>${escapeHtml(email)}</strong></td>
          </tr>
          ${
            locale
              ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Site language</td><td style="padding:4px 0;"><strong>${escapeHtml(locale)}</strong></td></tr>`
              : ""
          }
        </table>
        <p style="font-family:sans-serif;font-size:13px;color:#666;">Submitted from the footer sign-up form.</p>
      `,
    });

    return NextResponse.json({ success: true, message: "Subscribed." });
  } catch (error) {
    const err = error as Error & { code?: string; response?: string; command?: string };
    console.error("[subscribe] SMTP send failed:", {
      code: err.code,
      command: err.command,
      response: err.response,
      message: err.message,
      smtpUser: smtp.user,
      smtpHost: smtp.host,
      smtpPort: smtp.port,
      to: smtp.to,
    });
    return NextResponse.json(
      {
        success: false,
        message:
          err.code === "ECONNECTION"
            ? "Cannot reach the mail server. Please try again or email us directly at " + smtp.to + "."
            : "We could not complete your sign-up. Please try again or email us directly at " + smtp.to + ".",
      },
      { status: 502 }
    );
  }
}

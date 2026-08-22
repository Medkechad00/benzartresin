import { escapeHtml } from "@/lib/mail";

/**
 * The studio's enquiry notification email.
 *
 * WHAT THIS REPLACES. The previous version was four unstyled tags assembled
 * inline in the route handler: an `<h2>`, a borderless `<table>` of grey
 * label/value pairs, an `<h3>`, and a `<p>`. It carried none of the brand — no
 * gold, no ivory, no typographic hierarchy — and because every row was rendered
 * identically, the two things the studio actually acts on (who to reply to, and
 * what they wrote) had exactly the same visual weight as "Site language".
 *
 * DESIGN. Carries the site's own language into the inbox: ivory page, white
 * card, hard square corners, a gold slab behind the heading exactly as the site
 * sets its own headings, hairline rules at 10% black, and uppercase micro-labels
 * on wide tracking. The contact block is promoted to the top as a distinct
 * panel, the enquiry text is given the largest type on the page, and the
 * specification rows sit below both as reference.
 *
 * EMAIL-CLIENT CONSTRAINTS, and why the markup looks like 2004:
 *
 * - Tables, not flex or grid. Outlook 2016-2021 renders through Word, which
 *   supports neither.
 * - Every style inlined. Gmail strips `<style>` blocks in forwarded mail and in
 *   several webmail views, so a stylesheet cannot be relied on.
 * - No `border-radius`. Outlook ignores it, and the brand is square-cornered
 *   anyway, so this is the rare case where the constraint and the design agree.
 * - Brand fonts named first, then real fallbacks. Modern Romance and Louis
 *   George Cafe cannot load — Gmail strips `@font-face` — so the stacks resolve
 *   to Georgia and Helvetica, which are the closest widely-installed matches in
 *   character (a high-contrast serif and a humanist sans).
 * - A hidden preheader controls the inbox preview line. Without one, clients
 *   scrape the first visible text, which was previously the word "Name".
 */

/** Design tokens, mirrored from `app/globals.css` `@theme`. */
const C = {
  black: "#000000",
  white: "#FFFFFF",
  gold: "#E4B028",
  goldDark: "#C49A1F",
  ivory: "#F5F1E8",
  ivoryDark: "#EDE8DB",
  hairline: "rgba(0,0,0,0.10)",
  muted: "#6B6558",
  body: "#2E2A24",
} as const;

/**
 * Modern Romance and Louis George Cafe are named first so they render for the
 * studio, who have them installed locally. Everyone else gets the fallback.
 */
const FONT_DISPLAY = "'Modern Romance', Georgia, 'Times New Roman', Times, serif";
const FONT_SANS = "'Louis George Cafe', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export type EmailRow = { label: string; value: string };

export type InquiryEmailInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Specification rows. Empty values are filtered by the caller. */
  rows: EmailRow[];
  /** Slug of the piece the visitor arrived from, if any. */
  ref?: string;
  /** Honeypot tripped — delivered anyway, but flagged. */
  flaggedAsSpam?: boolean;
  /** Absolute site URL, for the piece link. */
  baseUrl?: string;
  receivedAt?: Date;
};

/**
 * Uppercase micro-label, the site's standard field caption.
 *
 * `color` is typed as `string` rather than inferred: `C` is `as const`, so an
 * inferred default would narrow the parameter to the literal `"#6B6558"` and
 * reject every other token.
 */
const label = (text: string, color: string = C.muted) =>
  `<span style="font-family:${FONT_SANS};font-size:10px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;color:${color};">${escapeHtml(text)}</span>`;

/** Full-width hairline, as a table so Outlook honours the height. */
const rule = (top = 0, bottom = 0) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
    <tr><td style="padding:${top}px 0 ${bottom}px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr><td style="height:1px;line-height:1px;font-size:0;background-color:${C.hairline};">&nbsp;</td></tr>
      </table>
    </td></tr>
  </table>`;

/**
 * Builds the studio notification.
 *
 * Returns subject, HTML and plain text together so the three can never describe
 * different submissions — they were previously assembled separately in the route
 * handler, which is how a field gets added to one and forgotten in the others.
 */
export function buildInquiryEmail(input: InquiryEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    name,
    email,
    phone,
    message,
    rows,
    ref,
    flaggedAsSpam = false,
    baseUrl,
    receivedAt = new Date(),
  } = input;

  const stamp = receivedAt.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  });

  const subject =
    `${flaggedAsSpam ? "[SUSPECTED SPAM] " : ""}New commission enquiry — ${name}` +
    (ref ? ` (${ref})` : "");

  /* ── preheader ──────────────────────────────────────────────────────────
     The inbox preview line. `display:none` alone is not enough — several
     clients still surface it — so it is also zeroed and moved off-canvas.
     The trailing entity padding stops Gmail appending body text after it. */
  const preheader = `${name} · ${phone}${ref ? ` · ${ref}` : ""}`;

  /* ── spam notice ─────────────────────────────────────────────────────── */
  const spamNotice = flaggedAsSpam
    ? `<tr><td style="padding:0 0 24px 0;">
         <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#FFF6DD;">
           <tr>
             <td width="3" style="width:3px;background-color:${C.gold};font-size:0;line-height:0;">&nbsp;</td>
             <td style="padding:14px 18px;font-family:${FONT_SANS};font-size:13px;line-height:1.6;color:${C.body};">
               <strong style="letter-spacing:0.04em;">Flagged, but probably genuine.</strong><br />
               The hidden anti-spam field was filled. That is nearly always browser
               autofill on a real enquiry rather than a bot — read it before discarding.
             </td>
           </tr>
         </table>
       </td></tr>`
    : "";

  /* ── contact panel ───────────────────────────────────────────────────────
     Promoted above everything else and given its own ivory panel, because
     replying is the only action this email exists to prompt. Both the address
     and the number are real links: `mailto:` and `tel:` so the studio can act
     from a phone without retyping. */
  const contactPanel = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${C.ivory};">
      <tr>
        <td style="padding:22px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 4px 0;">${label("Reply to")}</td>
            </tr>
            <tr>
              <td style="padding:0 0 14px 0;font-family:${FONT_DISPLAY};font-size:26px;line-height:1.2;color:${C.black};">
                ${escapeHtml(name)}
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 6px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.5;">
                <a href="mailto:${escapeHtml(email)}" style="color:${C.black};text-decoration:none;border-bottom:1px solid ${C.gold};">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr>
              <td style="font-family:${FONT_SANS};font-size:15px;line-height:1.5;">
                <a href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ""))}" style="color:${C.black};text-decoration:none;border-bottom:1px solid ${C.gold};" dir="ltr">${escapeHtml(phone)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  /* ── referring piece ─────────────────────────────────────────────────────
     Only rendered when the visitor came from a specific table. Linked so the
     studio can open the exact piece rather than searching the catalogue. */
  const refBlock = ref
    ? `<tr><td style="padding:20px 0 0 0;">
         <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${C.hairline};">
           <tr>
             <td style="padding:16px 20px;">
               <div style="padding-bottom:6px;">${label("Enquiring about")}</div>
               <div style="font-family:${FONT_SANS};font-size:14px;line-height:1.5;">
                 ${
                   baseUrl
                     ? `<a href="${escapeHtml(baseUrl)}/en/tables/${escapeHtml(ref)}" style="color:${C.black};text-decoration:none;border-bottom:1px solid ${C.gold};">${escapeHtml(ref)}</a>`
                     : `<span style="color:${C.black};">${escapeHtml(ref)}</span>`
                 }
               </div>
             </td>
           </tr>
         </table>
       </td></tr>`
    : "";

  /* ── specification rows ──────────────────────────────────────────────────
     Two-column label/value, hairline-separated. Stacked labels above values
     rather than side by side, because a narrow phone column squeezed the value
     to two words per line. */
  const specRows = rows
    .map(
      ({ label: l, value }, i) => `
      <tr>
        <td style="padding:${i === 0 ? "0" : "14px"} 0 0 0;">
          ${i === 0 ? "" : `<div style="height:1px;line-height:1px;font-size:0;background-color:${C.hairline};margin-bottom:14px;">&nbsp;</div>`}
          <div style="padding-bottom:5px;">${label(l)}</div>
          <div style="font-family:${FONT_SANS};font-size:15px;line-height:1.5;color:${C.black};font-weight:600;">${escapeHtml(value)}</div>
        </td>
      </tr>`
    )
    .join("");

  const specBlock = rows.length
    ? `<tr><td style="padding:32px 0 0 0;">
         <div style="padding-bottom:14px;">${label("Specification", C.goldDark)}</div>
         <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
           ${specRows}
         </table>
       </td></tr>`
    : "";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <!-- Opt out of forced dark-mode inversion; the palette is already low-contrast ivory. -->
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${C.ivoryDark};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${C.ivoryDark};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse:collapse;width:600px;max-width:600px;">

          <!-- Masthead -->
          <tr>
            <td style="padding:0 0 20px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="font-family:${FONT_SANS};font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${C.black};">
                    Benzart&nbsp;Resin
                  </td>
                  <td align="right" style="font-family:${FONT_SANS};font-size:11px;letter-spacing:0.08em;color:${C.muted};">
                    ${escapeHtml(stamp)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${C.white};border:1px solid ${C.hairline};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:36px 32px 40px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">

                      ${spamNotice}

                      <!-- Heading, on the gold slab the site uses for its own headings.
                           Inline-block on a span so the gold hugs the words rather than
                           the column, matching the h1/h2 treatment across the site. -->
                      <tr>
                        <td style="padding:0 0 6px 0;">
                          <span style="display:inline-block;background-color:${C.gold};padding:2px 10px 5px 10px;font-family:${FONT_DISPLAY};font-size:30px;line-height:1.2;color:${C.black};">
                            New commission enquiry
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 26px 0;font-family:${FONT_SANS};font-size:14px;line-height:1.65;color:${C.muted};">
                          Submitted through the site. Reply directly to this message and it
                          reaches ${escapeHtml(name.split(/\s+/)[0] ?? "the sender")}.
                        </td>
                      </tr>

                      <tr><td>${contactPanel}</td></tr>

                      ${refBlock}

                      <!-- The enquiry itself: largest type on the page, because it is
                           the only part that cannot be skimmed from the subject line. -->
                      <tr>
                        <td style="padding:32px 0 0 0;">
                          <div style="padding-bottom:12px;">${label("In their words", C.goldDark)}</div>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                            <tr>
                              <td width="2" style="width:2px;background-color:${C.gold};font-size:0;line-height:0;">&nbsp;</td>
                              <td style="padding:2px 0 2px 18px;font-family:${FONT_DISPLAY};font-size:18px;line-height:1.6;color:${C.body};white-space:pre-wrap;">${escapeHtml(message)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      ${specBlock}

                      <!-- Reply CTA. Square, black, uppercase — the site's button. -->
                      <tr>
                        <td style="padding:34px 0 0 0;">
                          ${rule(0, 24)}
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                            <tr>
                              <td style="background-color:${C.black};">
                                <a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent(`Re: your commission enquiry — Benzart Resin`)}"
                                   style="display:inline-block;padding:15px 30px;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.white};text-decoration:none;">
                                  Reply to ${escapeHtml(name.split(/\s+/)[0] ?? "sender")}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 4px 0 4px;font-family:${FONT_SANS};font-size:11px;line-height:1.6;color:${C.muted};">
              Automated notification from the commission form.
              This address is monitored — replies go to the enquirer, not to the site.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  /**
   * Plain-text alternative.
   *
   * Not a courtesy. Sending `html` with no `text` part measurably raises spam
   * scores, and a notification that lands in the studio's junk folder is a lost
   * commission. Built from the same inputs as the HTML so they cannot diverge.
   */
  const text = [
    flaggedAsSpam
      ? "NOTE: the hidden anti-spam field was filled. Usually browser autofill on a genuine enquiry — check before discarding.\n"
      : "",
    "NEW COMMISSION ENQUIRY",
    stamp,
    "",
    "REPLY TO",
    `  ${name}`,
    `  ${email}`,
    `  ${phone}`,
    ref ? `\nENQUIRING ABOUT\n  ${ref}` : "",
    "",
    "IN THEIR WORDS",
    message
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
    rows.length ? `\nSPECIFICATION\n${rows.map(({ label: l, value }) => `  ${l}: ${value}`).join("\n")}` : "",
  ]
    .filter((part) => part !== "")
    .join("\n");

  return { subject, html, text };
}

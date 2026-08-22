// Render the notification email and assert the constraints that make it safe in
// real inboxes. Writes a preview to `.preview/inquiry-email.html` so the layout
// can be opened in a browser.
//
// Run with:  npx tsx scripts/preview-inquiry-email.mts
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildInquiryEmail } from '../lib/inquiry-email';

const sample = buildInquiryEmail({
  name: 'Yasmine Ould Ahmed',
  email: 'yasmine.ouldahmed@example.com',
  phone: '+212 661 24 88 03',
  message:
    "We're furnishing a riad we've just finished restoring in the Kasbah, and the dining room is the last room left.\n\nThe ceiling is high and the walls are tadelakt, so we want one long piece rather than anything fussy. I saw the 220cm walnut slab on your site and it is close to what we had in mind, though we would need it a little narrower to clear the doorway.\n\nCould we come to the workshop and see the boards before anything is cut?",
  rows: [
    { label: 'Dimensions', value: '240 x 95 cm' },
    { label: 'Shape', value: 'Organic edge' },
    { label: 'Shipping country', value: 'Morocco' },
    { label: 'Site language', value: 'fr' },
  ],
  ref: 'solid-walnut-live-edge-dining-table-220',
  baseUrl: 'https://benzartresin.com',
  receivedAt: new Date('2026-08-20T14:32:00Z'),
});

const minimal = buildInquiryEmail({
  name: 'Tom Reeve',
  email: 'tom@example.co.uk',
  phone: '+44 7700 900123',
  message: 'Interested in a round coffee table. What are your lead times to the UK?',
  rows: [],
});

const flagged = buildInquiryEmail({
  ...{
    name: 'Autofilled Visitor',
    email: 'a@example.com',
    phone: '+1 555 0100',
    message: 'Genuine enquiry that tripped the honeypot via a password manager.',
    rows: [{ label: 'Shipping country', value: 'United States' }],
  },
  flaggedAsSpam: true,
});

mkdirSync('.preview', { recursive: true });
writeFileSync('.preview/inquiry-email.html', sample.html, 'utf8');
writeFileSync('.preview/inquiry-email-minimal.html', minimal.html, 'utf8');
writeFileSync('.preview/inquiry-email-flagged.html', flagged.html, 'utf8');

const problems: string[] = [];
const pass: string[] = [];
const check = (ok: boolean, label: string) => (ok ? pass.push(label) : problems.push(label));

const { html, text, subject } = sample;

// ── email-client constraints ────────────────────────────────────────────────
check(html.startsWith('<!DOCTYPE html'), 'has a doctype');
check(!/<style[\s>]/i.test(html), 'no <style> block — Gmail strips them, so all styles are inlined');
check(!/border-radius/i.test(html), 'no border-radius — Outlook ignores it and the brand is square');
check(!/display:\s*flex|display:\s*grid/i.test(html), 'no flex or grid — Outlook renders through Word');
check(/role="presentation"/.test(html), 'layout tables marked role="presentation" for screen readers');
check(
  (html.match(/<table/g) ?? []).length >= 6,
  'table-based layout'
);
check(/max-width:600px/.test(html), 'capped at 600px');
check(/name="viewport"/.test(html), 'viewport meta present');
check(/color-scheme/.test(html), 'declares a colour scheme so clients do not force-invert it');

// Preheader must exist, be hidden, and not repeat the heading.
const preheader = html.match(/max-height:0[^>]*>\s*([^<]+)/)?.[1]?.trim() ?? '';
check(preheader.length > 0, 'hidden preheader controls the inbox preview line');
check(!/New commission enquiry/i.test(preheader), 'preheader adds information rather than repeating the heading');

// ── brand consistency ───────────────────────────────────────────────────────
check(html.includes('#E4B028'), 'uses the gold token from globals.css (#E4B028)');
check(html.includes('#F5F1E8'), 'uses the ivory token (#F5F1E8)');
check(/Modern Romance/.test(html), 'display font named first in the stack');
check(/Louis George Cafe/.test(html), 'sans font named first in the stack');
check(/Georgia/.test(html) && /Helvetica/.test(html), 'both stacks fall back to installed faces');
check(/letter-spacing:0\.18em/.test(html), 'uppercase micro-labels on wide tracking, as on the site');
check(
  /background-color:#E4B028;padding:2px 10px 5px 10px/.test(html),
  'heading sits on the gold slab the site uses for its own headings'
);

// ── content correctness ─────────────────────────────────────────────────────
check(subject.includes('Yasmine Ould Ahmed'), 'subject carries the sender name');
check(subject.includes('solid-walnut-live-edge'), 'subject carries the referring piece');
check(html.includes('mailto:yasmine.ouldahmed@example.com'), 'email address is a mailto link');
check(html.includes('tel:+212661248803'), 'phone is a tel link with separators stripped');
check(html.includes('/en/tables/solid-walnut-live-edge-dining-table-220'), 'referring piece links to its page');
check(text.length > 200, 'plain-text alternative is substantive');
check(text.includes('IN THEIR WORDS'), 'plain text carries the enquiry body');
check(
  text.includes('240 x 95 cm') && html.includes('240 x 95 cm'),
  'html and text describe the same submission'
);

// Removed fields must not reappear anywhere.
for (const gone of ['Wood preference', 'Resin style', 'Budget range', 'Space type', 'City']) {
  check(!html.includes(gone) && !text.includes(gone), `removed field absent from the email: ${gone}`);
}

// ── escaping ────────────────────────────────────────────────────────────────
const hostile = buildInquiryEmail({
  name: '<script>alert(1)</script>',
  email: 'x"@example.com',
  phone: '+1 555',
  message: '<img src=x onerror=alert(1)> & "quoted" \'text\'',
  rows: [{ label: 'Shape', value: '<b>bold</b>' }],
});
check(!/<script>alert/.test(hostile.html), 'script tag in a name is escaped');
/*
  The right property is that no attacker-supplied TAG survives, not that the
  string "onerror" is absent. `<img src=x onerror=alert(1)>` escapes to
  `&lt;img src=x onerror=alert(1)&gt;`, which still contains the substring while
  being inert text — asserting on the substring failed a correctly escaped
  payload. Check for an unescaped tag opener instead.
*/
check(!/<img\b/i.test(hostile.html), 'img tag in the message never renders as a tag');
check(
  hostile.html.includes('&lt;img src=x onerror=alert(1)&gt;'),
  'the payload is preserved as inert escaped text rather than silently dropped'
);
check(!/<b>bold<\/b>/.test(hostile.html), 'markup in a spec value is escaped');
check(hostile.html.includes('&lt;script&gt;'), 'escaped output is present rather than dropped');
/*
  The mailto in the reply button interpolates the address into a URL, so a quote
  in it must not be able to break out of the href attribute.
*/
check(!/href="mailto:x"@/.test(hostile.html), 'a quote in the address cannot break out of href');

// ── variants ────────────────────────────────────────────────────────────────
check(!minimal.html.includes('Specification'), 'no empty Specification block when nothing optional was answered');
check(!minimal.html.includes('Enquiring about'), 'no referring-piece block when there is no ref');
check(flagged.subject.startsWith('[SUSPECTED SPAM]'), 'flagged submission is marked in the subject');
check(flagged.html.includes('probably genuine'), 'flagged notice explains autofill rather than accusing');

pass.forEach((p) => console.log('  PASS  ' + p));
console.log('');
if (problems.length === 0) {
  console.log(`ALL ${pass.length} EMAIL CHECKS PASSED`);
  console.log('\npreviews written to .preview/  (open inquiry-email.html in a browser)');
  console.log(`html ${(html.length / 1024).toFixed(1)} KB — well under Gmail's 102KB clipping threshold`);
} else {
  problems.forEach((p) => console.log('  FAIL  ' + p));
  console.log(`\n${problems.length} failed / ${pass.length} passed`);
  process.exitCode = 1;
}

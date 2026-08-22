/**
 * Post-build verification.
 *
 * Reads the prerendered HTML that `next build` actually emitted and asserts the
 * things this audit set out to fix. A build that compiles proves the types line
 * up; only the output proves the canonical, the hreflang cluster, the landmarks
 * and the structured data are really there.
 *
 * Exits non-zero on any failure so it can gate a deploy.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), '.next', 'server', 'app');

const failures = [];
const notes = [];

function fail(msg) {
  failures.push(msg);
}

function read(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

function all(html, re) {
  return [...html.matchAll(re)].map((m) => m[1] ?? m[0]);
}

/** Every prerendered HTML document, relative to .next/server/app. */
function htmlFiles(dir = ROOT, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(path.relative(ROOT, full));
  }
  return acc;
}

const pages = htmlFiles();
notes.push(`prerendered HTML documents: ${pages.length}`);

/* ───────────────────────── per-page structural checks ──────────────────── */

let missingCanonical = [];
let missingSkip = [];
let missingMain = [];
let missingHeader = [];
let badH1 = [];
let missingOgImage = [];
let missingOgType = [];
let missingTwitter = [];
let missingDescription = [];
let legacyH4 = [];
let outlineSkips = [];

for (const rel of pages) {
  const html = read(rel);
  if (!html) continue;

  // The 404 documents are allowed to differ: no canonical, and global-not-found
  // has no chrome at all.
  const isNotFound = /_not-found|_global-error/.test(rel);

  if (!/<link rel="canonical"/.test(html) && !isNotFound) missingCanonical.push(rel);
  if (!/class="skip-link"/.test(html) && !isNotFound) missingSkip.push(rel);
  if (!/id="main-content"/.test(html) && !isNotFound) missingMain.push(rel);
  if (!/<header/.test(html) && !isNotFound) missingHeader.push(rel);
  if (!/<meta name="description"/.test(html) && !isNotFound) missingDescription.push(rel);
  if (!/property="og:image"/.test(html) && !isNotFound) missingOgImage.push(rel);
  if (!/property="og:type"/.test(html) && !isNotFound) missingOgType.push(rel);
  if (!/name="twitter:card"/.test(html) && !isNotFound) missingTwitter.push(rel);

  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1 && !/_global-error/.test(rel)) badH1.push(`${rel} (${h1s})`);

  // Exactly one <main>. A nested second one was the original defect.
  const mains = (html.match(/<main[\s>]/g) || []).length;
  if (mains > 1) fail(`${rel}: ${mains} <main> elements`);

  if (/<h4[\s>]/.test(html)) legacyH4.push(rel);

  // Heading outline: no level may jump by more than one.
  const levels = all(html, /<h([1-6])[\s>]/g).map(Number);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      outlineSkips.push(`${rel}: h${levels[i - 1]} -> h${levels[i]}`);
      break;
    }
  }
}

const report = (label, list) => {
  if (list.length) fail(`${label}: ${list.length} page(s) -> ${list.slice(0, 6).join(', ')}${list.length > 6 ? ' …' : ''}`);
  else notes.push(`${label}: none`);
};

report('missing canonical', missingCanonical);
report('missing skip link', missingSkip);
report('missing #main-content', missingMain);
report('missing <header> landmark', missingHeader);
report('missing meta description', missingDescription);
report('missing og:image', missingOgImage);
report('missing og:type', missingOgType);
report('missing twitter:card', missingTwitter);
report('pages without exactly one h1', badH1);
report('pages still using <h4>', legacyH4);
report('heading-level skips', outlineSkips);

/* ─────────────────────────── locale-specific checks ────────────────────── */

const en = read('en.html');
const fr = read('fr.html');
const ar = read('ar.html');

if (!en || !fr || !ar) fail('could not read en/fr/ar home documents');

if (en) {
  const canon = all(en, /<link rel="canonical" href="([^"]+)"/g)[0];
  if (canon && !canon.endsWith('/en')) fail(`en canonical is ${canon}`);

  /*
    Case-insensitive: React serialises the JSX prop as `hrefLang`, not
    `hreflang`. HTML attribute names are ASCII case-insensitive, so browsers and
    crawlers read it correctly either way — but a case-sensitive assertion here
    reports a false failure.
  */
  const langs = all(en, /hreflang="([^"]+)"/gi);
  for (const want of ['en', 'fr', 'ar', 'x-default']) {
    if (!langs.includes(want)) fail(`en home missing hreflang="${want}"`);
  }

  if (!/property="og:site_name"/.test(en)) fail('en home missing og:site_name');
  if (!/property="og:locale"/.test(en)) fail('en home missing og:locale');
  if (!/name="twitter:card" content="summary_large_image"/.test(en)) {
    fail('en home twitter:card is not summary_large_image');
  }
}

if (fr) {
  // The French home page's alternates must name the FRENCH pathnames.
  const canon = all(fr, /<link rel="canonical" href="([^"]+)"/g)[0];
  if (canon && !canon.endsWith('/fr')) fail(`fr canonical is ${canon}`);
  if (/lang="fr"/.test(fr) === false) fail('fr document missing lang="fr"');
}

if (ar) {
  if (!/dir="rtl"/.test(ar)) fail('ar document missing dir="rtl"');
  if (!/lang="ar"/.test(ar)) fail('ar document missing lang="ar"');
}

/* ───────────── French translated pathnames in canonicals/hreflang ───────── */

const frCollection = read(path.join('fr', 'tables.html'));
if (frCollection) {
  const canon = all(frCollection, /<link rel="canonical" href="([^"]+)"/g)[0] ?? '';
  if (!canon.includes('/fr/collection')) {
    fail(`fr collection canonical does not use /fr/collection: ${canon}`);
  } else {
    notes.push(`fr collection canonical: ${canon}`);
  }
}

const frJournal = read(path.join('fr', 'blog.html'));
if (frJournal) {
  const canon = all(frJournal, /<link rel="canonical" href="([^"]+)"/g)[0] ?? '';
  if (!canon.includes('/fr/journal')) {
    fail(`fr journal canonical does not use /fr/journal: ${canon}`);
  } else {
    notes.push(`fr journal canonical: ${canon}`);
  }
}

/* ───────────── every internal href in French output is translated ───────── */

const frPages = pages.filter((p) => p.startsWith(`fr${path.sep}`) || p === 'fr.html');
const untranslated = new Set();
for (const rel of frPages) {
  const html = read(rel);
  if (!html) continue;
  for (const href of all(html, /href="(\/fr\/[^"#?]*)"/g)) {
    if (/^\/fr\/(tables|blog|inquiry|our-craft|privacy|terms)(\/|$)/.test(href)) {
      untranslated.add(`${rel} -> ${href}`);
    }
  }
}
if (untranslated.size) {
  fail(
    `French pages still link to untranslated paths (${untranslated.size}): ` +
      [...untranslated].slice(0, 8).join(', ')
  );
} else {
  notes.push('French internal links: all translated, none would redirect');
}

/* ─────────────────────────── structured data types ─────────────────────── */

function schemaTypes(html) {
  const blocks = all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  const types = new Set();
  for (const raw of blocks) {
    // Undo the JsonLd escaping before parsing.
    const json = raw.replace(/\\u003c/g, '<');
    try {
      const data = JSON.parse(json);
      if (data['@type']) types.add(data['@type']);
    } catch {
      fail('a JSON-LD block did not parse');
    }
    if (!/\\u003c/.test(raw) && /</.test(raw)) fail('JSON-LD contains a raw "<"');
  }
  return types;
}

const expectations = [
  ['en.html', ['Organization', 'WebSite', 'LocalBusiness']],
  [path.join('en', 'tables.html'), ['Organization', 'WebSite', 'BreadcrumbList', 'ItemList']],
  [path.join('en', 'blog.html'), ['Organization', 'WebSite', 'BreadcrumbList', 'ItemList']],
  [path.join('en', 'our-craft.html'), ['Organization', 'WebSite', 'LocalBusiness', 'BreadcrumbList']],
  [path.join('en', 'faq.html'), ['Organization', 'WebSite', 'FAQPage']],
  [path.join('en', 'inquiry.html'), ['Organization', 'WebSite', 'BreadcrumbList', 'FAQPage']],
  [path.join('en', 'contact.html'), ['Organization', 'WebSite', 'LocalBusiness']],
];

for (const [rel, wanted] of expectations) {
  const html = read(rel);
  if (!html) {
    fail(`missing prerendered ${rel}`);
    continue;
  }
  const types = schemaTypes(html);
  for (const type of wanted) {
    if (!types.has(type)) fail(`${rel}: missing ${type} schema (has ${[...types].join(',')})`);
  }
}

// One product page: Product + BreadcrumbList, and Organization must carry a logo.
const productPage = read(path.join('en', 'tables', 'walnut-berber-resin-coffee-table.html'));
if (productPage) {
  const types = schemaTypes(productPage);
  for (const type of ['Product', 'BreadcrumbList']) {
    if (!types.has(type)) fail(`product page missing ${type} schema`);
  }
  if (!/benzart-logo\.webp/.test(productPage)) fail('Organization schema has no logo');
} else {
  fail('missing prerendered product page');
}

// One article page: BlogPosting + BreadcrumbList.
const articlePage = read(path.join('en', 'blog', 'the-art-of-the-live-edge.html'));
if (articlePage) {
  const types = schemaTypes(articlePage);
  for (const type of ['BlogPosting', 'BreadcrumbList']) {
    if (!types.has(type)) fail(`article page missing ${type} schema`);
  }
}

/* ──────────────────────────── sitemap and robots ───────────────────────── */

const sitemapBody = read('sitemap.xml.body') ?? (() => {
  const p = path.join(process.cwd(), '.next', 'server', 'app', 'sitemap.xml.body');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
})();

if (sitemapBody) {
  const urls = all(sitemapBody, /<loc>([^<]+)<\/loc>/g);
  notes.push(`sitemap URLs: ${urls.length}`);
  if (!/<lastmod>/.test(sitemapBody)) fail('sitemap has no <lastmod>');
  const bad = urls.filter((u) => /\/fr\/(tables|blog|inquiry|our-craft|privacy|terms)(\/|$)/.test(u));
  if (bad.length) fail(`sitemap lists ${bad.length} untranslated French URL(s): ${bad[0]}`);
  const legal = urls.filter((u) => /\/(privacy|confidentialite|terms|conditions)$/.test(u));
  if (legal.length !== 6) fail(`expected 6 legal URLs in sitemap, found ${legal.length}`);
} else {
  notes.push('sitemap body not found on disk (generated at request time)');
}

/* ─────────────────────────────────── output ────────────────────────────── */

console.log('\n--- notes ---');
for (const n of notes) console.log('  ' + n);

if (failures.length) {
  console.log('\n--- FAILURES ---');
  for (const f of failures) console.log('  ✗ ' + f);
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\nall checks passed');

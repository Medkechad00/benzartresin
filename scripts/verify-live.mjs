/**
 * Live checks against a running production server.
 *
 * The build manifests prove the config was accepted; only real responses prove
 * the headers are sent, the redirects land where they claim, and robots/sitemap
 * serve correct bodies. Run `next start` first.
 *
 *   node scripts/verify-live.mjs [baseUrl]
 */
const base = process.argv[2] ?? 'http://localhost:3111';

const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

async function head(pathname, { redirect = 'manual' } = {}) {
  return fetch(base + pathname, { redirect, headers: { 'user-agent': 'audit' } });
}

/* ─────────────────────────────── 1. headers ────────────────────────────── */

const REQUIRED_HEADERS = {
  'content-security-policy': /default-src 'self'/,
  'strict-transport-security': /max-age=63072000/,
  'x-content-type-options': /^nosniff$/,
  'x-frame-options': /^DENY$/,
  'referrer-policy': /strict-origin-when-cross-origin/,
  'permissions-policy': /camera=\(\)/,
  'cross-origin-opener-policy': /same-origin-allow-popups/,
};

{
  const res = await head('/en');
  notes.push(`GET /en -> ${res.status}`);
  for (const [name, pattern] of Object.entries(REQUIRED_HEADERS)) {
    const value = res.headers.get(name);
    if (!value) fail(`/en missing header ${name}`);
    else if (!pattern.test(value)) fail(`/en header ${name} unexpected: ${value}`);
  }
  if (res.headers.get('x-powered-by')) fail('X-Powered-By is still being sent');
  else notes.push('X-Powered-By: absent');
}

/* immutable caching on unhashed public assets */
for (const asset of ['/benzart-logo.webp', '/fonts/NotoSansArabic-Variable.woff2']) {
  const res = await head(asset);
  const cc = res.headers.get('cache-control') ?? '';
  if (res.status !== 200) fail(`${asset} -> ${res.status}`);
  else if (!/immutable/.test(cc)) fail(`${asset} cache-control is "${cc}"`);
}
notes.push('public asset caching: immutable');

/* ────────────────────────────── 2. redirects ───────────────────────────── */

const REDIRECTS = [
  ['/en/about', '/en/our-craft'],
  ['/fr/about', '/fr/notre-metier'],
  ['/ar/craftsmanship', '/ar/our-craft'],
  ['/fr/tables/walnut-magenta-resin-coffee-table-set', '/fr/collection/ensemble-tables-noyer-resine-magenta'],
  ['/en/tables/marble-effect-resin-oval-dining-table', '/en/tables/resin-oval-dining-table'],
  // next-intl pathname redirects: the untranslated French form must not be served.
  ['/fr/tables', '/fr/collection'],
  ['/fr/blog', '/fr/journal'],
  ['/fr/inquiry', '/fr/demande'],
];

for (const [from, expected] of REDIRECTS) {
  const res = await head(from);
  const location = res.headers.get('location') ?? '';
  if (res.status < 300 || res.status >= 400) {
    fail(`${from} did not redirect (${res.status})`);
    continue;
  }
  const target = location.replace(base, '');
  if (target !== expected) fail(`${from} -> ${target}, expected ${expected}`);

  // The destination must resolve in ONE hop, not chain.
  const second = await head(target);
  if (second.status !== 200) {
    fail(`${from} chains: ${target} -> ${second.status} ${second.headers.get('location') ?? ''}`);
  }
}
notes.push(`${REDIRECTS.length} redirects: single hop, correct destination`);

/* ──────────────────────────── 3. status codes ──────────────────────────── */

for (const [pathname, expected] of [
  ['/en', 200],
  ['/fr/collection', 200],
  ['/ar/tables', 200],
  ['/fr/journal/commander-table-riviere-epoxy-sur-mesure', 200],
  ['/en/tables/walnut-berber-resin-coffee-table', 200],
  ['/robots.txt', 200],
  ['/sitemap.xml', 200],
  ['/llms.txt', 200],
  // Unmatched URLs must be 404, not 200 and not 500.
  ['/en/this-page-does-not-exist', 404],
  ['/en/tables/not-a-real-slug', 404],
  ['/en/blog/not-a-real-slug', 404],
  ['/de/tables', 404],
]) {
  const res = await head(pathname, { redirect: 'follow' });
  if (res.status !== expected) fail(`${pathname} -> ${res.status}, expected ${expected}`);
}
notes.push('status codes: 200s and 404s as expected');

/**
 * The 404 surface.
 *
 * There is now exactly ONE, `app/global-not-found.tsx`, and that consolidation is
 * the fix rather than a simplification. The previous arrangement routed in-locale
 * misses through `[locale]/[...notFound]` -> `notFound()` -> `[locale]/not-found.tsx`,
 * and that path server-rendered an EMPTY body: no heading, no links, no text,
 * with the whole page present only in the RSC payload for the client to render
 * after hydration. Anyone with slow or blocked JS got a blank screen, and a
 * crawler following a stale link found nothing to follow onward — which defeats
 * the `follow` half of `noindex, follow`.
 *
 * The cause is documented in Next's own `not-found.md`: a root layout defined
 * with a top-level dynamic segment (`app/[locale]/layout.tsx`) cannot compose a
 * 404 from `layout.js` + `not-found.js`. Converting the page to a server
 * component was tried and did not help; `global-not-found` is the documented
 * escape hatch and it renders a complete document.
 *
 * So these assertions are about real bytes in the response, not just the head.
 */
const NOT_FOUND_CASES = [
  ['/en/this-page-does-not-exist', 'en', 'ltr'],
  ['/fr/page-inexistante', 'fr', 'ltr'],
  ['/ar/not-real', 'ar', 'rtl'],
  ['/en/tables/not-a-real-slug', 'en', 'ltr'],
  ['/en/blog/not-a-real-slug', 'en', 'ltr'],
  ['/definitely-not-a-route-xyz', 'en', 'ltr'],
];

for (const [pathname, locale, dir] of NOT_FOUND_CASES) {
  const res = await fetch(base + pathname, {
    redirect: 'follow',
    headers: { cookie: `NEXT_LOCALE=${locale}` },
  });
  const html = await res.text();

  if (res.status !== 404) fail(`${pathname} -> ${res.status}, expected 404`);

  // Server-rendered content, not an empty shell.
  if (!/<h1/.test(html)) fail(`${pathname}: no <h1> in the server-rendered body`);
  if (!/<main/.test(html)) fail(`${pathname}: no <main> landmark`);
  if (!/href="\/"/.test(html)) fail(`${pathname}: no exit link`);

  // Correct language and direction.
  if (!new RegExp(`<html lang="${locale}"`).test(html)) fail(`${pathname}: lang is not ${locale}`);
  if (!new RegExp(`dir="${dir}"`).test(html)) fail(`${pathname}: dir is not ${dir}`);

  // Indexing signals.
  if (!/<meta name="robots" content="noindex/.test(html)) fail(`${pathname}: not noindex`);
  const robotsTags = (html.match(/<meta name="robots"/g) ?? []).length;
  if (robotsTags !== 1) fail(`${pathname}: ${robotsTags} robots tags, expected 1`);
  if (/<link rel="canonical"/.test(html)) fail(`${pathname}: declares a canonical`);
  if (/<link rel="alternate"/i.test(html)) fail(`${pathname}: declares hreflang alternates`);

  // Must not impersonate the home page.
  if (/Epoxy River Dining Tables, Made to Order/.test(html)) {
    fail(`${pathname}: serves the homepage title`);
  }
}
notes.push(
  `${NOT_FOUND_CASES.length} 404 surfaces: 404 status, SSR body with h1 + exit, localised, noindex, no canonical`
);

/* ───────────────────────── 4. robots and sitemap ───────────────────────── */

{
  const robots = await (await head('/robots.txt')).text();
  if (/^Host:/m.test(robots)) fail('robots.txt still emits the deprecated Host directive');
  if (!/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/.test(robots)) fail('robots.txt has no Sitemap line');
  if (!/User-Agent: GPTBot/i.test(robots)) fail('robots.txt lost the AI crawler allowances');
  if (!/Disallow: \/api\//.test(robots)) fail('robots.txt does not disallow /api/');
  notes.push(`robots.txt: ${robots.split('\n').filter(Boolean).length} directives`);
}

{
  const xml = await (await head('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const lastmods = [...xml.matchAll(/<lastmod>/g)].length;
  notes.push(`sitemap: ${locs.length} urls, ${lastmods} lastmod, ${[...xml.matchAll(/xhtml:link/g)].length} alternates`);

  if (lastmods !== locs.length) fail(`sitemap has ${lastmods} lastmod for ${locs.length} urls`);

  const untranslated = locs.filter((u) =>
    /\/fr\/(tables|blog|inquiry|our-craft|privacy|terms)(\/|$)/.test(u)
  );
  if (untranslated.length) fail(`sitemap lists untranslated French URLs: ${untranslated[0]}`);

  // Every listed URL must answer 200 with no redirect. Sample across types.
  const sample = [
    locs.find((u) => u.endsWith('/fr/collection')),
    locs.find((u) => u.includes('/fr/journal/')),
    locs.find((u) => u.includes('/ar/tables/')),
    locs.find((u) => u.endsWith('/en/privacy')),
    locs.find((u) => u.endsWith('/fr/confidentialite')),
  ].filter(Boolean);

  for (const url of sample) {
    const res = await head(new URL(url).pathname);
    if (res.status !== 200) {
      fail(`sitemap URL ${url} -> ${res.status} ${res.headers.get('location') ?? ''}`);
    }
  }
  notes.push(`sitemap sample (${sample.length} urls): all 200, no redirect`);
}

/* ───────────────────────── 5. API hardening ────────────────────────────── */

{
  // Wrong content type must be refused before any parsing happens.
  const res = await fetch(base + '/api/inquiry', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({ name: 'x', email: 'x@y.co', phone: '123456', message: 'hi' }),
  });
  if (res.status !== 415) fail(`/api/inquiry with text/plain -> ${res.status}, expected 415`);
  else notes.push('/api/inquiry rejects non-JSON content type (415)');
}

{
  // Cross-origin must be refused.
  const res = await fetch(base + '/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({ email: 'a@b.co' }),
  });
  if (res.status !== 403) fail(`/api/subscribe cross-origin -> ${res.status}, expected 403`);
  else notes.push('/api/subscribe rejects foreign Origin (403)');
}

{
  // Type confusion must be a 400, never an unhandled 500.
  const res = await fetch(base + '/api/inquiry', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 1, email: [], phone: {}, message: null }),
  });
  if (res.status === 500) fail('/api/inquiry 500s on non-string fields');
  else notes.push(`/api/inquiry with wrong types -> ${res.status} (no crash)`);
}

/* ───────────────────────────────── output ──────────────────────────────── */

console.log('--- notes ---');
for (const n of notes) console.log('  ' + n);

if (failures.length) {
  console.log('\n--- FAILURES ---');
  for (const f of failures) console.log('  x ' + f);
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall live checks passed');

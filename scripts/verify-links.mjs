/**
 * Crawls the prerendered output and resolves every internal link against the
 * set of URLs the build actually produced.
 *
 * This is the check that catches the class of bug the audit found most of: links
 * that resolve with a 200 but only after a redirect, and links whose target was
 * never prerendered. `next build` cannot report either, because both are
 * correct-looking strings until something follows them.
 *
 * Exits non-zero if any internal link points somewhere the build did not emit.
 */
import fs from 'node:fs';
import path from 'node:path';

const APP = path.join(process.cwd(), '.next', 'server', 'app');

/** Routes the build prerendered, as URL paths. */
function prerenderedPaths() {
  const out = new Set();
  const walk = (dir, prefix = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, `${prefix}/${entry.name}`);
      } else if (entry.name.endsWith('.html')) {
        const base = entry.name.replace(/\.html$/, '');
        out.add(base === 'index' ? prefix || '/' : `${prefix}/${base}`);
      }
    }
  };
  walk(APP);
  return out;
}

const available = prerenderedPaths();

/**
 * Pathnames next-intl will REWRITE rather than redirect.
 *
 * The proxy maps a French URL onto the internal English route before Next
 * matches it, so `/fr/collection` is served by the prerendered `/fr/tables`
 * document. A link to `/fr/collection` is therefore correct even though no file
 * of that name exists — but a link to `/fr/tables` is a redirect, which is the
 * thing being hunted here.
 */
const FR_TO_INTERNAL = {
  '/collection': '/tables',
  '/notre-metier': '/our-craft',
  '/journal': '/blog',
  '/demande': '/inquiry',
  '/confidentialite': '/privacy',
  '/conditions': '/terms',
};

/** Slug maps, mirroring lib/urls.ts. */
const FR_BLOG_SLUGS = {
  'resines-tables-restauration-hotellerie': 'can-resin-tables-handle-hospitality-restaurant-use',
  'commander-table-riviere-epoxy-sur-mesure': 'commissioning-custom-epoxy-river-table-guide',
  'tables-riviere-luxe-restauration-hotellerie-entreprise': 'luxury-river-tables-dining-hospitality-corporate',
  'ensembles-tables-salle-cafe-tables-basses': 'matching-sets-dining-coffee-side-tables',
};

const tablesSrc = fs.readFileSync(path.join(process.cwd(), 'content', 'tables', 'tables.ts'), 'utf8');
const FR_TABLE_SLUGS = {};
{
  const slugs = [...tablesSrc.matchAll(/slug: '([^']+)',\s*\n\s*slugFr: '([^']+)'/g)];
  for (const [, en, fr] of slugs) FR_TABLE_SLUGS[fr] = en;
}

/** Maps a public URL path to the internal route the proxy will serve. */
function toInternal(urlPath) {
  const m = urlPath.match(/^\/(en|fr|ar)(\/.*)?$/);
  if (!m) return urlPath;
  const [, locale, rest = ''] = m;
  if (locale !== 'fr') return urlPath;

  for (const [fr, en] of Object.entries(FR_TO_INTERNAL)) {
    if (rest === fr) return `/fr${en}`;
    if (rest.startsWith(`${fr}/`)) {
      const slug = rest.slice(fr.length + 1);
      if (en === '/blog') return `/fr/blog/${FR_BLOG_SLUGS[slug] ? slug : slug}`;
      if (en === '/tables') return `/fr/tables/${slug}`;
      return `/fr${en}/${slug}`;
    }
  }
  return urlPath;
}

/** True when a public path would be redirected rather than served directly. */
function wouldRedirect(urlPath) {
  const m = urlPath.match(/^\/fr(\/.*)?$/);
  if (!m) return false;
  const rest = m[1] ?? '';
  for (const en of Object.values(FR_TO_INTERNAL)) {
    if (rest === en || rest.startsWith(`${en}/`)) return true;
  }
  return false;
}

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
})(APP);

const broken = new Map();
const redirecting = new Map();
let checked = 0;

for (const file of htmlFiles) {
  const rel = path.relative(APP, file).replace(/\.html$/, '').split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');

  for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
    // Skip assets, API, and Next internals.
    if (/^\/(_next|api)\//.test(href) || /\.[a-z0-9]{2,5}($|\?)/i.test(href)) continue;

    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean === '/') continue;

    checked++;

    if (wouldRedirect(clean)) {
      redirecting.set(`${rel} -> ${clean}`, true);
      continue;
    }

    const internal = toInternal(clean);
    const candidates = [internal, internal.replace(/\/$/, '')];
    if (!candidates.some((c) => available.has(c))) {
      broken.set(`${rel} -> ${href} (resolved ${internal})`, true);
    }
  }
}

console.log(`internal links checked: ${checked}`);
console.log(`prerendered routes:     ${available.size}`);

let failed = false;

if (redirecting.size) {
  failed = true;
  console.log(`\n✗ ${redirecting.size} link(s) would be redirected:`);
  for (const k of [...redirecting.keys()].slice(0, 20)) console.log('   ' + k);
}

if (broken.size) {
  failed = true;
  console.log(`\n✗ ${broken.size} link(s) resolve to nothing:`);
  for (const k of [...broken.keys()].slice(0, 20)) console.log('   ' + k);
}

/* Every locale must have prerendered the slug it actually serves. */
for (const [fr] of Object.entries(FR_TABLE_SLUGS)) {
  if (!available.has(`/fr/tables/${fr}`)) {
    failed = true;
    console.log(`✗ French table slug not prerendered: /fr/tables/${fr}`);
  }
}
for (const fr of Object.keys(FR_BLOG_SLUGS)) {
  if (!available.has(`/fr/blog/${fr}`)) {
    failed = true;
    console.log(`✗ French blog slug not prerendered: /fr/blog/${fr}`);
  }
}

if (!failed) console.log('\nno broken and no redirecting internal links');
process.exit(failed ? 1 : 0);

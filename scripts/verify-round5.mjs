// Verify this round: masonry grids, image distribution, the Vimeo embed, and the
// simplified 404. All three locales.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';

const SITE = 'C:/Users/Mohamed/Desktop/benzresin/site';
const BASE = 'http://127.0.0.1:3127';
const LOCALES = ['en', 'fr', 'ar'];

const pass = [];
const fail = [];
const check = (c, label) => (c ? pass.push(label) : fail.push(label));

const get = async (p) => {
  const r = await fetch(BASE + p, { redirect: 'follow' });
  return { status: r.status, html: (await r.text()).replace(/&amp;/g, '&') };
};

/**
 * Slice out the tables masonry grid specifically.
 *
 * An earlier version sliced from the first `grid grid-cols-2` to `<footer>`, which
 * on the homepage swallowed every section BELOW the tables grid — including
 * `MadeForYourSpaceSection`'s `lg:grid-cols-12` and other sections' `grid-cols-1`.
 * That produced false failures for "no span overrides" and "no single-column
 * fallback". The grid is bounded by its own closing structure instead: take from
 * the grid opener up to the end of the last <article> it contains.
 */
const sliceGrid = (html) => {
  const start = html.indexOf('grid grid-cols-2');
  if (start === -1) return '';
  const rest = html.slice(start);
  const lastArticle = rest.lastIndexOf('</article>');
  return lastArticle === -1 ? '' : rest.slice(0, lastArticle + 10);
};

// ═══ 1. MASONRY ════════════════════════════════════════════════════════════
for (const loc of LOCALES) {
  for (const [page, path, expectedCards] of [
    ['collection', loc === 'fr' ? '/fr/collection' : `/${loc}/tables`, 12],
    ['home', `/${loc}`, 6],
  ]) {
    const { status, html } = await get(path);
    check(status === 200, `${loc} ${page}: 200`);

    const grid = sliceGrid(html);
    check(grid.length > 0, `${loc} ${page}: masonry grid found`);

    const columnWrappers = (grid.match(/flex flex-col gap-3/g) ?? []).length;
    check(columnWrappers === 2, `${loc} ${page}: exactly 2 masonry columns (found ${columnWrappers})`);

    check(/grid grid-cols-2/.test(grid), `${loc} ${page}: grid-cols-2 — 50% per card`);
    check(!/grid-cols-1/.test(grid), `${loc} ${page}: no single-column fallback inside the grid`);
    check(!/col-span-/.test(grid), `${loc} ${page}: no span overrides — every card is 50%`);

    const articles = [...grid.matchAll(/<article[\s\S]*?<\/article>/g)].map((m) => m[0]);
    check(articles.length === expectedCards, `${loc} ${page}: ${expectedCards} cards (found ${articles.length})`);

    // Every frame must be portrait; three tiers exist so heights vary.
    const ratios = articles.map((a) => {
      const m = a.match(/aspect-\[(\d+)\/(\d+)\]/);
      return m ? Number(m[1]) / Number(m[2]) : null;
    });
    check(ratios.every((r) => r !== null && r < 1), `${loc} ${page}: every card frame is portrait`);
    const distinct = new Set(ratios.map((r) => r?.toFixed(3)));
    check(distinct.size >= 2, `${loc} ${page}: card heights vary (${distinct.size} distinct ratios)`);

    // Second column carries the offset that guarantees the rows never align.
    check(/md:mt-12/.test(grid), `${loc} ${page}: second column is offset so rows cannot align`);

    // Content retained.
    const withBoth = articles.filter((a) => /<h[23][^>]*>/.test(a) && /<p[^>]*>/.test(a)).length;
    check(withBoth === articles.length, `${loc} ${page}: every card keeps name + subtitle`);
    const gapped = articles.filter((a) => /mt-2 bg-\[#DFAB2E\]/.test(a)).length;
    check(gapped === articles.length, `${loc} ${page}: gold band still gapped from the image`);
    check(
      articles.every((a) => a.includes('data:image/webp;base64')),
      `${loc} ${page}: every card has a blur placeholder`
    );
    check(/50vw/.test(grid), `${loc} ${page}: sizes reflects the 50% column width`);
  }
}

// Column balance, recomputed from shipped data: offset but not ragged.
{
  const ts = readFileSync(`${SITE}/content/tables/tables.ts`, 'utf8');
  const covers = ts
    .split(/^\s{4}slug: '/gm)
    .slice(1)
    .map((b) => ({
      w: Number(b.match(/width: (\d+)/)?.[1] ?? 0),
      h: Number(b.match(/height: (\d+)/)?.[1] ?? 0),
    }));

  const CAPTION = 0.3;
  const tier = (c) => {
    const n = c.w / c.h;
    return n < 0.78 ? 2 / 3 : n < 0.95 ? 3 / 4 : 4 / 5;
  };
  const simulate = (n) => {
    const h = [0, 0];
    covers.slice(0, n).forEach((c) => {
      const target = h[1] < h[0] ? 1 : 0;
      h[target] += 1 / tier(c) + CAPTION;
    });
    return h;
  };

  for (const [label, n] of [['collection', 12], ['home', 6]]) {
    const [a, b] = simulate(n);
    const diff = Math.abs(a - b);
    check(diff > 0.001, `${label}: columns are offset, not level (Δ ${diff.toFixed(3)} column-widths)`);
    check(diff < 0.5, `${label}: columns stay balanced, no ragged bottom (Δ ${diff.toFixed(3)})`);
  }
}

// ═══ 2. IMAGE DISTRIBUTION ═════════════════════════════════════════════════
{
  const expected = {
    '/en': ['hero-walnut-turquoise', 'cta-live-edge-walnut-steel'],
    '/en/our-craft': [
      'our-craft-blue-resin-river',
      'our-craft-green-resin-pour',
      'craft-phase-1-',
      'craft-phase-2-',
      'craft-phase-3-',
      'craft-phase-4-',
      'craft-phase-5-',
    ],
    '/en/contact': ['contact-round-walnut-resin-table-in-workshop'],
  };

  for (const [path, files] of Object.entries(expected)) {
    const { html } = await get(path);
    for (const f of files) check(html.includes(f), `${path}: renders ${f}`);
  }

  const { html: craft } = await get('/en/our-craft');
  const positions = [1, 2, 3, 4, 5].map((n) => craft.indexOf(`craft-phase-${n}-`));
  check(
    positions.every((p, i) => p > -1 && (i === 0 || p > positions[i - 1])),
    'our-craft: phases 1-5 appear in sequential order'
  );

  /*
    Placeholder leakage, scoped to the slots this round replaced.

    The homepage ALSO renders blog cover images, and every one of those still
    points at an `/images/*.png` placeholder via the `heroImage` frontmatter in
    `content/blog/**.mdx`. No blog assets were supplied, so those are excluded by
    reading the exact heroImage set rather than guessed at from `sizes` — an
    earlier version filtered on `20vw` and missed the featured card, which renders
    at 50vw.
  */
  const blogCovers = new Set(
    readdirSync(`${SITE}/content/blog`)
      .flatMap((loc) => {
        const dir = `${SITE}/content/blog/${loc}`;
        if (!statSync(dir).isDirectory()) return [];
        return readdirSync(dir)
          .filter((f) => f.endsWith('.mdx'))
          .map((f) => readFileSync(`${dir}/${f}`, 'utf8').match(/^heroImage:\s*"([^"]+)"/m)?.[1])
          .filter(Boolean);
      })
  );

  const SECTION_PLACEHOLDERS = [
    'workshop_wide',
    'about_artisan',
    'hero_lifestyle',
    'material_detail',
    'table_golden_current',
    'process_final_finish',
  ];
  for (const path of ['/en', '/en/our-craft', '/en/contact', '/en/tables']) {
    const { html } = await get(path);
    const imgTags = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
    // A tag is a blog cover if its decoded src is one of the heroImage values.
    const nonBlog = imgTags.filter((t) => {
      const src = decodeURIComponent(t.match(/url=([^&"]+)/)?.[1] ?? '');
      return !blogCovers.has(src);
    });
    const leaked = SECTION_PLACEHOLDERS.filter((p) => nonBlog.some((t) => t.includes(p)));
    check(leaked.length === 0, `${path}: no placeholder in a section slot (${leaked.join(', ') || 'none'})`);
  }

  // And state the residual gap explicitly rather than letting it pass silently.
  const { html: home } = await get('/en');
  const blogTagCount = [...home.matchAll(/<img[^>]*>/g)]
    .map((m) => decodeURIComponent(m[0].match(/url=([^&"]+)/)?.[1] ?? ''))
    .filter((src) => blogCovers.has(src)).length;
  check(
    blogTagCount > 0,
    `NOTE: ${blogTagCount} blog cover images on the homepage still use placeholders (no blog assets were supplied)`
  );

  // LocalBusiness schema must not advertise a placeholder.
  const { html: contact } = await get('/en/contact');
  const ld = [...contact.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) =>
    JSON.parse(m[1])
  );
  const biz = ld.find((o) => o['@type'] === 'LocalBusiness');
  check(!!biz, 'LocalBusiness schema present');
  if (biz) {
    check(!String(biz.image).includes('workshop_wide'), 'LocalBusiness image is no longer a placeholder');
    check(String(biz.image).includes('contact-round-walnut'), 'LocalBusiness image is the supplied workshop frame');
  }
}

// ═══ 3. VIMEO EMBED ════════════════════════════════════════════════════════
for (const loc of LOCALES) {
  const { html } = await get(`/${loc}`);
  const iframe = html.match(/<iframe[^>]*vimeo[^>]*>/)?.[0] ?? '';
  check(iframe.length > 0, `${loc} home: Vimeo iframe present`);
  if (iframe) {
    check(iframe.includes('player.vimeo.com/video/1219958577'), `${loc} home: correct video id`);
    check(/title="[^"]{10,}"/.test(iframe), `${loc} home: iframe has an accessible title`);
    check(iframe.includes('loading="lazy"'), `${loc} home: iframe is deferred`);
    check(
      iframe.includes('picture-in-picture') && iframe.includes('fullscreen'),
      `${loc} home: allow attributes preserved`
    );
    // React preserves camelCase on iframe attributes, so match case-insensitively.
    check(
      /referrerpolicy="strict-origin-when-cross-origin"/i.test(iframe),
      `${loc} home: referrer policy preserved`
    );
  }
  check(
    /padding-top:133\.33%/.test(html.replace(/\s/g, '')),
    `${loc} home: 133.33% ratio box reserves the frame`
  );
  check(!/stageLabel/.test(html), `${loc} home: old stage-counter machinery gone`);
  check(
    !html.includes('player.vimeo.com/api/player.js'),
    `${loc} home: Vimeo player.js not injected (not needed for a plain embed)`
  );
}

// ═══ 4. 404 ════════════════════════════════════════════════════════════════
{
  /*
    Two things to verify, because Next serves these differently.

    `app/[locale]/not-found.tsx` is never prerendered — proven by probe: even a
    dependency-free server component produced no `[locale]/not-found.html`. That is
    the documented limitation for a root layout on a top-level dynamic segment, so
    it is asserted against the SOURCE (what a browser renders after hydration).

    `app/global-not-found.tsx` IS prerendered, so it is asserted against its built
    HTML.
  */
  const source = readFileSync(`${SITE}/app/[locale]/not-found.tsx`, 'utf8');
  check(!/<Image|next\/image/.test(source), 'locale 404 source: no images');
  check(!/rotate-45/.test(source), 'locale 404 source: rotated decorative square removed');
  check(!/WebkitTextStroke/.test(source), 'locale 404 source: stroked giant numeral removed');
  check(!/text-\[1[04]rem\]|text-\[18vw\]/.test(source), 'locale 404 source: oversized ghost numerals removed');
  check(!/lg:grid-cols-12/.test(source), 'locale 404 source: two-column decorative layout removed');
  check(!/@phosphor-icons/.test(source), 'locale 404 source: icon package no longer pulled in');
  check((source.match(/<Link/g) ?? []).length === 2, 'locale 404 source: exactly two exits');

  const built = `${SITE}/.next/server/app/_not-found.html`;
  check(existsSync(built), 'global 404 is prerendered to static HTML');
  if (existsSync(built)) {
    const html = readFileSync(built, 'utf8');
    check(html.length > 3000, `global 404: real server-rendered body (${html.length} bytes, was 51)`);
    check(/<html[^>]*lang="en"/.test(html), 'global 404: declares a language');
    check(!/<img/.test(html), 'global 404: no images');
    check(/404/.test(html), 'global 404: identifies itself');
    check((html.match(/<a\b/g) ?? []).length === 1, 'global 404: a single exit');
    check(/bg-gold|#E4B028/.test(html), 'global 404: keeps one brand accent');
    check(!/rotate-45|WebkitTextStroke/.test(html), 'global 404: no decorative ornament');
  }
}

// ═══ report ════════════════════════════════════════════════════════════════
pass.forEach((p) => console.log('  PASS  ' + p));
console.log('');
if (fail.length === 0) console.log(`ALL ${pass.length} CHECKS PASSED`);
else {
  fail.forEach((f) => console.log('  FAIL  ' + f));
  console.log(`\n${fail.length} failed / ${pass.length} passed`);
  process.exitCode = 1;
}

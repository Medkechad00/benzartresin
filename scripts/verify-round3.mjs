// Verify this round of UI changes, plus a static proof that the hydration
// mismatch class is actually gone rather than just moved.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'C:/Users/Mohamed/Desktop/benzresin/site';
const BASE = 'http://127.0.0.1:3127';
const LOCALES = ['en', 'fr', 'ar'];

const pass = [];
const fail = [];
const check = (c, label) => (c ? pass.push(label) : fail.push(label));

const read = (rel) => readFileSync(join(SITE, rel), 'utf8');
const get = async (p) => {
  const r = await fetch(BASE + p, { redirect: 'follow' });
  return { status: r.status, html: (await r.text()).replace(/&amp;/g, '&') };
};

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

// ═══ 1. HYDRATION: static proof ═══════════════════════════════════════════
{
  const appFiles = [...walk(join(SITE, 'app')), ...walk(join(SITE, 'components')), ...walk(join(SITE, 'lib'))];

  /**
   * Strip comments before scanning for code.
   *
   * These files document the hydration bug in prose, so a naive search finds
   * `useReducedMotion()` inside block comments and JSX comments and reports a
   * violation that does not exist.
   */
  const codeOnly = (src) =>
    src
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // {/* jsx comment */}
      .replace(/\/\*[\s\S]*?\*\//g, '') // /* block */
      .replace(/^\s*\/\/.*$/gm, '') // // line
      .replace(/^\s*import[^\n]*$/gm, ''); // import specifiers

  // (a) Nothing may read the preference during render except the safe hook.
  const unsafe = appFiles.filter((f) => {
    if (f.endsWith('use-safe-reduced-motion.ts')) return false;
    return /useReducedMotion\s*\(/.test(codeOnly(readFileSync(f, 'utf8')));
  });
  check(
    unsafe.length === 0,
    `no component calls useReducedMotion() during render (${unsafe.map((f) => f.split(/[\\/]/).pop()).join(', ') || 'none'})`
  );

  // (b) The safe hook must gate on a mount flag, so the FIRST client render can
  //     only ever return false — identical to the server's falsy null.
  const hook = read('lib/hooks/use-safe-reduced-motion.ts');
  check(/useState\(false\)/.test(hook), 'safe hook seeds its mount flag to false');
  check(/useEffect\(/.test(hook), 'safe hook flips only inside useEffect (post-hydration)');
  check(
    /return isHydrated && prefersReducedMotion === true;/.test(hook),
    'safe hook returns false until hydrated — first client render matches server'
  );

  // (c) MotionConfig must be mounted at the root so the preference is still honoured.
  const layout = read('app/[locale]/layout.tsx');
  check(/<MotionProvider>/.test(layout), 'MotionProvider wraps the app');
  check(
    /reducedMotion="user"/.test(read('components/providers/MotionProvider.tsx')),
    'MotionConfig reducedMotion="user" set (preference honoured at mount, not render)'
  );

  // (d) No `initial={reduceMotion ? ...}` branches anywhere in real code.
  const branchy = appFiles.filter((f) =>
    /initial[=:]\s*\{?\s*reduceMotion \?/.test(codeOnly(readFileSync(f, 'utf8')))
  );
  check(branchy.length === 0, `no initial={reduceMotion ? ...} branches remain (${branchy.length})`);

  // (e) Other classic render-time hydration hazards in the affected components.
  const hazardFiles = [
    'components/sections/FeaturedTablesSection.tsx',
    'app/[locale]/tables/TablesClient.tsx',
    'components/sections/MadeForYourSpaceSection.tsx',
    'components/blog/ReadingProgress.tsx',
  ];
  const hazards = [];
  for (const rel of hazardFiles) {
    const code = codeOnly(read(rel));
    for (const [name, re] of [
      ['Math.random', /Math\.random\(/],
      ['Date.now', /Date\.now\(/],
      ['new Date', /new Date\(/],
      ['direct window read', /(?<!typeof )\bwindow\./],
      ['localStorage', /localStorage/],
    ]) {
      if (re.test(code)) hazards.push(`${rel.split('/').pop()}: ${name}`);
    }
  }
  check(hazards.length === 0, `no other render-time hydration hazards (${hazards.join('; ') || 'none'})`);
}

// ═══ 2. IMAGE DISTRIBUTION ════════════════════════════════════════════════
{
  const expected = {
    hero: 'hero-walnut-turquoise-resin-river-coffee-table.webp',
    cta: 'cta-live-edge-walnut-steel-coffee-table.webp',
    craftLead: 'our-craft-blue-resin-river-table-workshop.webp',
    craftPour: 'our-craft-green-resin-pour-in-progress.webp',
  };

  for (const [key, file] of Object.entries(expected)) {
    check(existsSync(join(SITE, 'public/images', file)), `${key} image on disk: ${file}`);
  }

  // Each must appear on the page it was assigned to, and only there.
  const home = await get('/en');
  const craft = await get('/en/our-craft');

  check(home.html.includes(expected.hero), 'hero image renders on the homepage');
  check(home.html.includes(expected.cta), 'CTA image renders on the homepage CTA section');
  check(craft.html.includes(expected.craftLead), 'craft lead image renders on Our Craft');
  check(craft.html.includes(expected.craftPour), 'craft pour image renders on Our Craft');

  // Document order on Our Craft: lead image must precede the pour.
  const iLead = craft.html.indexOf(expected.craftLead);
  const iPour = craft.html.indexOf(expected.craftPour);
  check(iLead > -1 && iPour > -1 && iLead < iPour, 'Our Craft order: lead image first, pour second');

  // The photographs they replaced must be gone from the visible slots. Scoped to
  // <img> tags, because `workshop_wide.png` legitimately remains as the
  // LocalBusiness schema's `image` (metadata, not a rendered section image).
  const imgTags = (html) => [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]).join('\n');
  for (const [page, html, old] of [
    ['homepage', home.html, 'hero_lifestyle'],
    ['homepage', home.html, 'table_golden_current'],
    ['our-craft', craft.html, 'about_artisan'],
  ]) {
    check(!imgTags(html).includes(old), `${page}: replaced image ${old} no longer rendered`);
  }

  /*
    The second Our Craft slot is the `CinematicImageBreak`, which renders a
    <figure>. Assert on that element rather than the whole page: `workshop_wide.png`
    is still `PHASE_IMAGES[0]` further down the route, which is a different slot
    and out of scope here.
  */
  const figure = craft.html.match(/<figure[\s\S]*?<\/figure>/)?.[0] ?? '';
  check(figure.includes(expected.craftPour), 'Our Craft second slot (figure) holds the pour image');
  check(
    !figure.includes('workshop_wide'),
    'Our Craft second slot no longer holds the old workshop shot'
  );

  // Blur placeholders + correct loading strategy on the new images.
  check(home.html.includes('data:image/webp;base64'), 'section images carry blur placeholders');
  const heroTag = home.html.match(new RegExp(`<img[^>]*${expected.hero.replace(/[.]/g, '\\.')}[^>]*>`))
    ?? home.html.match(/<img[^>]*hero-walnut[^>]*>/);
  check(!!heroTag, 'hero <img> found');
  if (heroTag) {
    check(/loading="eager"/.test(heroTag[0]), 'hero image is eager (it is the LCP element)');
    check(/fetchpriority="high"/i.test(heroTag[0]), 'hero image is fetchPriority=high');
  }
}

// ═══ 3. ALT TEXT ══════════════════════════════════════════════════════════
{
  for (const loc of LOCALES) {
    const m = JSON.parse(read(`messages/${loc}.json`));
    check(!!m.Hero?.imageAlt?.trim(), `${loc}: Hero.imageAlt present (was hardcoded English)`);
    check(!('artisanAlt' in m.OurCraft), `${loc}: stale OurCraft.artisanAlt removed`);
    check(!!m.OurCraft?.leadImageAlt?.trim(), `${loc}: OurCraft.leadImageAlt present`);
    // Alt must describe the new photograph, not the one it replaced.
    check(
      !/artisan|حرفي/i.test(m.OurCraft.leadImageAlt),
      `${loc}: lead alt no longer claims an artisan is in frame`
    );
    check(
      !/olive|olivier|الزيتون/i.test(m.InquiryCTA.imageAlt),
      `${loc}: CTA alt no longer claims olive wood`
    );
    check(
      !/dining|manger|طعام/i.test(m.Hero.imageAlt),
      `${loc}: hero alt says coffee table, not dining table`
    );
  }
  // Arabic must be Arabic, not an English fallback.
  const ar = JSON.parse(read('messages/ar.json'));
  check(/[\u0600-\u06FF]/.test(ar.Hero.imageAlt), 'ar: hero alt is Arabic script');
  check(/[\u0600-\u06FF]/.test(ar.OurCraft.leadImageAlt), 'ar: lead alt is Arabic script');
}

// ═══ 4. CARDS + GRID ══════════════════════════════════════════════════════
for (const loc of LOCALES) {
  const path = loc === 'fr' ? '/fr/collection' : `/${loc}/tables`;
  const { status, html } = await get(path);
  check(status === 200, `${loc} collection: 200`);

  const cards = [...html.matchAll(/<article[\s\S]*?<\/article>/g)].map((m) => m[0]);
  check(cards.length === 12, `${loc} collection: 12 cards (found ${cards.length})`);

  // Strictly two per row. Scoped to the card grid: the Footer legitimately uses
  // a 12-column grid with col-span utilities of its own.
  const gridStart = html.indexOf('md:grid-cols-2');
  const gridEnd = html.search(/<footer/i);
  const grid = gridStart > -1 ? html.slice(gridStart, gridEnd > gridStart ? gridEnd : undefined) : '';
  check(/grid grid-cols-2/.test(html), `${loc} collection: grid is two columns at every width`);
  check(
    !/md:col-span-\d+/.test(grid),
    `${loc} collection: no span overrides in the card grid — no card can own a row`
  );
  check(!/col-span-12/.test(grid), `${loc} collection: no full-width cards`);

  /*
    REVERSED ON PURPOSE, and worth recording why.

      Round 3: "Standardize the card height so it does not expand excessively
               when alone in a row."   -> one uniform ratio, columns level.
      Round 5: "two-column masonry grid ... Pinterest aesthetic."
               -> masonry only reads as masonry if heights VARY. Uniform ratios
                  produce a plain aligned grid.

    Both cannot hold. Round 3's actual concern was one full-width card ballooning
    to 1600px tall, and that is now met structurally: there is no full-width card
    and every card is 50%. So the newer instruction wins, and this checks what
    matters now — every frame portrait, more than one height tier.
  */
  const ratioValues = cards.map((c) => {
    const m = c.match(/aspect-\[(\d+)\/(\d+)\]/);
    return m ? Number(m[1]) / Number(m[2]) : null;
  });
  check(
    ratioValues.every((r) => r !== null && r < 1),
    `${loc} collection: every card frame is portrait`
  );
  check(
    new Set(ratioValues).size > 1,
    `${loc} collection: card heights vary so the columns stagger (${new Set(ratioValues).size} tiers)`
  );

  // Name + subtitle both present, with a gap above the gold band.
  const withBoth = cards.filter((c) => /<h2[^>]*>/.test(c) && /<p[^>]*>/.test(c)).length;
  check(withBoth === cards.length, `${loc} collection: every card shows a name and a subtitle`);
  const gapped = cards.filter((c) => /mt-2 bg-\[#DFAB2E\]/.test(c)).length;
  check(gapped === cards.length, `${loc} collection: gold band gapped from the image on all cards`);

  // Homepage cards: same treatment.
  const home = await get(`/${loc}`);
  const homeCards = [...home.html.matchAll(/<article[\s\S]*?<\/article>/g)].map((m) => m[0]);
  const homeBoth = homeCards.filter((c) => /<h3[^>]*>/.test(c) && /<p[^>]*>/.test(c)).length;
  check(homeBoth === homeCards.length && homeCards.length === 6, `${loc} home: 6 cards with name + subtitle`);
  const homeGapped = homeCards.filter((c) => /mt-2 bg-\[#DFAB2E\]/.test(c)).length;
  check(homeGapped === homeCards.length, `${loc} home: gold band gapped from the image on all cards`);
}

// ═══ 5. DETAIL PAGE BACK BUTTON ═══════════════════════════════════════════
for (const loc of LOCALES) {
  const { html } = await get(`/${loc}/tables/walnut-berber-motif-resin-coffee-table`);
  // Match on the class attribute itself. Next emits `class` before `href`, and
  // the control's inner span + inline SVG runs well past a short window, so
  // trying to match through to </a> is brittle.
  const back = html.match(/class="(group mb-10[^"]*)"/);
  check(!!back, `${loc} detail: back control found`);
  if (back) {
    check(!/rounded/.test(back[1]), `${loc} detail: back control has no rounded corners`);
    // The arrow tile is the next element; check it is square too.
    const tile = html.slice(html.indexOf(back[0]), html.indexOf(back[0]) + 700);
    check(!/rounded-full/.test(tile), `${loc} detail: arrow tile has no rounded corners`);
    check(/rtl:rotate-180/.test(tile), `${loc} detail: back arrow still mirrors for RTL`);
  }
}

// ═══ report ═══════════════════════════════════════════════════════════════
pass.forEach((p) => console.log('  PASS  ' + p));
console.log('');
if (fail.length === 0) console.log(`ALL ${pass.length} CHECKS PASSED`);
else {
  fail.forEach((f) => console.log('  FAIL  ' + f));
  console.log(`\n${fail.length} failed / ${pass.length} passed`);
  process.exitCode = 1;
}

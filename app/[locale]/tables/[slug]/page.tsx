import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getTableBySlug, getAllTableSlugs } from '@/content/tables/tables';
import { localizeTable, localizedMaterial } from '@/lib/tables-i18n';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductOpenGraph } from '@/components/seo/ProductOpenGraph';
import { buildProductSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import {
  buildAlternates,
  clampDescription,
  clampTitle,
  INDEXABLE,
  openGraphFor,
} from '@/lib/seo/metadata';
import { tableSlug, localizedPath, toHref } from '@/lib/urls';
import { Link, routing } from '@/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SITE } from '@/lib/site-config';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * Prerender the slug each locale actually serves.
 *
 * This used to emit the English slug for all three locales, so the build
 * produced `/fr/collection/walnut-berber-resin-coffee-table` — which resolves
 * 200, because `getTableBySlug` matches either slug form — while the sitemap and
 * the canonical both advertise `/fr/collection/table-basse-noyer-resine-motif-berbere`.
 * The net effect was twelve prerendered non-canonical French duplicates, and the
 * twelve URLs that ARE canonical falling through to on-demand rendering.
 *
 * `blog/[slug]` already did this correctly; this route was simply missed.
 */
export function generateStaticParams() {
  const slugs = getAllTableSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug: tableSlug(slug, locale) }))
  );
}

/**
 * Unknown slugs 404 rather than being rendered on demand.
 *
 * `dynamicParams` defaults to true, which meant any URL under
 * `/{locale}/tables/` triggered a server render that then called `notFound()`.
 * Since `generateStaticParams` now enumerates every valid slug in every locale,
 * anything not on that list is definitionally invalid and can be rejected at the
 * routing layer for free.
 */
export const dynamicParams = false;

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const raw = getTableBySlug(slug);
  if (!raw) return { robots: { index: false, follow: false } };

  // Metadata must be localized too — an Arabic search result showing an English
  // title and description is worse than not ranking at all.
  const tTables = await getTranslations('Tables');
  const table = localizeTable(raw, tTables);

  /**
   * Titles and descriptions are now clamped to SERP length.
   *
   * The title was `${name} — ${material} | ${SITE.name}`, where `material` is a
   * full sentence like "Solid walnut & Opaque black with embroidered Berber
   * panel epoxy resin" — around 136 characters, more than twice what Google
   * displays. The description was `table.story` verbatim: between 500 and 1,000
   * characters on all 36 table URLs, so every one of them was truncated
   * mid-sentence in the results page.
   *
   * The material is dropped from the title rather than clamped into it — cutting
   * a compound material name at 60 characters produces a fragment, whereas the
   * piece's own name is already the differentiating phrase. The story is clamped
   * on a word boundary.
   */
  const title = clampTitle(`${table.name} | ${SITE.name}`);
  const description = clampDescription(table.story);
  const path = `${localizedPath('/tables', locale)}/${tableSlug(slug, locale)}`;

  /**
   * Product-specific Open Graph tags are emitted by <ProductOpenGraph> in the
   * body rather than here — see that component for why `metadata.other` cannot
   * produce spec-correct Open Graph markup.
   */
  return {
    title,
    description,
    robots: INDEXABLE,
    alternates: buildAlternates(
      locale,
      // Resolver, not a string: the path segment and the slug both differ by
      // locale ('/tables/atlas-walnut-river' vs '/collection/atlas-noyer-riviere'),
      // so each alternate has to be built in its own locale or it 307s.
      (loc) => `${localizedPath('/tables', loc)}/${tableSlug(slug, loc)}`
    ),
    openGraph: openGraphFor({
      locale,
      title,
      description,
      path,
      images: table.images.map((img) => ({ url: img.src, alt: img.alt })),
    }),
  };
}

export default async function TableDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('TableDetail');
  const tc = await getTranslations('Common');
  const tNav = await getTranslations('Navbar');
  const tTables = await getTranslations('Tables');
  const raw = getTableBySlug(slug);

  if (!raw) {
    notFound();
  }

  const table = localizeTable(raw, tTables);

  const productSchema = buildProductSchema(locale, {
    sku: table.slug,
    name: table.name,
    images: table.images.map((img) => img.src),
    description: table.story,
    material: localizedMaterial(table),
    startingPrice: table.startingPrice,
    availability: table.availability,
  });

  /**
   * Breadcrumb names must be localised.
   *
   * These were the hardcoded English strings 'Home' and 'Collection', so the
   * French and Arabic product pages emitted an English breadcrumb trail —
   * which is what Google renders in place of the URL in the result. The blog
   * route already read these from translations; this one was missed.
   */
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: tc('home'), url: `/${locale}` },
    { name: tNav('collection'), url: `/${locale}${localizedPath('/tables', locale)}` },
    { name: table.name, url: `/${locale}${localizedPath('/tables', locale)}/${tableSlug(slug, locale)}` },
  ]);

  /**
   * The commission link, localised.
   *
   * Was the literal `/inquiry?ref=...`. next-intl's `Link` translates an href
   * only when it matches a key in the `pathnames` map, and a concrete path with
   * a query string does not — so on French pages this emitted
   * `/fr/inquiry?ref=...`, which the proxy then 307s to `/fr/demande?ref=...`.
   * Both CTAs on the highest-intent page in the funnel were costing a redirect.
   */
  const inquiryHref = `${localizedPath('/inquiry', locale)}?ref=${table.slug}`;

  const specs = [
    // One piece has no timber visible on its top, its edge, or its underside,
    // so it carries no `wood` and shows a Materials row instead. Rendering an
    // empty "Wood species" cell there would read as a data bug; asserting a
    // species would be a false material claim.
    table.wood
      ? { label: t('woodSpecies'), value: table.wood }
      : { label: t('materials'), value: localizedMaterial(table) },
    { label: t('resin'), value: table.resinColor },
    { label: t('dimensions'), value: table.dimensions },
    // Shape is an enum in the data file, so it translates via a lookup rather
    // than rendering the raw English key.
    { label: t('shape'), value: t(`shapes.${table.shape}`) },
  ];

  return (
    <>
      <Navbar theme="dark" />

      {/*
        `pb-32 md:pb-16` — the mobile enquiry bar is fixed, so without extra
        bottom padding the last of this column would sit permanently underneath
        it and be unreachable.
      */}
      <div className="pt-32 pb-32 md:pb-16 px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
        <JsonLd data={productSchema} />
        <JsonLd data={breadcrumbSchema} />
        <ProductOpenGraph
          availability={table.availability}
          price={table.startingPrice}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          {/* Images */}
          <div className="flex flex-col gap-6">
            {table.images.map((img, idx) => (
              <div
                key={img.src}
                className="relative aspect-[4/5] md:aspect-square w-full rounded-sm overflow-hidden bg-ivory-dark"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  /*
                    The first frame is the LCP element on this page, so it
                    loads eagerly at high priority. `priority` was deprecated
                    in Next 16, and `loading` + `fetchPriority` states the
                    intent without a head preload.

                    Everything after it is lazy: a piece with eight
                    photographs was fetching all eight at once on a page where
                    the visitor sees one.
                  */
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  placeholder="blur"
                  blurDataURL={img.blurDataURL}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="flex flex-col sticky top-32 self-start">
            {/*
              Back control.

              Was a bare underlined caption with an HTML entity arrow, which
              read as body text rather than a control. Now a squared chip with
              the glyph in a filled tile: the arrow shifts toward the direction
              of travel on hover, and the whole thing is a real target rather
              than a line of small caps. Square corners to match the site's
              other controls — the enquiry CTA, the caption bands and the
              heading slabs are all hard-edged, so a pill was the only rounded
              element on the page. Logical padding (`ps`/`pe`) and
              `rtl:rotate-180` mean it mirrors correctly in Arabic without a
              second set of classes.
            */}
            <Link
              href={toHref(localizedPath('/tables', locale))}
              className="group mb-10 inline-flex w-fit items-center gap-2.5 border border-black/10 bg-white/70 py-1.5 ps-1.5 pe-4 font-sans text-[11px] uppercase tracking-[0.18em] text-gray-600 backdrop-blur-sm transition-colors duration-300 hover:border-black/25 hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center bg-black text-white transition-transform duration-300 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="m12 19-7-7 7-7" />
                </svg>
              </span>
              {tc('backToCollection')}
            </Link>

            {/*
              Gold slab on the title, matching the h1 on /tables and the h2s on
              the homepage: inner span so the gold hugs the words rather than
              the column, `box-decoration-clone` to keep the padding on every
              wrapped line, and asymmetric vertical padding as descender
              reserve so a long name is never clipped.
            */}
            <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.15] mb-6">
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {table.name}
              </span>
            </h1>
            <p className="font-sans text-gray-700 leading-relaxed mb-8 max-w-prose">
              {table.story}
            </p>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8 border-y border-gray-200 py-6">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">
                    {spec.label}
                  </p>
                  <p className="font-sans text-sm font-bold capitalize">{spec.value}</p>
                </div>
              ))}
            </div>

            {/*
              Displayed because Product schema emits `offers.price`. Google
              requires structured-data prices to be visible on the page — a
              schema-only price is a mismatch and can invalidate the markup.
            */}
            {table.startingPrice ? (
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">
                  {t('priceFrom')}
                </p>
                <p className="font-display text-3xl text-black">
                  {/*
                    `dir="ltr"` because the figure is formatted as `$450` — a
                    leading currency symbol followed by digits. Left to inherit
                    RTL on the Arabic page, bidi reordering puts the symbol on
                    the wrong side of the number.
                  */}
                  <span dir="ltr" className="inline-block">
                    {priceFormatter.format(table.startingPrice)}
                  </span>
                </p>
                {/*
                  The disclaimer carries the gold as a filled block rather than
                  a text highlight: it is the one piece of small print on the
                  page that a buyer must not skip, and at this size a
                  word-hugging slab would read as emphasis rather than as a
                  notice.
                */}
                <p className="font-sans text-xs text-black/80 leading-relaxed mt-4 max-w-prose bg-[#DFAB2E] px-4 py-3">
                  {t('priceNote')}
                </p>
              </div>
            ) : null}

            {/* Desktop CTA. The mobile equivalent is the fixed bar below. */}
            <Link
              href={toHref(inquiryHref)}
              className="hidden md:block bg-black text-white px-8 py-5 text-center uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>

      {/*
        Mobile enquiry bar.

        On a phone the desktop CTA sits below a full-height image stack plus the
        description and the spec table, so it is thousands of pixels down the
        page — the visitor has to scroll back up past everything to act. This
        keeps it in reach at any scroll position, and carries the price so the
        two pieces of information a buyer decides on are together.

        `md:hidden` rather than a duplicated link that is merely visually
        hidden: `display: none` removes the inactive one from the accessibility
        tree, so assistive technology is never offered the same link twice.
      */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-4">
          {table.startingPrice ? (
            <div className="min-w-0 shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 leading-none mb-1">
                {t('priceFromShort')}
              </p>
              <p className="font-display text-xl leading-none text-black">
                <span dir="ltr" className="inline-block">
                  {priceFormatter.format(table.startingPrice)}
                </span>
              </p>
            </div>
          ) : null}
          <Link
            href={toHref(inquiryHref)}
            className="flex-1 bg-black text-white px-5 py-4 text-center uppercase tracking-widest text-[11px] font-bold transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            {t('cta')}
          </Link>
        </div>
      </div>

      <Footer />

      {/*
        Reserves the height of the fixed bar so the last row of the footer is
        not permanently sitting underneath it at the bottom of the scroll.
      */}
      <div aria-hidden="true" className="md:hidden h-20" />
    </>
  );
}

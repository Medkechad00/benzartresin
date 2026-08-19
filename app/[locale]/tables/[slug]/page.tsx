import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getTableBySlug, getAllTableSlugs } from '@/content/tables/tables';
import { localizeTable, localizedMaterial } from '@/lib/tables-i18n';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductOpenGraph } from '@/components/seo/ProductOpenGraph';
import { buildProductSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { buildAlternates } from '@/lib/seo/metadata';
import { tableSlug, localizedPath } from '@/lib/urls';
import { Link, routing } from '@/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SITE, abs } from '@/lib/site-config';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const slugs = getAllTableSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const raw = getTableBySlug(slug);
  if (!raw) return {};

  // Metadata must be localized too — an Arabic search result showing an English
  // title and description is worse than not ranking at all.
  const tTables = await getTranslations('Tables');
  const table = localizeTable(raw, tTables);

  /**
   * Product-specific Open Graph tags are emitted by <ProductOpenGraph> in the
   * body rather than here — see that component for why `metadata.other` cannot
   * produce spec-correct Open Graph markup.
   */
  return {
    title: `${table.name} — ${localizedMaterial(table)} | ${SITE.name}`,
    description: table.story,
    alternates: buildAlternates(
      locale,
      // Resolver, not a string: the path segment and the slug both differ by
      // locale ('/tables/atlas-walnut-river' vs '/collection/atlas-noyer-riviere'),
      // so each alternate has to be built in its own locale or it 307s.
      (loc) => `${localizedPath('/tables', loc)}/${tableSlug(slug, loc)}`
    ),
    openGraph: {
      title: `${table.name} | ${SITE.name}`,
      description: table.story,
      url: abs(`/${locale}${localizedPath('/tables', locale)}/${tableSlug(slug, locale)}`),
      siteName: SITE.name,
      images: table.images.map((img) => ({ url: img.src, alt: img.alt })),
    },
  };
}

export default async function TableDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('TableDetail');
  const tc = await getTranslations('Common');
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

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: `/${locale}` },
    { name: 'Collection', url: `/${locale}${localizedPath('/tables', locale)}` },
    { name: table.name, url: `/${locale}${localizedPath('/tables', locale)}/${tableSlug(slug, locale)}` },
  ]);

  const specs = [
    { label: t('woodSpecies'), value: table.wood },
    { label: t('resin'), value: table.resinColor },
    { label: t('dimensions'), value: table.dimensions },
    // Shape is an enum in the data file, so it translates via a lookup rather
    // than rendering the raw English key.
    { label: t('shape'), value: t(`shapes.${table.shape}`) },
  ];

  return (
    <>
      <Navbar theme="dark" />

      <div className="pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
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
                className="relative aspect-[4/5] md:aspect-square w-full rounded-sm overflow-hidden bg-gray-100"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  priority={idx === 0}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="flex flex-col sticky top-32 self-start">
            <Link
              href={localizedPath('/tables', locale) as any}
              className="text-xs uppercase tracking-widest text-gray-500 mb-8 hover:text-black transition-colors block w-fit"
            >
              <span aria-hidden="true" className="inline-block rtl:rotate-180">
                &#8592;
              </span>{' '}
              {tc('backToCollection')}
            </Link>

            <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
              {table.name}
            </h1>
            <p className="font-sans text-gray-700 leading-relaxed mb-8 max-w-prose">
              {table.story}
            </p>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8 border-y border-gray-200 py-6">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
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
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  {t('priceFrom')}
                </p>
                <p className="font-display text-3xl text-black">
                  {priceFormatter.format(table.startingPrice)}
                </p>
                <p className="font-sans text-xs text-gray-500 mt-2 max-w-prose">
                  {t('priceNote')}
                </p>
              </div>
            ) : null}

              <Link
                href={`/inquiry?ref=${table.slug}` as any}
                className="bg-black text-white px-8 py-5 text-center uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-colors active:scale-[0.98]"
              >
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

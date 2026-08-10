import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildFAQPageSchema } from '@/lib/seo/schema';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Commission a Custom Table | Benzart Inquiry',
    description: 'Start your custom table commission. Share your vision — wood species, resin color, dimensions, and budget — and our atelier will craft your piece.',
    alternates: buildAlternates(locale, '/inquiry'),
  };
}

export default async function InquiryLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);

  /**
   * Schema lives in this server layout rather than in the page.
   *
   * The page is a client component wrapped in a Suspense boundary because it
   * reads `?ref=` via useSearchParams. Anything inside that boundary is absent
   * from the prerendered HTML, which would mean the schema only appeared after
   * JavaScript executed. AI crawlers do not execute JavaScript, so it has to be
   * in the initial server response.
   *
   * This previously emitted HowTo, which Google deprecated in September 2023.
   * It produced no rich result and no answer-engine benefit that the FAQ below
   * does not produce better. Replaced with:
   *   - FAQPage, built from the same four process steps but phrased as the
   *     questions people actually ask, which is what an answer engine matches
   *     a query against.
   *   - BreadcrumbList, for the same page-hierarchy signal the blog and table
   *     detail pages already emit.
   */
  const t = await getTranslations({ locale, namespace: 'Inquiry' });
  const tc = await getTranslations({ locale, namespace: 'Common' });

  const breadcrumb = buildBreadcrumbSchema([
    { name: tc('home'), url: `/${locale}` },
    { name: t('title'), url: `/${locale}/inquiry` },
  ]);

  const faq = buildFAQPageSchema(
    (t.raw('processFaq') as { question: string; answer: string }[]) ?? []
  );

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faq} />
      {children}
    </>
  );
}

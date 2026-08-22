import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { staticPageMetadata } from '@/lib/seo/metadata';

type Props = { params: Promise<{ locale: string }> };

/**
 * Metadata for this route lives here, not in page.tsx.
 *
 * Both files used to declare a byte-identical generateMetadata, which is
 * redundant at best — the leaf always wins — and a drift hazard at worst, since
 * only one of the pair ever got updated. staticPageMetadata builds the title,
 * description, canonical, hreflang cluster and the complete Open Graph object
 * together, so none of them can go missing independently.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata('tables', locale, '/tables');
}

export default async function TablesLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}
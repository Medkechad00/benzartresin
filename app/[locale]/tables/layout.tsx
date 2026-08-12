import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/metadata';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Collection | Benzart Bespoke Tables',
    description: 'Browse our gallery of one-of-a-kind handcrafted epoxy resin and solid wood dining tables. Each piece is unique.',
    alternates: buildAlternates(locale, localizedPath('/tables', locale)),
  };
}

export default async function TablesLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}

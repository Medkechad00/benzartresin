import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates, getLocalizedMetadata } from '@/lib/seo/metadata';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('tables', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, localizedPath('/tables', locale)),
    openGraph: {
      title: meta.title || undefined,
      description: meta.description || undefined,
      type: 'website',
    },
  };
}

export default async function TablesLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}

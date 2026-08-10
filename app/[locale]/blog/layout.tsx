import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/metadata';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Journal | Benzart Blog',
    description: 'Expert guides on epoxy resin tables, wood species selection, craftsmanship techniques, and luxury furniture design from the Benzart atelier.',
    alternates: buildAlternates(locale, '/blog'),
  };
}

export default async function BlogLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}

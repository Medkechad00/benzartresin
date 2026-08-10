import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/metadata';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'FAQ | Benzart — Custom Table Questions Answered',
    description: 'Frequently asked questions about commissioning a custom epoxy resin and wood table: lead times, materials, shipping, and care.',
    alternates: buildAlternates(locale, '/faq'),
  };
}

export default async function FaqLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}

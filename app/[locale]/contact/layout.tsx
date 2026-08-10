import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/metadata';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Contact | Benzart Atelier',
    description: 'Reach the Benzart team for press inquiries, trade accounts, or to schedule a visit to our Marrakech atelier.',
    alternates: buildAlternates(locale, '/contact'),
  };
}

export default async function ContactLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}

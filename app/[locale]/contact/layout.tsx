import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates, getLocalizedMetadata } from '@/lib/seo/metadata';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('contact', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, localizedPath('/contact', locale)),
  };
}

export default async function ContactLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}

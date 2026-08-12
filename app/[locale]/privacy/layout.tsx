import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates, getLocalizedMetadata } from '@/lib/seo/metadata';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('privacy', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, localizedPath('/privacy', locale)),
  };
}

export default async function PrivacyLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}

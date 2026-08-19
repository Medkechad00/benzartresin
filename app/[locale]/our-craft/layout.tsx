import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates, getLocalizedMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildLocalBusinessSchema } from '@/lib/seo/schema';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('ourCraft', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/our-craft'),
  };
}

export default async function OurCraftLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);

  /**
   * LocalBusiness belongs on the pages that actually show the Marrakech
   * address. This page is the merged replacement for /about, which carried it.
   */
  return (
    <>
      <JsonLd data={buildLocalBusinessSchema(locale)} />
      {children}
    </>
  );
}

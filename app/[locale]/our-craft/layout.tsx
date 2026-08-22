import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { staticPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildLocalBusinessSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata('ourCraft', locale, '/our-craft');
}

export default async function OurCraftLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'OurCraft' });
  const tc = await getTranslations({ locale, namespace: 'Common' });

  /**
   * LocalBusiness belongs on the pages that actually show the Marrakech
   * address. This page is the merged replacement for /about, which carried it.
   */
  return (
    <>
      <JsonLd data={buildLocalBusinessSchema(locale)} />
      {/*
        Breadcrumbs were on only three of thirteen routes. They are the cheapest
        structured data there is — two nodes — and they are what Google renders
        in place of the raw URL in a result.
      */}
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: tc('home'), url: `/${locale}` },
          { name: t('title'), url: `/${locale}${localizedPath('/our-craft', locale)}` },
        ])}
      />
      {children}
    </>
  );
}

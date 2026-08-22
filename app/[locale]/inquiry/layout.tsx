import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { staticPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildFAQPageSchema } from '@/lib/seo/schema';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata('inquiry', locale, '/inquiry');
}

export default async function InquiryLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Inquiry' });
  const tc = await getTranslations({ locale, namespace: 'Common' });

  const breadcrumb = buildBreadcrumbSchema([
    { name: tc('home'), url: `/${locale}` },
    { name: t('title'), url: `/${locale}${localizedPath('/inquiry', locale)}` },
  ]);

  const faqItems = (t.raw('processFaq') as { question: string; answer: string }[]) ?? [];

  return (
    <>
      <JsonLd data={breadcrumb} />
      {/*
        Guarded. `buildFAQPageSchema` has no empty check of its own, so an absent
        or emptied `processFaq` key would emit `FAQPage` with `mainEntity: []` —
        a syntactically valid node that asserts the page has questions and then
        lists none.
      */}
      {faqItems.length > 0 ? <JsonLd data={buildFAQPageSchema(faqItems)} /> : null}
      {children}
    </>
  );
}

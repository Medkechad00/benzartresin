import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { buildAlternates, getLocalizedMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildFAQPageSchema } from '@/lib/seo/schema';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('inquiry', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, localizedPath('/inquiry', locale)),
  };
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

  const faq = buildFAQPageSchema(
    (t.raw('processFaq') as { question: string; answer: string }[]) ?? []
  );

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faq} />
      {children}
    </>
  );
}

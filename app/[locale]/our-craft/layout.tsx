import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildLocalBusinessSchema } from '@/lib/seo/schema';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string }> };

const META: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Our Craft | How BenzArt Makes Custom Resin & Wood Tables',
    description:
      'Inside the BenzArt atelier outside Marrakech: how we choose a slab, why deep resin pours go in layers, and why hand-finishing takes longer than everything else combined.',
  },
  fr: {
    title: 'Notre Savoir-Faire | Tables sur mesure en résine et bois | BenzArt',
    description:
      "Dans l'atelier BenzArt près de Marrakech : comment nous choisissons une planche, pourquoi les coulées profondes se font en couches, et pourquoi la finition à la main prend plus de temps que tout le reste.",
  },
  ar: {
    title: 'حرفتنا | كيف تصنع BenzArt طاولات الراتنج والخشب حسب الطلب',
    description:
      'من داخل ورشة BenzArt خارج مراكش: كيف نختار اللوح، ولماذا تُصبّ الطبقات العميقة على مراحل، ولماذا يستغرق الإنهاء اليدوي وقتاً أطول من كل ما سبق مجتمعاً.',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = META[locale] ?? META.en;
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, localizedPath('/our-craft', locale)),
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

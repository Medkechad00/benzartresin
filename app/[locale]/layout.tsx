import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getTextDirection } from '@/lib/i18n/direction';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildOrganizationSchema } from '@/lib/seo/schema';
import { SITE, BASE_URL, GA_MEASUREMENT_ID } from '@/lib/site-config';
import { getLocalizedMetadata } from '@/lib/seo/metadata';
import { GoogleAnalytics } from '@next/third-parties/google';
import "../globals.css";

/** OG locale codes. `og:locale` wants language_TERRITORY, not a bare language. */
const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  ar: 'ar_MA',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('home', locale);

  return {
    metadataBase: new URL(BASE_URL),
    title: meta.title ?? `${SITE.name}`,
    description: meta.description ?? SITE.description,
    openGraph: {
      siteName: SITE.name,
      locale: OG_LOCALE[locale] ?? 'en_US',
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l] ?? l),
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  /**
   * Opts the whole tree into static rendering.
   *
   * Without this, next-intl resolves the locale from the incoming request,
   * which marks every route dynamic — the previous build prerendered zero
   * pages and server-rendered all 99 on demand. On an image-heavy luxury site
   * that is paid directly in TTFB and LCP, which is the Core Web Vitals risk
   * the SEO strategy calls out. Must be called before any translation lookup.
   */
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} dir={getTextDirection(locale)} className="h-full scroll-smooth">
      <body className="min-h-[100dvh] flex flex-col font-sans bg-ivory text-black selection:bg-gold selection:text-black">
        <JsonLd data={buildOrganizationSchema(locale)} />
        <NextIntlClientProvider messages={messages}>
          <main className="flex-grow flex flex-col">{children}</main>
        </NextIntlClientProvider>
      </body>
      {/*
        GA4 via the official component rather than a hand-rolled pair of
        <script> tags. It emits the same gtag.js config, but defers the fetch
        until after hydration so the tag never blocks first paint, and it wires
        App Router client-side navigations into page_view events. Two raw script
        tags would only ever report the first page of a session, because App
        Router transitions do not reload the document.

        Rendered outside <body> as the docs specify. Guarded so an empty
        measurement ID (preview branches, local dev) ships no tag at all.
      */}
      {GA_MEASUREMENT_ID ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
    </html>
  );
}

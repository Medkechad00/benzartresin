import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getTextDirection } from '@/lib/i18n/direction';
import { JsonLd } from '@/components/seo/JsonLd';
import { MotionProvider } from '@/components/providers/MotionProvider';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema';
import { SITE, BASE_URL, GA_MEASUREMENT_ID } from '@/lib/site-config';
import { openGraphFor, TWITTER } from '@/lib/seo/metadata';
import { GoogleAnalytics } from '@next/third-parties/google';
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * SITE-WIDE DEFAULTS ONLY.
 *
 * This function used to return the HOME PAGE's title, description, canonical and
 * Open Graph object. That is the wrong home for them, and it had a concrete
 * consequence: a root layout's metadata is also what a 404 inherits, because
 * `notFound()` composes its response from the layout chain. So every unmatched
 * URL under a locale served the homepage's title, the homepage's description,
 * `<link rel="canonical" href="…/en">` and the homepage's `og:title` — telling
 * Google that an unbounded set of URLs was the home page.
 *
 * The home page's own metadata now lives in `app/[locale]/page.tsx`, where it
 * belongs. What is left here is genuinely site-wide: the origin every relative
 * URL resolves against, a last-resort title, and the Twitter card type.
 *
 * Deliberately absent:
 *  - `alternates`. A canonical is a per-page claim; inheriting one is how a 404
 *    ends up claiming to be another page. Every real route builds its own.
 *  - `robots`. See `INDEXABLE` in lib/seo/metadata.ts — declaring it here put a
 *    second, contradictory robots tag on every 404.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    metadataBase: new URL(BASE_URL),
    /**
     * A fallback, not the home page's title. Every route sets its own; this is
     * what shows if one ever fails to.
     */
    title: SITE.name,
    description: SITE.description,
    /**
     * Site-wide Open Graph defaults.
     *
     * These have to be complete, because `openGraph` is REPLACED — not
     * deep-merged — the moment a child segment declares its own. Before this,
     * the home page, `/tables`, `/tables/[slug]` and `/blog/[slug]` each
     * declared a partial `openGraph`, which silently discarded `siteName`,
     * `locale` and `alternateLocale` from this layout on exactly the four routes
     * that get shared most. `openGraphFor` exists so no page can make that
     * mistake again: it always returns the full object.
     */
    openGraph: openGraphFor({
      locale,
      title: SITE.name,
      description: SITE.description,
      path: '',
    }),
    twitter: TWITTER,
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
  const t = await getTranslations({ locale, namespace: 'Common' });

  /**
   * The `Metadata` namespace is server-only.
   *
   * `getLocalizedMetadata` imports the JSON module directly, so nothing in the
   * client tree ever reads these keys — but `NextIntlClientProvider` serialises
   * whatever it is handed into the RSC payload for every single route. That is
   * 36 titles and descriptions shipped to the browser on all 125 pages to be
   * read by nobody. Omitting one namespace is a safe, mechanical win; narrowing
   * further would mean tracking which client component uses which namespace,
   * and a miss there is a runtime throw rather than a degraded render.
   */
  const clientMessages = Object.fromEntries(
    Object.entries(messages).filter(([namespace]) => namespace !== 'Metadata')
  );

  const isArabic = locale === 'ar';

  return (
    <html lang={locale} dir={getTextDirection(locale)} className="h-full scroll-smooth">
      <head>
        {/*
          Font preloads.

          The six faces are declared with @font-face in globals.css, which means
          the browser cannot discover any of them until it has fetched and parsed
          the stylesheet — three hops from the HTML. Every face carries
          `font-display: swap`, so nothing blocks render, but the hero H1 is set
          at up to 6.75rem in the display face and re-lays out when it arrives.

          Only the two faces needed for first paint are preloaded, and only the
          ones that locale will actually use: preloading all six would compete
          with the LCP image for bandwidth and lose more than it gains.
          `crossOrigin` is required on font preloads even for same-origin, or the
          fetch is made twice.
        */}
        <link
          rel="preload"
          href="/fonts/Modern%20Romance.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Louis%20George%20Cafe.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {isArabic ? (
          <link
            rel="preload"
            href="/fonts/NotoSansArabic-Variable.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ) : null}

        {/*
          The two third-party origins this site actually contacts. Both are
          discovered late — GA after hydration, Vimeo when its lazy iframe
          scrolls into view — so warming the connection costs one DNS lookup and
          saves a full TLS handshake at the moment it is needed.
        */}
        {GA_MEASUREMENT_ID ? (
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        ) : null}
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
      </head>
      <body className="min-h-[100dvh] flex flex-col font-sans bg-ivory text-black selection:bg-gold selection:text-black">
        {/*
          Skip link — WCAG 2.4.1.

          Every page ships a fixed navbar with up to five controls before the
          content starts, and /blog puts a four-card topic grid in front of the
          article list on top of that. This is the first focusable thing in the
          document and it is the only way past all of it without tabbing.

          It targets `#main-content`, which carries `tabIndex={-1}` below —
          without that, Safari and older WebKit move the viewport but leave focus
          on the link, so the next Tab goes back into the navbar.
        */}
        <a href="#main-content" className="skip-link">
          {t('skipToContent')}
        </a>

        <JsonLd data={buildOrganizationSchema(locale)} />
        {/*
          WebSite, once, site-wide. It is the node that ties the whole domain to
          the Organization as an entity; without it the Organization schema on
          every page has nothing to be the publisher OF.
        */}
        <JsonLd data={buildWebSiteSchema(locale)} />
        <NextIntlClientProvider messages={clientMessages}>
          {/*
            Motion honours "prefers-reduced-motion" here rather than in each
            component. Components used to branch on `useReducedMotion()` during
            render, which returns `null` on the server but the real value on the
            first client render — a guaranteed hydration mismatch for anyone with
            the setting enabled. See components/providers/MotionProvider.tsx.

            CSS-driven motion is handled separately, by the
            @media (prefers-reduced-motion: reduce) block in globals.css —
            MotionConfig cannot reach a Tailwind `transition-transform`.
          */}
          <MotionProvider>
            <main id="main-content" tabIndex={-1} className="flex-grow flex flex-col">
              {children}
            </main>
          </MotionProvider>
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

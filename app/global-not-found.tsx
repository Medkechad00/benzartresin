import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getTextDirection } from '@/lib/i18n/direction';
import { getLocalizedMetadata } from '@/lib/seo/metadata';
import { BASE_URL } from '@/lib/site-config';
import './globals.css';

/**
 * Best-effort locale for a request that never resolved a `[locale]` segment.
 *
 * This file receives no props and bypasses routing, so there is no param to
 * read. `NEXT_LOCALE` is written by the next-intl proxy on the visitor's first
 * request, which means anyone who has already loaded a page — i.e. essentially
 * everyone who reaches a 404 by clicking a stale link — has their language
 * recorded. `en` is the honest fallback for a genuinely first-contact request;
 * guessing from `accept-language` here would duplicate the negotiation the proxy
 * already owns and could disagree with it.
 */
async function resolveLocale(): Promise<string> {
  const store = await cookies();
  const cookieLocale = store.get('NEXT_LOCALE')?.value;
  return cookieLocale && routing.locales.includes(cookieLocale as never)
    ? cookieLocale
    : routing.defaultLocale;
}

/**
 * The 404 page for unmatched URLs, across the whole app.
 *
 * WHY THIS FILE EXISTS AT ALL. Every 404 on this site was serving a 51-byte empty
 * body — no heading, no links, no `lang` or `dim` on `<html>` — with the content
 * present only in the RSC payload for the client to render after hydration. That
 * applied to unmatched URLs and to in-route `notFound()` calls alike, so
 * `app/[locale]/not-found.tsx` never server-rendered in any case, and a visitor
 * with slow or blocked JS saw a blank page.
 *
 * The cause is documented rather than mysterious. From Next's own
 * `not-found.md`: composing a 404 from `layout.js` + `not-found.js` breaks when
 * "your root layout is defined using top-level dynamic segments (e.g.
 * `app/[country]/layout.tsx`)". This app's root layout is `app/[locale]/layout.tsx`,
 * exactly that case — there is no resolved `locale` for an unmatched URL, so the
 * layout that provides `<html>`, the fonts and the intl provider cannot run.
 *
 * `global-not-found` is the documented escape hatch: handled at the routing level,
 * bypassing layouts, and returning a full HTML document itself. Which is why this
 * file imports `globals.css` directly — nothing else in the tree will.
 *
 * LANGUAGE. English, and `lang="en"`. This file receives no props and skips
 * routing, so there is no locale to read; inventing one from a header would be a
 * guess. The single exit points at `/` rather than a locale-prefixed path, so the
 * next-intl proxy resolves the visitor's own language on the way out — they land
 * back in the right locale even though this page could not greet them in it.
 *
 * DESIGN. The brief asked for minimal, and a 404 is the one page where that is
 * also the correct instinct: the visitor has already failed to find something and
 * wants a way out, not art direction. What was here before was a two-column
 * layout carrying a 14rem numeral at 3% opacity, a rotated empty square, a
 * floating gold dash, and a second `404` at `18vw` with a text stroke — the
 * numeral rendered twice, at two sizes, alongside three ornaments that said
 * nothing. This is a statement, a rule, and a door.
 *
 * No `motion` and no icon package: both are client-side, and this page ships
 * outside the app's provider tree. Static markup also means it renders with
 * JavaScript disabled, which is the whole point of the fix.
 */
/**
 * Read from the `notFound` key in `messages/*.json` rather than hardcoded here.
 *
 * That key existed in all three locale files and was read by nothing — the copy
 * was written, translated three times, and dead. It now drives the one 404
 * surface the site has.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const meta = await getLocalizedMetadata('notFound', locale);
  return {
    metadataBase: new URL(BASE_URL),
    title: meta.title,
    description: meta.description,
    /**
     * No `robots` here.
     *
     * Next already emits `<meta name="robots" content="noindex">` on every 404
     * response, so declaring it produced two robots tags on the same document.
     * They agreed, which is why it worked, but a duplicated directive is the kind
     * of thing an auditor flags and the next person "fixes" in the wrong place.
     * Omitting `follow` is also correct: it is the default, and `noindex` alone
     * already means "do not index, do follow the links out".
     *
     * No `alternates` either — a 404 must not name a canonical.
     */
  };
}

export default async function GlobalNotFound() {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: 'NotFound' });

  return (
    <html lang={locale} dir={getTextDirection(locale)}>
      {/*
        Tokens are named directly rather than through Tailwind's theme layer.
        `globals.css` is imported above so the utilities exist, but this document
        renders outside the layout that sets `font-sans` on `body` — so the two
        font stacks are declared here explicitly.
      */}
      <body className="min-h-screen bg-ivory text-black antialiased font-sans">
        <main className="flex min-h-screen items-center">
          <div className="w-full px-6 py-24 md:px-12 md:py-32">
            <div className="mx-auto max-w-7xl">
              {/* A measure, not a column — there is nothing to balance against. */}
              <div className="max-w-2xl mx-auto text-center">
                <p className="font-sans inline-block bg-[#DFAB2E] px-4 py-2 text-base font-bold uppercase tracking-[0.3em] text-black md:text-lg">
                  {t('eyebrow')}
                </p>

                <h1 className="mt-8 font-display text-4xl leading-[1.1] tracking-tight text-balance text-black md:text-6xl lg:text-7xl">
                  {t('title')}
                </h1>

                {/* The single ornament kept: one hairline in the brand gold. */}
                <div aria-hidden="true" className="mt-8 h-px w-24 mx-auto bg-gold" />

                <p className="mt-8 font-sans text-lg leading-relaxed text-gray-600">
                  {t('description')}
                </p>

                {/*
                  One exit, unprefixed. `/` lets the locale proxy send an Arabic or
                  French visitor back into their own language, which a hardcoded
                  `/en/...` could not do.

                  A raw `<a>`, not `next/link`. This file renders a complete,
                  standalone HTML document at the routing layer — it is outside
                  every layout and therefore outside `NextIntlClientProvider`, so
                  the localised `Link` has no locale to read and `next/link` would
                  ship a client runtime to a page whose only job is to hand the
                  visitor back to the proxy. The lint rule cannot see that
                  distinction.
                */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/"
                  className="mt-12 inline-block bg-black px-8 py-5 text-center font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-gold hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {t('cta')}
                </a>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

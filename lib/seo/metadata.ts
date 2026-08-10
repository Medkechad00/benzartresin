import type { Metadata } from 'next';
import { LOCALES } from '@/lib/site-config';

/**
 * Build alternates metadata (hreflang + canonical) for a page.
 *
 * Two rules this exists to enforce:
 *  1. The canonical is always derived from the real `locale` param, never a
 *     hardcoded string — a copy-pasted canonical collapses the site onto one URL.
 *  2. Every page self-references in its own hreflang cluster. A missing
 *     self-reference is the most common reason Google ignores a cluster outright.
 *
 * @param locale     The current locale.
 * @param path       Path after /{locale}, e.g. '/tables' or '/blog/some-slug'. '' for home.
 * @param available  Locales that actually serve content for this path. Defaults to
 *                   all locales. Pass a narrower list for content that is not yet
 *                   translated, so we never advertise a /fr/ URL that serves English.
 */
export function buildAlternates(
  locale: string,
  path: string = '',
  available: readonly string[] = LOCALES
): Metadata['alternates'] {
  const normalizedPath = path.startsWith('/') ? path : path ? `/${path}` : '';

  // Guarantee the self-reference even if a caller passes an incomplete list.
  const locales = available.includes(locale) ? available : [...available, locale];

  return {
    canonical: `/${locale}${normalizedPath}`,
    languages: {
      ...Object.fromEntries(locales.map((loc) => [loc, `/${loc}${normalizedPath}`])),
      'x-default': `/en${normalizedPath}`,
    },
  };
}

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

/**
 * Retrieve localized SEO metadata for a page.
 *
 * Reads from the `Metadata` namespace in messages/*.json. Each key maps to a
 * static page (home, tables, blog, ourCraft, inquiry, contact, faq, privacy,
 * terms, notFound). Detail pages override with `detailTitleTemplate` and
 * `detailDescriptionTemplate` which interpolate dynamic content into the
 * localized string.
 *
 * @param templateKey  Key in Metadata namespace, e.g. 'home', 'tablesDetail'.
 * @param locale       The active locale.
 * @param values       Optional interpolation values for dynamic templates.
 */
export async function getLocalizedMetadata(
  templateKey: string,
  locale: string,
  values?: Record<string, string>
): Promise<Metadata> {
  // Dynamic import to keep the bundle lean; messages are loaded per-request on server.
  const messages: Record<string, any> = await import(`@/messages/${locale}.json`);
  const meta = messages.Metadata?.[templateKey];

  if (!meta) {
    return { title: undefined, description: undefined };
  }

  let title = meta.title;
  let description = meta.description;

  // Interpolate {placeholders} with values for detail pages
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      title = title.replace(`{${k}}`, v);
      description = description.replace(`{${k}}`, v);
    }
  }

  return { title, description };
}

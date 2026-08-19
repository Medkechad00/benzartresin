import type { Metadata } from 'next';
import { LOCALES } from '@/lib/site-config';
import { localizedPath } from '@/lib/urls';

/**
 * Build alternates metadata (hreflang + canonical) for a page.
 *
 * Three rules this exists to enforce:
 *  1. The canonical is always derived from the real `locale` param, never a
 *     hardcoded string — a copy-pasted canonical collapses the site onto one URL.
 *  2. Every page self-references in its own hreflang cluster. A missing
 *     self-reference is the most common reason Google ignores a cluster outright.
 *  3. Every URL in the cluster is built in *that alternate's* own locale.
 *
 * Rule 3 is the reason this function takes a resolver rather than a path.
 *
 * It previously accepted one finished path string and reused it for every
 * locale, which is only correct when a route has the same pathname in all three.
 * This site translates both path segments (`/blog` -> `/journal`) and four blog
 * slugs, so the cluster was wrong on every translated route:
 *
 *   on /fr/collection/atlas-noyer-riviere
 *     hreflang="en" -> /en/collection/atlas-noyer-riviere   307
 *     hreflang="ar" -> /ar/collection/atlas-noyer-riviere   307
 *
 * and, because the static pages passed the untranslated path, the canonical
 * pointed away from the page declaring it:
 *
 *   /fr/journal        canonical -> /fr/blog      307
 *   /fr/collection     canonical -> /fr/tables    307
 *   /fr/demande        canonical -> /fr/inquiry   307
 *   /fr/notre-metier   canonical -> /fr/our-craft 307
 *
 * A canonical that names a different URL, which then redirects back to the page
 * that named it, is the worst of both signals.
 *
 * @param locale     The current locale.
 * @param pathFor    Either the *logical* (English) path, e.g. '/blog' or '' for
 *                   home, which is translated per locale internally; or a
 *                   resolver for dynamic routes that must also translate a slug.
 * @param available  Locales that actually serve content for this path. Defaults
 *                   to all locales. Pass a narrower list for content that is not
 *                   yet translated, so we never advertise a /fr/ URL that serves
 *                   English.
 */
export function buildAlternates(
  locale: string,
  pathFor: string | ((loc: string) => string) = '',
  available: readonly string[] = LOCALES
): Metadata['alternates'] {
  const resolve = (loc: string): string => {
    const raw = typeof pathFor === 'function' ? pathFor(loc) : localizedPath(pathFor, loc);
    return raw.startsWith('/') ? raw : raw ? `/${raw}` : '';
  };

  // Guarantee the self-reference even if a caller passes an incomplete list.
  const locales = available.includes(locale) ? available : [...available, locale];

  return {
    canonical: `/${locale}${resolve(locale)}`,
    languages: {
      ...Object.fromEntries(locales.map((loc) => [loc, `/${loc}${resolve(loc)}`])),
      'x-default': `/en${resolve('en')}`,
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

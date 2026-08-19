import type { MetadataRoute } from 'next';
import { getAllTableSlugs } from '@/content/tables/tables';
import { getAuthoredSlugs } from '@/lib/blog';
import { BASE_URL, LOCALES } from '@/lib/site-config';
import { routing } from '@/i18n/routing';
import { localizedPath, tableSlug, blogSlug } from '@/lib/urls';

/**
 * Static routes that exist and are translated in every locale (chrome + page
 * copy). Legal pages are intentionally excluded: they carry no search intent
 * and dilute the crawl budget on an image-heavy site.
 */
const STATIC_PATHS = [
  '',
  '/tables',
  '/our-craft',
  '/faq',
  '/contact',
  '/inquiry',
  '/blog',
] as const;

/**
 * Builds the `alternates.languages` map Next serialises into `xhtml:link
 * rel="alternate" hreflang=...` entries. Declaring the cluster in the sitemap as
 * well as in the page head is belt-and-braces, and it is the only signal Google
 * gets for pages it has not crawled yet.
 *
 * Takes a resolver rather than a path for the same reason `buildAlternates`
 * does. It previously received one finished path and reused it for every locale,
 * so the sitemap advertised 58 French URLs that 307 redirect: `/fr/blog` instead
 * of `/fr/journal`, `/fr/tables` instead of `/fr/collection`, and French slugs
 * under `/en/` and `/ar/`. An hreflang target that redirects is treated as a
 * broken cluster.
 */
function languagesFor(pathFor: (loc: string) => string, locales: readonly string[]) {
  const map: Record<string, string> = Object.fromEntries(
    locales.map((loc) => [loc, `${BASE_URL}/${loc}${pathFor(loc)}`])
  );
  map['x-default'] = `${BASE_URL}/${routing.defaultLocale}${pathFor(routing.defaultLocale)}`;
  return map;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const tableSlugs = getAllTableSlugs();

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      const pathFor = (loc: string) => localizedPath(path, loc);
      entries.push({
        url: `${BASE_URL}/${locale}${pathFor(locale)}`,
        changeFrequency: 'monthly',
        priority: path === '' ? 1 : 0.7,
        alternates: { languages: languagesFor(pathFor, LOCALES) },
      });
    }

    for (const slug of tableSlugs) {
      const pathFor = (loc: string) => `${localizedPath('/tables', loc)}/${tableSlug(slug, loc)}`;
      entries.push({
        url: `${BASE_URL}/${locale}${pathFor(locale)}`,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: languagesFor(pathFor, LOCALES) },
      });
    }
  }

  for (const locale of LOCALES) {
    for (const slug of getAuthoredSlugs(locale)) {
      const pathFor = (loc: string) => `${localizedPath('/blog', loc)}/${blogSlug(slug, loc)}`;
      const translatedIn = LOCALES.filter((loc) => getAuthoredSlugs(loc).includes(slug));
      entries.push({
        url: `${BASE_URL}/${locale}${pathFor(locale)}`,
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: languagesFor(pathFor, translatedIn) },
      });
    }
  }

  return entries;
}

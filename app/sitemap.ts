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
 */
function languagesFor(path: string, locales: readonly string[]) {
  const map: Record<string, string> = Object.fromEntries(
    locales.map((loc) => [loc, `${BASE_URL}/${loc}${path}`])
  );
  map['x-default'] = `${BASE_URL}/${routing.defaultLocale}${path}`;
  return map;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const tableSlugs = getAllTableSlugs();

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      const localized = localizedPath(path, locale);
      entries.push({
        url: `${BASE_URL}/${locale}${localized}`,
        changeFrequency: 'monthly',
        priority: path === '' ? 1 : 0.7,
        alternates: { languages: languagesFor(localized, LOCALES) },
      });
    }

    for (const slug of tableSlugs) {
      const localized = `${localizedPath('/tables', locale)}/${tableSlug(slug, locale)}`;
      entries.push({
        url: `${BASE_URL}/${locale}${localized}`,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: languagesFor(localized, LOCALES) },
      });
    }
  }

  for (const locale of LOCALES) {
    for (const slug of getAuthoredSlugs(locale)) {
      const localized = `${localizedPath('/blog', locale)}/${blogSlug(slug, locale)}`;
      const translatedIn = LOCALES.filter((loc) => getAuthoredSlugs(loc).includes(slug));
      entries.push({
        url: `${BASE_URL}/${locale}${localized}`,
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: languagesFor(localized, translatedIn) },
      });
    }
  }

  return entries;
}

import type { MetadataRoute } from 'next';
import { getAllTableSlugs, getTableBySlug } from '@/content/tables/tables';
import { getAuthoredSlugs, getPost } from '@/lib/blog';
import { BASE_URL, LOCALES } from '@/lib/site-config';
import { routing } from '@/i18n/routing';
import { localizedPath, tableSlug, blogSlug } from '@/lib/urls';

/**
 * Static routes, translated in every locale (chrome + page copy).
 *
 * `/privacy` and `/terms` used to be excluded here on the reasoning that legal
 * pages carry no search intent and dilute crawl budget. That reasoning was half
 * right and had the wrong remedy: they genuinely have no search intent, but
 * neither page sets `robots: noindex`, and both are linked from the footer of
 * all 125 pages — so Google indexes them regardless, and the only thing the
 * omission achieved was a sitemap that disagreed with the index on six URLs.
 * Listing them at the lowest priority states the truth: indexable, unimportant.
 */
const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/tables', priority: 0.9 },
  { path: '/blog', priority: 0.8 },
  { path: '/our-craft', priority: 0.7 },
  { path: '/inquiry', priority: 0.7 },
  { path: '/faq', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
  { path: '/privacy', priority: 0.1 },
  { path: '/terms', priority: 0.1 },
];

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

/**
 * `lastModified` for the pages whose content is not dated.
 *
 * Static pages and the catalogue have no per-page timestamp, so the build date
 * is the only honest answer: it is the moment this copy of the content was
 * published. Using it is meaningfully better than omitting the field — Google
 * uses `lastmod` to prioritise recrawls, and every entry was missing it — and it
 * is better than inventing a per-page date the content does not have.
 */
const BUILD_DATE = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const tableSlugs = getAllTableSlugs();

  for (const locale of LOCALES) {
    for (const { path, priority } of STATIC_PATHS) {
      const pathFor = (loc: string) => localizedPath(path, loc);
      entries.push({
        url: `${BASE_URL}/${locale}${pathFor(locale)}`,
        lastModified: BUILD_DATE,
        changeFrequency: 'monthly',
        priority,
        alternates: { languages: languagesFor(pathFor, LOCALES) },
      });
    }

    for (const slug of tableSlugs) {
      const pathFor = (loc: string) => `${localizedPath('/tables', loc)}/${tableSlug(slug, loc)}`;
      const table = getTableBySlug(slug);
      entries.push({
        url: `${BASE_URL}/${locale}${pathFor(locale)}`,
        lastModified: BUILD_DATE,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: languagesFor(pathFor, LOCALES) },
        /**
         * Image sitemap extension. This is a catalogue of photographs of
         * one-off objects — Google Images is a real acquisition channel for it,
         * and the cover shot is the one that should rank.
         */
        images: table ? [`${BASE_URL}${table.images[0]?.src ?? ''}`].filter(Boolean) : undefined,
      });
    }
  }

  for (const locale of LOCALES) {
    for (const slug of getAuthoredSlugs(locale)) {
      const pathFor = (loc: string) => `${localizedPath('/blog', loc)}/${blogSlug(slug, loc)}`;
      const translatedIn = LOCALES.filter((loc) => getAuthoredSlugs(loc).includes(slug));
      const post = getPost(locale, slug);

      /**
       * Real dates, from the frontmatter that already drives
       * `article:published_time` and `article:modified_time` on the page itself.
       * The data was one call away and the field was simply never populated.
       */
      const fm = post?.frontmatter;
      const lastModified = fm?.updated ?? fm?.date;

      entries.push({
        url: `${BASE_URL}/${locale}${pathFor(locale)}`,
        lastModified: lastModified ? new Date(lastModified) : BUILD_DATE,
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: languagesFor(pathFor, translatedIn) },
        images: fm?.heroImage ? [`${BASE_URL}${fm.heroImage}`] : undefined,
      });
    }
  }

  return entries;
}

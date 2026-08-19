/**
 * Locale-aware URL helpers.
 *
 * next-intl's `pathnames` feature translates static page routes
 * (e.g. `/our-craft` → `/notre-metier` in French), but dynamic content slugs
 * need an explicit per-locale mapping because the file-system slug never
 * changes. These helpers keep that mapping in one place so the form, the
 * schema, and the UI can never drift.
 *
 * Arabic keeps English slugs throughout, per the user's specification.
 */

import { getTableBySlug } from "@/content/tables/tables";
import { getPost } from "@/lib/blog";

/** Returns the URL slug for a table in the given locale. */
export function tableSlug(tableSlug: string, locale: string): string {
  if (locale === "fr") {
    const table = getTableBySlug(tableSlug);
    if (table?.slugFr) return table.slugFr;
  }
  return tableSlug;
}

/** Returns the URL slug for a blog post in the given locale. */
export function blogSlug(englishSlug: string, locale: string): string {
  if (locale === "fr") {
    return FR_BLOG_SLUGS[englishSlug] ?? englishSlug;
  }
  return englishSlug;
}

/** French URL slugs for blog posts. */
const FR_BLOG_SLUGS: Record<string, string> = {
  "can-resin-tables-handle-hospitality-restaurant-use":
    "resines-tables-restauration-hotellerie",
  "commissioning-custom-epoxy-river-table-guide":
    "commander-table-riviere-epoxy-sur-mesure",
  "luxury-river-tables-dining-hospitality-corporate":
    "tables-riviere-luxe-restauration-hotellerie-entreprise",
  "matching-sets-dining-coffee-side-tables":
    "ensembles-tables-salle-cafe-tables-basses",
};

/**
 * Inverse of `blogSlug`: maps a slug as it appears in the URL back to the
 * English slug, which is also the MDX filename on disk.
 *
 * Required because the content files are named with English slugs while French
 * URLs expose translated ones. Without this, `/fr/journal/<translated-slug>`
 * resolves to no file and 404s — every route that reads a slug from `params`
 * must pass it through here before touching the filesystem.
 */
export function englishBlogSlug(urlSlug: string, locale: string): string {
  if (locale === "fr") {
    for (const [english, french] of Object.entries(FR_BLOG_SLUGS)) {
      if (french === urlSlug) return english;
    }
  }
  return urlSlug;
}

/**
 * Inverse of `tableSlug`: maps a slug as it appears in the URL back to the
 * English slug, which is the canonical identifier in the tables data.
 */
export function englishTableSlug(urlSlug: string): string {
  const table = getTableBySlug(urlSlug);
  return table?.slug ?? urlSlug;
}

/**
 * Resolves a localized pathname for static routes.
 *
 * next-intl's `Link` handles this automatically when `pathnames` is configured,
 * but server components, metadata, and schema builders need it explicitly.
 */
export function localizedPath(pathname: string, locale: string): string {
  if (locale === "fr") {
    const frPaths: Record<string, string> = {
      "/tables": "/collection",
      "/our-craft": "/notre-metier",
      "/blog": "/journal",
      "/inquiry": "/demande",
      "/privacy": "/confidentialite",
      "/terms": "/conditions",
    };
    return frPaths[pathname] ?? pathname;
  }
  return pathname;
}


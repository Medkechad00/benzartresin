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

/**
 * Casts a runtime-computed pathname to the type next-intl's `Link` accepts.
 *
 * `createNavigation({ pathnames })` types `href` as a union of the literal keys
 * in the pathnames map. That is genuinely useful for static routes, and
 * genuinely unusable for a path built at runtime from a slug — so every call site
 * on this site had its own `as any` or `as never` escape hatch. There were about
 * forty of them, they were the single largest source of lint errors in the
 * project, and each one silently opted that link out of type checking.
 *
 * One cast, named and explained, is better than forty anonymous ones. `never` is
 * assignable to every type, so this satisfies the union without introducing
 * `any` — the value still has to be a string or a URL object to get in here.
 */
export function toHref<T extends string | Record<string, unknown>>(path: T) {
  return path as never;
}

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

/* ───────────────────────── detail-page href builders ────────────────────────
 *
 * Why these exist.
 *
 * next-intl's `Link` looks an href up as a KEY in the `pathnames` map. Keys are
 * templates — `/blog/[slug]`, `/tables/[slug]` — so a *concrete* path like
 * `/blog/how-to-care-for-a-resin-river-table` matches nothing, falls through
 * untranslated, and is merely prefixed with the locale.
 *
 * The consequence was that eleven call sites emitting `` `/blog/${slug}` `` and
 * `` `/tables/${slug}` `` produced `/fr/blog/...` and `/fr/tables/...` on French
 * pages — every one of which the proxy then 307s to `/fr/journal/...` and
 * `/fr/collection/...`. That is every table card on the homepage and the
 * collection, every article card on the homepage and the journal, all three
 * topic-guide cards and all four related-reading slots on every article: the
 * entire internal link graph of the French site, one redirect deep.
 *
 * Nothing 404'd, which is exactly why it went unnoticed. Redirected internal
 * links still cost a round trip per click and dilute the link signal, and four
 * of them landed on live-but-non-canonical duplicate URLs.
 *
 * Use these instead of interpolating a path by hand. They translate the path
 * segment AND the slug together, which is the pairing that has to stay atomic.
 */

/** Localised href for a blog post detail page. Takes the English slug. */
export function blogHref(englishSlug: string, locale: string): string {
  return `${localizedPath("/blog", locale)}/${blogSlug(englishSlug, locale)}`;
}

/** Localised href for a table detail page. Takes the English slug. */
export function tableHref(englishSlug: string, locale: string): string {
  return `${localizedPath("/tables", locale)}/${tableSlug(englishSlug, locale)}`;
}

/**
 * Localises a bare internal href written by a content author.
 *
 * MDX bodies contain roughly 275 internal links, all authored as untranslated
 * English paths — `/blog/<english-slug>`, `/tables`, `/inquiry` — including in
 * the French files. `MdxContent` handed those straight to next-intl's `Link`,
 * which prefixes but does not translate, so on French articles every one of them
 * pointed at a URL that redirects. Nine of them were worse than that: they
 * resolved 200 on a live URL that self-canonicalises somewhere else, because
 * `/fr/journal/<english-slug>` renders the right article at the wrong address.
 *
 * Rewriting the MDX would mean maintaining translated paths and translated slugs
 * inside 54 content files, and getting it wrong silently. Translating at the
 * render boundary keeps authoring in one vocabulary — the English slug, which is
 * also the filename — and makes the URL a presentation concern, which is what it
 * is.
 *
 * Query strings and hashes are preserved. Anything not recognised is passed
 * through `localizedPath`, so an unknown static path still gets translated if a
 * mapping exists and is otherwise left alone.
 */
export function localizeMdxHref(href: string, locale: string): string {
  const [pathAndQuery, ...hashParts] = href.split("#");
  const hash = hashParts.length ? `#${hashParts.join("#")}` : "";
  const [path, ...queryParts] = pathAndQuery.split("?");
  const query = queryParts.length ? `?${queryParts.join("?")}` : "";

  const blogMatch = path.match(/^\/blog\/([^/]+)\/?$/);
  if (blogMatch) return `${blogHref(blogMatch[1], locale)}${query}${hash}`;

  const tableMatch = path.match(/^\/tables\/([^/]+)\/?$/);
  if (tableMatch) return `${tableHref(englishTableSlug(tableMatch[1]), locale)}${query}${hash}`;

  return `${localizedPath(path, locale)}${query}${hash}`;
}



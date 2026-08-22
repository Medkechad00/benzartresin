import type { Metadata } from 'next';
import { LOCALES, SITE, abs } from '@/lib/site-config';
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

/** OG locale codes. `og:locale` wants language_TERRITORY, not a bare language. */
const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  ar: 'ar_MA',
};

/**
 * The site-wide share card.
 *
 * Deliberately an existing studio photograph rather than a generated card: the
 * catalogue imagery is the product, and a rendered wordmark would say less about
 * a bespoke furniture maker than a picture of the furniture. 1536x1024 is a 3:2
 * crop, comfortably inside every platform's minimum and close enough to 1.91:1
 * that neither Facebook nor LinkedIn letterboxes it.
 */
export const DEFAULT_OG_IMAGE = {
  url: '/images/cta-live-edge-walnut-steel-coffee-table.webp',
  width: 1536,
  height: 1024,
  alt: 'A live-edge walnut and steel coffee table by Benzart Resin',
};

/**
 * Twitter/X card defaults.
 *
 * Nothing declared `twitter` anywhere, so every card was inferred: without an
 * image in `openGraph`, the inference produces `summary` (the small square
 * card), which is the wrong shape for furniture photography. Declaring
 * `summary_large_image` once, site-wide, fixes all 125 URLs.
 */
export const TWITTER: Metadata['twitter'] = {
  card: 'summary_large_image',
  title: undefined,
  description: undefined,
  images: [DEFAULT_OG_IMAGE.url],
};

type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * A COMPLETE Open Graph object, every time.
 *
 * Next resolves `openGraph` by replacement, not by merge: `resolveMetadata`
 * clones the parent metadata and then assigns `newResolvedMetadata.openGraph =
 * resolveOpenGraph(metadata.openGraph)` wholesale. So a page that declares
 * `openGraph: { title, description, type }` does not add three keys to the
 * layout's object — it destroys `siteName`, `locale` and `alternateLocale`.
 *
 * That is exactly what was happening on the four highest-value routes. Routing
 * every page through this helper makes the failure mode impossible: there is no
 * partial object to declare.
 *
 * `og:type` is also handled here. Next emits `og:type` only when `type` is
 * explicitly present — there is no default — so seven routes were shipping no
 * type at all.
 */
export function openGraphFor({
  locale,
  title,
  description,
  path,
  type = 'website',
  images,
  publishedTime,
  modifiedTime,
}: {
  locale: string;
  title: string;
  description: string;
  /** Already-localised path, e.g. '/journal/mon-article'. '' for home. */
  path: string;
  type?: 'website' | 'article';
  images?: OgImage[];
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata['openGraph'] {
  const base = {
    title,
    description,
    siteName: SITE.name,
    url: abs(`/${locale}${path}`),
    locale: OG_LOCALE[locale] ?? 'en_US',
    alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l] ?? l),
    images: images?.length ? images : [DEFAULT_OG_IMAGE],
  };

  if (type === 'article') {
    return { ...base, type: 'article', publishedTime, modifiedTime };
  }

  return { ...base, type: 'website' };
}

/**
 * Trim a string to a search-result-safe length on a word boundary.
 *
 * Google truncates around 155-160 characters for descriptions and roughly 60
 * for titles. Over-long values are not penalised, but they are cut mid-word by
 * the SERP, which wastes the tail of a sentence someone wrote deliberately.
 *
 * The two places this matters are the ones that interpolate authored prose:
 * table detail pages were emitting `table.story` verbatim as the description —
 * 500 to 1000 characters — and half the blog frontmatter descriptions run past
 * 160.
 *
 * Cuts at the last space before the limit and appends an ellipsis, so the
 * snippet ends as a phrase rather than a fragment. Strips newlines first,
 * because a description containing one is invalid.
 */
export function clamp(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;

  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-–—]$/, '')}…`;
}

/** Titles: 60 characters is where Google's desktop SERP starts truncating. */
export const clampTitle = (text: string) => clamp(text, 60);

/** Descriptions: 158 leaves a character of headroom under the ~160 cutoff. */
export const clampDescription = (text: string) => clamp(text, 158);

/**
 * Robots directives for a page that should be indexed.
 *
 * Declared per-page rather than once on the root layout, and that distinction
 * matters: the layout's metadata is also what a 404 inherits. When `index,
 * follow` lived on the layout, every unmatched URL emitted BOTH the 404's
 * `noindex` and the layout's `index, follow` — two contradictory robots tags on
 * one document. Search engines resolve that by taking the most restrictive, so
 * it happened to behave, but "happens to behave" is not a signal worth shipping.
 *
 * `max-image-preview: large` is the part that earns its keep: it is what lets
 * Google show a full-size thumbnail beside the result, which matters
 * disproportionately for a furniture catalogue.
 */
export const INDEXABLE: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

/**
 * Complete metadata for a static page, in one call.
 *
 * Every one of the nine static routes was assembling this by hand, in BOTH its
 * `layout.tsx` and its `page.tsx` — eighteen near-identical `generateMetadata`
 * functions. They had drifted: two set `openGraph`, seven did not, and the seven
 * that did not therefore emitted no `og:type` at all, because Next has no
 * default for it. Centralising the shape is the only way that stays fixed.
 *
 * @param key    Key in the `Metadata` message namespace.
 * @param locale Active locale.
 * @param path   Logical (English) path, e.g. '/tables'. '' for home.
 */
export async function staticPageMetadata(
  key: string,
  locale: string,
  path: string
): Promise<Metadata> {
  const meta = await getLocalizedMetadata(key, locale);
  const title = (meta.title as string) ?? SITE.name;
  const description = (meta.description as string) ?? SITE.description;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: openGraphFor({
      locale,
      title,
      description,
      path: localizedPath(path, locale),
    }),
    robots: INDEXABLE,
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
  const messages = (await import(`@/messages/${locale}.json`)) as {
    Metadata?: Record<string, { title: string; description: string } | undefined>;
  };
  const meta = messages.Metadata?.[templateKey];

  if (!meta) {
    return { title: undefined, description: undefined };
  }

  let title: string = meta.title;
  let description: string = meta.description;

  // Interpolate {placeholders} with values for detail pages
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      title = title.replace(`{${k}}`, v);
      description = description.replace(`{${k}}`, v);
    }
  }

  return { title: clampTitle(title), description: clampDescription(description) };
}

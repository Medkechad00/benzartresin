import { SITE, abs } from '@/lib/site-config';
import { contactImage } from '@/content/section-images';
import { localizedPath, blogSlug, tableSlug } from '@/lib/urls';

/**
 * JSON-LD builders. Rules that apply to every builder here:
 *  - All URLs are absolute (relative URLs are invalid in structured data).
 *  - Every builder takes `locale` so `url`/`offers.url` point at the page the
 *    visitor is actually on, not a hardcoded /en/.
 *  - Unverified facts (phone, geo, socials, logo) come from lib/site-config and
 *    are omitted when null rather than filled with placeholder values.
 */

/** Drops null/undefined/empty-array keys so we never emit hollow properties. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    })
  ) as Partial<T>;
}

const ORGANIZATION_ID = `${abs('/')}#organization`;
const WEBSITE_ID = `${abs('/')}#website`;

/** Entity anchor for the brand. Referenced by @id from the other types. */
export const buildOrganizationSchema = (locale: string) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: abs(`/${locale}`),
    description: SITE.description,
    /**
     * `logo` is what Google's Article guidance expects on `publisher`, and it
     * was being omitted because `SITE.logoPath` was still `null` — while
     * `public/benzart-logo.webp` was sitting on disk and rendering in the navbar
     * and footer of every page. A site that ships a logo and tells search
     * engines it has none is the drift this file exists to prevent.
     */
    logo: SITE.logoPath
      ? {
          '@type': 'ImageObject',
          url: abs(SITE.logoPath),
          width: SITE.logoWidth,
          height: SITE.logoHeight,
        }
      : null,
    image: abs(contactImage.src),
    email: SITE.email,
    telephone: SITE.telephone,
    address: {
      '@type': 'PostalAddress',
      ...SITE.address,
    },
    sameAs: [...SITE.social],
  });

/**
 * The WebSite node.
 *
 * Missing entirely before this. It is the entity that binds the domain itself
 * to the Organization: without it, `publisher: { '@id': '#organization' }` on
 * every article points at a node that is never declared to own the site, and
 * there is no `inLanguage` signal at the site level for a trilingual property.
 *
 * Deliberately NO `potentialAction`/`SearchAction`. The sitelinks search box
 * requires a real on-site search endpoint; this site has none, and declaring a
 * search URL that 404s is worse than declaring nothing.
 */
export const buildWebSiteSchema = (locale: string) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: abs(`/${locale}`),
    name: SITE.name,
    description: SITE.description,
    inLanguage: locale,
    publisher: { '@id': ORGANIZATION_ID },
  });

export const buildLocalBusinessSchema = (locale: string) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${abs('/')}#localbusiness`,
    name: SITE.legalName,
    parentOrganization: { '@id': ORGANIZATION_ID },
    /*
      This is the photograph Google may surface beside the business in a knowledge
      panel or local result, so it should not be a placeholder. It pointed at
      `/images/workshop_wide.png`, which is no longer used anywhere on the site and
      was never a real Benzart photograph. Now the supplied workshop frame — a
      finished round walnut table on a workbench with slabs racked behind it, which
      shows both the product and the operation in one image.

      Imported rather than hardcoded so the schema cannot drift from the asset the
      Contact page actually renders.
    */
    image: abs(contactImage.src),
    description: SITE.description,
    url: abs(`/${locale}/contact`),
    email: SITE.email,
    telephone: SITE.telephone,
    address: {
      '@type': 'PostalAddress',
      ...SITE.address,
    },
    geo: SITE.geo
      ? { '@type': 'GeoCoordinates', ...SITE.geo }
      : null,
    openingHours: SITE.openingHours ? [...SITE.openingHours] : null,
    priceRange: SITE.priceRange,
  });

export type ProductSchemaInput = {
  sku: string;
  name: string;
  images: string[];
  description: string;
  material: string;
  startingPrice?: number;
  /**
   * `made-to-order` → LimitedAvailability (we can craft another in this design)
   * `sold`          → SoldOut (portfolio piece, already delivered)
   */
  availability: 'made-to-order' | 'sold';
};

export const buildProductSchema = (locale: string, product: ProductSchemaInput) => {
  const availability =
    product.availability === 'sold'
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/LimitedAvailability';

  /**
   * The offer URL must be the localised inquiry path.
   *
   * `/fr/inquiry?ref=...` is not a French URL — the proxy 307s it to
   * `/fr/demande?ref=...`. Structured data that names a redirecting URL is a
   * validation warning at best and a dropped `offers` node at worst.
   */
  const offerUrl = abs(`/${locale}${localizedPath('/inquiry', locale)}?ref=${product.sku}`);

  /**
   * `offers` is emitted only when there is a real price.
   *
   * Google requires `price` (or a `priceSpecification`) on an `Offer`. One piece
   * in the catalogue deliberately withholds its price, and emitting a
   * price-less Offer for it produced a hard "Missing field 'price'" error on
   * three URLs. Omitting `offers` on that one piece costs the product rich
   * result for it but keeps the Product node valid, which is the better trade —
   * an invalid node can invalidate the whole page's markup.
   */
  const offers = product.startingPrice
    ? {
        '@type': 'Offer',
        url: offerUrl,
        availability,
        seller: { '@id': ORGANIZATION_ID },
        priceCurrency: 'USD',
        // A "from" price: the final commission varies with slab and size.
        price: product.startingPrice,
      }
    : null;

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': abs(
      `/${locale}${localizedPath('/tables', locale)}/${tableSlug(product.sku, locale)}#product`
    ),
    sku: product.sku,
    name: product.name,
    image: product.images.map((img) => abs(img)),
    description: product.description,
    material: product.material,
    itemCondition: 'https://schema.org/NewCondition',
    brand: { '@type': 'Brand', name: SITE.name },
    url: abs(`/${locale}${localizedPath('/tables', locale)}/${tableSlug(product.sku, locale)}`),
    // Commission funnel, not stock inventory: the offer points at the inquiry
    // form pre-filled with this piece's SKU rather than an add-to-cart URL.
    offers,
  });
};

export const buildArticleSchema = (
  locale: string,
  article: {
    slug: string;
    title: string;
    description: string;
    datePublished: string;
    dateModified?: string;
    image: string;
    keywords?: string[];
  }
) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    image: abs(article.image),
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    inLanguage: locale,
    // Authored collectively by the studio. Deliberately NOT an invented Person.
    author: { '@type': 'Organization', name: SITE.authorName, '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
    /**
     * Must be the localised URL, built with the localised slug.
     *
     * This was `abs(`/${locale}/blog/${article.slug}`)` — the untranslated path
     * AND the English slug. On `/fr/journal/commander-table-riviere-epoxy-sur-mesure`
     * it named `/fr/blog/commissioning-custom-epoxy-river-table-guide`, which
     * takes two redirects to reach the page that declared it. `mainEntityOfPage`
     * naming a different URL than the canonical is a direct contradiction of the
     * page's own signal.
     */
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': abs(
        `/${locale}${localizedPath('/blog', locale)}/${blogSlug(article.slug, locale)}`
      ),
    },
    keywords: article.keywords?.join(', ') ?? null,
  });

/**
 * NOTE: Google restricted FAQ rich results to government and healthcare sites
 * in Aug 2023, so this earns no rich result for a furniture studio. Kept
 * because AI answer engines still parse it for citation — that is its only
 * remaining value here.
 */
export const buildFAQPageSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
});

/*
  buildHowToSchema was removed.

  Google deprecated HowTo rich results in September 2023, so it produced no
  rich result, and it was never rendered by any page — it was dead code. The
  claude-seo skill lists "never recommend HowTo schema (deprecated)" as a hard
  rule, and leaving an unused builder in place invites someone to wire it up.

  The commission process it described is already expressed in three places that
  do work for answer engines: the /inquiry page copy, the FAQPage entries on the
  commissioning guide, and the "## Notes for answer engines" block in llms.txt.
*/

export const buildBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: abs(item.url),
  })),
});

/**
 * ItemList for the two index pages.
 *
 * `/tables` lists 12 products and `/blog` lists 18 articles, and neither carried
 * any list markup — so a crawler arriving at the collection page had to infer
 * that it was a collection. An `ItemList` of URLs is the cheap, unambiguous
 * version of that signal, and it is also what answer engines walk to enumerate a
 * catalogue.
 *
 * `url`-only `ListItem`s rather than nested `Product` nodes: repeating the full
 * product body here would duplicate what each detail page already declares, and
 * Google's own guidance is to use the summary form and let the crawler follow.
 */
export const buildItemListSchema = (
  name: string,
  items: { name: string; url: string }[]
) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    url: abs(item.url),
  })),
});

import { SITE, abs } from '@/lib/site-config';

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
    logo: SITE.logoPath ? abs(SITE.logoPath) : null,
    email: SITE.email,
    telephone: SITE.telephone,
    address: {
      '@type': 'PostalAddress',
      ...SITE.address,
    },
    sameAs: [...SITE.social],
  });

export const buildLocalBusinessSchema = (locale: string) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${abs('/')}#localbusiness`,
    name: SITE.legalName,
    parentOrganization: { '@id': ORGANIZATION_ID },
    image: abs('/images/workshop_wide.png'),
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

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: product.sku,
    name: product.name,
    image: product.images.map((img) => abs(img)),
    description: product.description,
    material: product.material,
    itemCondition: 'https://schema.org/NewCondition',
    brand: { '@type': 'Brand', name: SITE.name },
    // Commission funnel, not stock inventory: the offer points at the inquiry
    // form pre-filled with this piece's SKU rather than an add-to-cart URL.
    offers: compact({
      '@type': 'Offer',
      url: abs(`/${locale}/inquiry?ref=${product.sku}`),
      availability,
      seller: { '@id': ORGANIZATION_ID },
      // Only emitted when a real starting price exists — never `price: 0`.
      // This is a "from" price: the final commission varies with slab and size.
      priceCurrency: product.startingPrice ? 'USD' : null,
      price: product.startingPrice ?? null,
    }),
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
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': abs(`/${locale}/blog/${article.slug}`),
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

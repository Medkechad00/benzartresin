/**
 * Single source of truth for business facts.
 *
 * Both the visible pages and the JSON-LD builders read from here, so schema can
 * never drift from what a visitor actually sees — NAP consistency is the whole
 * point of LocalBusiness markup.
 *
 * Fields typed `| null` are NOT YET VERIFIED. They are omitted from structured
 * data entirely rather than filled with plausible-looking placeholders, because
 * a wrong phone number or an invented social profile in schema is worse than an
 * absent one. Fill them in and they light up automatically.
 */

/**
 * The canonical origin. Everything derives from this: `metadataBase`, every
 * hreflang alternate, the sitemap, robots, and llms.txt.
 *
 * Overridable via `NEXT_PUBLIC_SITE_URL` so a preview/staging deploy emits its
 * own canonicals instead of pointing at production. Hardcoding the origin is
 * how a staging build ends up telling Google that production is a duplicate.
 *
 * ⚠️ VERIFY BEFORE LAUNCH (checked Aug 2026):
 *   - benzartresin.com has NO DNS records. Nothing resolves.
 *   - benzart.com is parked on HugeDomains and listed for sale. Not ours.
 * Until the real domain resolves and serves this app, Search Console
 * verification and any canonical/hreflang/sitemap URL built from this value
 * will point somewhere that is not the site.
 */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://benzartresin.com'
).replace(/\/+$/, '');

/**
 * GA4 measurement ID. Empty string disables the tag entirely, which is what we
 * want on preview deploys so staging traffic never pollutes production data.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-G78WJFE4P2';

export const SITE = {
  /**
   * Full brand name. Used verbatim in every page title, Organization schema,
   * and OG `siteName`, so the short form "Benzart" must not reappear here —
   * a split brand name across locales weakens the entity match in search.
   */
  name: 'Benzart Resin',
  legalName: 'Benzart Resin Atelier',
  /** Used as the Article author/publisher — the studio, not an invented person. */
  authorName: 'Benzart Resin Atelier',
  description:
    'Benzart Resin builds one-off dining tables in solid wood and epoxy, cut to your room and made to order in Marrakech.',

  /** TODO: add a real logo asset to /public and set this to its path. */
  logoPath: null as string | null,

  /** Confirmed by the studio. */
  email: 'benzartdecor@gmail.com',
  /**
   * No separate press inbox yet — press enquiries route to the main address so
   * the site never publishes a mailbox nobody reads.
   */
  pressEmail: 'benzartdecor@gmail.com',

  /** Confirmed by the studio. E.164 format, as schema.org requires. */
  telephone: '+212660203060',
  /** Human-readable form for the visible page. Same number, formatted. */
  telephoneDisplay: '+212 660 203 060',

  address: {
    /**
     * Confirmed by the studio (Aug 2026). Previously listed as "Sidi Ghanem",
     * which was wrong.
     *
     * NOTE FOR THE STUDIO: please confirm the spelling "Dourika". The road out
     * of Marrakech toward the Ourika valley is normally written "Route de
     * l'Ourika". Since this string is emitted into LocalBusiness schema and is
     * what Google matches against Maps and any Business Profile, a misspelling
     * here weakens the local-entity match.
     */
    streetAddress: 'Tasseltant, Route Dourika KM 10',
    addressLocality: 'Marrakech',
    addressCountry: 'MA',
  },

  /** TODO: set once the studio's coordinates are confirmed. */
  geo: null as { latitude: number; longitude: number } | null,

  /** By-appointment only, so no fixed openingHours are claimed. */
  openingHours: null as string[] | null,

  priceRange: '$$$$',

  /**
   * Confirmed profile URLs. `sameAs` is an identity claim, so these must be
   * accounts the studio actually controls — never guessed handles.
   */
  social: [
    'https://www.instagram.com/benzart.resin/',
    'https://www.pinterest.com/benzartdecor/',
  ] as string[],

  /** Labelled links for the visible UI. Kept in sync with `social` above. */
  socialLinks: [
    { name: 'Instagram', url: 'https://www.instagram.com/benzart.resin/' },
    { name: 'Pinterest', url: 'https://www.pinterest.com/benzartdecor/' },
  ],
} as const;

export const LOCALES = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const abs = (path: string) =>
  `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

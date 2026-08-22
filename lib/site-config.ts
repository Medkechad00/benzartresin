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
 *
 * `||` rather than `??` on purpose. With `??` the fallback only fired on
 * `undefined`, so setting `NEXT_PUBLIC_GA_ID=""` — the documented way to turn
 * the tag off — was ignored and the hardcoded production ID shipped anyway. That
 * meant every preview branch, every CI Lighthouse run and every `next dev`
 * session reported into live analytics. An empty string is now honoured.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-G78WJFE4P2';

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

  /**
   * The brand wordmark, as shipped in `public/`.
   *
   * This was `null` with a "TODO: add a real logo asset" note, while
   * `benzart-logo.webp` was already on disk and rendering in the navbar and
   * footer of every page (see components/layout/Logo.tsx). The consequence was
   * that `Organization.logo` was omitted from structured data on all 125 pages,
   * and `BlogPosting.publisher` therefore resolved to a publisher with no logo —
   * which is a field Google's Article guidance explicitly asks for.
   *
   * Dimensions are the intrinsic size of the file and are declared so the
   * `ImageObject` node is complete.
   */
  logoPath: '/benzart-logo.webp' as string | null,
  logoWidth: 4039,
  logoHeight: 1447,

  /**
   * Brand email shown on the site and in structured data.
   *
   * Inbound mail (inquiries + newsletter) is delivered to `pressEmail` /
   * CONTACT_EMAIL, which is a separate Gmail account. The two addresses must
   * not be conflated: the brand email is for display, the receiving inbox is
   * where the studio actually reads submissions.
   */
  email: 'benzartdecor@gmail.com',
  /**
   * No separate press inbox yet — press enquiries route to the main address so
   * the site never publishes a mailbox nobody reads.
   */
  pressEmail: 'benzartdecor@gmail.com',

  /** Confirmed by the studio. */
  telephone: '+212660203060',
  /** Human-readable form for the visible page. Same number, formatted. */
  telephoneDisplay: '+212 660 203 060',

  address: {
    /**
     * Confirmed by the studio (Aug 2026). The road out of Marrakech toward the
     * Ourika valley is "Route de l'Ourika".
     */
    streetAddress: 'Tasseltant, Ourika Road KM 10',
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

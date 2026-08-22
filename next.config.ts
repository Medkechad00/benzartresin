import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const LOCALES = ['en', 'fr', 'ar'];

/**
 * French pathnames, mirrored from `i18n/routing.ts`.
 *
 * Redirect destinations must be written in the *target* locale's own pathname,
 * because `next.config.redirects()` runs BEFORE the next-intl proxy. A rule that
 * sends `/fr/about` to `/fr/our-craft` is not wrong so much as unfinished: the
 * proxy then 307s that to `/fr/notre-metier`, turning one 301 into a 301→307
 * chain. Chains leak link equity and cost a round trip, and they are entirely
 * avoidable by naming the final URL here.
 */
const FR_PATHNAMES: Record<string, string> = {
  '/tables': '/collection',
  '/our-craft': '/notre-metier',
  '/blog': '/journal',
  '/inquiry': '/demande',
  '/privacy': '/confidentialite',
  '/terms': '/conditions',
};

const localised = (path: string, locale: string) =>
  locale === 'fr' ? FR_PATHNAMES[path] ?? path : path;

/**
 * /about and /craftsmanship were merged into /our-craft.
 *
 * 301 rather than 302: the merge is permanent, and a permanent redirect is what
 * passes the old URLs' link equity to the new one. Both the locale-prefixed and
 * unprefixed forms are covered — the unprefixed ones would otherwise hit the
 * next-intl proxy first, get rewritten to a locale path, and then 404.
 */
const MERGED_PATHS = ['/about', '/craftsmanship'];

/**
 * Table slugs that were renamed for slug-system consistency. The catalogue is
 * still young, but these URLs may already have been shared, indexed, or linked
 * by price aggregators, so the old form gets a permanent redirect rather than a 404.
 *
 * English slugs are shared by `en` and `ar`; French uses its own `slugFr` values,
 * which did not change — so the French rules are deliberately sourced from the
 * *English* old slug under the *French* pathname, which is the only shape a
 * French visitor could ever have landed on, and they resolve straight to the
 * canonical `slugFr` destination rather than to an English-slug duplicate.
 */
const RENAMED_SLUGS = [
  [
    'walnut-berber-motif-resin-coffee-table',
    'walnut-berber-resin-coffee-table',
    'table-basse-noyer-resine-motif-berbere',
  ],
  [
    'marble-effect-resin-oval-dining-table',
    'resin-oval-dining-table',
    'table-repas-ovale-resine-effet-marbre',
  ],
  [
    'walnut-magenta-resin-coffee-table-set',
    'walnut-resin-coffee-table-set',
    'ensemble-tables-noyer-resine-magenta',
  ],
] as const;

/**
 * Response headers.
 *
 * Next ships none of these by default, so before this block the site answered
 * every request with no CSP, no `nosniff`, no framing policy and no referrer
 * policy — and with `X-Powered-By: Next.js` advertising the stack.
 *
 * The CSP is the awkward one on this app and is worth explaining, because the
 * obvious strict version cannot work here:
 *
 *  - `script-src` must allow `'unsafe-inline'`. Two inline scripts are load
 *    bearing: the JSON-LD blocks in `components/seo/JsonLd.tsx`, and the gtag
 *    bootstrap injected by `@next/third-parties`. A nonce would be the correct
 *    answer, but nonces require a dynamic response — reading headers to mint one
 *    opts every route out of static rendering, which would undo the 125
 *    prerendered pages that `setRequestLocale` exists to produce. Trading the
 *    site's entire static output for a marginally stronger script policy is the
 *    wrong trade on a brochure site with no authenticated surface and no
 *    user-generated HTML.
 *  - `'unsafe-eval'` is NOT granted. Nothing here needs it.
 *  - `frame-src` allows Vimeo only; the homepage embeds one player.
 *  - `img-src` allows `data:` for the inline WebP blur placeholders, and
 *    `https:` because the Next image optimiser rewrites to same-origin `/_next/
 *    image` but GA can serve pixels.
 *  - `object-src 'none'` and `base-uri 'self'` close the two classic
 *    injection escalations that cost nothing to forbid.
 *  - `frame-ancestors 'none'` is the modern half of the X-Frame-Options pair;
 *    both are sent because older scanners still look for the legacy header.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://player.vimeo.com",
  "media-src 'self' https://player.vimeo.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  /**
   * Two years, subdomains included, preload-eligible. Vercel sets HSTS on
   * TLS domains anyway, but declaring it here keeps the policy in version
   * control and makes it survive a platform move.
   */
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  /**
   * Deny the sensor and payment APIs outright. None are used, and an empty
   * allowlist is the difference between "we do not use the camera" and "no
   * injected script can use the camera either".
   */
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'interest-cohort=()',
    ].join(', '),
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  /**
   * `same-origin-allow-popups` rather than `same-origin`: the footer and navbar
   * open Instagram and Pinterest with `target="_blank"`, and the stricter value
   * severs `window.opener` for those in a way some browsers surface as a
   * blocked popup. `rel="noopener"` is already on every one of them, so the
   * isolation the strict value buys is already in place.
   */
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
];

/** One year, immutable. Correct only for content-addressed or never-edited files. */
const IMMUTABLE = 'public, max-age=31536000, immutable';

const nextConfig: NextConfig = {
  /**
   * `X-Powered-By: Next.js` on every response is a free byte tax and free
   * reconnaissance. Nothing depends on it.
   */
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],

    /**
     * The widest rendered image on the site is 1280px (`max-w-7xl` minus
     * padding) and the largest source file is 1672px wide. The default device
     * list ends `2048, 3840`, so every `srcset` advertised two buckets that no
     * source can fill — they only widen the markup and multiply optimiser cache
     * entries. This list stops where the assets do.
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],

    /**
     * 75 is Next's default and stays the default. 60 is added so the
     * below-the-fold catalogue grid can ask for a cheaper encode: 59 product
     * photographs at ~400KB average is the single largest payload on the site,
     * and `qualities` must enumerate every value any `quality` prop uses or the
     * request is rejected.
     */
    qualities: [60, 75],

    /**
     * The default is 4 hours. Every source image here is a build-time asset with
     * a stable filename, so re-encoding them across 6 widths × 2 formats every
     * four hours is pure waste. A year is the honest TTL; a changed picture gets
     * a changed filename.
     */
    minimumCacheTTL: 31536000,
  },

  experimental: {
    /**
     * Required for `app/global-not-found.tsx`.
     *
     * Without it, every 404 on this site shipped a 51-byte empty body: no
     * `<main>`, no links, no `lang` or `dir` on `<html>`, with the copy present
     * only in the RSC payload for the client to render after hydration. That
     * affected unmatched URLs AND in-route `notFound()` calls alike, so the
     * `[locale]/not-found.tsx` page never server-rendered in any case.
     *
     * The cause is documented in `next/dist/docs/.../not-found.md`: a root layout
     * defined with a top-level dynamic segment — here `app/[locale]/layout.tsx` —
     * is one of the two cases where a 404 cannot be composed from `layout.js`
     * plus `not-found.js`, because there is no resolved segment to render the
     * layout with. `global-not-found` is the documented escape hatch: it is
     * handled at the routing level and returns a complete HTML document itself.
     */
    globalNotFound: true,

    /**
     * `@phosphor-icons/react` is the most expensive import in the project and is
     * NOT in Next's built-in optimise list (that list covers lucide, heroicons,
     * tabler, MUI and react-icons, but no Phosphor entry).
     *
     * Its root barrel — `dist/index.es.js` — is 4,562 lines that statically
     * import ~2,270 CSR icon modules AND re-export the SSR build via
     * `import * as`, the single hardest shape for a bundler to shake. Eight files
     * import from that barrel for eight icons total, and one of them is
     * `components/layout/Footer.tsx`, which is in `PageLayout` and therefore in
     * every route's module graph.
     *
     * This rewrites each named import to its own per-icon path at compile time.
     * `motion` is listed for the same reason at smaller scale.
     */
    optimizePackageImports: ['@phosphor-icons/react', 'motion'],
  },

  async headers() {
    return [
      {
        // Everything, including HTML documents and the API routes.
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        /**
         * Fonts are `public/` files with no content hash in the name, so Next
         * cannot fingerprint them and serves them with a conservative default.
         * Six faces on the critical path re-validating on every navigation is
         * the kind of cost that never shows up in a bundle report.
         */
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
      },
      {
        // Same reasoning: unhashed, immutable, and on every page (nav + footer).
        source: '/benzart-logo.webp',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
      },
      {
        source: '/tables/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
      },
      {
        /**
         * The API must never be cached by a shared cache — these are POST
         * endpoints that send mail, and a cached 200 would be a silent
         * lead-loss bug.
         */
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },

  async redirects() {
    const localisedMerges = LOCALES.flatMap((locale) =>
      MERGED_PATHS.map((path) => ({
        source: `/${locale}${path}`,
        destination: `/${locale}${localised('/our-craft', locale)}`,
        permanent: true,
      }))
    );

    const unprefixed = MERGED_PATHS.map((path) => ({
      source: path,
      destination: '/our-craft',
      permanent: true,
    }));

    const slugRedirects = LOCALES.flatMap((locale) =>
      RENAMED_SLUGS.map(([from, toEn, toFr]) => ({
        source: `/${locale}${localised('/tables', locale)}/${from}`,
        destination: `/${locale}${localised('/tables', locale)}/${
          locale === 'fr' ? toFr : toEn
        }`,
        permanent: true,
      }))
    );

    /**
     * The old English slugs under the *English* pathname, for `fr`.
     *
     * Kept because `/fr/tables/<old-english-slug>` was a reachable shape before
     * the rename — the pathname translation and the slug rename did not ship
     * together — and it is one rule to land it on the canonical French URL in a
     * single hop instead of chaining through the proxy into a duplicate.
     */
    const frLegacyEnglishPath = RENAMED_SLUGS.map(([from, , toFr]) => ({
      source: `/fr/tables/${from}`,
      destination: `/fr${FR_PATHNAMES['/tables']}/${toFr}`,
      permanent: true,
    }));

    return [...localisedMerges, ...unprefixed, ...slugRedirects, ...frLegacyEnglishPath];
  },
};

export default withNextIntl(nextConfig);

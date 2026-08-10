import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const LOCALES = ['en', 'fr', 'ar'];

/**
 * /about and /craftsmanship were merged into /our-craft.
 *
 * 301 rather than 302: the merge is permanent, and a permanent redirect is what
 * passes the old URLs' link equity to the new one. Both the locale-prefixed and
 * unprefixed forms are covered — the unprefixed ones would otherwise hit the
 * next-intl proxy first, get rewritten to a locale path, and then 404.
 */
const MERGED_PATHS = ['/about', '/craftsmanship'];

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    const localised = LOCALES.flatMap((locale) =>
      MERGED_PATHS.map((path) => ({
        source: `/${locale}${path}`,
        destination: `/${locale}/our-craft`,
        permanent: true,
      }))
    );

    const unprefixed = MERGED_PATHS.map((path) => ({
      source: path,
      destination: '/our-craft',
      permanent: true,
    }));

    return [...localised, ...unprefixed];
  },
};

export default withNextIntl(nextConfig);

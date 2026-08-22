import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'en',
  /**
   * Explicit cookie attributes.
   *
   * next-intl's defaults are `{ name: 'NEXT_LOCALE', sameSite: 'lax' }` and
   * nothing else, so the cookie shipped without `Secure` and as a session
   * cookie. The practical risk is nil — the value is a language preference with
   * no authentication or authorization meaning — but "the one cookie this site
   * sets has no Secure flag" is a finding on every scanner report, and defending
   * it costs more than fixing it. A one-year `maxAge` also makes it a persistent
   * preference, which is the actual intent: a returning visitor should not have
   * to re-negotiate their language.
   *
   * `httpOnly` is deliberately absent because next-intl's `CookieAttributes`
   * type does not accept it — the library needs the cookie readable from the
   * client to sync locale changes made through `Link`. Nothing in this codebase
   * reads `document.cookie`, so that is a library constraint rather than a
   * choice, and it carries no risk for a value that is already visible in the
   * URL path.
   */
  localeCookie: {
    name: 'NEXT_LOCALE',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  },
  pathnames: {
    '/': '/',
    '/tables': {
      en: '/tables',
      fr: '/collection',
      ar: '/tables',
    },
    '/tables/[slug]': {
      en: '/tables/[slug]',
      fr: '/collection/[slug]',
      ar: '/tables/[slug]',
    },
    '/blog': {
      en: '/blog',
      fr: '/journal',
      ar: '/blog',
    },
    '/blog/[slug]': {
      en: '/blog/[slug]',
      fr: '/journal/[slug]',
      ar: '/blog/[slug]',
    },
    '/our-craft': {
      en: '/our-craft',
      fr: '/notre-metier',
      ar: '/our-craft',
    },
    '/inquiry': {
      en: '/inquiry',
      fr: '/demande',
      ar: '/inquiry',
    },
    '/contact': {
      en: '/contact',
      fr: '/contact',
      ar: '/contact',
    },
    '/faq': {
      en: '/faq',
      fr: '/faq',
      ar: '/faq',
    },
    '/privacy': {
      en: '/privacy',
      fr: '/confidentialite',
      ar: '/privacy',
    },
    '/terms': {
      en: '/terms',
      fr: '/conditions',
      ar: '/terms',
    },
  }
});
 
// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);

import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'en',
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

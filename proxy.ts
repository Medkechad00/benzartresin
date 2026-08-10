import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Locale negotiation and redirects.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`; the old name
 * still works but logs a deprecation warning on every build. next-intl's
 * `createMiddleware` returns a plain request handler, so it satisfies the
 * proxy contract unchanged — only the filename and export name move.
 *
 * Handles: unprefixed paths (`/tables` → `/en/tables`), Accept-Language
 * negotiation, and the NEXT_LOCALE cookie.
 */
const handler = createMiddleware(routing);

export default handler;

export const config = {
  // Internationalised pathnames only.
  // Excludes /api (not a user-facing SEO surface and must not be locale-prefixed),
  // /_next, /_vercel, and anything with a file extension (static assets,
  // sitemap.xml, robots.txt, favicon.ico).
  matcher: ['/', '/(en|fr|ar)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};

# Benzart Resin — Website Architecture

Technical stack and the real route/component tree. Kept in sync with the code
deliberately: the previous version of this file documented `app/page.tsx`,
`app/about/`, `app/craftsmanship/` and a non-internationalised tree, none of which
exist. Documentation that describes routes you cannot visit is worse than none.

## Tech stack

- **Framework:** Next.js 16.2.11 (App Router, Turbopack)
- **UI:** React 19.2.4
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4, single stylesheet at `app/globals.css`
- **i18n:** `next-intl` 4.13 — three locales (`en`, `fr`, `ar`) with translated
  pathnames and translated content slugs
- **Animation:** `motion/react` v12
- **Icons:** `@phosphor-icons/react`
- **Content:** MDX via `next-mdx-remote/rsc`, frontmatter via `gray-matter`
- **Mail:** Node route handlers + `nodemailer`
- **Analytics:** GA4 via `@next/third-parties`

## Routing

`proxy.ts` (Next 16's rename of `middleware.ts`) runs `next-intl`'s handler:
locale negotiation, the `NEXT_LOCALE` cookie, and rewriting translated pathnames
onto internal routes.

Every route is locale-prefixed. French translates both path segments and four
blog slugs; Arabic reuses the English forms.

| Logical route | `en` / `ar` | `fr` |
|---|---|---|
| home | `/[locale]` | `/fr` |
| collection | `/tables` | `/collection` |
| piece detail | `/tables/[slug]` | `/collection/[slugFr]` |
| journal | `/blog` | `/journal` |
| article | `/blog/[slug]` | `/journal/[slugFr]` |
| our craft | `/our-craft` | `/notre-metier` |
| commission | `/inquiry` | `/demande` |
| contact | `/contact` | `/contact` |
| faq | `/faq` | `/faq` |
| privacy | `/privacy` | `/confidentialite` |
| terms | `/terms` | `/conditions` |

**Never build an internal href by hand.** `next-intl`'s `Link` translates an
href only when it matches a *key* in the `pathnames` map, so a concrete
`/blog/some-slug` is passed through untranslated and merely prefixed — which is
how every internal link on the French site ended up costing a redirect. Use the
helpers in `lib/urls.ts`: `blogHref`, `tableHref`, `localizedPath`,
`localizeMdxHref`, and `toHref` for the type cast.

### 404

One surface: `app/global-not-found.tsx`, enabled by
`experimental.globalNotFound`. It renders a complete HTML document at the routing
level and reads its locale from the `NEXT_LOCALE` cookie.

There is deliberately no `app/[locale]/not-found.tsx` and no catch-all route.
Both existed and produced an **empty server-rendered body** — the whole page lived
only in the RSC payload — because a root layout defined with a top-level dynamic
segment (`app/[locale]/layout.tsx`) cannot compose a 404 from `layout.js` plus
`not-found.js`. This is documented in Next's own `not-found.md`. Converting the
page to a server component does not help.

## Generated output

125 prerendered pages: 3 locales × (9 static + 12 pieces + 18 articles), plus
metadata routes. Static rendering depends on `setRequestLocale(locale)` being
called in every layout and leaf — without it `next-intl` reads the request and
every route becomes dynamic.

## SEO

- `lib/seo/metadata.ts` — `staticPageMetadata` builds title, description,
  canonical, the hreflang cluster and a **complete** Open Graph object together.
  `openGraph` is replaced rather than merged by Next, so a partial object silently
  destroys the parent's `siteName`/`locale`; `openGraphFor` exists so that cannot
  happen. `clampTitle`/`clampDescription` hold SERP lengths.
- `lib/seo/schema.ts` — Organization, WebSite, LocalBusiness, Product,
  BlogPosting, BreadcrumbList, ItemList, FAQPage. All URLs absolute and localised.
- `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`.
- The root layout carries **site-wide defaults only**. Page-specific metadata
  belongs in the page, because the layout's metadata is also what a 404 inherits.

## Layout & components

`app/[locale]/layout.tsx` provides `<html>`, the skip link, `<main id="main-content">`,
font preloads, `MotionProvider`, `NextIntlClientProvider` and the Organization +
WebSite JSON-LD. `components/layout/PageLayout.tsx` wraps `Navbar` + `Footer` for
the simple pages; the blog and piece-detail routes compose those directly.

- **`layout/`** — `Navbar` (the `<header>` landmark, mobile menu with focus
  management and `inert` siblings), `Footer`, `PageLayout`, `LegalPage`, `Logo`
- **`sections/`** — `HeroSection`, `FeaturedTablesSection`,
  `MadeForYourSpaceSection`, `InquiryCTASection`, `TestimonialsSection`,
  `BlogPreviewSection`, `BlogTopicGuides`, `BlogAllArticles`
- **`blog/`** — `MdxContent`, `ArticleToc`, `ReadingProgress`, `BlogInternalLinks`
- **`inquiry/`** — `InquirySuccess`
- **`seo/`** — `JsonLd` (escapes `<` against `</script>` breakout), `ProductOpenGraph`
- **`ui/`** — `AnimatedSeparator`, `LanguageSwitcher`
- **`providers/`** — `MotionProvider` (`reducedMotion="user"`)

## API

`app/api/inquiry` and `app/api/subscribe`. Shared plumbing in `lib/mail.ts`:
SMTP config, transport, header sanitising, HTML escaping, an in-memory rate
limiter, and the request guards (`rejectUnsafeRequest`, `readJsonBody`, `str`).

Both routes require `application/json` and a same-origin `Origin`, bound every
field's length, coerce types before use, and log only redacted contact details on
a failed send.

## Accessibility

- Skip link and a focusable `<main id="main-content">`
- One `<h1>` per page and no skipped heading levels (verified in CI)
- `@media (prefers-reduced-motion: reduce)` in `globals.css` covers CSS-driven
  motion; `MotionProvider` covers Motion components; the Vimeo embed has an
  explicit pause control
- `--color-gold-ink` is the gold that passes contrast as *text* on light
  surfaces; `--color-gold` remains the background gold (black-on-gold is 10:1)
- RTL throughout via logical properties (`ps`/`pe`, `ms`/`me`, `start`/`end`)

## Verification

```
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run build
npm run verify        # asserts the emitted HTML + crawls every internal link
npm run start & npm run verify:live   # headers, redirects, status codes, API guards
```

`scripts/verify-build-output.mjs` reads the prerendered HTML and fails on a
missing canonical, skip link, `<main>`, `<header>`, `og:image`, `og:type`,
`twitter:card`, a wrong `h1` count or a heading-level skip.
`scripts/verify-links.mjs` resolves all ~2,800 internal links against the routes
the build actually produced and fails on anything broken **or redirecting**.

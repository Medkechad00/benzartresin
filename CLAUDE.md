# Benzart - Website Architecture

This document outlines the technical stack and the exact component tree structure of the Benzart website.

## Tech Stack
- **Framework:** Next.js 16.2.11 (App Router)
- **UI/React:** React 19.2.4
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** `motion/react` v12.42 (Framer Motion)
- **Icons:** `@phosphor-icons/react`
- **Backend/Forms:** Node.js API Routes + `nodemailer` (for inquiry submissions)

## Website Structure (Pages & Components)

### Global Layout (`app/layout.tsx`)
Applies to all pages across the site.
- `<Navbar />` (from `components/layout/Navbar.tsx`)
- `{children}` (Page Content)
- `<Footer />` (from `components/layout/Footer.tsx`)

### 1. Homepage (`app/page.tsx`)
The homepage is constructed from modular sections separated by animated dividers.
- `<HeroSection />`
- `<AnimatedSeparator />`
- `<FeaturedTablesSection />`
- `<AnimatedSeparator />`
- `<CraftsmanshipSection />`
- `<AnimatedSeparator />`
- `<InquiryCTASection />`
- `<AnimatedSeparator />`
- `<TestimonialsSection />` (Includes anchor `id="testimonials"` for footer link)
- `<AnimatedSeparator />`
- `<BlogPreviewSection />`

### 2. Collection (`app/tables/page.tsx`)
- Displays the full gallery of bespoke dining tables and available commissions.

### 3. Atelier (`app/craftsmanship/page.tsx`)
- Details the woodworking process, materials, and resin techniques used in the workshop.

### 4. Studio (`app/about/page.tsx`)
- The story behind the brand, the artisans, and the physical studio location.

### 5. Journal (`app/blog/page.tsx` & `app/blog/[slug]/page.tsx`)
- **Blog Index:** Displays all articles.
- **Dynamic Article (`[slug]`):** Renders individual blog posts dynamically.

### 6. Commission (`app/inquiry/page.tsx`)
- Uses `<PageLayout>` wrapper.
- Contains a client-side, multi-step interactive form to collect commission details.
- Submits form data to the backend via POST to `app/api/inquiry/route.ts`.

### 7. Contact (`app/contact/page.tsx`)
- Studio contact information, email addresses, and press inquiries.

### 8. FAQ (`app/faq/page.tsx`)
- Frequently asked questions regarding pricing, shipping, and custom orders.

### 9. Legal Pages
- **Privacy Policy:** `app/privacy/page.tsx`
- **Terms of Service:** `app/terms/page.tsx`

## Component Library (`components/`)
- **`layout/`**: `Navbar.tsx`, `Footer.tsx`, `PageLayout.tsx`
- **`sections/`**: 
  - `HeroSection.tsx`, `FeaturedTablesSection.tsx`, `CraftsmanshipSection.tsx`
  - `InquiryCTASection.tsx`, `TestimonialsSection.tsx`, `BlogPreviewSection.tsx`
- **`ui/`**: 
  - `AnimatedSeparator.tsx`

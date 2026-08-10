# Benzart - Bespoke Handcrafted Furniture

Benzart is a premium, high-end e-commerce and portfolio website for a bespoke furniture atelier specializing in solid wood and epoxy resin dining tables. The site is designed with a strictly editorial, architectural aesthetic, featuring fluid micro-animations, cinematic scroll parallax, and a luxurious minimalist layout.

## 🛠 Tech Stack & Languages

The project is built using modern web development standards with a focus on performance, SEO, and high-end animations.

- **Framework:** [Next.js](https://nextjs.org/) (App Router) v16.2.11
- **UI Library:** [React](https://react.dev/) v19.2.4
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Animations:** [Motion](https://motion.dev/) (Framer Motion) v12.42
- **Icons:** Phosphor Icons (`@phosphor-icons/react`)
- **Backend/API:** Node.js with `nodemailer` (for processing commission inquiries)
- **Utilities:** `clsx` and `tailwind-merge` (for dynamic class name merging)

## 📂 Project Structure

The codebase follows a modular and scalable structure inside the `/site` directory:

```text
site/
├── app/                      # Next.js App Router (Pages & Routing)
│   ├── api/                  # Backend API Routes (e.g., /api/inquiry for form submissions)
│   ├── about/                # Studio & About Us page
│   ├── blog/                 # Journal & Articles (Dynamic routing with [slug])
│   ├── contact/              # Contact Information page
│   ├── craftsmanship/        # Atelier & Process page
│   ├── faq/                  # Frequently Asked Questions
│   ├── inquiry/              # Multi-step Custom Commission form
│   ├── tables/               # Collection & Gallery page
│   ├── layout.tsx            # Root HTML layout and metadata
│   └── page.tsx              # Homepage assembling all sections
│
├── components/               # Reusable React Components
│   ├── layout/               # Global layout components (Navbar, Footer, PageLayout)
│   ├── sections/             # Major page sections (HeroSection, FeaturedTablesSection, etc.)
│   └── ui/                   # Micro-components (AnimatedSeparator, Buttons, etc.)
│
├── lib/                      # Utility Functions
│   └── utils.ts              # Tailwind class merging utility (cn)
│
├── public/                   # Static Assets
│   └── images/               # High-resolution product and atelier photography
│
├── package.json              # Project dependencies and scripts
├── tailwind.config.ts        # Tailwind styling tokens (if applicable, using v4)
└── tsconfig.json             # TypeScript configuration
```

## ✨ Key Features & Design Philosophy

1. **Aesthetic:** "Expensive UI." Flush-left typography, asymmetrical balance, pure white architectural backgrounds, and a signature gold accent (`#DFAB2E`).
2. **Cinematic Animations:** Uses `motion/react` extensively for scroll-linked animations, vertical parallax effects on images, and elegant reveal sequences using highly tuned custom easing curves (`[0.23, 1, 0.32, 1]`).
3. **Multi-step Inquiry Flow:** A highly customized, animated multi-step form built for lead generation (Bespoke Commissions).
4. **Responsive:** Fully optimized for mobile, tablet, and ultra-wide desktop displays using fluid typography and CSS grid.

## 🚀 Getting Started

To run the development server locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedTablesSection } from "@/components/sections/FeaturedTablesSection";
import { MadeForYourSpaceSection } from "@/components/sections/MadeForYourSpaceSection";
import { InquiryCTASection } from "@/components/sections/InquiryCTASection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { BlogPreviewSection, type BlogPreviewPost } from "@/components/sections/BlogPreviewSection";
import { AnimatedSeparator } from "@/components/ui/AnimatedSeparator";
import { getAllPosts } from "@/lib/blog";
import { buildAlternates } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildLocalBusinessSchema } from "@/lib/seo/schema";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Benzart | Bespoke Handcrafted Epoxy Resin & Wood Tables",
    description: "One-of-a-kind handcrafted dining tables using solid wood and epoxy resin. Designed for your space, built for generations. Commission your table today.",
    alternates: buildAlternates(locale, ''),
    openGraph: {
      title: "Benzart | Bespoke Handcrafted Tables",
      description: "One-of-a-kind handcrafted dining tables using solid wood and epoxy resin.",
      type: "website",
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  /**
   * Real posts from content/blog, newest first. The preview section used to own
   * a hardcoded list of four articles that did not exist, so every card on the
   * homepage journal block 404'd.
   */
  const previewPosts: BlogPreviewPost[] = getAllPosts(locale)
    .slice(0, 4)
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title,
      category: post.frontmatter.category,
      date: post.frontmatter.date,
      image: post.frontmatter.heroImage,
      imageAlt: post.frontmatter.heroAlt,
    }));

  return (
    <>
      <JsonLd data={buildLocalBusinessSchema(locale)} />
      <Navbar theme="dark" />
      <HeroSection />
      <AnimatedSeparator />
      <FeaturedTablesSection />
      <AnimatedSeparator />
      {/*
        Carries the core differentiator — "you choose the actual slab" — which
        the sales strategy identifies as the participation pillar.

        This is the only process block on the homepage. A second one
        ("The making of a modern heirloom.") used to sit directly below it and
        told the same three-stage story in the same order, so the page said
        everything twice. The long-form version of that story lives on
        /our-craft, which is where a visitor who wants the detail goes.
      */}
      <MadeForYourSpaceSection />
      <AnimatedSeparator />
      <InquiryCTASection />
      <AnimatedSeparator />
      <TestimonialsSection />
      <AnimatedSeparator />
      <BlogPreviewSection posts={previewPosts} />
      <Footer />
    </>
  );
}

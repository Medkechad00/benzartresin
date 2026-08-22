"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { blogHref, toHref } from "@/lib/urls";

export type BlogPostCard = {
  slug: string;
  frontmatter: {
    title: string;
    cluster: string;
    date: string;
    heroImage: string;
    heroAlt: string;
  };
};

export function BlogAllArticles({ posts }: { posts: BlogPostCard[] }) {
  const locale = useLocale();
  const t = useTranslations("Blog");

  function formatDate(iso: string) {
    const tag = locale === "ar" ? "ar-MA-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-US";
    return new Date(iso).toLocaleDateString(tag, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <section className="py-16 md:py-20 px-6 md:px-12 border-t border-black/10">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-[1.15] mb-10 md:mb-14"
        >
          <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
            {t("allArticles")}
          </span>
        </motion.h2>

        {/*
          Uniform card height.

          Every card is dimensionally identical here, across rows as well as
          within them, which takes three things:

           1. The wrapper carries `h-full` and the anchor is a flex column that
              fills it. The anchor previously had both `block` and `flex`, two
              conflicting display utilities whose winner depended on the order
              Tailwind happened to emit them in.
           2. The title reserves the space for its longest possible form rather
              than taking what it needs. The longest headline in this collection
              is 71 characters ("Luxury River Tables for Every Space...") which
              runs to three lines in a third-width column, so three lines are
              reserved and `line-clamp-3` holds that ceiling. Clamping to two
              would have been tidier but would truncate that article's title.
              `min-h` is in `em`, so it tracks the font-size change at `lg`
              without a second value: `leading-snug` is 1.375, so 3 lines is
              exactly 4.125em.
           3. The meta row is locked to one line. It carries a date that
              lengthens in French ("19 août 2026") and could wrap at narrow
              column widths, which would shift every title below it out of
              alignment.

          The result is that short titles leave space above the closing rule
          rather than pulling the rule upward, so the rule sits on one baseline
          across the whole grid. That is the part that reads as deliberate.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 items-stretch">
          {posts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Link
                href={toHref(blogHref(post.slug, locale))}
                className="group flex h-full flex-col"
              >
                {/*
                  Uniform image height, from an aspect ratio rather than a fixed
                  one.

                  `aspect-[3/2]` plus `fill` plus `object-cover` means height is
                  always width x 2/3, and the grid columns are equal, so every
                  image in a row is identical to the pixel while still scaling
                  with the breakpoint. A fixed `h-[280px]` would hold height
                  constant too, but it would stop responding to column width and
                  look wrong at both extremes.

                  The ratio matters as much as the uniformity. This was
                  `aspect-[4/5]`, a portrait frame, which at a third of the
                  container came to roughly 500px per image; six rows of that made
                  the grid about 4300px tall on its own. 3:2 brings it closer to
                  2900px without touching the type.

                  `object-cover` is what keeps every source usable: all 18 hero
                  images are 1024x1024 squares, so a 3:2 frame crops about a third
                  of the height off each one, centred, with no distortion. It is
                  also why the ratio was free to change at all.

                  `shrink-0` matters in a flex column: without it the image would
                  give up height to the text block instead of holding the frame.
                */}
                <div className="relative w-full aspect-[3/2] overflow-hidden bg-gray-100 mb-5 shrink-0">
                  <Image
                    src={post.frontmatter.heroImage}
                    alt={post.frontmatter.heroAlt}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    /*
                      The grid is 1 column, then 2 at `md`, then 3 at `lg`. The
                      previous value jumped straight from 100vw to 33vw and so
                      under-declared the whole 768-1024px band by half, which is
                      where a tablet fetches a card image at twice the density it
                      asked for.
                    */
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="flex flex-col flex-grow">
                  <div className="flex items-center gap-3 text-gray-600 font-sans text-xs uppercase tracking-widest mb-3 whitespace-nowrap min-w-0">
                    <span className="text-black font-bold truncate">{post.frontmatter.cluster}</span>
                    <span aria-hidden="true" className="text-black/25">&bull;</span>
                    <span className="shrink-0">{formatDate(post.frontmatter.date)}</span>
                  </div>

                  <h3 className="font-display text-2xl lg:text-3xl text-black leading-snug group-hover:text-gold-ink transition-colors line-clamp-3 min-h-[4.125em]">
                    {post.frontmatter.title}
                  </h3>

                  {/*
                    Closing rule, pushed to the bottom of the card by `mt-auto`
                    so it lands on the same baseline in every card and gives the
                    reserved space above it a purpose. It fills from the reading
                    edge on hover, the same device the stage rows on the home page
                    use, with `origin-left` overridden for RTL.
                  */}
                  <div className="mt-auto pt-6">
                    <span aria-hidden="true" className="block h-px w-full bg-black/10 overflow-hidden">
                      <span className="block h-px w-full bg-gold origin-left rtl:origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

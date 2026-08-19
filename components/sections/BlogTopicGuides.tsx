"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { blogSlug } from "@/lib/urls";

export type PillarPost = {
  slug: string;
  frontmatter: {
    title: string;
    cluster: string;
    heroImage: string;
    heroAlt: string;
    description?: string;
  };
};

/**
 * Topic guides: one featured pillar over a pair of secondary ones.
 *
 * The redesign turns on one decision: the two secondary cards no longer use the
 * same treatment as the featured card.
 *
 * Previously all three were "photograph, dark gradient, white text on top". That
 * cost the section its hierarchy, because tier was expressed only through size,
 * and it cost the secondary cards their legibility, since a title in white over
 * an uncontrolled photograph has no contrast guarantee. Three consecutive blocks
 * of the same layout family is also the pattern this project avoids elsewhere.
 *
 * So the featured card keeps the immersive overlay, which is the right treatment
 * for one hero asset, and the secondary pair inverts to photograph above, type
 * below on white. Different tier, different layout family, black-on-white type,
 * and room for the description that the old secondary cards dropped.
 */
export function BlogTopicGuides({ pillars }: { pillars: PillarPost[] }) {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const t = useTranslations("Blog");

  if (!pillars.length) return null;

  const [featured, ...rest] = pillars;

  return (
    <section className="py-16 md:py-20 px-6 md:px-12 border-t border-black/10">
      <div className="max-w-7xl mx-auto">
        {/*
          Deliberately a medium heading, not a banded display one.

          The page previously ran three large gold-banded headings down its
          length: "Journal.", "Topic guides", "All articles". The first two sat
          within a paragraph of each other, so the eye met two competing
          statements before reaching any content. Demoting this one leaves two
          large headings, which is enough to structure the page.

          This stays an `<h2>`, so the document outline is unchanged and nothing
          about the SEO structure moves. Visual weight is not a ranking input;
          heading level is, and that is preserved.
        */}
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-2xl md:text-3xl text-black tracking-tight mb-8 md:mb-10"
        >
          {t("topicGuides")}
        </motion.h2>

        {/* ── Featured pillar ──────────────────────────────────────────── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-14"
        >
          {/*
            Aspect ratio rather than `h-[50vh] md:h-[60vh]`.

            Viewport-height units on a card are unstable on phones: the value
            changes when mobile browser chrome collapses on scroll, which resizes
            the card mid-scroll and reflows everything under it. An aspect ratio
            derives height from the container width instead, so the card is
            deterministic and reserves its exact space before the image loads.
          */}
          <Link
            href={`/blog/${blogSlug(featured.slug, locale)}` as never}
            className="group block relative w-full aspect-[4/3] md:aspect-[2/1] overflow-hidden bg-gray-100"
          >
            <Image
              src={featured.frontmatter.heroImage}
              alt={featured.frontmatter.heroAlt}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="100vw"
            />

            {/*
              Bottom-weighted scrim. The previous
              `from-black/80 via-black/30 to-transparent` spread its midpoint
              across the whole frame, greying the photograph everywhere in order
              to protect text that only occupies the lower third. Pinning the
              midpoint at 35% keeps the type backing dense where the type is and
              releases the top half of the image.
            */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-black/90 from-0% via-black/45 via-35% to-transparent to-80%"
            />

            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-14">
              <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-[#DFAB2E] mb-4">
                {featured.frontmatter.cluster}
              </p>
              <h3 className="font-display text-3xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] max-w-4xl">
                {featured.frontmatter.title}
              </h3>
              {featured.frontmatter.description && (
                <p className="font-sans text-white/75 text-base md:text-lg leading-relaxed mt-5 max-w-2xl line-clamp-2">
                  {featured.frontmatter.description}
                </p>
              )}
            </div>
          </Link>
        </motion.div>

        {/* ── Secondary pillars ────────────────────────────────────────── */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 items-stretch">
            {rest.map((pillar, index) => (
              <motion.div
                key={pillar.slug}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: (index + 1) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <Link
                  href={`/blog/${blogSlug(pillar.slug, locale)}` as never}
                  className="group flex h-full flex-col"
                >
                  {/*
                    Same 3:2 frame as the article cards below, so every card
                    image on this page belongs to one system. See the note in
                    BlogAllArticles for why the height comes from an aspect ratio
                    rather than a fixed value.
                  */}
                  <div className="relative w-full aspect-[3/2] overflow-hidden bg-gray-100 mb-6 shrink-0">
                    <Image
                      src={pillar.frontmatter.heroImage}
                      alt={pillar.frontmatter.heroAlt}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  {/*
                    Reserved heights so both cards are dimensionally identical
                    whatever their copy length. The longest pillar title is 71
                    characters, which runs to two lines in a half-width column, so
                    two lines are reserved: `leading-snug` is 1.375, giving 2.75em.
                    Descriptions run to roughly 190 characters, clamped to two
                    lines at `leading-relaxed` (1.625), giving 3.25em.
                  */}
                  <div className="flex flex-col flex-grow">
                    <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold-dark mb-3">
                      {pillar.frontmatter.cluster}
                    </p>

                    <h3 className="font-display text-2xl md:text-3xl text-black tracking-tight leading-snug line-clamp-2 min-h-[2.75em] group-hover:text-gold-dark transition-colors">
                      {pillar.frontmatter.title}
                    </h3>

                    {pillar.frontmatter.description && (
                      <p className="font-sans text-sm md:text-base text-black/60 leading-relaxed mt-3 line-clamp-2 min-h-[3.25em]">
                        {pillar.frontmatter.description}
                      </p>
                    )}

                    {/*
                      Closing rule on a shared baseline, filling from the reading
                      edge on hover. Same device as the stage rows on the home
                      page and the article cards below, with `origin-left`
                      overridden for RTL.
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
        )}
      </div>
    </section>
  );
}

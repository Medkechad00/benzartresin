"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { tables } from "@/content/tables/tables";
import { localizeTable } from "@/lib/tables-i18n";
import { getTextDirection } from "@/lib/i18n/direction";
import { rtlIconClass } from "@/lib/i18n/motion";
import { tableSlug, localizedPath } from "@/lib/urls";

/**
 * Signature commissions on the homepage.
 *
 * THE BUG THIS REPLACES. The previous layout was `flex flex-wrap
 * justify-between` with children alternating `md:w-[60%]` and `md:w-[35%]`, and
 * a `gap-x-24`. At the container's real width that is 710 + 414 + 96 = 1220px
 * against 1184px available, so no pair ever fit on a row. Every card wrapped to
 * its own line and the intended two-column rhythm collapsed into a ragged
 * single column separated by 10rem gaps. Adding tables made it worse, not
 * better, because each new card inherited another orphaned row.
 *
 * THE REPLACEMENT. A 12-column CSS grid with explicit spans. Grid cannot
 * silently reflow the way flex-wrap does: a 7 + 5 pair always occupies one row
 * because the columns are declared, not inferred from pixel widths.
 *
 * Two further corrections:
 *
 * - ASPECT RATIO IS NOW A LAYOUT DECISION, NOT A DATA ONE. The cards were
 *   rendering `cover.aspect` straight from the content file, which mixes 4/5,
 *   square, 16/9 and 3/4. Mixed ratios across a grid read as an accident. The
 *   ratio is now assigned by grid role, so the wide card is always wide and the
 *   tall card is always tall regardless of what the content file says.
 *
 * - THE STAGGER IS BOUNDED. `md:mt-32` on every second card pushed the offset
 *   further down the page with each row. The offset now applies only within a
 *   pair, via grid row alignment, so the rhythm repeats instead of drifting.
 */

/**
 * Repeating 4-card rhythm across a 12-column grid.
 *
 * The cycle is: tall-wide, tall-narrow (dropped), narrow, wide. That gives two
 * visually distinct rows per cycle and avoids the "two equal columns" default
 * without letting any card become an orphan — 12 divides evenly at every step.
 */
const RHYTHM = [
  {
    span: "md:col-span-7",
    ratio: "aspect-[4/5]",
    heading: "text-2xl md:text-3xl lg:text-4xl",
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 700px",
    offset: "",
  },
  {
    span: "md:col-span-5",
    ratio: "aspect-[3/4]",
    heading: "text-xl md:text-2xl lg:text-3xl",
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 40vw, 480px",
    offset: "md:mt-20 lg:mt-28",
  },
  {
    span: "md:col-span-5",
    ratio: "aspect-[4/5]",
    heading: "text-xl md:text-2xl lg:text-3xl",
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 40vw, 480px",
    offset: "",
  },
  {
    span: "md:col-span-7",
    ratio: "aspect-[16/11]",
    heading: "text-2xl md:text-3xl lg:text-4xl",
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 700px",
    offset: "md:mt-20 lg:mt-28",
  },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Slow vertical drift on the cover image, tied to scroll position.
 *
 * The wrapper is inset by -10% and sized 120% so there is real image outside
 * the frame to travel into; animating `y` on a flush-fitting image would expose
 * the edge. Transform only, so this stays on the compositor.
 */
function ParallaxImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden w-full h-full">
      <motion.div
        style={{ y: reduceMotion ? 0 : y }}
        className="absolute inset-[-10%] w-[120%] h-[120%]"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          sizes={sizes}
        />
      </motion.div>
    </div>
  );
}

/**
 * How many pieces the homepage shows.
 *
 * Six, not "all of them". The grid rhythm below runs in pairs, so an odd count
 * always ends on a half-empty row — with seven tables the last card sat alone
 * against dead space. Six is also a full two cycles of the four-step rhythm's
 * pairing, so the section closes on a complete row at every breakpoint.
 *
 * The gallery at /tables remains the complete catalogue; this is a curated
 * front door to it, which is what the "View full gallery" link is for.
 */
const HOMEPAGE_LIMIT = 6;

export function FeaturedTablesSection() {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const t = useTranslations("Featured");
  const tTables = useTranslations("Tables");
  const tCard = useTranslations("TableCard");
  const localized = tables
    .slice(0, HOMEPAGE_LIMIT)
    .map((table) => localizeTable(table, tTables));
  const isRtl = getTextDirection(locale) === "rtl";

  return (
    <section className="relative bg-white overflow-x-clip">
      {/*
        Container matches the Navbar exactly, and the nesting order is the whole
        point: the Navbar puts its padding on the full-width element and the
        `max-w-7xl` cap INSIDE it. This block had the two inverted
        (`max-w-7xl mx-auto px-6 md:px-12`), which caps the box at 1280px first
        and then eats 48px of padding out of it — so its content sat 48px inside
        the nav's edge on any viewport wide enough for the cap to bind
        (≥1376px). Same tokens in the same order as the Navbar and Footer is the
        only way these stay aligned.
      */}
      <div className="w-full px-6 md:px-12">
        <div className="max-w-7xl mx-auto py-20 md:py-28 lg:py-32">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 md:mb-28">
          <div className="max-w-xl">
            {/*
              The "Signature pieces" eyebrow is gone. It repeated the h2
              directly beneath it word for word, so the section announced
              itself twice before saying anything.
            */}
            {/*
              Same slab treatment as every other homepage h2: inner span so the
              gold hugs the words, `box-decoration-clone` to keep padding on
              wrapped lines, and asymmetric vertical padding as descender
              reserve so a serif cap-and-descender pair is never clipped.
            */}
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-[1.15] text-balance">
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {t("title")}
              </span>
            </h2>
            <p className="font-sans text-gray-600 text-lg leading-relaxed mt-6">
              {t("description")}
            </p>
          </div>

          <Link
            href={localizedPath('/tables', locale) as any}
            className="group flex items-center gap-3 font-sans uppercase tracking-wider text-sm font-bold text-black border-b border-black pb-1 hover:text-gold hover:border-gold transition-colors w-fit shrink-0"
          >
            {t("viewAll")}
            <ArrowRight
              size={16}
              className={`transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 ${rtlIconClass(isRtl)}`}
            />
          </Link>
        </div>

        {/*
          `items-start` so each card keeps its own height instead of stretching
          to the tallest in the row — the varied heights are what produce the
          editorial rhythm.
        */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-14 md:gap-y-20 items-start">
          {localized.map((table, index) => {
            const layout = RHYTHM[index % RHYTHM.length];
            const cover = table.images[0];
            const isSold = table.availability === "sold";

            return (
              <motion.article
                key={table.slug}
                initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.9,
                  delay: (index % 2) * 0.08,
                  ease: EASE,
                }}
                className={`group ${layout.span} ${layout.offset}`}
              >
                <Link href={`/tables/${tableSlug(table.slug, locale)}` as any} className="block">
                  {/* Cover */}
                  <div className={`relative w-full ${layout.ratio} overflow-hidden bg-ivory-dark`}>
                    <ParallaxImage
                      src={cover.src}
                      alt={cover.alt}
                      sizes={layout.sizes}
                      priority={index === 0}
                    />

                    {/*
                      Availability chip. Only rendered for sold pieces — an
                      "available" chip on everything else would be noise, and
                      the enquiry CTA already implies availability.
                    */}
                    {isSold ? (
                      <span className="absolute top-4 start-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.2em] text-black">
                        {tCard("sold")}
                      </span>
                    ) : null}

                    {/*
                      Hover scrim. Sits above the image and below the caption,
                      so the caption text stays fully opaque while the image
                      dims slightly behind it.
                    */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700"
                    />
                  </div>

                  {/* Caption */}
                  <div className="pt-5 flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span
                          aria-hidden="true"
                          className="font-sans text-[10px] text-gold tabular-nums tracking-[0.2em] shrink-0"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          aria-hidden="true"
                          className="h-px flex-1 bg-black/10 group-hover:bg-gold/50 transition-colors duration-500"
                        />
                      </div>

                      <h3
                        className={`font-display ${layout.heading} text-black tracking-tight leading-[1.15] pb-0.5 mb-2 group-hover:text-gold transition-colors duration-300`}
                      >
                        {table.name}
                      </h3>
                      <p className="font-sans text-xs md:text-sm text-gray-500 uppercase tracking-[0.15em]">
                        {table.wood} &middot; {table.resinColor}
                      </p>
                    </div>

                    <ArrowRight
                      size={18}
                      aria-hidden="true"
                      className={`shrink-0 mt-8 text-black/25 group-hover:text-gold transition-all duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 ${rtlIconClass(isRtl)}`}
                    />
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}

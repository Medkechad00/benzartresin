"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { tables, coverImage } from "@/content/tables/tables";
import { localizeTable } from "@/lib/tables-i18n";
import { getTextDirection } from "@/lib/i18n/direction";
import { useSafeReducedMotion } from "@/lib/hooks/use-safe-reduced-motion";
import { rtlIconClass } from "@/lib/i18n/motion";
import { tableHref, localizedPath, toHref } from "@/lib/urls";
import {
  balanceColumns,
  cardBucket,
  CARD_ASPECT,
  CARD_ASPECT_RATIO,
  SECOND_COLUMN_OFFSET,
} from "@/lib/masonry";

/**
 * Signature commissions on the homepage, as a two-column masonry board.
 *
 * HISTORY, because two earlier layouts failed here for different reasons:
 *
 * 1. `flex flex-wrap justify-between` with children alternating `md:w-[60%]` and
 *    `md:w-[35%]` plus `gap-x-24`. At the container's real width that is
 *    710 + 414 + 96 = 1220px against 1184px available, so no pair ever fit on a
 *    row. Every card wrapped to its own line and the intended two-column rhythm
 *    collapsed into a ragged single column separated by 10rem gaps.
 *
 * 2. A 12-column grid with a repeating 5/5/7 span rhythm and alternating
 *    `mt-20` offsets. That fixed the reflow, but it deliberately rendered cards
 *    at three different widths and three different crops, which reads as an
 *    editorial magazine grid rather than a Pinterest board — and it meant the
 *    same photograph appeared at a different aspect ratio depending on its index.
 *
 * Now every card is exactly 50% of the container in a portrait frame, and the
 * offset between the two columns comes from packing rather than from hardcoded
 * margins, so it cannot drift down the page as rows accumulate. The distribution
 * is computed in `lib/masonry.ts` — see the note there on why this is not
 * `columns-2` and not a JS measuring pass.
 */

/**
 * Caption band height as a fraction of column width, used ONLY to predict card
 * height when balancing the columns. It does not constrain the rendered band.
 */
const CAPTION_RATIO = 0.3;

const CARD_SIZES = "(max-width: 768px) 50vw, (max-width: 1376px) 46vw, 610px";

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
  blurDataURL,
}: {
  src: string;
  alt: string;
  sizes: string;
  blurDataURL: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /*
    THIS WAS THE HYDRATION BUG.

    `useReducedMotion()` returns `null` on the server and the real media-query
    result on the very first client render, so for anyone with reduced motion
    enabled `y` resolved to a parallax MotionValue on the server and to `0` on the
    client. The wrapping div's `transform` therefore differed between the two
    renders, and React reported the mismatch against the deepest node it reached
    while walking the subtree — the `loading` attribute on the `<img>` below,
    which was never actually the problem.

    `useSafeReducedMotion()` returns `false` on the server and on the hydrating
    render, then adopts the real preference once mounted. Parallax is a
    scroll-driven effect, so nothing is lost by resolving it one tick late.
  */
  const reduceMotion = useSafeReducedMotion();

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
          /*
            Every card here loads lazily, including the first.

            This section sits below the hero, so none of its images can be the
            LCP element — but the first card used to carry `priority`, which in
            Next 16 still injects a `<link rel="preload" as="image">` into the
            head. That put a 700px table photograph in direct contention with
            the hero image for early bandwidth, on a page where it is offscreen.
          */
          loading="lazy"
          /*
            These are 300-800KB photographs. The frame never reflows — its
            aspect ratio is fixed in CSS — but without a placeholder it sits
            empty until the image lands. The blur is a 16px inline WebP,
            ~155 bytes, so it costs nothing and paints with the image's real
            colours immediately.
          */
          placeholder="blur"
          blurDataURL={blurDataURL}
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
  const locale = useLocale();
  const t = useTranslations("Featured");
  const tTables = useTranslations("Tables");
  const localized = tables
    .slice(0, HOMEPAGE_LIMIT)
    .map((table) => localizeTable(table, tTables));
  const isRtl = getTextDirection(locale) === "rtl";

  const cards = localized.map((table) => {
    const cover = coverImage(table);
    const bucket = cardBucket(cover);
    return {
      table,
      cover,
      aspectClass: CARD_ASPECT[bucket],
      aspectRatio: CARD_ASPECT_RATIO[bucket],
      captionRatio: CAPTION_RATIO,
    };
  });

  const columns = balanceColumns(cards, 2);

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
            href={toHref(localizedPath('/tables', locale))}
            className="group flex items-center gap-3 font-sans uppercase tracking-wider text-sm font-bold text-black border-b border-black pb-1 hover:text-gold-ink hover:border-gold-ink transition-colors w-fit shrink-0"
          >
            {t("viewAll")}
            <ArrowRight
              size={16}
              aria-hidden="true"
              className={`transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 ${rtlIconClass(isRtl)}`}
            />
          </Link>
        </div>

        {/*
          Two-column masonry, matching the collection page.

          This replaces a four-step twelve-column rhythm (5/5/7 spans with
          alternating `mt-20` offsets) that produced deliberately mismatched card
          widths. That reads as an editorial grid, not as the Pinterest board the
          brief asks for, and it meant the same piece rendered at three different
          crops depending on its index. Every card is now exactly 50% wide, in a
          portrait frame, packed shortest-column-first so the columns stagger.

          `items-start` so a column never stretches to match its sibling.
        */}
        <div className="grid grid-cols-2 gap-x-3 md:gap-x-6 lg:gap-x-10 items-start">
          {columns.map((indices, columnIndex) => (
            <div
              key={columnIndex}
              className={`flex flex-col gap-3 md:gap-6 lg:gap-10 min-w-0 ${
                columnIndex === 1 ? SECOND_COLUMN_OFFSET : ""
              }`}
            >
              {indices.map((i) => {
                const { table, cover, aspectClass } = cards[i]!;

                return (
                  <motion.article
                    key={table.slug}
                    /*
                      Unconditional. The root `MotionConfig reducedMotion="user"`
                      suppresses the `y` transform for reduced-motion users while
                      still fading opacity, so branching here is unnecessary — and
                      branching was what broke hydration.
                    */
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.9,
                      delay: (i % 2) * 0.08,
                      ease: EASE,
                    }}
                    className="group"
                  >
                    {/*
                      The card is the control. There is no separate arrow
                      affordance any more, so the focus ring has to live here or
                      keyboard users get no indication of where they are.
                    */}
                    <Link
                      href={toHref(tableHref(table.slug, locale))}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      {/* Cover */}
                      <div
                        className={`relative w-full ${aspectClass} overflow-hidden bg-ivory-dark`}
                      >
                        <ParallaxImage
                          src={cover.src}
                          alt={cover.alt}
                          sizes={CARD_SIZES}
                          blurDataURL={cover.blurDataURL}
                        />

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

                      {/*
                        Caption band: name over subtitle, on gold.

                        `mt-2` rather than flush to the image. Butted directly
                        against the photograph the gold read as part of the
                        picture — a colour block cropping the bottom of the table
                        — instead of as a label belonging to it.

                        The index number and the per-card arrow are gone: the
                        number was decorative ordering that carried no meaning,
                        and the arrow duplicated a link the whole card provides.
                      */}
                      <div className="mt-2 bg-[#DFAB2E] group-hover:bg-[#d3a02a] transition-colors duration-500 px-3 py-3 md:px-5 md:py-4 lg:px-6 lg:py-5">
                        <h3 className="font-display text-base md:text-2xl lg:text-3xl text-black tracking-tight leading-[1.15] pb-0.5">
                          {table.name}
                        </h3>
                        {/*
                          black/75 rather than a grey: grey-on-gold drops under
                          4.5:1 at this size, and this line is already small caps.
                        */}
                        <p className="font-sans text-[10px] md:text-sm lg:text-base text-black/75 uppercase tracking-[0.15em] mt-1 md:mt-2">
                          {[table.wood, table.resinColor].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { tables, coverImage } from "@/content/tables/tables";
import { localizeTable } from "@/lib/tables-i18n";
import { tableHref, toHref } from "@/lib/urls";
import {
  balanceColumns,
  cardBucket,
  CARD_ASPECT,
  CARD_ASPECT_RATIO,
  SECOND_COLUMN_OFFSET,
} from "@/lib/masonry";

/**
 * Two-column masonry, at exactly 50% of the container each.
 *
 * WHAT THIS REPLACES, in order of how wrong each was:
 *
 * 1. A 7/5/12 twelve-column span cycle, so every third card occupied a whole row
 *    on its own. An orphaned full-width card reads as a different, larger product
 *    tier rather than as rhythm.
 * 2. That full-width card took its ratio from `cover.aspect`, derived from the
 *    source photograph — mostly 4:5. Across the 1280px container that is 1600px
 *    tall: one card taller than the viewport.
 * 3. `items-stretch` plus `h-full` on each card, so a paired row was forced to
 *    the taller of the two and the shorter card's caption floated away from its
 *    image.
 *
 * Now: two equal columns, portrait frames, and cards packed shortest-column-first
 * so the two sides deliberately do NOT align. The split is computed from the
 * covers' intrinsic dimensions in `lib/masonry.ts` — see the note there on why
 * this is not `columns-2` and not a JS measuring pass.
 *
 * `CAPTION_RATIO` is the caption band's height as a fraction of the column width,
 * used only to predict card height when balancing. It does not constrain the
 * rendered band; it just keeps the estimate honest enough that the columns come
 * out close to level. Measured from the shipped band at the 2-up column width.
 */
const CAPTION_RATIO = 0.3;

const CARD_SIZES = "(max-width: 768px) 50vw, (max-width: 1376px) 46vw, 610px";

export default function TablesClient() {
  const locale = useLocale();
  const t = useTranslations("TablesPage");
  const tTables = useTranslations("Tables");

  const localized = tables.map((table) => localizeTable(table, tTables));

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
    <PageLayout>
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <header className="mb-20 max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8"
            >
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {t("title")}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-gray-600 text-lg leading-relaxed"
            >
              {t("description")}
            </motion.p>
          </header>

          {/*
            Two columns at every breakpoint including mobile, because the brief
            asks for exactly 50% per card. `items-start` so a column never
            stretches to match its sibling — that stretching was one of the three
            bugs listed above.
          */}
          <div className="grid grid-cols-2 gap-x-3 md:gap-x-6 lg:gap-x-8 items-start">
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
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.8, delay: (i % 2) * 0.08 }}
                      className="group"
                    >
                      <Link
                        href={toHref(tableHref(table.slug, locale))}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      >
                        <div
                          className={`relative w-full overflow-hidden ${aspectClass} bg-ivory-dark`}
                        >
                          <Image
                            src={cover.src}
                            alt={cover.alt}
                            fill
                            /*
                              `priority` was deprecated in Next 16 in favour of
                              `preload`, and the docs advise against `preload`
                              where the LCP element depends on the viewport — with
                              twelve cards, preloading a fixed pair would be a
                              guess. `loading` plus `fetchPriority` states the
                              same intent without injecting head links.

                              The first card in each column is above the fold, so
                              both load eagerly; only the very first takes
                              priority.
                            */
                            loading={i < 2 ? "eager" : "lazy"}
                            fetchPriority={i === 0 ? "high" : "auto"}
                            placeholder="blur"
                            blurDataURL={cover.blurDataURL}
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            /*
                              Two columns from the narrowest viewport up, so a
                              card is never wider than ~50vw. Declaring 100vw
                              here would fetch a variant twice the rendered
                              width on every phone.
                            */
                            sizes={CARD_SIZES}
                          />
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700"
                          />
                        </div>

                        {/*
                          Caption band: name over subtitle, on gold, gapped from
                          the image. Butted flush the gold read as part of the
                          photograph — a colour block cropping the bottom of the
                          table — rather than as a label belonging to it.
                        */}
                        <div className="mt-2 bg-[#DFAB2E] group-hover:bg-[#d3a02a] transition-colors duration-500 px-3 py-3 md:px-5 md:py-4 lg:px-6 lg:py-5">
                          <h2 className="font-display text-base md:text-2xl lg:text-3xl text-black tracking-tight leading-[1.15] pb-0.5">
                            {table.name}
                          </h2>
                          <p className="font-sans text-[10px] md:text-sm lg:text-base text-black/75 uppercase tracking-[0.15em] mt-1 md:mt-2">
                            {/* `wood` is absent on the resin-topped piece; joining
                                rather than interpolating avoids a dangling separator. */}
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
    </PageLayout>
  );
}

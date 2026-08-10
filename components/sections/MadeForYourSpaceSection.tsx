"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

type ValueItem = { title: string; description: string };

/**
 * "Made for your space." — the commissioning-process section.
 *
 * Design decisions worth recording, because several are deliberate reversals of
 * what was here before:
 *
 * 1. BACKGROUND. Stays in the ivory family (`--background` is already ivory, so
 *    this is the site's own surface, not a new colour). The section previously
 *    sat on flat `bg-ivory` while every neighbour was `bg-white`, which read as
 *    an accident. It now steps ivory -> ivory-dark across the split, so the
 *    tonal change lands on a structural edge and reads as intent.
 *
 * 2. NO GOLD SLAB ON THE HEADING. The h2 was `<span className="bg-[#DFAB2E]">`.
 *    Gold text on white is 2.10:1 and gold-as-fill demands near-black type; a
 *    saturated band behind a 48px serif reads as a highlighter pen. The accent
 *    moves to a 2px rule and a single numeral, where it has contrast to spare.
 *
 * 3. NO REPEATED LEFT BORDER. Three identical `border-s` cards is the "three
 *    equal cards" default. The items are now a hairline lattice — dividers
 *    *between* rows, no enclosing boxes — with the step numeral carrying the
 *    accent. Sequence is the actual content here, so numbering is semantic.
 *
 * 4. ASYMMETRY. 5/7 split rather than 50/50, and the image is pulled up out of
 *    the grid so the type column and the photograph do not start on the same
 *    line.
 */
export function MadeForYourSpaceSection() {
  const reduceMotion = useReducedMotion();
  const t = useTranslations("MadeForSpace");

  // `t.raw` returns the array as authored in messages/*.json so the list length
  // stays a content decision rather than a code one.
  const values = t.raw("items") as ValueItem[];

  return (
    <section className="relative py-24 md:py-32 lg:py-40 bg-ivory overflow-x-clip">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/*
          Stacked header, left aligned, capped at 65ch. Not a split header with
          a paragraph floating in the right column.
        */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[65ch]"
        >
          <div className="w-16 h-[3px] bg-gold mb-8" />
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-[1.05] pb-1 mb-6 text-balance">
            {t("title")}
          </h2>
          <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed">
            {t("description")}
          </p>
        </motion.div>
      </div>

      {/*
        The split. `items-stretch` so the photograph runs the full height of the
        step list rather than being vertically centred against it — a tall
        image column beside a tall type column is what gives the section its
        weight.
      */}
      <div className="max-w-7xl mx-auto mt-16 md:mt-24 px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">

          {/*
            Image first in the DOM and on the left at desktop, so the reading
            order on mobile is header -> image -> steps.
          */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative w-full aspect-[4/5] lg:aspect-auto lg:min-h-[560px] overflow-hidden bg-ivory-dark"
          >
            <Image
              src="/images/material_detail.png"
              alt={t("imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </motion.div>

          {/*
            Hairline lattice. `divide-y` puts a rule *between* rows only, so
            there is no border above the first or below the last — no boxes, no
            top-and-bottom border on every row.
          */}
          <div className="lg:col-span-7 lg:ps-4">
            <ol className="divide-y divide-black/10 border-t border-black/10">
              {values.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex gap-6 md:gap-10 py-8 md:py-10"
                >
                  {/*
                    The one place the accent appears as type in this section.
                    Gold on ivory is legible at this size and weight, and the
                    number is real information: these are sequential stages of
                    a commission, not decoration.
                  */}
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl md:text-4xl text-gold leading-none shrink-0 w-8 md:w-10 tabular-nums"
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-display text-2xl md:text-3xl text-black tracking-tight leading-[1.15] pb-0.5 mb-3">
                      {item.title}
                    </h3>
                    <p className="font-sans text-gray-600 leading-relaxed text-base md:text-lg max-w-[58ch]">
                      {item.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </section>
  );
}

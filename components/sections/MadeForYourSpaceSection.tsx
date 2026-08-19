"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

type ValueItem = { title: string; description: string; imageAlt: string };

/**
 * "Made for your space." — the three-stage commissioning story.
 *
 * Layout: a sticky image column paired with a scrolling type column. The
 * photograph stays pinned while the three stages move past it, so the section
 * reads as one continuous idea rather than three stacked cards. That pairing is
 * the standard editorial treatment for sequential process content, and it is
 * what makes the section feel considered rather than templated.
 *
 * Notes on specific choices:
 *
 * 1. BACKGROUND. `bg-white`, matching every other homepage section. This block
 *    was previously the only `bg-ivory` one on the page, which read as an
 *    accident rather than a deliberate tonal step. Separation from its
 *    neighbours now comes from the hairline rule and the vertical rhythm, not
 *    from a colour change.
 *
 * 2. GOLD SLAB ON THE HEADING. Matches every other homepage h2. I previously
 *    argued against it on contrast grounds, and I was wrong about which
 *    contrast matters: the slab is a background behind BLACK type, so the pair
 *    that must pass is black-on-gold (10.0:1, comfortably AA), not gold-on-
 *    white. Consistency across the page wins.
 *
 * 3. THREE IMAGES, NOT ONE. Each stage now shows its own photograph, cross-
 *    faded as that stage becomes active. A single static image beside three
 *    unrelated stages was the weakest part of the old layout — the picture
 *    could not illustrate what the text was saying.
 *
 * 4. NUMERALS AS STRUCTURE. Large ghosted numerals anchor each stage and carry
 *    the sequence, which is the actual content here. They sit at low opacity so
 *    they read as structure, not decoration competing with the headings.
 */
export function MadeForYourSpaceSection() {
  const reduceMotion = useReducedMotion();
  const t = useTranslations("MadeForSpace");
  const sectionRef = useRef<HTMLDivElement>(null);

  // `t.raw` returns the array as authored in messages/*.json so the list length
  // stays a content decision rather than a code one.
  const values = t.raw("items") as ValueItem[];

  const STAGE_IMAGES = [
    "/images/process_wood_selection.png",
    "/images/material_detail.png",
    "/images/process_final_finish.png",
  ];

  /**
   * Drives the image cross-fade from the scroll position of the type column.
   * `offset` starts tracking when the column's top reaches 80% of the viewport
   * and finishes when its bottom passes 20%, so the final image is fully
   * settled before the section leaves the screen.
   */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.8", "end 0.2"],
  });

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
        {/*
          Hairline top rule at the container edge, not full-bleed: it aligns the
          section opening with the grid the rest of the page uses.
        */}
        <div className="max-w-7xl mx-auto border-t border-black/10 pt-20 md:pt-28 lg:pt-32">

          {/* Header */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20 md:mb-28"
          >
            <div className="max-w-3xl">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-[1.15] text-balance mb-8">
                <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                  {t("title")}
                </span>
              </h2>
              <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl">
                {t("description")}
              </p>
            </div>
          </motion.div>

          {/* Split: sticky imagery / scrolling stages */}
          <div ref={sectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-24 md:pb-32">

            {/*
              Sticky column. `self-start` is required for `position: sticky` to
              work inside a grid item — without it the item stretches to the row
              height and has nothing to stick within.
            */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-ivory-dark">
                {STAGE_IMAGES.map((src, i) => (
                  <StageImage
                    key={src}
                    src={src}
                    alt={values[i]?.imageAlt ?? ""}
                    index={i}
                    total={STAGE_IMAGES.length}
                    progress={scrollYProgress}
                    reduceMotion={reduceMotion}
                    priority={i === 0}
                  />
                ))}

                {/* Stage counter, bottom-left, over the image. */}
                <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 flex items-end justify-between pointer-events-none">
                  <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/80 drop-shadow-sm">
                    {t("stageLabel")}
                  </span>
                  <span className="font-display text-white text-sm tabular-nums drop-shadow-sm">
                    01 &mdash; {String(values.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            {/* Stages */}
            <ol className="lg:col-span-7 lg:ps-6">
              {values.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative border-t border-black/10 last:border-b py-10 md:py-14 lg:min-h-[38vh] flex flex-col justify-center"
                >
                  <div className="flex items-start gap-6 md:gap-10">
                    {/*
                      Ghosted numeral. Low opacity so it reads as structure
                      rather than competing with the heading, and it darkens on
                      hover to tie the row together as one target.

                      It darkens rather than turning gold. The heading beside it
                      now carries a solid gold band, so a gold numeral plus the
                      gold rule that draws in on hover put three gold elements in
                      one row and the band stopped being the thing your eye
                      landed on. Black at 25% still reads as a state change.
                    */}
                    <span
                      aria-hidden="true"
                      className="font-display text-5xl md:text-7xl leading-none shrink-0 tabular-nums text-black/10 group-hover:text-black/25 transition-colors duration-500"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 pt-1 md:pt-2">
                      {/*
                        Same gold band as the section headline above, so the
                        stage titles read as part of one typographic system.

                        `box-decoration-clone` is required, not optional: without
                        it a title that wraps gets the horizontal padding only on
                        the first and last fragments, and the band tears open
                        mid-phrase. `pt`/`pb` are em-based so the band scales with
                        the type across the three breakpoints, and the slightly
                        larger `pb` is descender reserve for the `y` in
                        "dimensions" and "by".

                        `leading-[1.2]` on the h3 is what keeps stacked bands from
                        colliding when a title does wrap: the band is about 1.08em
                        tall inside a 1.2em line box, leaving a hairline of white
                        between lines rather than a solid slab.

                        Hierarchy still holds against the h2 despite the shared
                        treatment, because the sizes stay two steps apart
                        (4xl/5xl/6xl against 2xl/3xl/4xl).
                      */}
                      <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-black tracking-tight leading-[1.2] pb-0.5 mb-4">
                        <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                          {item.title}
                        </span>
                      </h3>
                      <p className="font-sans text-gray-600 leading-relaxed text-base md:text-lg max-w-[54ch]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/*
                    Gold rule that draws in on hover, from the reading edge.
                    `origin-left` with an RTL override so it grows from the
                    correct side in Arabic.
                  */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-px inset-x-0 h-px bg-gold origin-left rtl:origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out"
                  />
                </motion.li>
              ))}
            </ol>

          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One frame of the sticky image stack.
 *
 * Each image owns a slice of the section's scroll progress and cross-fades
 * within it. Opacity only — no layout properties animate — so this stays on the
 * compositor and never triggers reflow while scrolling.
 *
 * Under `prefers-reduced-motion` the stack collapses to the first image at full
 * opacity and the rest stay hidden, rather than flickering through transitions.
 */
function StageImage({
  src,
  alt,
  index,
  total,
  progress,
  reduceMotion,
  priority,
}: {
  src: string;
  alt: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduceMotion: boolean | null;
  priority?: boolean;
}) {
  const slice = 1 / total;
  const start = index * slice;

  // Fade in over the first 40% of this image's slice, hold, then fade out over
  // the last 40%. The first and last images clamp so the stack is never blank.
  const opacity = useTransform(
    progress,
    [
      start - slice * 0.4,
      start + slice * 0.15,
      start + slice * 0.85,
      start + slice * 1.4,
    ],
    [0, 1, 1, 0],
    { clamp: true }
  );

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        opacity: reduceMotion ? (index === 0 ? 1 : 0) : opacity,
      }}
      aria-hidden={index !== 0}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 42vw"
      />
    </motion.div>
  );
}

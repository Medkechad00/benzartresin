"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSafeReducedMotion } from "@/lib/hooks/use-safe-reduced-motion";

/*
  `imageAlt` was dropped along with the per-stage photographs: the sticky
  column is now a single video embed, so there is no image for a stage to
  describe.
*/
type ValueItem = { title: string; description: string };

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
  const t = useTranslations("MadeForSpace");

  /**
   * Playback is a user-controllable state, not a fixed query parameter.
   *
   * The embed was `autoplay=1&loop=1&background=1&controls=0`: motion that
   * starts by itself, runs longer than five seconds, repeats forever, and — with
   * `background=1` plus `controls=0` — renders no player chrome at all, so there
   * was no pause affordance anywhere on the page. That is a direct WCAG 2.2.2
   * (Pause, Stop, Hide) failure at Level A, and because `MotionConfig` only
   * governs Motion components it also ignored `prefers-reduced-motion`
   * entirely.
   *
   * Two changes fix it without giving up the design:
   *
   *  - The default is derived from the visitor's own preference. Reduced motion
   *    means the video mounts paused, showing Vimeo's own poster frame.
   *  - A real button toggles it. Changing the `autoplay` parameter remounts the
   *    iframe (via `key`), which is what actually starts and stops playback —
   *    Vimeo's postMessage API would need `player.js`, and pulling a
   *    third-party script onto the homepage to add a pause button is a poor
   *    trade when a remount does the same job for nothing.
   *
   * `useSafeReducedMotion` rather than `useReducedMotion`: the latter returns
   * `null` on the server and the real value on the first client render, which is
   * exactly the hydration mismatch documented in
   * `components/providers/MotionProvider.tsx`. This returns `false` until
   * mounted, so the server and the hydrating render agree and the preference is
   * adopted one tick later.
   */
  const reduceMotion = useSafeReducedMotion();
  const [playing, setPlaying] = useState(true);
  const isPlaying = playing && !reduceMotion;

  // `t.raw` returns the array as authored in messages/*.json so the list length
  // stays a content decision rather than a code one.
  const values = t.raw("items") as ValueItem[];

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
            initial={{ opacity: 0, y: 24 }}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-24 md:pb-32">

            {/*
              Sticky column. `self-start` is required for `position: sticky` to
              work inside a grid item — without it the item stretches to the row
              height and has nothing to stick within.
            */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
              {/*
                Vimeo embed, replacing a three-image scroll-linked cross-fade.

                `padding-top: 133.33%` on the wrapper with the iframe absolutely
                filling it is the standard intrinsic-ratio box — 4:3 portrait,
                which is the ratio the source is encoded at. It reserves the
                frame's height before the iframe loads, so nothing reflows; using
                a fixed height instead would letterbox at some widths and clip at
                others.

                The supplied snippet also shipped `<script src=".../player.js">`.
                That is only needed to drive playback through Vimeo's JS API — for
                a plain embed the iframe is self-contained, and injecting a
                third-party script into a client component would block the main
                thread on a homepage that is already image-heavy. Left out
                deliberately; add it back only if this needs programmatic control.

                Query-string parameters make the embed behave as a background
                element without any of that JS: `autoplay=1&muted=1&loop=1`
                start the video silently (browsers block unmuted autoplay, so
                mute is what makes autoplay legal), loop it, and therefore never
                let it reach an end screen — which is what would otherwise show
                the Vimeo profile badge and suggested related videos.
                `background=1` removes every piece of Vimeo chrome (title bar,
                byline, portrait, share controls); `title=0&byline=0&portrait=0`
                and `controls=0` are the explicit per-element switches that
                cover plans on which `background` is not honoured. `dnt=1`
                stops Vimeo setting tracking cookies, which also trims the
                player's own network work. None of these add requests — the
                iframe count, lazy loading, and shift-free ratio box are all
                unchanged.

                `title` is required: an iframe without one is announced as
                "frame" with no indication of its contents.
              */}
              <div className="relative w-full overflow-hidden bg-ivory-dark" style={{ paddingTop: "133.33%" }}>
                <iframe
                  /*
                    `key` forces a remount when playback is toggled. Vimeo reads
                    `autoplay` only at load, so changing the src alone would not
                    start or stop anything.
                  */
                  key={isPlaying ? "playing" : "paused"}
                  src={`https://player.vimeo.com/video/1219958577?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=${
                    isPlaying ? 1 : 0
                  }&muted=1&loop=1&dnt=1&background=1&title=0&byline=0&portrait=0&controls=0`}
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  /*
                    Deferred so the embed never competes with the hero for
                    bandwidth or main-thread time during first paint. This section
                    sits well below the fold.
                  */
                  loading="lazy"
                  title={t("videoTitle")}
                  className="absolute inset-0 h-full w-full border-0"
                />

                {/*
                  The pause control WCAG 2.2.2 requires.

                  `background=1` and `controls=0` strip every one of Vimeo's own
                  controls, so without this there was no mechanism anywhere to
                  stop an infinite auto-playing animation. Positioned inside the
                  ratio box so it travels with the video, and sized past the 24px
                  target minimum.
                */}
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  aria-pressed={isPlaying}
                  className="absolute bottom-3 end-3 z-10 flex items-center gap-2 bg-black/80 px-3 py-2 font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true" className="block leading-none">
                    {isPlaying ? "❙❙" : "▶"}
                  </span>
                  {isPlaying ? t("videoPause") : t("videoPlay")}
                </button>
              </div>
            </div>

            {/* Stages */}
            <ol className="lg:col-span-7 lg:ps-6">
              {values.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: 28 }}
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


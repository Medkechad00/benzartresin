"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { localizedPath } from "@/lib/urls";

export function HeroSection() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  /*
    `overflow-x-clip` rather than `overflow-hidden`: the title's negative inline
    margin must be allowed to overlap the image, but nothing may ever create
    horizontal page scroll. Clipping only the x axis keeps the overlap visible
    while still trapping any overflow.

    ── Why there is no fixed height at any breakpoint ──────────────────────
    This section used to be `h-[100dvh] min-h-[700px]`, and later
    `md:h-[100dvh] md:max-h-[800px]` on the inner grid. Both are fixed boxes, and
    the content does not fit them in every locale.

    The grid is `md:grid-rows-[auto_1fr]`: row 1 is the headline and takes
    whatever it wants, row 2 holds the paragraph and the CTAs and gets the
    remainder. When the remainder is smaller than the CTAs, they overflow the
    section, and since `isolate` (below) correctly confines this section's
    z-indices, the next section's `bg-white` then paints straight over them. The
    buttons do not move, they disappear.

    Arabic triggers it and Latin does not, because
    `html[lang="ar"] h1 { line-height: 1.25 }` in globals.css overrides the
    `md:leading-[0.82]` utility here. That rule is correct and necessary:
    Arghavan's ink bounding box is 1.803em and its OS/2 typo line is 1.760em, so
    1.25 is already a tight compromise for the script, not a mistake. But at the
    `xl` size of 108px it costs 3 x 108 x 0.43 = 139px of extra headline, all of
    which comes out of row 2. Measured:

      1440x700  en  row1 324px  row2 264px  cta 186px   fits
      1440x700  ar  row1 464px  row2 124px  cta 220px   clipped by 96px
      1366x660  ar  row1 464px  row2  84px  cta 220px   clipped by 136px
      1920x1080 ar  row1 464px  row2 336px  cta 220px   fits

    So it is wide-but-short viewports, which is to say laptops, and it was
    invisible on desktops tall enough to absorb the difference.

    Tightening the Arabic leading is the wrong lever: at 1.00 it still clips by
    15px to 55px and it puts the glyphs inside their own ink box. Shrinking the
    Arabic headline is a design decision, not a bug fix. So the height is now a
    minimum everywhere and the section grows to fit whatever the locale needs.
    Nothing can be starved because nothing is capped.

    The image carries an aspect ratio at every breakpoint instead of `h-[80%]`
    and `h-full`. That is what made the fixed height necessary in the first
    place: a percentage height needs a definite ancestor to resolve against, so
    the chain of `h-full` from section to grid existed only to feed it. An aspect
    ratio needs nothing, and `lg:aspect-[9/8]` gives 646px at the 727px column
    this resolves to on any screen past the `max-w-7xl` cap, which sits inside
    the 588px to 800px range the percentage produced before.

    `isolate` stays. `position: relative` with `z-index: auto` does not open a
    stacking context, so this section's `z-30` children were competing in the
    root context and painted over later siblings. Confining them is correct, and
    with the overflow gone there is nothing left to hide.
  */
  return (
    <section className="relative isolate min-h-[100dvh] w-full pt-20 pb-12 md:pb-16 px-6 md:px-12 bg-white flex flex-col overflow-x-clip">
      <div className="w-full max-w-7xl mx-auto flex-grow flex items-center justify-center">
        
          <div className="w-full grid grid-cols-1 md:grid-cols-12 md:grid-rows-[auto_1fr] gap-y-4 md:gap-y-0 md:gap-x-8 lg:gap-x-12 items-center md:overflow-visible">
          
          {/* 1. Title (Mobile: Top, Desktop: Top Left) */}
          <div className="order-1 md:col-span-6 md:col-start-1 md:row-start-1 z-30 pt-8 md:pt-10 self-end md:overflow-visible">
            {/*
              Exactly three lines, always.

              The three `title_part*` strings are three flex-column children, so
              the headline is three lines only if none of them wraps. The
              `[&>span]:whitespace-nowrap` on the h1 enforces that: each part
              stays on its own line regardless of viewport or locale. Wrapping
              was previously possible on narrow phones, which produced a four or
              five line headline. Nowrap on the parts (rather than on the h1
              itself) is safe because the parts are short: it cannot introduce
              horizontal scroll the way nowrap on the whole title did.

              ── Why 10.2vw at mobile ──────────────────────────────────────
              Because the parts cannot wrap, the largest usable font-size is
              fixed by the widest single line, so it is measured rather than
              guessed. Advance widths taken straight from the font binaries,
              with `tracking-tighter` (-0.05em) applied:

                en  6.112em  "Made in Marrakech."
                fr  5.924em  "faites à Marrakech."
                ar  7.341em  "وخشب بحافة طبيعية،"      <- binding

              Arabic binds, not French as this comment previously claimed, since
              Arghavan is a heavy display face with wide advances. That figure is
              also an upper bound, because summing isolated advances ignores the
              contextual joining that makes real Arabic narrower.

              Below `md` the grid is single-column, so the line has `100vw - 48px`
              (`px-6` both sides). Dividing that by 7.341em gives the ceiling:
              11.58vw at 320px, 11.81vw at 360px, 11.95vw at 390px. The ceiling
              rises with viewport width because the 48px padding is fixed, so the
              320px case governs. 10.2vw sits about 12% under it, which is the
              margin for the `serif` fallback shown during font swap.

              This lifts a 390px phone from 32px to 40px, a 24% increase.

              `md:` is deliberately left alone. From `md` up the headline moves
              into `md:col-span-6` of a 12-column grid, roughly 320px plus the
              64px reclaimed by `md:-me-16`, which puts its own ceiling near
              6.8vw. The existing 6.4vw is already close to it.
            */}
            <h1 className="text-[10.2vw] md:text-[6.4vw] lg:text-[5.5rem] xl:text-[6.75rem] leading-[0.9] md:leading-[0.82] tracking-tighter font-display mb-2 md:mb-6 pointer-events-none relative flex flex-col items-start max-w-full md:-me-16 lg:-me-24 [&>span]:whitespace-nowrap">

              <motion.span
                initial={{ clipPath: "polygon(-10% 100%, 110% 100%, 110% 100%, -10% 100%)", y: 40 }}
                animate={{ clipPath: "polygon(-10% -20%, 110% -20%, 110% 120%, -10% 120%)", y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.77, 0, 0.175, 1] }}
                className="text-black relative z-10 drop-shadow-sm"
              >
                {t('title_part1')}
              </motion.span>

              <motion.span
                initial={{ clipPath: "polygon(-10% 100%, 110% 100%, 110% 100%, -10% 100%)", y: 40 }}
                animate={{ clipPath: "polygon(-10% -20%, 110% -20%, 110% 120%, -10% 120%)", y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.77, 0, 0.175, 1] }}
                className="text-black relative z-10 drop-shadow-sm"
              >
                {t('title_part2')}
              </motion.span>

              {/*
                The differentiator gets the gold band. Padding is em-based so
                it scales with the type; pt is the descender reserve. The band
                is a sibling behind the text (`-mt-*`), not padding on the text
                itself, so it can never clip a descender.
              */}
              <motion.span
                initial={{ clipPath: "polygon(-10% 100%, 110% 100%, 110% 100%, -10% 100%)", y: 40, opacity: 0 }}
                animate={{ clipPath: "polygon(-10% -50%, 110% -50%, 110% 150%, -10% 150%)", y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.32, ease: [0.77, 0, 0.175, 1] }}
                className="text-black relative z-10"
              >
                <span className="block bg-[#DFAB2E] px-[0.16em] pb-[0.02em] pt-[0.03em] -mt-[0.10em]">
                  {t('title_part3')}
                </span>
              </motion.span>

            </h1>
          </div>

          {/* 2. Image (Mobile: Middle, Desktop: Right side spanning both rows) */}
          {/*
            An aspect ratio at every breakpoint, never a viewport or percentage
            height.

            `h-[35vh]` at base was unstable, because viewport units change when
            mobile browser chrome collapses on scroll and the image resized
            mid-scroll. `md:h-[80%]` and `lg:h-full` were worse in a quieter way:
            a percentage height needs a definite ancestor height to resolve
            against, which is the only reason the section and grid carried
            `h-full` at all, and that fixed height is what clipped the CTAs in
            Arabic.

            The ratios are chosen so the image never becomes the reason the hero
            outgrows the viewport. Past the `max-w-7xl` cap the image column
            resolves to 727px on every screen, and a 1440x700 laptop leaves 556px
            for the grid, so `lg:aspect-[4/3]` gives 545px and Latin still fits
            the fold exactly as it did before. At `md` the column is about 456px
            and `aspect-square` matches the old `h-[80%]` closely. At base 4:3
            gives 293px against 35vh of 844 = 295px.

            The cost is that a very tall desktop no longer stretches the image to
            800px the way `lg:h-full` did. That is the price of the image no
            longer being sized by the viewport, and it is worth paying: the old
            behaviour is exactly what required the fixed height that clipped the
            Arabic CTAs.
          */}
          <motion.div 
            initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.77, 0, 0.175, 1] }}
            className="order-2 md:col-span-7 md:col-start-6 md:row-start-1 md:row-span-2 aspect-[4/3] md:aspect-square lg:aspect-[4/3] w-full relative z-10 -mt-16 sm:-mt-20 md:mt-0 rounded-sm shadow-2xl"
          >
            <motion.div
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="w-full h-full relative overflow-hidden rounded-sm"
            >
              <Image
                src="/images/hero_lifestyle.png"
                alt="Luxury handcrafted resin and walnut dining table in an elegant interior"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </motion.div>
          </motion.div>

          {/* 3. Paragraph & CTAs (Mobile: Bottom, Desktop: Bottom Left) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="order-3 md:col-span-6 md:col-start-1 md:row-start-2 flex flex-col z-30 self-start pt-4 md:pt-6"
          >
            <p className="font-sans text-gray-700 text-base md:text-lg mb-6 leading-relaxed max-w-[35ch]">
              {t('description')}
            </p>
            
            <div className="flex flex-col sm:flex-row lg:flex-row gap-4">
              <Link
                href={localizedPath('/tables', locale) as never}
                className="bg-black text-white px-6 py-4 text-center uppercase tracking-widest text-xs font-bold hover:bg-black/90 transition-transform active:scale-[0.98] whitespace-nowrap"
              >
                {t('explore')}
              </Link>
              <Link
                href={localizedPath('/inquiry', locale) as never}
                className="bg-transparent border border-black/20 text-black px-6 py-4 text-center uppercase tracking-widest text-xs font-bold hover:bg-black/5 transition-transform active:scale-[0.98] whitespace-nowrap"
              >
                {t('custom')}
              </Link>
            </div>
          </motion.div>
          
        </div>

      </div>
    </section>
  );
}

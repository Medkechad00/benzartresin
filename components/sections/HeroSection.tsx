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
  */
  return (
    <section className="relative h-[100dvh] min-h-[700px] md:min-h-[600px] w-full pt-20 pb-8 px-6 md:px-12 bg-white flex flex-col overflow-x-clip">
      <div className="w-full max-w-7xl mx-auto flex-grow flex items-center justify-center h-full">
        
          <div className="w-full grid grid-cols-1 md:grid-cols-12 md:grid-rows-[auto_1fr] gap-y-4 md:gap-y-0 md:gap-x-8 lg:gap-x-12 h-full max-h-[800px] items-center md:overflow-visible">
          
          {/* 1. Title (Mobile: Top, Desktop: Top Left) */}
          <div className="order-1 md:col-span-6 md:col-start-1 md:row-start-1 z-30 pt-8 md:pt-10 self-end md:overflow-visible">
            {/*
              Exactly three lines, always.

              The three `title_part*` strings are three flex-column children, so
              the headline is three lines only if none of them wraps. The
              `[&>span]:whitespace-nowrap` on the h1 enforces that: each part
              stays on its own line regardless of viewport or locale. French is
              the constraint here at 19 characters ("faites à Marrakech."), so
              the vw sizes are set to fit that, not the shorter English.

              Wrapping was previously possible on narrow phones, which produced
              a four or five line headline. Nowrap on the parts (rather than on
              the h1 itself) is safe because the parts are short: it cannot
              introduce horizontal scroll the way nowrap on the whole title did.
            */}
            <h1 className="text-[8.2vw] md:text-[6.4vw] lg:text-[5.5rem] xl:text-[6.75rem] leading-[0.9] md:leading-[0.82] tracking-tighter font-display mb-2 md:mb-6 pointer-events-none relative flex flex-col items-start max-w-full md:-me-16 lg:-me-24 [&>span]:whitespace-nowrap">

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
          <motion.div 
            initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.77, 0, 0.175, 1] }}
            className="order-2 md:col-span-7 md:col-start-6 md:row-start-1 md:row-span-2 h-[35vh] md:h-[80%] lg:h-full w-full relative z-10 -mt-16 sm:-mt-20 md:mt-0 rounded-sm shadow-2xl"
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
                href={localizedPath('/tables', locale) as any}
                className="bg-black text-white px-6 py-4 text-center uppercase tracking-widest text-xs font-bold hover:bg-black/90 transition-transform active:scale-[0.98] whitespace-nowrap"
              >
                {t('explore')}
              </Link>
              <Link
                href={localizedPath('/inquiry', locale) as any}
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

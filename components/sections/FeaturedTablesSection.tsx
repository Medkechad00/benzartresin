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

/**
 * Signature commissions on the homepage.
 *
 * Reads from `content/tables/tables.ts`. It previously held its own four-item
 * array in which "atlas-walnut-river" appeared twice — the same piece rendered
 * as two different cards linking to the same URL, which is duplicate content on
 * the site's highest-authority page.
 */

/** Alternating column widths, so the grid rhythm survives any table count. */
const LAYOUT = [
  { width: "md:w-[60%]", offset: "", sizes: "(max-width: 768px) 100vw, 60vw", heading: "text-3xl md:text-4xl" },
  { width: "md:w-[35%]", offset: "md:mt-32", sizes: "(max-width: 768px) 100vw, 35vw", heading: "text-2xl md:text-3xl" },
];

const SLAM_EASE = [0.23, 1, 0.32, 1] as const;

function ParallaxImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

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
          className="object-cover transform transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
          sizes={sizes}
        />
      </motion.div>
    </div>
  );
}

export function FeaturedTablesSection() {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const t = useTranslations("Featured");
  const tTables = useTranslations("Tables");
  const localized = tables.map((table) => localizeTable(table, tTables));
  const isRtl = getTextDirection(locale) === "rtl";

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div className="max-w-xl relative z-20">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-black mb-6 tracking-tight leading-[0.9]">
              <span className="bg-[#DFAB2E]">{t("title")}</span>
            </h2>
            <p className="font-sans text-gray-600 text-lg leading-relaxed">
              {t("description")}
            </p>
          </div>
          <Link
            href="/tables"
            className="group relative z-20 flex items-center gap-3 font-sans uppercase tracking-wider text-sm font-bold text-black border-b border-black pb-1 hover:text-[#DFAB2E] hover:border-[#DFAB2E] transition-colors w-fit"
          >
            {t("viewAll")}
            <ArrowRight
              size={16}
              className={`transform transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 ${rtlIconClass(isRtl)}`}
            />
          </Link>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-y-24 md:gap-y-40 gap-x-12 md:gap-x-24 relative z-10">
          {localized.map((table, index) => {
            const layout = LAYOUT[index % LAYOUT.length];
            const cover = table.images[0];

            return (
              <div
                key={table.slug}
                className={`w-full ${layout.width} ${layout.offset} flex flex-col perspective-[1200px]`}
              >
                <Link
                  href={`/tables/${table.slug}`}
                  className="relative block overflow-hidden mb-6 group"
                >
                  <div className={`relative w-full ${cover.aspect} overflow-hidden`}>
                    <motion.div
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, rotateX: 30, scale: 0.85, filter: "blur(20px)", y: 120 }
                      }
                      whileInView={{ opacity: 1, rotateX: 0, scale: 1, filter: "blur(0px)", y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.6, delay: (index % 2) * 0.1, ease: SLAM_EASE }}
                      style={{ transformOrigin: "bottom center" }}
                      className="absolute inset-0"
                    >
                      <ParallaxImage src={cover.src} alt={cover.alt} sizes={layout.sizes} />
                    </motion.div>
                  </div>
                </Link>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 30, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3, ease: SLAM_EASE }}
                  className="flex flex-col items-start"
                >
                  <h3
                    className={`font-display ${layout.heading} text-black mb-1 transition-colors`}
                  >
                    {table.name}
                  </h3>
                  <p className="font-sans text-sm text-gray-500 uppercase tracking-widest">
                    {table.wood} &amp; {table.resinColor} Resin
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

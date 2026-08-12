"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";
import { localizedPath } from "@/lib/urls";

export function InquiryCTASection() {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const t = useTranslations("InquiryCTA");

  return (
    <section className="py-24 md:py-40 px-6 md:px-12 bg-white flex justify-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-stretch gap-16 lg:gap-24">
        
        {/* Left: Emotional & Collaborative Typography */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-start py-4 md:py-0">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6 block">
              {t("eyebrow")}
            </span>
            
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl text-black mb-8 tracking-tight leading-[0.9]">
              {t("title_line1")} <br />
              <span className="bg-[#DFAB2E] text-black px-2 mt-2 inline-block shadow-sm">{t("title_highlight")}</span>
            </h2>
            
            <p className="font-sans text-gray-600 leading-relaxed text-lg md:text-xl max-w-md mb-12">
              {t("description")}
            </p>

            <Link
              href={localizedPath('/inquiry', locale) as any}
              className="group relative inline-flex items-center gap-6 pb-4 border-b-2 border-black hover:border-[#DFAB2E] transition-colors duration-500 w-max"
            >
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-bold text-black group-hover:text-[#DFAB2E] transition-colors">
                {t("cta")}
              </span>
              <ArrowRight size={18} className="text-black group-hover:text-[#DFAB2E] transform group-hover:translate-x-2 rtl:-scale-x-100 rtl:group-hover:-translate-x-2 transition-transform duration-500" />
            </Link>
          </motion.div>
        </div>

        {/* Right: Clean Editorial Image */}
        <div className="w-full md:w-1/2 relative">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full h-full min-h-[400px] md:min-h-0 overflow-hidden shadow-2xl rounded-sm"
          >
            <Image
              src="/images/table_golden_current.png"
              alt={t("imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
          
          {/* Subtle decorative element */}
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            whileInView={{ opacity: 1, height: "40%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="absolute -end-6 md:-end-12 bottom-12 w-[1px] bg-black/10 hidden md:block" 
          />
        </div>

      </div>
    </section>
  );
}

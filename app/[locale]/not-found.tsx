"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { localizedPath } from "@/lib/urls";
import { motion } from "motion/react";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-white flex flex-col overflow-x-clip">
      <Navbar theme="light" />

      <div className="flex-grow flex items-center relative">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left: Copy */}
            <div className="lg:col-span-7 max-w-xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-8"
              >
                {t("eyebrow")}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="font-display text-[18vw] md:text-[10rem] lg:text-[12rem] leading-[0.85] tracking-tighter text-black mb-2"
              >
                404
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="h-[2px] bg-[#DFAB2E] mb-10 origin-left"
              />

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="font-display text-3xl md:text-5xl text-black tracking-tight leading-[1.1] mb-8"
              >
                {t("title")}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="font-sans text-gray-500 text-lg md:text-xl leading-relaxed max-w-md mb-12"
              >
                {t("description")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Link
                  href={localizedPath("/tables", locale) as any}
                  className="group inline-flex items-center gap-4 bg-black text-white px-8 py-5 uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-all duration-500 active:scale-[0.98]"
                >
                  {t("cta")}
                  <span className="inline-block transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100">
                    →
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* Right: decorative ghost number */}
            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative w-full max-w-sm aspect-square"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-[30vw] md:text-[20rem] leading-none text-black/[0.03] select-none pointer-events-none">
                    404
                  </span>
                </div>

                <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 bg-[#DFAB2E]/10 rotate-45" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-display text-6xl md:text-8xl text-black/10 tracking-tighter">?</p>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

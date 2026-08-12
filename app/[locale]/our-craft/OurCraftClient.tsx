"use client";

import Image from "next/image";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const RevealParagraph = ({ children, delay = 0, firstLetter = false }: { children: React.ReactNode, delay?: number, firstLetter?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
    className={`font-sans text-lg md:text-xl text-gray-700 leading-relaxed mb-12 ${firstLetter ? 'first-letter-dropcap' : ''}`}
  >
    {children}
  </motion.div>
);

const CinematicImageBreak = ({ src, alt, caption }: { src: string, alt: string, caption: string }) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imgRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <figure className="my-16 md:my-24 relative w-full">
      <div ref={imgRef} className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 w-full h-[130%]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
      </div>
      <figcaption className="text-start font-sans text-xs uppercase tracking-widest text-gray-400 mt-4">
        {caption}
      </figcaption>
    </figure>
  );
};

type Phase = { title: string; body: string; alt: string };

const PHASE_IMAGES = [
  "/images/process_wood_selection.png",
  "/images/material_detail.png",
  "/images/process_final_finish.png",
] as const;

export default function OurCraftClient() {
  const t = useTranslations("OurCraft");

  const phases = (t.raw("phases") as Phase[]).map((phase, i) => ({
    ...phase,
    image: PHASE_IMAGES[i],
  }));

  return (
    <PageLayout>
      <style dangerouslySetInnerHTML={{__html: `
        .first-letter-dropcap::first-letter {
          font-family: var(--font-display);
          font-size: 7rem;
          line-height: 0.8;
          float: left;
          margin-inline-end: 1.5rem;
          margin-top: 0.5rem;
          color: #DFAB2E;
        }
      `}} />

      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

          <div className="lg:w-1/3 lg:sticky lg:top-40 shrink-0">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8"
            >
              <span className="bg-[#DFAB2E]">{t("title")}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-gray-600 text-lg leading-relaxed mb-8 pe-8"
            >
              {t("description")}
            </motion.p>
          </div>

          <div className="lg:w-2/3 flex flex-col min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-gray-100 mb-16"
            >
              <Image
                src="/images/about_artisan.png"
                alt={t("artisanAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl text-black tracking-tight mb-8"
            >
              {t("philosophyHeading")}
            </motion.h2>

            <RevealParagraph firstLetter>{t("philosophyBody1")}</RevealParagraph>
            <RevealParagraph>{t("philosophyBody2")}</RevealParagraph>

            <CinematicImageBreak
              src="/images/workshop_wide.png"
              alt={t("workshopAlt")}
              caption={t("workshopCaption")}
            />

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl text-black tracking-tight mb-8 mt-8"
            >
              {t("studioHeading")}
            </motion.h2>

            <RevealParagraph>{t("studioBody1")}</RevealParagraph>
            <RevealParagraph>{t("studioBody2")}</RevealParagraph>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl text-black tracking-tight mb-4 mt-8 pt-16 border-t border-black/10"
            >
              {t("processHeading")}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full aspect-[21/9] my-12 overflow-hidden bg-gray-100"
            >
              <Image
                src="/images/process_resin_pour.png"
                alt={t("heroAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </motion.div>

            <div className="flex flex-col gap-16 md:gap-24">
              {phases.map((phase, index) => (
                <motion.div
                  key={phase.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col gap-6"
                >
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <Image
                      src={phase.image}
                      alt={phase.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>
                  <div>
                    <span className="font-sans text-xs text-gray-400 uppercase tracking-widest block mb-3">
                      {t("phaseLabel")} {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl text-black mb-4">{phase.title}</h3>
                    <p className="font-sans text-gray-600 leading-relaxed text-base md:text-lg">{phase.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </PageLayout>
  );
}

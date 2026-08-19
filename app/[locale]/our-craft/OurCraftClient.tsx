"use client";

import Image from "next/image";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

const RevealParagraph = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
    className="font-sans text-lg md:text-xl text-gray-700 leading-relaxed"
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
    <figure className="my-8 md:my-12 relative w-full">
      {/*
        Aspect ratio rather than `h-[50vh] md:h-[70vh]`, for the same reason as
        the matching figure in ContactClient: viewport units change when mobile
        browser chrome collapses on scroll, resizing the frame mid-scroll and
        fighting the parallax transform above it.
      */}
      <div ref={imgRef} className="relative w-full aspect-[3/2] md:aspect-[16/9] overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 w-full h-[130%]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
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

/**
 * One photograph per phase, index-matched to `OurCraft.phases` in the message
 * files. The order is load-bearing, so it is paired with each phase's authored
 * alt text below:
 *
 *   0 Consultation  "Consultation call with a client"
 *   1 Design        "Measured drawing and material board"
 *   2 Selection     "Client choosing a walnut board from photographs"
 *   3 Production    "Resin being poured into a mould"
 *   4 Delivery      "Table being installed in a client's home"
 *
 * This array held three entries against five phases, so `PHASE_IMAGES[3]` and
 * `[4]` were `undefined`. next/image renders an undefined src as `src=""`, which
 * makes the browser re-request the current document: two broken images and two
 * wasted page loads on every visit to this route, in all three locales.
 *
 * Filling it in also corrects two mismatches that existed among the three that
 * were present: index 0 showed wood selection under the consultation alt, and
 * index 2 showed the final finish under the board-selection alt. Alt text that
 * describes something the image does not show is worse than no alt at all.
 *
 * Phase 0 is the one honest compromise: there is no consultation photograph in
 * the library, so it uses the workshop establishing shot. That alt string should
 * be rewritten to match, or a real photograph supplied.
 */
const PHASE_IMAGES = [
  "/images/workshop_wide.png",
  "/images/material_detail.png",
  "/images/process_wood_selection.png",
  "/images/process_resin_pour.png",
  "/images/hero_lifestyle.png",
] as const;

export default function OurCraftClient() {
  const t = useTranslations("OurCraft");
  const processSectionRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [isInProcessSection, setIsInProcessSection] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!processSectionRef.current) return;
    const rect = processSectionRef.current.getBoundingClientRect();
    setIsInProcessSection(rect.top < window.innerHeight * 0.4);
  });

  const phases = (t.raw("phases") as Phase[]).map((phase, i) => ({
    ...phase,
    /*
      Never `undefined`. The phase list is authored content and can grow, so a
      sixth phase must degrade to a real photograph rather than to `src=""`.
    */
    image: PHASE_IMAGES[i] ?? PHASE_IMAGES[PHASE_IMAGES.length - 1],
  }));

  return (
    <PageLayout>
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

          {/* Sticky sidebar — switches content when process section is in view */}
          <div className="lg:w-1/3 lg:sticky lg:top-40 shrink-0">
            {isInProcessSection ? (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8"
                >
                  <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                    {t("processHeading")}
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-sans text-gray-600 text-lg leading-relaxed mb-8 pe-8"
                >
                  {t("description")}
                </motion.p>
              </>
            ) : (
              <>
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
              </>
            )}
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
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {t("philosophyHeading")}
              </span>
            </motion.h2>

            <div className="space-y-4 mb-12">
              <RevealParagraph>{t("philosophyBody1")}</RevealParagraph>
              <RevealParagraph>{t("philosophyBody2")}</RevealParagraph>
            </div>

            <CinematicImageBreak
              src="/images/workshop_wide.png"
              alt={t("workshopAlt")}
              caption={t("workshopCaption")}
            />

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl text-black tracking-tight mb-8 mt-4"
            >
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {t("studioHeading")}
              </span>
            </motion.h2>

            <div className="space-y-4 mb-12">
              <RevealParagraph>{t("studioBody1")}</RevealParagraph>
              <RevealParagraph>{t("studioBody2")}</RevealParagraph>
            </div>

            <div ref={processSectionRef}>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-3xl md:text-4xl text-black tracking-tight mb-4 mt-8 pt-16 border-t border-black/10"
              >
                <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                  {t("processHeading")}
                </span>
              </motion.h2>

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
                      <h3 className="font-display text-2xl md:text-3xl text-black mb-4">
                        <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                          {phase.title}
                        </span>
                      </h3>
                      <p className="font-sans text-gray-600 leading-relaxed text-base md:text-lg">{phase.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </PageLayout>
  );
}

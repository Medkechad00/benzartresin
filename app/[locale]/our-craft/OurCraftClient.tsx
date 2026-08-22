"use client";

import Image from "next/image";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { craftLeadImage, craftPourImage, craftPhaseImages } from "@/content/section-images";

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

const CinematicImageBreak = ({
  src,
  alt,
  caption,
  blurDataURL,
}: {
  src: string;
  alt: string;
  caption: string;
  blurDataURL: string;
}) => {
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
            loading="lazy"
            placeholder="blur"
            blurDataURL={blurDataURL}
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </motion.div>
      </div>
      <figcaption className="text-start font-sans text-xs uppercase tracking-widest text-gray-600 mt-4">
        {caption}
      </figcaption>
    </figure>
  );
};

type Phase = { title: string; body: string; alt: string };

/**
 * The phase photographs now live in `content/section-images.ts` as
 * `craftPhaseImages`, index-matched to `OurCraft.phases` in the message files.
 *
 * WHAT THIS REPLACES. A local array of five `/images/*.png` paths — placeholders,
 * three of which were also used elsewhere on this same page, so the route showed
 * the same photograph three times. It has been swapped for the five supplied
 * `phase1`..`phase5` assets, mapped to steps 1-5 in filename order.
 *
 * Phases 3, 4 and 5 depict their step literally: a slab being milled, a cured top
 * being trimmed, a wrapped table carried into a villa. Phases 1 and 2 are both
 * finished tables standing in for "Consultation" and "Design", which are not
 * things the studio has photographed. The alt text in the message files describes
 * what is actually in each frame rather than repeating the step name, so the page
 * never claims to show a consultation that is not there.
 */

export default function OurCraftClient() {
  const t = useTranslations("OurCraft");
  const processSectionRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [isInProcessSection, setIsInProcessSection] = useState(false);

  /**
   * The callback takes no argument on purpose.
   *
   * `useMotionValueEvent` supplies the latest scroll offset, but this handler
   * needs the section's position relative to the viewport, not the document, so
   * it reads `getBoundingClientRect()` instead and the argument was unused.
   */
  useMotionValueEvent(scrollY, "change", () => {
    if (!processSectionRef.current) return;
    const rect = processSectionRef.current.getBoundingClientRect();
    setIsInProcessSection(rect.top < window.innerHeight * 0.4);
  });

  const phases = (t.raw("phases") as Phase[]).map((phase, i) => ({
    ...phase,
    /*
      Never `undefined`. The phase list is authored content and can grow, so a
      sixth phase must degrade to a real photograph rather than to `src=""`,
      which next/image renders as a re-request of the current document.
    */
    image: craftPhaseImages[i] ?? craftPhaseImages[craftPhaseImages.length - 1]!,
  }));

  return (
    <PageLayout>
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

          {/* Sticky sidebar — heading swaps when the process section is in view */}
          <div className="lg:w-1/3 lg:sticky lg:top-40 shrink-0">
            {/*
              One <h1> and one <p>, not two copies of both.

              These were two sibling branches whose only difference was the
              heading key — `processHeading` versus `title` — with a byte-identical
              paragraph duplicated in each. Because the branches were separate
              elements, crossing the section boundary UNMOUNTED one subtree and
              mounted the other, which replayed both entry animations every single
              time the visitor scrolled across the threshold. Switching the text
              inside stable elements keeps the intended swap, animates once, and
              guarantees the page has exactly one h1 element rather than two that
              alternate.
            */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8"
            >
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {isInProcessSection ? t("processHeading") : t("title")}
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
          </div>

          <div className="lg:w-2/3 flex flex-col min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-gray-100 mb-16"
            >
              <Image
                src={craftLeadImage.src}
                alt={t("leadImageAlt")}
                fill
                /*
                  Lead image of the route and its LCP element. `priority` was
                  deprecated in Next 16 in favour of stating the intent directly.
                */
                loading="eager"
                fetchPriority="high"
                placeholder="blur"
                blurDataURL={craftLeadImage.blurDataURL}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
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
              src={craftPourImage.src}
              alt={t("workshopAlt")}
              caption={t("workshopCaption")}
              blurDataURL={craftPourImage.blurDataURL}
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
                    <div className="relative aspect-[16/9] bg-ivory-dark">
                      <Image
                        src={phase.image.src}
                        alt={phase.alt}
                        fill
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={phase.image.blurDataURL}
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                    </div>
                    <div>
                      <span className="font-sans text-xs text-gray-600 uppercase tracking-widest block mb-3">
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

"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

type Step = {
  title: string;
  description: string;
  image: string;
  /** Descriptive alt text — process stage, material, and what is visible. */
  alt: string;
};

/**
 * Image and alt text stay in code because they describe fixed assets, while the
 * translatable prose comes from messages/*.json and is zipped in at render.
 */
const STEP_ASSETS = [
  {
    image: "/images/process_wood_selection.png",
    alt: "Raw walnut slabs racked in the Marrakech workshop during selection, showing grain and live edges before milling",
  },
  {
    image: "/images/process_resin_pour.png",
    alt: "Epoxy resin being hand-poured in layers into a sealed form around a live-edge walnut slab",
  },
  {
    image: "/images/process_final_finish.png",
    alt: "Artisan hand-polishing the cured resin and walnut surface to an even sheen at the finishing bench",
  },
] as const;

function Word({
  children,
  progress,
  range,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.1, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block relative">
      {children}
    </motion.span>
  );
}

function StepRow({
  step,
  index,
  stepLabel,
  reduceMotion,
}: {
  step: Step;
  index: number;
  stepLabel: string;
  reduceMotion: boolean | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Track natural scrolling. Text reveals between the time it enters the screen (80% down) and reaches the middle.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "center center"]
  });

  const isEven = index % 2 !== 0;
  const words = step.description.split(" ");
  
  // Parallax effect: The image translates slightly as you scroll, making it feel "stopped" or detached.
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    // EXACT ORIGINAL GRID CONTAINER
    <div ref={ref} className="relative w-full group">
      <div className={`flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}>
        
        {/* Image side - exact original grid spacing */}
        <div className="w-full md:w-1/2 relative h-[60vh] md:h-[80vh] overflow-hidden">
          
          {/* Expensive Entrance Animation for Image */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 1.15, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Parallax Wrapper */}
            <motion.div style={{ y: reduceMotion ? 0 : imageY, height: "120%" }} className="absolute -top-[10%] w-full transform-gpu">
              <Image
                src={step.image}
                alt={step.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={index === 0}
              />
            </motion.div>
          </motion.div>
          
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent duration-700 pointer-events-none" />
        </div>

        {/* Text side - exact original grid spacing */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-12 md:p-24 bg-gray-50/50 md:bg-transparent">
          <div className="max-w-md w-full">
            
            {/* Title appears instantly when scrolled into view */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="font-sans text-xs md:text-sm text-gray-400 block mb-4 uppercase tracking-widest">
                {stepLabel} {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-3xl md:text-4xl text-black mb-6">
                <span className="bg-[#DFAB2E]">{step.title}</span>
              </h3>
            </motion.div>
            
            {/* Scroll-driven word reveal mapped perfectly to natural scroll progress */}
            <p className="font-sans text-gray-600 leading-relaxed text-base md:text-lg flex flex-wrap gap-x-1 mt-4">
              {words.map((word: string, i: number) => {
                const start = (i / words.length);
                const end = start + (1 / words.length);
                
                return (
                  <Word key={i} progress={scrollYProgress} range={[start, end]}>
                    {word}
                  </Word>
                );
              })}
            </p>
            
          </div>
        </div>

      </div>
    </div>
  );
}

export function CraftsmanshipSection() {
  const reduceMotion = useReducedMotion();
  const t = useTranslations("CraftsmanshipSection");

  // Zip translated prose onto the fixed image assets.
  const copy = t.raw("steps") as { title: string; description: string }[];
  const steps: Step[] = copy.map((s, i) => ({
    ...s,
    image: STEP_ASSETS[i].image,
    alt: STEP_ASSETS[i].alt,
  }));

  return (
    <section className="pt-16 md:pt-24 pb-0 bg-white text-black overflow-hidden relative">
      
      {/* Title Container - Padding logic matched perfectly to FeaturedTablesSection */}
      <div className="w-full px-6 md:px-12">
        <div className="max-w-7xl mx-auto mb-16 md:mb-24 relative z-10">
          <div className="max-w-full">
            <motion.h2 
              initial={reduceMotion ? false : { opacity: 0, y: 40, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className="font-display text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-[0.9] mb-6"
            >
              <span className="bg-[#DFAB2E]">{t("title")}</span>
            </motion.h2>
            
            <motion.p 
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="font-sans text-gray-600 text-lg leading-relaxed"
            >
              {t("description")}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full relative z-10">
        {steps.map((step, index) => (
          <StepRow
            key={step.title}
            step={step}
            index={index}
            stepLabel={t("stepLabel")}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}

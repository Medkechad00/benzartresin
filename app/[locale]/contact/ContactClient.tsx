"use client";

import { PageLayout } from "@/components/layout/PageLayout";
import { contactImage } from "@/content/section-images";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildLocalBusinessSchema } from "@/lib/seo/schema";
import { SITE } from "@/lib/site-config";
import { localizedPath, toHref } from "@/lib/urls";

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
    <figure className="my-16 md:my-24 relative w-full">
      {/*
        Aspect ratio rather than `h-[50vh] md:h-[70vh]`.

        Viewport units are unstable on phones: the value changes when browser
        chrome collapses on scroll, so the frame resized mid-scroll and reflowed
        everything below it, which also fights the parallax transform above. A
        ratio derives height from width and does not move. 3:2 at base and 16:9
        from `md` land close to what the old percentages produced.
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
            /*
              `sizes` was missing entirely, so the browser assumed 100vw and
              downloaded the largest candidate on every viewport. This figure is
              full-bleed inside a capped container, so 100vw below the cap and
              1280px above it.
            */
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

export default function ContactClient() {
  const locale = useLocale();
  const t = useTranslations("Contact");
  return (
    <PageLayout>
      <JsonLd data={buildLocalBusinessSchema(locale)} />
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="border-t border-black/10 pt-8"
            >
              <p className="font-sans text-gray-600 leading-relaxed mb-4 pe-8">
                {t("commissionNote")}
              </p>
              <Link
                href={toHref(localizedPath('/inquiry', locale))}
                className="inline-block bg-black text-white px-6 py-4 uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-colors active:scale-[0.98]"
              >
                {t("commissionCta")}
              </Link>
            </motion.div>
          </div>

          <div className="lg:w-2/3 flex flex-col min-w-0">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-16 border-t border-black/10 pt-16"
            >
              <div>
                {/*
                  `h2`, not `h3`. These three sit directly under the page `h1`,
                  so `h3` skipped a level in the document outline.
                */}
                <h2 className="font-sans font-bold uppercase tracking-widest text-xs mb-6 text-[#DFAB2E]">{t("generalHeading")}</h2>
                <a href={`mailto:${SITE.email}`} className="block font-display text-2xl md:text-3xl text-black hover:text-gray-600 transition-colors mb-2 break-words">{SITE.email}</a>
                {SITE.telephone ? (
                  <a href={`tel:${SITE.telephone}`} className="block font-sans text-gray-600 hover:text-black transition-colors text-end" dir="ltr">{SITE.telephoneDisplay}</a>
                ) : null}
              </div>

              <div>
                <h2 className="font-sans font-bold uppercase tracking-widest text-xs mb-6 text-[#DFAB2E]">{t("atelierHeading")}</h2>
                <p className="font-display text-2xl md:text-3xl text-black mb-2">{t("address.street")}</p>
                <p className="font-sans text-gray-600">{t("address.locality")}, {t("address.country")}</p>
              </div>

              <div>
                <h2 className="font-sans font-bold uppercase tracking-widest text-xs mb-6 text-[#DFAB2E]">{t("socialHeading")}</h2>
                {SITE.socialLinks.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {SITE.socialLinks.map(({ name, url }) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="font-display text-2xl md:text-3xl text-black hover:text-gray-600 transition-colors">
                        {name}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="font-sans text-gray-600">{t("socialEmpty")}</p>
                )}
              </div>
            </motion.div>

            <div className="mt-8">
              <CinematicImageBreak
                src={contactImage.src}
                alt={t("workshopAlt")}
                caption={t("workshopCaption")}
                blurDataURL={contactImage.blurDataURL}
              />
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}

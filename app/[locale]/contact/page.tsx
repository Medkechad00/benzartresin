"use client";

import { PageLayout } from "@/components/layout/PageLayout";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildLocalBusinessSchema } from "@/lib/seo/schema";
import { SITE } from "@/lib/site-config";
import { localizedPath } from "@/lib/urls";

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
          />
        </motion.div>
      </div>
      <figcaption className="text-start font-sans text-xs uppercase tracking-widest text-gray-400 mt-4">
        {caption}
      </figcaption>
    </figure>
  );
};

export default function ContactPage() {
  const locale = useLocale();
  const t = useTranslations("Contact");
  return (
    <PageLayout>
      <JsonLd data={buildLocalBusinessSchema(locale)} />
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Sticky Left Column */}
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

            {/*
              Commission enquiries belong on /inquiry, which collects the room,
              budget, and destination we need to quote. Sending them to a plain
              email address loses all of that.
            */}
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
                href={localizedPath('/inquiry', locale) as any}
                className="inline-block bg-black text-white px-6 py-4 uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-colors active:scale-[0.98]"
              >
                {t("commissionCta")}
              </Link>
            </motion.div>
          </div>

          {/* Scrolling Content Column */}
          <div className="lg:w-2/3 flex flex-col min-w-0">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-16 border-t border-black/10 pt-16"
            >
              <div>
                <h3 className="font-sans font-bold uppercase tracking-widest text-xs mb-6 text-[#DFAB2E]">{t("generalHeading")}</h3>
                <a href={`mailto:${SITE.email}`} className="block font-display text-2xl md:text-3xl text-black hover:text-gray-500 transition-colors mb-2 break-words">{SITE.email}</a>
                {/*
                  Phone and schema both read from SITE, so the visible number can
                  never drift from the one in LocalBusiness markup. `telephone` is
                  E.164 for the tel: href; `telephoneDisplay` is the human form.
                */}
                {SITE.telephone ? (
                  <a href={`tel:${SITE.telephone}`} className="block font-sans text-gray-600 hover:text-black transition-colors" dir="ltr">{SITE.telephoneDisplay}</a>
                ) : null}
              </div>

              {/*
                Press & Media block removed at the studio's request. Its address
                was the same inbox as general enquiries, so it was a second door
                onto one room. `SITE.pressEmail` is retained in config for
                whenever a real press contact exists.
              */}

              <div>
                <h3 className="font-sans font-bold uppercase tracking-widest text-xs mb-6 text-[#DFAB2E]">{t("atelierHeading")}</h3>
                <p className="font-display text-2xl md:text-3xl text-black mb-2">{SITE.address.streetAddress}</p>
                <p className="font-sans text-gray-600">{SITE.address.addressLocality}, Morocco</p>
              </div>

              <div>
                <h3 className="font-sans font-bold uppercase tracking-widest text-xs mb-6 text-[#DFAB2E]">{t("socialHeading")}</h3>
                {/*
                  Rendered from SITE.socialLinks — the studio's real, confirmed
                  profiles, and the same URLs `sameAs` points at in schema.
                */}
                {SITE.socialLinks.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {SITE.socialLinks.map(({ name, url }) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="font-display text-2xl md:text-3xl text-black hover:text-gray-500 transition-colors">
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
                src="/images/workshop_wide.png"
                alt={t("workshopAlt")}
                caption={t("workshopCaption")}
              />
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}

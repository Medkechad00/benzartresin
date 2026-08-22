"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion, AnimatePresence } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQPageSchema } from "@/lib/seo/schema";
import { localizedPath, toHref } from "@/lib/urls";

type FaqItem = { question: string; answer: string };

export default function FaqClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const locale = useLocale();
  const t = useTranslations("Faq");

  const faqs = t.raw("items") as FaqItem[];

  return (
    <PageLayout>
      <JsonLd data={buildFAQPageSchema(faqs)} />
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">

        <header className="mb-20 max-w-2xl">
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
            className="font-sans text-gray-600 text-lg leading-relaxed"
          >
            {t("description")}
          </motion.p>
        </header>

        <div className="flex flex-col">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="border-b border-black/10"
              >
                {/*
                  `h2`, not `h3`. The page heading is the `h1` above, so `h3`
                  skipped a level on every question — and with 8+ items that was
                  8+ breaks in the outline on one page.
                */}
                <h2>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-8 py-8 text-start group"
                  >
                    <span className="font-display text-2xl group-hover:text-gold-ink transition-colors">
                      {faq.question}
                    </span>
                    <CaretDown
                      size={24}
                      weight="light"
                      aria-hidden="true"
                      className={`shrink-0 transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </h2>
                {/*
                  The panel container is always in the DOM, so `aria-controls`
                  above always resolves.

                  Previously `AnimatePresence` unmounted the whole panel when
                  closed, which left `aria-controls="faq-panel-N"` pointing at a
                  non-existent element on every collapsed item — an invalid ARIA
                  reference on all but one question at any moment. The wrapper
                  now persists and only its contents animate in and out, which
                  keeps the exit transition and makes the reference honest.
                */}
                <div id={panelId} role="region" aria-labelledby={buttonId}>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="font-sans text-gray-600 leading-relaxed pb-8 max-w-3xl">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 border-t border-black/10 pt-12 flex flex-col sm:flex-row sm:items-center gap-6">
          <p className="font-display text-2xl text-black">{t("stillAsking")}</p>
          <Link
            href={toHref(localizedPath('/inquiry', locale))}
            className="bg-black text-white px-8 py-4 text-center uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-colors active:scale-[0.98] w-fit"
          >
            {t("stillAskingCta")}
          </Link>
        </div>
        </div>
      </div>
    </PageLayout>
  );
}

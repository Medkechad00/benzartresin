"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion, AnimatePresence } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQPageSchema } from "@/lib/seo/schema";
import { localizedPath } from "@/lib/urls";

type FaqItem = { question: string; answer: string };

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const locale = useLocale();
  const t = useTranslations("Faq");

  /**
   * Questions come from messages/*.json so the FAQ is genuinely localised in
   * all three languages — and so the FAQPage schema emitted below matches the
   * visible text on each locale. Schema that disagrees with the rendered copy
   * is invalid markup, so both must read from one source.
   */
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
                <h3>
                  <button
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-8 py-8 text-start group"
                  >
                    <span className="font-display text-2xl group-hover:text-gold transition-colors">
                      {faq.question}
                    </span>
                    <CaretDown
                      size={24}
                      weight="light"
                      aria-hidden="true"
                      className={`shrink-0 transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
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
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 border-t border-black/10 pt-12 flex flex-col sm:flex-row sm:items-center gap-6">
          <p className="font-display text-2xl text-black">{t("stillAsking")}</p>
          <Link
            href={localizedPath('/inquiry', locale) as any}
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

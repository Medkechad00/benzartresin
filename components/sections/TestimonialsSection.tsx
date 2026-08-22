"use client";

import { motion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { testimonials } from "@/content/testimonials";
import { localizedPath, toHref } from "@/lib/urls";

/**
 * Client words.
 *
 * This section previously shipped five invented reviews dressed in Google's
 * review UI — the official G logo, a "4.9 / based on 42 reviews" aggregate,
 * "Local Guide · N reviews" bylines, green verified-purchase badges, working
 * "Helpful" counters, and studio product renders labelled as customer photos.
 * All of it was fabricated. That is a Google manual-action trigger, a trademark
 * problem, and an offence under UK/EU consumer law, so it has been removed
 * rather than softened.
 *
 * While `content/testimonials.ts` is empty this renders an honest empty state
 * that reads as a placeholder. Real quotes drop straight in with no further
 * changes here. No Review or AggregateRating schema is emitted in either case.
 */
export function TestimonialsSection() {
  const locale = useLocale();
  const t = useTranslations("Testimonials");
  const tc = useTranslations("Common");

  const reveal = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.4 },
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const },
  };

  return (
    <section
      id="testimonials"
      className="py-16 md:py-24 px-6 md:px-12 bg-white relative border-t border-black/5"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
        <div className="w-full lg:w-[35%]">
          <motion.div {...reveal}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-[0.9] mb-6">
              <span className="bg-[#DFAB2E]">{t("title")}</span>
            </h2>
            <p className="font-sans text-gray-600 text-lg leading-relaxed max-w-prose">
              {t("subtitle")}
            </p>
          </motion.div>
        </div>

        <div className="w-full lg:w-[65%]">
          {testimonials.length === 0 ? (
            <motion.div
              {...reveal}
              className="border border-dashed border-black/20 bg-ivory/40 p-8 md:p-12"
            >
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-gray-600 mb-4">
                {t("eyebrow")}
              </p>
              <p className="font-sans text-gray-700 text-lg leading-relaxed max-w-prose mb-8">
                {t("body")}
              </p>
              <p className="font-sans text-gray-600 leading-relaxed max-w-prose mb-10">
                {t("secondary")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={toHref(localizedPath('/tables', locale))}
                  className="bg-black text-white px-6 py-4 text-center uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-colors active:scale-[0.98]"
                >
                  {tc("seeCollection")}
                </Link>
                <Link
                  href={toHref(localizedPath('/our-craft', locale))}
                  className="border border-black/20 text-black px-6 py-4 text-center uppercase tracking-widest text-xs font-bold hover:bg-black/5 transition-colors active:scale-[0.98]"
                >
                  {tc("insideAtelier")}
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-8">
              {testimonials.map((item, index) => (
                <motion.figure
                  key={`${item.author}-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.12,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="bg-white p-6 md:p-10 border border-black/5 shadow-sm"
                >
                  <blockquote className="font-sans text-gray-800 leading-relaxed text-base md:text-lg mb-6">
                    {item.quote}
                  </blockquote>
                  <figcaption className="font-sans text-xs uppercase tracking-[0.2em] text-gray-600">
                    <span className="text-black font-bold">{item.author}</span>
                    {item.location ? <span> · {item.location}</span> : null}
                    {item.commission ? (
                      <span className="block mt-2 tracking-normal normal-case text-gray-600">
                        {item.commission}
                      </span>
                    ) : null}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

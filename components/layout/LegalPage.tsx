"use client";

import { PageLayout } from "@/components/layout/PageLayout";
import { motion } from "motion/react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { localizedPath } from "@/lib/urls";

type Section = { heading: string; body: string };

/**
 * Shared shell for the two legal pages.
 *
 * Both were previously hardcoded English with an identical layout duplicated
 * across two files, and both used the locale-unaware `next/link` so the
 * cross-link between them dropped visitors back to the default locale.
 *
 * Section headings and bodies now come from `messages/*.json`, so the sidebar
 * navigation is generated from the same array that renders the content and the
 * two can never fall out of sync.
 */
export function LegalPage({
  titleKey,
  introKey,
  sectionsKey,
  crossLinkHref,
  crossLinkLabelKey,
}: {
  titleKey: "privacyTitle" | "termsTitle";
  introKey: "privacyIntro" | "termsIntro";
  sectionsKey: "privacySections" | "termsSections";
  crossLinkHref: "/privacy" | "/terms";
  crossLinkLabelKey: "privacy" | "terms";
}) {
  const t = useTranslations("Legal");
  const tf = useTranslations("Footer");
  const locale = useLocale();
  const sections = t.raw(sectionsKey) as Section[];

  return (
    <PageLayout>
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

          {/* Sticky Sidebar */}
          <div className="lg:w-1/3 lg:sticky lg:top-40 shrink-0">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8"
            >
              <span className="bg-[#DFAB2E]">{t(titleKey)}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-gray-600 text-lg leading-relaxed mb-4 pe-8"
            >
              {t(introKey)}
            </motion.p>
            <p className="font-sans text-xs uppercase tracking-widest text-gray-400">
              {t("lastUpdated")}: 2026-08
            </p>

            <div className="hidden lg:block border-t border-black/10 pt-8 mt-8">
              <ul className="flex flex-col gap-3 font-sans text-sm text-gray-500">
                {sections.map((section) => (
                  <li key={section.heading}>
                    <a
                      href={`#${slugify(section.heading)}`}
                      className="hover:text-black border-s-2 border-transparent hover:border-[#DFAB2E] ps-3 -ms-[2px] transition-colors block"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
                <li className="mt-4">
                  <Link href={localizedPath(crossLinkHref, locale) as any} className="text-gray-400 hover:text-black transition-colors underline">
                    {tf(crossLinkLabelKey)}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:w-2/3 flex flex-col min-w-0">
            {sections.map((section, index) => (
              <motion.section
                key={section.heading}
                id={slugify(section.heading)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: index === 0 ? 0.2 : 0 }}
                className="scroll-mt-32 mb-14"
              >
                <h2 className="font-display text-3xl md:text-4xl mb-6">
                  <span className="bg-[#DFAB2E]">{section.heading}</span>
                </h2>
                <p className="font-sans text-gray-600 leading-relaxed text-base md:text-lg max-w-prose">
                  {section.body}
                </p>
              </motion.section>
            ))}
          </div>

        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Anchor ids from headings. Latin headings become readable slugs; Arabic ones
 * have no ASCII to keep, so they fall back to a stable index-free hash of the
 * string rather than collapsing to an empty id.
 */
function slugify(value: string): string {
  const ascii = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (ascii) return ascii;

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return `s-${Math.abs(hash).toString(36)}`;
}

"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { tables } from "@/content/tables/tables";
import { localizeTable } from "@/lib/tables-i18n";
import { tableSlug } from "@/lib/urls";

/**
 * The collection gallery.
 *
 * Sources every card from `content/tables/tables.ts`. It previously carried its
 * own hardcoded array whose slugs had drifted from the real data — three of the
 * five cards ("walnut-river", "olive-console", "material-detail") linked to
 * pages that did not exist, so a third of the gallery 404'd.
 *
 * It also used `next/link` rather than the locale-aware `Link` from
 * `@/i18n/routing`, which emitted unprefixed hrefs like `/tables/x`. Those only
 * resolved via a middleware redirect, so every internal click cost an extra hop
 * and dropped visitors back to the default locale.
 */

/** Column spans, cycled by position. Keeps the masonry rhythm data-independent. */
const SPANS = [
  "col-span-1 md:col-span-7",
  "col-span-1 md:col-span-5",
  "col-span-1 md:col-span-12",
];

export default function TablesPage() {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const t = useTranslations("TablesPage");
  const tTables = useTranslations("Tables");

  const localized = tables.map((table) => localizeTable(table, tTables));

  return (
    <PageLayout>
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <header className="mb-20 max-w-2xl">
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8"
            >
              <span className="bg-[#DFAB2E]">{t("title")}</span>
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-gray-600 text-lg leading-relaxed"
            >
              {t("description")}
            </motion.p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {localized.map((table, index) => {
              const cover = table.images[0];
              return (
                <Link
                  href={`/tables/${tableSlug(table.slug, locale)}` as any}
                  key={table.slug}
                  className={`${SPANS[index % SPANS.length]} group flex flex-col`}
                >
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="flex flex-col h-full"
                  >
                    <div
                      className={`relative w-full overflow-hidden ${cover.aspect} mb-4 bg-gray-100`}
                    >
                      <Image
                        src={cover.src}
                        alt={cover.alt}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1100px"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <h2 className="font-display text-xl group-hover:text-[#DFAB2E] transition-colors">
                        {table.name}
                      </h2>
                      <div className="flex-grow border-b border-black/10 transition-colors group-hover:border-[#DFAB2E]/50" />
                      <span className="font-sans text-xs uppercase tracking-widest text-gray-400 group-hover:text-[#DFAB2E] transition-colors whitespace-nowrap">
                        {t("viewDetails")}
                      </span>
                    </div>
                    <p className="font-sans text-xs uppercase tracking-widest text-gray-400 mt-2">
                      {table.wood} · {table.resinColor}
                    </p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

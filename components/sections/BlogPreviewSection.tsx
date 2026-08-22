"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { localizedPath, blogHref, toHref } from "@/lib/urls";

/**
 * A post as far as this section is concerned. The homepage (a server component)
 * reads the real MDX corpus and passes the first few in.
 *
 * This section previously carried its own hardcoded array of four invented
 * posts — "art-of-walnut", "obsidian-resin", "8-week-polish",
 * "minimalist-spaces" — none of which existed in content/blog. Every card on the
 * homepage's journal block linked to a 404, on the site's highest-authority
 * page. Same failure mode as the tables gallery: a duplicated data source that
 * drifted from reality.
 */
export type BlogPreviewPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  image: string;
  imageAlt: string;
};

export function BlogPreviewSection({ posts }: { posts: BlogPreviewPost[] }) {
  const locale = useLocale();
  const t = useTranslations("BlogPreview");
  const tc = useTranslations("Common");

  if (posts.length === 0) return null;

  const [featuredPost, ...standardPosts] = posts;

  const formatDate = (iso: string) => {
    const tag = locale === "ar" ? "ar-MA-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-US";
    return new Date(iso).toLocaleDateString(tag, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="py-16 md:py-24 bg-white px-6 md:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-xl"
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-[0.9] mb-4">
              <span className="bg-[#DFAB2E]">{t("title")}</span>
            </h2>
            <p className="font-sans text-gray-600 text-lg leading-relaxed">{t("description")}</p>
          </motion.div>

          <Link 
            href={toHref(localizedPath('/blog', locale))} 
            className="group relative z-20 flex items-center gap-3 font-sans uppercase tracking-wider text-sm font-bold text-black border-b border-black pb-1 hover:text-gold-ink hover:border-gold-ink transition-colors w-fit whitespace-nowrap"
          >
            {t("viewAll")}
            <ArrowRight size={16} className="transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Featured Post */}
          <Link href={toHref(blogHref(featuredPost.slug, locale))} className="group block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-gray-100"
            >
              <Image 
                src={featuredPost.image} 
                alt={featuredPost.imageAlt}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                <div className="flex items-center gap-3 text-white/80 font-sans text-xs uppercase tracking-widest mb-4">
                  <span>{featuredPost.category}</span>
                  <span>•</span>
                  <span>{formatDate(featuredPost.date)}</span>
                </div>
                <h3 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-6">
                  {featuredPost.title}
                </h3>
                <span className="inline-flex items-center gap-2 text-white font-sans text-sm font-bold tracking-wider uppercase group-hover:text-[#DFAB2E] transition-colors">
                  {tc("readMore")} <ArrowRight size={16} className="group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 transition-transform" />
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Standard Posts Stack */}
          <div className="flex flex-col border-t border-black/10">
            {standardPosts.map((post, index) => (
              <Link key={post.slug} href={toHref(blogHref(post.slug, locale))} className="group block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col md:flex-row gap-8 py-8 md:py-12 border-b border-black/10 hover:bg-ivory/50 transition-colors -mx-6 px-6 md:mx-0 md:px-0"
                >
                  <div className="w-full md:w-1/3 aspect-[4/3] relative overflow-hidden bg-gray-100 shrink-0">
                    <Image src={post.image} alt={post.imageAlt} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 20vw" />
                  </div>
                  <div className="flex flex-col justify-center flex-grow">
                    <div className="flex items-center gap-3 text-gray-600 font-sans text-xs uppercase tracking-widest mb-3">
                      <span className="text-black font-bold">{post.category}</span>
                      <span>•</span>
                      <span>{formatDate(post.date)}</span>
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl text-black leading-snug mb-6 group-hover:text-[#DFAB2E] transition-colors">
                      {post.title}
                    </h3>
                    <span className="inline-flex items-center gap-2 text-black font-sans text-sm font-bold tracking-wider uppercase opacity-0 -translate-x-4 rtl:translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 rtl:group-hover:translate-x-0 transition-all duration-300">
                      {tc("readMore")} <ArrowRight size={16} className="rtl:-scale-x-100" />
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

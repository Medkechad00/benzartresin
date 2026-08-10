"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight, InstagramLogo, PinterestLogo, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { SITE } from "@/lib/site-config";
import { Logo } from "@/components/layout/Logo";

/** Maps the platform names in SITE.socialLinks onto their Phosphor icons. */
const SOCIAL_ICONS: Record<string, PhosphorIcon | undefined> = {
  Instagram: InstagramLogo,
  Pinterest: PinterestLogo,
};

export function Footer() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });
  
  const navT = useTranslations("Navbar");
  const footerT = useTranslations("Footer");

  const textScale = useTransform(scrollYProgress, [0.5, 1], [0.9, 1]);
  const textOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);
  const textBlur = useTransform(scrollYProgress, [0.5, 1], ["blur(10px)", "blur(0px)"]);

  return (
    <footer ref={containerRef} className="bg-black text-white pt-24 md:pt-32 pb-8 px-6 md:px-12 relative overflow-hidden">
      {/* Top Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 relative z-10">
        
        {/* Brand & Newsletter */}
        <div className="md:col-span-5 flex flex-col">
          <Link href="/" aria-label="BenzArt — home" className="text-white mb-8 block w-fit">
            <Logo decorative className="h-8" />
          </Link>
          <p className="font-sans text-gray-400 text-sm md:text-base leading-relaxed mb-12 max-w-sm">
            {footerT('tagline')}
          </p>
          
          <div className="mt-auto">
            <h4 className="font-sans text-white text-sm font-bold uppercase tracking-widest mb-4">{footerT('newsletter')}</h4>
            <form className="flex items-end border-b border-white/20 pb-2 max-w-sm group" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder={footerT('newsletterPlaceholder')}
                aria-label={footerT('newsletterPlaceholder')}
                className="bg-transparent border-none outline-none text-white placeholder:text-gray-600 font-sans text-sm w-full focus:ring-0 px-0"
              />
              <button type="submit" className="text-gray-400 group-hover:text-[#DFAB2E] transition-colors pb-1" aria-label={footerT('newsletterCta')}>
                {/* rtl:-scale-x-100 mirrors the arrow so it points toward the
                    reading direction rather than back into the input. */}
                <ArrowRight size={20} className="rtl:-scale-x-100" />
              </button>
            </form>
          </div>
        </div>

        {/* Navigation Columns */}
        <div className="md:col-span-3 md:col-start-7 flex flex-col gap-6">
          <h4 className="font-sans text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{footerT('explore')}</h4>
          <Link href="/tables" className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('collection')}</span>
          </Link>
          <Link href="/our-craft" className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('ourCraft')}</span>
          </Link>
          <Link href="/blog" className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('journal')}</span>
          </Link>
        </div>

        {/* Contact Column */}
        <div className="md:col-span-3 md:col-start-10 flex flex-col gap-6">
          <h4 className="font-sans text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{footerT('connect')}</h4>
          <Link href="/inquiry" className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('customOrder')}</span>
          </Link>
          <Link href="/#testimonials" className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{footerT('clientele')}</span>
          </Link>
          <Link href="/contact" className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{footerT('contact')}</span>
          </Link>
          <Link href="/faq" className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{footerT('faq')}</span>
          </Link>
          
          <div className="flex gap-6 mt-8">
            {/*
              Rendered from SITE.socialLinks, which holds the studio's real,
              confirmed profiles. These are the same URLs `sameAs` points at in
              Organization schema, so the visible links and the entity claim can
              never drift apart. Previously both were dead `href="#"` anchors.
            */}
            {SITE.socialLinks.map(({ name, url }) => {
              const Icon = SOCIAL_ICONS[name];
              return (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={name}
                >
                  {Icon ? <Icon size={24} weight="fill" /> : name}
                </a>
              );
            })}
          </div>
        </div>

      </div>

      {/* Massive Graphic Typography */}
      <div className="max-w-7xl mx-auto mt-24 md:mt-32 relative z-0 flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ 
            scale: textScale, 
            opacity: textOpacity,
            filter: textBlur
          }}
          className="w-full flex justify-center"
        >
          <h2 className="font-display text-[15vw] leading-[0.8] text-center text-white/5 uppercase tracking-tighter select-none pointer-events-none">
            Benzart
          </h2>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left Side: Copyright & Legal Links */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <p className="font-sans text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} Benzart. {footerT('rights')}
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="font-sans text-gray-600 text-xs hover:text-white transition-colors">{footerT('privacy')}</Link>
            <Link href="/terms" className="font-sans text-gray-600 text-xs hover:text-white transition-colors">{footerT('terms')}</Link>
          </div>
        </div>

        {/* Right Side: Agency Tag */}
        <a href="https://bidayalab.com" target="_blank" rel="noopener noreferrer" className="font-sans text-gray-500 text-[10px] uppercase tracking-[0.2em] hover:text-[#DFAB2E] transition-colors font-bold">
          CRAFTED IN THE LABS OF BIDAYALAB
        </a>
        
      </div>
    </footer>
  );
}

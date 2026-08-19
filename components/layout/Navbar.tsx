"use client";

import { useState, useEffect, useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { getTextDirection } from "@/lib/i18n/direction";
import { SITE } from "@/lib/site-config";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { localizedPath, blogSlug, englishBlogSlug, tableSlug, englishTableSlug } from "@/lib/urls";

/**
 * "Atelier" (→/craftsmanship) and "Studio" (→/about) were two labels for two
 * pages whose own H1s said the opposite thing. Both are now one page, "Our
 * Craft", which covers the brand story and the process together.
 */
const NAV_KEYS = [
  { key: "collection", path: "/tables" },
  { key: "ourCraft", path: "/our-craft" },
  { key: "journal", path: "/blog" },
] as const;

interface NavbarProps {
  theme?: "light" | "dark";
}

export function Navbar({ theme = "light" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const locale = useLocale();
  const t = useTranslations("Navbar");
  const dir = getTextDirection(locale);
  const isRtl = dir === 'rtl';

  /**
   * Locale switching via next-intl's router.
   *
   * `usePathname` from next-intl drops dynamic route params (e.g. [slug])
   * when called from a layout, so `/en/blog/my-post` becomes `/blog` and
   * `router.replace` throws "Insufficient params". Reading the full pathname
   * from `window.location.pathname` preserves every segment, then we strip
   * the current locale prefix manually before handing it to `router.replace`.
   * Search and hash are preserved too, so /inquiry?ref=<sku> survives the
   * switch without a full reload.
   */
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    if (next === locale) return;
    startTransition(() => {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      const withoutLocale = path.startsWith(`/${locale}`) ? path.slice(`/${locale}`.length) : path;

      let targetPath = withoutLocale;

      const blogMatch = withoutLocale.match(/^\/blog\/([^/]+)$/);
      if (blogMatch) {
        const currentSlug = blogMatch[1];
        const englishSlug = englishBlogSlug(currentSlug, locale);
        const newSlug = blogSlug(englishSlug, next);
        const base = localizedPath('/blog', next);
        targetPath = `${base}/${newSlug}`;
      } else {
        const tableMatch = withoutLocale.match(/^\/tables\/([^/]+)$/);
        if (tableMatch) {
          const englishSlug = englishTableSlug(tableMatch[1]);
          const newSlug = tableSlug(englishSlug, next);
          const base = localizedPath('/tables', next);
          targetPath = `${base}/${newSlug}`;
        } else {
          targetPath = localizedPath(withoutLocale, next);
        }
      }

      router.replace(`${targetPath}${search}${hash}` as any, { locale: next });
    });
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  // Determine if text should be dark based on scroll or page theme
  const isDarkText = theme === "dark" || isScrolled || isMobileMenuOpen;

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -50, opacity: 0, backgroundColor: "rgba(245, 241, 232, 0)", borderBottomColor: "rgba(245, 241, 232, 0)" }}
        animate={{
          y: 0,
          opacity: 1,
          backgroundColor: isScrolled ? "#DFAB2E" : "transparent",
          borderBottomColor: isScrolled ? "rgba(0, 0, 0, 0.1)" : "transparent",
        }}
        transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 px-6 py-6 md:px-12 transition-all duration-500",
          isScrolled ? "backdrop-blur-md" : "backdrop-blur-none"
        )}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between md:grid md:grid-cols-3 relative">
          
          {/* Left: Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_KEYS.map((link) => (
              <Link
                key={link.key}
                href={localizedPath(link.path, locale) as any}
                className={cn(
                  "text-[11px] tracking-[0.2em] uppercase font-bold relative group transition-colors duration-500",
                  isDarkText ? "text-black/70 hover:text-black" : "text-white/70 hover:text-white"
                )}
              >
                <span className="relative z-10">{t(link.key)}</span>
                {/* start-1/2 is logical, so the centring translate must mirror
                    too — otherwise the underline sits off-centre under RTL. */}
                <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-0 h-[1px] bg-current group-hover:w-full transition-all duration-500 ease-out" />
              </Link>
            ))}
          </div>

          {/* Center: Logo */}
          <div className="flex justify-start md:justify-center">
            <Link
              href="/"
              aria-label={`${SITE.name} — home`}
              className={cn(
                // The logo is masked with `bg-current`, so it simply inherits
                // this colour. Same token that drives the nav text, which is
                // why contrast can never drift between the two.
                "transition-colors duration-500 z-50",
                isDarkText ? "text-black" : "text-white"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Logo decorative className="h-7 md:h-8" />
            </Link>
          </div>

          {/* Right: CTA & Mobile Toggle */}
          <div className="flex justify-end items-center gap-4">
             <Link
               href={localizedPath('/inquiry', locale) as any}
               className={cn(
                 "hidden md:flex px-6 py-3 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-500",
                 isDarkText
                   ? "border border-black text-black hover:bg-black hover:text-white"
                   : "border border-white text-white hover:bg-white hover:text-black"
               )}
             >
               {t('customOrder')}
             </Link>

            {/* Locale Switcher */}
            <LanguageSwitcher
              isDarkText={isDarkText}
              isPending={isPending}
              onSelect={switchLocale}
            />

            {/* Mobile Menu Toggle - Creative Animated Hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] relative z-50 group"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <motion.span
                animate={{ 
                  rotate: isMobileMenuOpen ? 45 : 0, 
                  y: isMobileMenuOpen ? 7 : 0,
                  backgroundColor: isDarkText ? "#000" : "#fff"
                }}
                transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
                className="w-7 h-[1px] block origin-center transition-colors group-hover:bg-[#DFAB2E]"
              />
              <motion.span
                animate={{ 
                  opacity: isMobileMenuOpen ? 0 : 1,
                  backgroundColor: isDarkText ? "#000" : "#fff",
                  x: isMobileMenuOpen ? -10 : 0
                }}
                transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
                className="w-7 h-[1px] block transition-colors group-hover:bg-[#DFAB2E]"
              />
              <motion.span
                animate={{ 
                  rotate: isMobileMenuOpen ? -45 : 0, 
                  y: isMobileMenuOpen ? -7 : 0,
                  backgroundColor: isDarkText ? "#000" : "#fff"
                }}
                transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
                className="w-7 h-[1px] block origin-center transition-colors group-hover:bg-[#DFAB2E]"
              />
            </button>
          </div>

        </div>
      </motion.nav>

      {/* Mobile Menu Overlay with Creative Transitions */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            exit={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
            transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 z-40 bg-white flex flex-col justify-between px-6 pt-32 pb-12 overflow-hidden"
          >
            
            {/* Links List */}
            <div className="flex flex-col gap-2 mt-12">
              {NAV_KEYS.map((link, i) => (
                <motion.div
                  key={link.key}
                  initial={{ opacity: 0, x: isRtl ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Link
                    href={localizedPath(link.path, locale) as any}
                    className="text-6xl sm:text-7xl font-display tracking-tight text-black hover:text-[#DFAB2E] transition-colors inline-block pb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(link.key)}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.7, ease: [0.23, 1, 0.32, 1] }}
                className="mt-12"
              >
                 <Link
                   href={localizedPath('/inquiry', locale) as any}
                   className="inline-block bg-[#DFAB2E] text-black px-12 py-5 uppercase tracking-widest text-xs font-bold active:scale-[0.98] transition-transform w-full text-center sm:w-auto"
                   onClick={() => setIsMobileMenuOpen(false)}
                 >
                   {t('customOrder')}
                 </Link>
              </motion.div>
            </div>

            {/* Socials & Contact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex justify-between items-end border-t border-black/10 pt-8"
            >
              <div className="flex flex-col gap-3">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gray-500">{t('socials')}</p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  {/*
                    Was two dead `href="#"` anchors. They now point at the real
                    profiles in site-config — the same source `sameAs` uses in
                    Organization schema, so the visible links and the structured
                    data can never disagree.
                  */}
                  {SITE.socialLinks.map(({ name, url }) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black font-bold uppercase text-[11px] tracking-[0.2em] hover:text-[#DFAB2E] transition-colors"
                    >
                      {name}
                    </a>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-3 text-end">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gray-500">{t('language')}</p>
                <LanguageSwitcher
                  isDarkText={true}
                  isPending={isPending}
                  onSelect={(loc) => {
                    setIsMobileMenuOpen(false);
                    switchLocale(loc);
                  }}
                />
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

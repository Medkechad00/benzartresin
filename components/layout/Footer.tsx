"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { ArrowRight, CircleNotch, InstagramLogo, PinterestLogo, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { SITE } from "@/lib/site-config";
import { Logo } from "@/components/layout/Logo";
import { localizedPath } from "@/lib/urls";

/** Maps the platform names in SITE.socialLinks onto their Phosphor icons. */
const SOCIAL_ICONS: Record<string, PhosphorIcon | undefined> = {
  Instagram: InstagramLogo,
  Pinterest: PinterestLogo,
};

type SubscribeStatus = "idle" | "submitting" | "success" | "error";

export function Footer() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });
  
  const navT = useTranslations("Navbar");
  const footerT = useTranslations("Footer");
  const locale = useLocale();

  const textScale = useTransform(scrollYProgress, [0.5, 1], [0.9, 1]);
  const textOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);
  const textBlur = useTransform(scrollYProgress, [0.5, 1], ["blur(10px)", "blur(0px)"]);

  /**
   * Newsletter sign-up.
   *
   * This form used to be `onSubmit={(e) => e.preventDefault()}` and nothing
   * else: the address was read from the DOM by no one, sent nowhere, and the UI
   * gave no feedback, so it looked like it had worked. It now posts to
   * /api/subscribe, which emails the studio inbox.
   */
  const [email, setEmail] = useState("");
  /** Honeypot. Hidden from users; anything in it marks the sender as a bot. */
  const [extraNotes, setExtraNotes] = useState("");
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setFeedback("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, extraNotes }),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setStatus("success");
        setFeedback(footerT("newsletterSuccess"));
        setEmail("");
      } else {
        // Surface the server's reason where it has one — a 503 from
        // unconfigured SMTP has to read differently from a rejected address.
        setStatus("error");
        setFeedback(result?.message ?? footerT("newsletterError"));
      }
    } catch {
      setStatus("error");
      setFeedback(footerT("newsletterError"));
    }
  };

  return (
    <footer ref={containerRef} className="bg-black text-white pt-24 md:pt-32 pb-8 px-6 md:px-12 relative overflow-hidden">
      {/* Top Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 relative z-10">
        
        {/* Brand & Newsletter */}
        <div className="md:col-span-5 flex flex-col">
          <Link href="/" aria-label={`${SITE.name} — home`} className="text-white mb-8 block w-fit">
            <Logo decorative className="h-8" />
          </Link>
          <p className="font-sans text-gray-400 text-sm md:text-base leading-relaxed mb-12 max-w-sm">
            {footerT('tagline')}
          </p>
          
          <div className="mt-auto">
            <h4 className="font-sans text-white text-sm font-bold uppercase tracking-widest mb-4">{footerT('newsletter')}</h4>
            <form className="max-w-sm" onSubmit={handleSubscribe} noValidate>
              <div className="flex items-end border-b border-white/20 pb-2 group focus-within:border-white/50 transition-colors">
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear a stale result the moment the visitor edits, so the
                    // message always refers to what is currently in the field.
                    if (status !== "idle") {
                      setStatus("idle");
                      setFeedback("");
                    }
                  }}
                  disabled={status === "submitting"}
                  placeholder={footerT('newsletterPlaceholder')}
                  aria-label={footerT('newsletterPlaceholder')}
                  aria-describedby="newsletter-feedback"
                  aria-invalid={status === "error" || undefined}
                  className="bg-transparent border-none outline-none text-white placeholder:text-gray-600 font-sans text-sm w-full focus:ring-0 px-0 disabled:opacity-50"
                />

                {/*
                  Honeypot.

                  Named `extraNotes`, not `website`: password managers map
                  `website` to a saved login's URL and fill it regardless of
                  `autocomplete="off"`, which silently discarded genuine
                  submissions on the inquiry form. The `data-*` attributes are
                  the opt-outs for LastPass, 1Password, Dashlane and Bitwarden.

                  Off-screen rather than `display:none`, because some bots skip
                  fields that are not rendered. `tabIndex={-1}` and `aria-hidden`
                  keep it away from keyboard and screen-reader users.
                */}
                <input
                  type="text"
                  name="extraNotes"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore=""
                  data-form-type="other"
                  data-bwignore="true"
                  aria-hidden="true"
                  className="absolute -left-[9999px] w-px h-px opacity-0"
                />

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="text-gray-400 group-hover:text-[#DFAB2E] transition-colors pb-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={footerT('newsletterCta')}
                >
                  {status === "submitting" ? (
                    <CircleNotch size={20} className="animate-spin" />
                  ) : (
                    /* rtl:-scale-x-100 mirrors the arrow so it points toward the
                       reading direction rather than back into the input. */
                    <ArrowRight size={20} className="rtl:-scale-x-100" />
                  )}
                </button>
              </div>

              {/*
                `aria-live` so the result is announced rather than only shown.
                The node is always present — swapping an empty container in and
                out is unreliable in several screen readers.
              */}
              <p
                id="newsletter-feedback"
                role="status"
                aria-live="polite"
                className={`font-sans text-xs mt-3 min-h-[1rem] ${
                  status === "error" ? "text-red-400" : "text-[#DFAB2E]"
                }`}
              >
                {feedback}
              </p>
            </form>
          </div>
        </div>

        {/* Navigation Columns */}
        <div className="md:col-span-3 md:col-start-7 flex flex-col gap-6">
          <h4 className="font-sans text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{footerT('explore')}</h4>
          <Link href={localizedPath('/tables', locale) as any} className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('collection')}</span>
          </Link>
          <Link href={localizedPath('/our-craft', locale) as any} className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('ourCraft')}</span>
          </Link>
          <Link href={localizedPath('/blog', locale) as any} className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('journal')}</span>
          </Link>
        </div>

        {/* Contact Column */}
        <div className="md:col-span-3 md:col-start-10 flex flex-col gap-6">
          <h4 className="font-sans text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{footerT('connect')}</h4>
          <Link href={localizedPath('/inquiry', locale) as any} className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{navT('customOrder')}</span>
          </Link>
          <Link href={"/#testimonials" as any} className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{footerT('clientele')}</span>
          </Link>
          <Link href={localizedPath('/contact', locale) as any} className="group w-fit">
            <span className="font-sans text-sm text-gray-300 group-hover:text-white transition-colors relative after:absolute after:bottom-0 after:start-0 after:h-[1px] after:w-0 after:bg-[#DFAB2E] after:transition-all after:duration-300 group-hover:after:w-full pb-1">{footerT('contact')}</span>
          </Link>
          <Link href={localizedPath('/faq', locale) as any} className="group w-fit">
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
          {/*
            Decorative wordmark. Sized down from 15vw when the brand went from
            "Benzart" (7 characters) to the full "Benzart Resin" (13), which
            overflowed the viewport at the old size. `whitespace-nowrap` keeps
            it on one line rather than breaking mid-brand.
          */}
          <h2 className="font-display text-[8vw] leading-[0.8] text-center text-white/5 uppercase tracking-tighter select-none pointer-events-none whitespace-nowrap">
            {SITE.name}
          </h2>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left Side: Copyright & Legal Links */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <p className="font-sans text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} {SITE.name}. {footerT('rights')}
          </p>
          <div className="flex gap-6">
            <Link href={localizedPath('/privacy', locale) as any} className="font-sans text-gray-600 text-xs hover:text-white transition-colors">{footerT('privacy')}</Link>
            <Link href={localizedPath('/terms', locale) as any} className="font-sans text-gray-600 text-xs hover:text-white transition-colors">{footerT('terms')}</Link>
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

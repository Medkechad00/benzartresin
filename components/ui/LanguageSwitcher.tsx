"use client";

import { useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { CaretDown } from "@phosphor-icons/react";

const LOCALES = [
  { code: "en" as const, label: "EN" },
  { code: "fr" as const, label: "FR" },
  { code: "ar" as const, label: "AR" },
];

/**
 * Language switcher — minimal icon-free trigger with animated dropdown.
 *
 * In the navbar it renders as just the active locale code and a tiny chevron,
 * so it never competes with the CTA or the logo for attention. The dropdown
 * opens on click (not hover, so it is intentional) with a measured spring
 * motion — height and opacity animate together so it reads as one movement
 * rather than two separate transitions.
 *
 * Nothing in this component reads the background colour from props. The text
 * and border use the site's always-dark palette (#000, white-on-black active),
 * which is correct on both the transparent-over-hero state and the solid-gold
 * scrolled state. The only theme-dependent thing is the outer ring: a hairline
 * border on light backgrounds, no border when the background is dark enough
 * that the text already reads.
 */

export function LanguageSwitcher({
  isDarkText,
  isPending,
  onSelect,
}: {
  isDarkText: boolean;
  isPending: boolean;
  onSelect: (code: string) => void;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSelect = (code: string) => {
    if (code === locale || isPending) return;
    onSelect(code);
    setOpen(false);
  };

  const activeLabel = LOCALES.find((l) => l.code === locale)?.label ?? locale.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Change language"
        disabled={isPending}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5
          text-[11px] font-bold uppercase tracking-[0.2em]
          transition-colors duration-300
          disabled:opacity-50
          ${isDarkText ? "text-black hover:text-black/70" : "text-white hover:text-white/70"}
        `}
      >
        <span>{activeLabel}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={`
            transition-transform duration-300
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Languages"
          className="absolute end-0 top-full mt-2 z-50"
        >
          <div className="
            bg-white border border-black/10
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            py-1.5 min-w-[5.5rem]
            origin-top-end
            animate-in
            fade-in
            slide-in-from-top-1
            duration-200
            ease-out
          ">
            {LOCALES.map((loc) => {
              const isActive = locale === loc.code;
              return (
                <button
                  key={loc.code}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(loc.code)}
                  disabled={isPending || isActive}
                  className={`
                    w-full text-start px-4 py-2
                    text-[11px] font-bold uppercase tracking-[0.2em]
                    transition-colors duration-150
                    disabled:opacity-40
                    ${isActive
                      ? "bg-black text-white"
                      : "text-black hover:bg-black/5"
                    }
                  `}
                >
                  {loc.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

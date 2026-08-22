"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useRef, useEffect, useId, useCallback } from "react";
import { CaretDown } from "@phosphor-icons/react";

const LOCALES = [
  { code: "en" as const, label: "EN", lang: "en" },
  { code: "fr" as const, label: "FR", lang: "fr" },
  { code: "ar" as const, label: "AR", lang: "ar" },
];

/**
 * Language switcher — minimal icon-free trigger with a dropdown.
 *
 * In the navbar it renders as just the active locale code and a tiny chevron,
 * so it never competes with the CTA or the logo for attention. The dropdown
 * opens on click (not hover, so it is intentional).
 *
 * Nothing in this component reads the background colour from props. The text
 * and border use the site's always-dark palette (#000, white-on-black active),
 * which is correct on both the transparent-over-hero state and the solid-gold
 * scrolled state. The only theme-dependent thing is the outer ring: a hairline
 * border on light backgrounds, no border when the background is dark enough
 * that the text already reads.
 *
 * ACCESSIBILITY — what was wrong and what replaced it.
 *
 * 1. It declared `role="listbox"` on a wrapper, then nested a plain <div>
 *    between it and the `role="option"` buttons. A listbox may only own
 *    `option` and `group` children, so the intervening generic broke the
 *    relationship and the options were not reliably exposed as such.
 * 2. The currently-selected locale's button was `disabled`, so the one item
 *    carrying `aria-selected={true}` could never be reached by keyboard.
 * 3. There was no arrow-key handling, no focus movement into the list, and no
 *    focus restoration on close — so after Escape, focus was orphaned on
 *    <body>.
 * 4. The accessible name was the hardcoded English "Change language" while the
 *    visible text was "EN"/"FR"/"AR" — a 2.5.3 Label in Name failure, because
 *    the visible label was not contained in the accessible name. It was also
 *    English on Arabic and French pages.
 *
 * The ARIA roles are gone rather than completed. A menu of three buttons is
 * natively accessible: each is focusable, each has a name, and Tab already
 * works. Adding `listbox`/`option` on top of that only creates the obligation
 * to reimplement focus management that the platform already provides. Arrow
 * keys, Home/End, Escape and focus restoration are still implemented, because
 * those are what make a *dropdown* usable regardless of roles.
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
  const t = useTranslations("Navbar");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  /** Rendered twice (navbar + mobile menu), so ids must be instance-scoped. */
  const rawId = useId();
  const menuId = `lang-menu-${rawId.replace(/:/g, '')}`;

  /** Close and hand focus back to the control that opened it. WCAG 2.4.3. */
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // No focus restore: the user has deliberately moved elsewhere.
        setOpen(false);
      }
    };
    // `pointerdown` rather than `mousedown` so it also fires for touch and pen.
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [open]);

  /** Focus the active locale when the menu opens, so arrows start from it. */
  useEffect(() => {
    if (!open) return;
    const activeIndex = LOCALES.findIndex((l) => l.code === locale);
    itemsRef.current[activeIndex === -1 ? 0 : activeIndex]?.focus();
  }, [open, locale]);

  const handleSelect = (code: string) => {
    if (isPending) return;
    if (code === locale) {
      close();
      return;
    }
    onSelect(code);
    setOpen(false);
  };

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = LOCALES.length - 1;
    const current = itemsRef.current.findIndex((el) => el === document.activeElement);

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        itemsRef.current[current >= last ? 0 : current + 1]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        itemsRef.current[current <= 0 ? last : current - 1]?.focus();
        break;
      case "Home":
        e.preventDefault();
        itemsRef.current[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        itemsRef.current[last]?.focus();
        break;
      case "Tab":
        // Tabbing out of a dropdown should dismiss it, not leave it hanging
        // open behind the next control.
        setOpen(false);
        break;
    }
  };

  const active = LOCALES.find((l) => l.code === locale);
  const activeLabel = active?.label ?? locale.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          // Opening with the arrow key is the expected affordance for a
          // dropdown, and it lands focus on the active item in one keystroke.
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        disabled={isPending}
        className={`
          flex items-center gap-1.5 px-2.5 py-2
          text-[11px] font-bold uppercase tracking-[0.2em]
          transition-colors duration-300
          disabled:opacity-50
          ${isDarkText ? "text-black hover:text-black/70" : "text-white hover:text-white/70"}
        `}
      >
        {/*
          The accessible name becomes "Change language: EN", which CONTAINS the
          visible text "EN" — that is what WCAG 2.5.3 requires, and it is why
          this is a visually-hidden span rather than an aria-label that
          replaces the visible string.
        */}
        <span className="sr-only">{t('changeLanguage')}: </span>
        <span lang={active?.lang}>{activeLabel}</span>
        <CaretDown
          size={12}
          weight="bold"
          aria-hidden="true"
          className={`
            transition-transform duration-300
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t('languageList')}
          onKeyDown={onMenuKeyDown}
          className="absolute end-0 top-full mt-2 z-50 bg-white border border-black/20 shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 min-w-[5.5rem]"
        >
          {/*
            The intermediate wrapper <div> is gone. It carried the dropdown's
            entrance animation via `animate-in fade-in slide-in-from-top-1`,
            which generated no CSS at all: those classes come from
            `tailwindcss-animate`, which is not a dependency of this project.
            The animation described in this component's original docblock never
            rendered, so removing the wrapper changes nothing visually and
            removes one node from between the menu and its items.
          */}
          {LOCALES.map((loc, i) => {
            const isActive = locale === loc.code;
            return (
              <button
                key={loc.code}
                ref={(el) => {
                  itemsRef.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleSelect(loc.code)}
                /*
                  Only `isPending` disables an item now. The active locale used
                  to be disabled too, which made the one item a screen reader
                  announced as selected the one item a keyboard user could not
                  reach.
                */
                disabled={isPending}
                className={`
                  block w-full text-start px-4 py-2
                  text-[11px] font-bold uppercase tracking-[0.2em]
                  transition-colors duration-150
                  disabled:opacity-40
                  ${isActive
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/5"
                  }
                `}
              >
                {/*
                  `lang` on each code so a French screen reader does not
                  pronounce "AR" with French phonology. WCAG 3.1.2.
                */}
                <span lang={loc.lang}>{loc.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

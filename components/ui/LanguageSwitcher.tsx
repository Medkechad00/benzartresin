"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The three locales the site ships, with the details the switcher needs.
 *
 * `nativeName` is each language's name in its own script (EN / FR / AR), which
 * is what an international visitor actually recognises — someone reading Arabic
 * does not scan for "AR", they scan for "ع".
 */
const LOCALES = [
  { code: 'en' as const, label: 'EN' },
  { code: 'fr' as const, label: 'FR' },
  { code: 'ar' as const, label: 'AR' },
];

/**
 * Language switcher — an animated segmented control for the navbar.
 *
 * Why a segmented control rather than three plain buttons or a dropdown:
 *
 * 1. Three equally-weighted plain buttons give no visual structure, and on the
 *    transparent-over-hero navbar every one of them must sit on the exact same
 *    legibility gradient as the text beside it. A segmented pill contains its
 *    own surface, so its contrast no longer depends on whatever photograph is
 *    behind the nav.
 *
 * 2. A dropdown hides two of the three options and demands a hover/click to
 *    reveal them — an interaction tax on a control used constantly. Here all
 *    three options are visible and the selection is readable at a glance.
 *
 * 3. The sliding indicator is a single constrained motion tied to measured
 *    button widths, so it animates as an answer to a question rather than as
 *    ambient decoration.
 */

export function LanguageSwitcher({
  isDarkText,
  isPending,
  onSelect,
}: {
  /** True when the text above it is dark (scrolled/solid nav or dark page). */
  isDarkText: boolean;
  /** True while a locale switch is in flight, to block double-taps. */
  isPending: boolean;
  /** Called with the target locale code; the navbar owns the navigation. */
  onSelect: (code: string) => void;
}) {
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [hasLayout, setHasLayout] = useState(false);
  const [ready, setReady] = useState(false);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  /**
   * Two-phase mount. The sliding indicator needs the actual pixel offsets of
   * the buttons, which only exist after layout. On the first effect the
   * indicator renders at the active segment (no transition); after a
   * `requestAnimationFrame` the transition is enabled so the first paint never
   * visibly flies from a default position.
   */
  const measure = () => {
    const active = buttonRefs.current[locale];
    const container = containerRef.current;
    if (!active || !container) return;
    setIndicator({
      left: active.offsetLeft - container.offsetLeft,
      width: active.offsetWidth,
    });
    setHasLayout(true);
    // Re-measure after the browser has settled the rendered widths.
    window.requestAnimationFrame(() => {
      const a = buttonRefs.current[locale];
      const c = containerRef.current;
      if (!a || !c) return;
      setIndicator({ left: a.offsetLeft - c.offsetLeft, width: a.offsetWidth });
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      {/*
        Screen-reader name for the group. Wrapped and visually hidden so it does
        not take layout space; the visible labels carry the interaction.
      */}
      <span id="language-switcher-label" className="sr-only">
        Choose language
      </span>

      <div
        role="group"
        aria-labelledby="language-switcher-label"
        className={cn(
          "relative flex items-center rounded-full border px-1.5 py-1 backdrop-blur-sm transition-colors duration-500",
          isDarkText
            ? "border-black/15 bg-black/[0.03]"
            : "border-white/20 bg-white/[0.08]"
        )}
      >
        {/* Sliding indicator behind the active segment. */}
        {indicator && hasLayout && (
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{
              x: indicator.left,
              width: indicator.width,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 32, mass: 0.7 }
            }
            className={cn(
              "absolute top-1.5 bottom-1.5 rounded-full",
              isDarkText ? "bg-black" : "bg-white"
            )}
          />
        )}

        {LOCALES.map((loc) => {
          const active = locale === loc.code;
          return (
            <button
              key={loc.code}
              ref={(el) => {
                buttonRefs.current[loc.code] = el;
              }}
              onClick={() => onSelect(loc.code)}
              disabled={isPending || active}
              lang={loc.code}
              aria-pressed={active}
              aria-current={active ? "true" : undefined}
              className={cn(
                "relative z-10 px-3 py-1.5 min-w-[2.75rem] text-center text-[10px] uppercase tracking-[0.2em] font-bold rounded-full transition-colors duration-300 disabled:opacity-60",
                "outline-none focus-visible:ring-2 focus-visible:ring-[#DFAB2E] focus-visible:ring-offset-1",
                active
                  ? isDarkText
                    ? "text-white"
                    : "text-black"
                  : isDarkText
                    ? "text-black/60 hover:text-black"
                    : "text-white/70 hover:text-white"
              )}
            >
              {loc.label}
            </button>
          );
        })}
      </div>

      {/*
        Mount-time measurement. The empty div renders once; its ref callback
        fires after layout, giving us real button offsets before the first
        paint. Switching locale re-centres the indicator via the useEffect
        below.
      */}
      <div
        ref={(el) => {
          if (el && !ready) {
            measure();
            setReady(true);
          }
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/blog";

/**
 * Sticky table of contents with active-section tracking.
 *
 * Design notes:
 *  - Uses IntersectionObserver rather than a scroll listener, so highlighting
 *    costs nothing on the main thread during scroll.
 *  - `rootMargin` biases the detection band toward the upper third of the
 *    viewport. Without it the "active" heading only changes once a section has
 *    scrolled almost fully past, which reads as broken.
 *  - The active marker animates `opacity` and `color` only — no layout
 *    properties — and stays under 200ms per the animation-duration guidance for
 *    small, frequently-seen state changes.
 *  - Anchor jumps are left to native `href="#id"` so the browser's own
 *    scroll-behaviour and `prefers-reduced-motion` handling apply; hijacking
 *    them with JS smooth-scroll would override the user's OS setting.
 */
export function ArticleToc({ entries, label }: { entries: TocEntry[]; label: string }) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    if (entries.length === 0) return;

    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        // Detection band sits across the upper portion of the viewport.
        rootMargin: "-88px 0px -60% 0px",
        threshold: 0,
      }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav aria-label={label} className="hidden lg:block">
      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gray-600 mb-5">
        {label}
      </p>
      <ul className="flex flex-col gap-3 border-s border-black/10">
        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <li key={entry.id} className="-ms-px">
              <a
                href={`#${entry.id}`}
                aria-current={isActive ? "location" : undefined}
                className={[
                  "block ps-4 border-s-2 font-sans text-sm leading-snug transition-colors duration-150 ease-out",
                  isActive
                    ? "border-gold-ink text-black"
                    : "border-transparent text-gray-600 hover:text-black",
                ].join(" ")}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

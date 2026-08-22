"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useSafeReducedMotion } from "@/lib/hooks/use-safe-reduced-motion";

/**
 * Scroll-linked reading progress for long-form articles.
 *
 * Design notes (per the workspace design skill):
 *  - This is *constant motion* tied to a gesture, so it is spring-smoothed
 *    rather than duration-eased. Binding scale directly to scrollYProgress
 *    tracks perfectly but feels mechanical; a light spring gives it weight
 *    without lag.
 *  - `transform-origin: left` (mirrored under RTL) so it grows from the reading
 *    edge rather than the centre.
 *  - It animates scaleX only — never width — so it stays on the compositor and
 *    never triggers layout during scroll.
 *  - Hidden entirely under `prefers-reduced-motion`: it is decorative
 *    reinforcement of the scrollbar, not information the reader needs.
 *
 * The preference is read through `useSafeReducedMotion()` because this is a
 * conditional *return*: Motion's own hook reports `null` on the server and the
 * real value on the hydrating render, so a reduced-motion visitor would have had
 * the server send this bar and the client immediately remove it — a structural
 * hydration mismatch. Deferring by one tick unmounts it right after hydration
 * instead, which is invisible for a scroll indicator at scroll position 0.
 */
export function ReadingProgress() {
  const reduceMotion = useSafeReducedMotion();
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.001,
  });

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 inset-x-0 z-50 h-[2px] bg-gold origin-left rtl:origin-right"
    />
  );
}

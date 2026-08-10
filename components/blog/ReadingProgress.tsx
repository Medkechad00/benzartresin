"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

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
 */
export function ReadingProgress() {
  const reduceMotion = useReducedMotion();
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

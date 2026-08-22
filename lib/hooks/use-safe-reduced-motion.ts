"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * `useReducedMotion()`, made safe to use during render.
 *
 * Motion's own hook returns `null` on the server but the real media-query result
 * on the very first client render (see `MotionProvider` for the full trace), so
 * branching on it directly produces a hydration mismatch for every visitor who
 * has "prefers-reduced-motion: reduce" enabled.
 *
 * This returns `false` during SSR *and* during the hydrating render — matching
 * the server's falsy `null` exactly — then re-renders with the true preference
 * once mounted. The first client render is therefore always identical to the
 * server's.
 *
 * Use this only where the preference affects something Motion cannot handle
 * itself:
 *
 * - a scroll-linked `style` binding, e.g. `style={{ y: reduce ? 0 : parallax }}`
 * - a conditional return that changes the rendered tree
 *
 * For ordinary entry animations (`initial` / `animate` / `whileInView`), do not
 * use this — write the animation unconditionally and let the root
 * `MotionConfig reducedMotion="user"` suppress the transform. That applies from
 * the first painted frame, whereas this hook can only take effect after mount.
 */
export function useSafeReducedMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * eslint-disable react-hooks/set-state-in-effect
   *
   * The rule is right in general and wrong here. It exists to stop cascading
   * renders from state that could have been derived, but the whole purpose of
   * this hook is to make the FIRST client render deliberately disagree with the
   * real media query so that it agrees with the server. There is no way to
   * express "one render after hydration" without a state write in an effect, and
   * the alternative — reading the preference during render — is the hydration
   * mismatch this hook was written to eliminate.
   *
   * The cascade is bounded: one extra render, once, per mount.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  return isHydrated && prefersReducedMotion === true;
}

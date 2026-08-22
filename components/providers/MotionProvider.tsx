"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Global motion configuration.
 *
 * THE HYDRATION BUG THIS FIXES.
 *
 * `useReducedMotion()` is not safe to branch on during render. From
 * `motion-dom/render/utils/reduced-motion/state.mjs`:
 *
 *     // Does this device prefer reduced motion? Returns `null` server-side.
 *     const prefersReducedMotion = { current: null };
 *
 * `initPrefersReducedMotion()` bails out early when `typeof window === "undefined"`,
 * so the value stays `null` on the server. On the client it calls
 * `setReducedMotionPreferences()` *synchronously*, and `useReducedMotion()` seeds
 * `useState` from it — so the very first client render already sees the real
 * media-query result.
 *
 * For any visitor with "prefers-reduced-motion: reduce" enabled that means:
 *
 *     server render      -> null  (falsy) -> animated props
 *     hydrating render   -> true          -> static props
 *
 * Every component that wrote `initial={reduceMotion ? false : {...}}` therefore
 * emitted different markup on the server than on the client, and React reported
 * it as a hydration mismatch. The error surfaced against the `loading` attribute
 * of the `<img>` inside `FeaturedTablesSection`'s `ParallaxImage`, but that was
 * only the deepest node React reached while walking the differing subtree — the
 * `transform` on the wrapping `motion.div` was the thing that actually differed.
 *
 * THE FIX. `reducedMotion="user"` moves the decision inside Motion, where it is
 * applied in `VisualElement.mount()` — client-side, after hydration — instead of
 * during render. Components no longer branch on the preference at all, so server
 * and client markup are identical by construction.
 *
 * Behaviour for reduced-motion users is also better than the code it replaces:
 * Motion skips transform and layout animations while still allowing opacity and
 * colour to animate, which is the accessible recommendation. The old branch
 * disabled the entire entry animation, so content appeared with no transition.
 *
 * Anything that reads the preference *outside* an animation — a scroll-linked
 * `style` binding, or a conditional return — cannot be covered here and must use
 * `useSafeReducedMotion()` from `@/lib/hooks/use-safe-reduced-motion` instead.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

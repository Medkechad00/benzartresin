"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { enquiryReceivedImage } from "@/content/section-images";
import { SealCheck } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SITE } from "@/lib/site-config";
import { localizedPath, toHref } from "@/lib/urls";

/**
 * Post-submission confirmation for the commission enquiry.
 *
 * Design read: end-of-funnel confirmation for a premium commission-furniture
 * studio, in the site's existing editorial language. Redesign-preserve, so the
 * dials match the rest of the site: DESIGN_VARIANCE 7, MOTION_INTENSITY 5,
 * VISUAL_DENSITY 3.
 *
 * Three of the site's signature devices are reused so this reads as the same
 * brand rather than a bolt-on success screen: the `clipPath` bottom-up curtain
 * wipe from HeroSection, the gold band behind the headline
 * (`box-decoration-clone` so it survives a line break), and hairline
 * `border-t border-black/10` rules opening each block as
 * MadeForYourSpaceSection does.
 *
 * ── Layout: stacked bands, not a row-spanning grid ────────────────────────
 *
 * An earlier version placed everything in one twelve-column grid and had the
 * photograph `lg:row-span-2` beside two content rows, with the summary and the
 * direct line in a third row's right cell and the buttons in its left cell.
 * That produced the two gaps this version exists to remove:
 *
 *  1. The photograph has a fixed aspect ratio, so its height is a function of
 *     its column width. The two rows it spanned were sized by their own text.
 *     Those two numbers have no reason to match, and they did not: the image
 *     bottomed out roughly 140px above the row it was supposed to reach,
 *     leaving a dead band between the picture and "What you sent us".
 *  2. In the last row the left cell held only two buttons while the right cell
 *     held two stacked blocks, so `self-end` pinned the buttons to the bottom of
 *     a cell that was several hundred pixels taller than they were.
 *
 * Row-spanning a fixed-aspect element across content-sized rows cannot align
 * except by coincidence. So the photograph now sits in a single two-column row,
 * and everything below it is a full-width band whose height is its own content.
 * Nothing has to agree with anything else, which is why there is no gap left to
 * tune.
 */

export type SummaryEntry = { label: string; value: string };

/** The site's two easing curves, named so the intent is legible at each call. */
const EASE_CURTAIN = [0.77, 0, 0.175, 1] as const;
const EASE_SETTLE = [0.23, 1, 0.32, 1] as const;

/** Bottom-up wipe, identical to the hero headline reveal. */
const CURTAIN_HIDDEN = "polygon(-10% 100%, 110% 100%, 110% 100%, -10% 100%)";
const CURTAIN_SHOWN = "polygon(-10% -20%, 110% -20%, 110% 120%, -10% 120%)";

/**
 * Shared entry transition.
 *
 * Took a `reduceMotion` flag and returned `initial: false` when set. That read
 * was a hydration bug — see components/providers/MotionProvider.tsx — and it is
 * now handled by the root `MotionConfig reducedMotion="user"`, which suppresses
 * the `y` transform while still fading opacity.
 */
function settle(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE_SETTLE },
  };
}

/** Opens a band. One hairline at the container edge, the site's own device. */
const BAND = "mt-12 md:mt-16 pt-10 md:pt-12 border-t border-black/10";

/**
 * Only the four answers a client recognises as "their" table.
 *
 * The form collects up to eleven fields. Restating all of them turns a
 * confirmation into a receipt, and four is also what fits the spec strip below
 * in one clean row at every breakpoint.
 */
const SUMMARY_LIMIT = 4;

export function InquirySuccess({
  firstName,
  summary,
  onReset,
}: {
  firstName: string;
  summary: SummaryEntry[];
  onReset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Inquiry");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps = t.raw("success.steps") as { title: string; body: string }[];
  const shownSummary = summary.slice(0, SUMMARY_LIMIT);

  /**
   * Move focus to the heading once, on mount.
   *
   * The form is gone from the DOM, which leaves focus on `body`. `role="status"`
   * announces the panel, but without focus a keyboard user is dropped at the top
   * of the document with no idea the submission succeeded. `preventScroll`
   * because the panel is already in view and scrolling would fight the reveal.
   */
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    /*
      A plain <section>, not a page-sized live region.

      This carried `role="status" aria-live="polite"` on the outermost element,
      which wrapped roughly 240 lines of headings, a definition list, links and
      two buttons. Two problems with that: `role="status"` overrides the implicit
      `region` role, and every one of the staggered `motion` reveals inside it
      (delays out to +0.66s) mutates the subtree, so the whole panel was queued
      for re-announcement several times over.

      The announcement now comes from one small live region below, holding just
      the confirmation sentence — which is the part a screen-reader user needs to
      hear. Focus still moves to the heading, so the panel is also reachable.
    */
    <section aria-labelledby="inquiry-success-heading" className="w-full px-6 md:px-12 bg-white">
      {/*
        The actual announcement: short, text-only, and not re-triggered by the
        reveal animations because nothing inside it animates.
      */}
      <p role="status" aria-live="polite" className="sr-only">
        {t("success.eyebrow")}. {t("success.title")}
      </p>
      <div className="max-w-7xl mx-auto border-t border-black/10 pt-12 md:pt-16 pb-24 md:pb-32">

        {/* ── Confirmation and photograph ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-16 items-center">

          {/*
            `lg:self-center` via the row's `items-center`: the photograph is
            marginally taller than this column, and centring splits the residual
            difference evenly instead of hanging it all underneath the paragraph
            where it reads as a mistake.
          */}
          <div className="lg:col-span-7">
            {/*
              The single eyebrow this component is allowed. It is spent here
              because a status message is the one place a small affirmative
              label does real work.
            */}
            <motion.p
              {...settle(0)}
              className="flex items-center gap-2.5 font-sans text-[10px] uppercase tracking-[0.25em] text-gold-ink mb-5"
            >
              <SealCheck size={16} weight="fill" className="text-gold" aria-hidden="true" />
              {t("success.eyebrow")}
            </motion.p>

            {/*
              Overflow hidden on the wrapper so the curtain wipe has something to
              clip against, and `pb-[0.06em]` inside the band reserves the
              descender the gold rectangle would otherwise cut.
            */}
            {/*
              `h1`, not `h2`.

              `InquiryClient` returns this component instead of the form, and its
              own `<h1>` goes with it — so the success view was the one state on
              the site with no `h1` at all, starting its outline at `h2`. This is
              the page's heading while this state is showing.
            */}
            <h1
              id="inquiry-success-heading"
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-[2.6rem] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] text-black tracking-tight leading-[0.95] mb-6 overflow-hidden"
            >
              <motion.span
                initial={{ clipPath: CURTAIN_HIDDEN, y: 30 }}
                animate={{ clipPath: CURTAIN_SHOWN, y: 0 }}
                transition={{ duration: 0.9, delay: 0.08, ease: EASE_CURTAIN }}
                className="block"
              >
                <span className="bg-gold box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                  {t("success.title")}
                </span>
              </motion.span>
            </h1>

            <motion.p
              {...settle(0.2)}
              className="font-sans text-black/70 text-lg md:text-xl leading-relaxed max-w-[46ch]"
            >
              {t("success.body", { name: firstName })}
            </motion.p>
          </div>

          {/*
            A real image, not decoration: the second promise below is that we
            send photographs of the candidate boards, and this is what those look
            like, so the picture is evidence for the copy beside it.

            `aspect-[4/3]` rather than the portrait crop used elsewhere on the
            site. At this column width a 4:5 frame stood about 240px taller than
            the type beside it; landscape brings the two within about 30px, which
            is what makes the row sit level.
          */}
          <motion.div
            initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            transition={{ duration: 1.1, delay: 0.15, ease: EASE_CURTAIN }}
            className="lg:col-span-5 relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-ivory-dark shadow-2xl"
          >
            <motion.div
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.8, delay: 0.15, ease: EASE_SETTLE }}
              className="relative w-full h-full"
            >
              <Image
                src={enquiryReceivedImage.src}
                alt={t("success.imageAlt")}
                fill
                /*
                  Eager: this panel replaces the form the moment it submits, so
                  the image is the largest thing on screen at that instant and a
                  lazy fetch shows an empty frame at the emotional high point.
                */
                loading="eager"
                fetchPriority="high"
                placeholder="blur"
                blurDataURL={enquiryReceivedImage.blurDataURL}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* ── What happens next ────────────────────────────────────────── */}
        <div className={BAND}>
          <motion.h3
            {...settle(0.28)}
            className="font-display text-2xl md:text-3xl text-black tracking-tight mb-8 md:mb-10"
          >
            {t("success.nextTitle")}
          </motion.h3>

          {/*
            Three beats read left to right, which is the same direction as time,
            and mirrors correctly under RTL because the separators are logical
            (`border-s`) rather than physical.

            Separators instead of cards: three bordered boxes in a row is the
            house-banned feature-card pattern, and these are stages in one
            process rather than three independent things. `first:` resets keep the
            rule strictly between items, so the group never reads as a table.

            Below `lg` the columns stack and the separator rotates to a top rule
            on the same elements, which is why both variants are declared here
            rather than assumed.
          */}
          <ol className="grid grid-cols-1 lg:grid-cols-3">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                {...settle(0.34 + i * 0.08)}
                className="
                  border-t border-black/10 pt-6 mt-6 first:border-t-0 first:pt-0 first:mt-0
                  lg:border-t-0 lg:pt-0 lg:mt-0 lg:border-s lg:ps-8 lg:first:border-s-0 lg:first:ps-0 lg:pe-4
                "
              >
                <p className="font-display text-xl md:text-2xl text-black leading-snug mb-3">
                  {step.title}
                </p>
                <p className="font-sans text-sm text-black/60 leading-relaxed max-w-[40ch]">
                  {step.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* ── What you sent us, and the direct line ────────────────────── */}
        <div className={`${BAND} grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-16`}>

          {shownSummary.length > 0 && (
            <motion.div {...settle(0.5)} className="lg:col-span-7">
              <h2 className="font-display text-xl md:text-2xl text-black tracking-tight mb-6">
                {t("success.summaryTitle")}
              </h2>

              {/*
                A spec strip rather than a stacked list. Four short factual
                values laid out horizontally fill the width they are given and
                read at a glance, where the vertical version left a tall thin
                column of mostly air beside the photograph.

                `items-start` and a shared baseline per cell: labels sit above
                values so a long value wraps under its own label instead of
                pushing the neighbouring cell down.
              */}
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-7 items-start">
                {shownSummary.map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <dt className="font-sans text-[11px] text-black/60 leading-none">{label}</dt>
                    {/*
                      `dir="auto"` is safe on a value that always has content: the
                      first strong character is a real one, so a Latin answer
                      inside an Arabic page aligns to its own script.
                    */}
                    <dd
                      dir="auto"
                      className="font-display text-lg md:text-xl text-black leading-tight border-t-2 border-gold/40 pt-2.5"
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}

          <motion.div
            {...settle(0.58)}
            className={shownSummary.length > 0 ? "lg:col-span-5" : "lg:col-span-12"}
          >
            <h2 className="font-display text-xl md:text-2xl text-black tracking-tight mb-3">
              {t("success.urgentTitle")}
            </h2>
            <p className="font-sans text-sm text-black/60 leading-relaxed mb-5 max-w-[44ch]">
              {t("success.urgentBody")}
            </p>
            {/* Inline rather than stacked, so this block stays as short as the
                strip beside it and the band closes level. */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <a
                href={`mailto:${SITE.email}`}
                className="font-sans text-sm text-black border-b border-gold-ink pb-0.5 hover:text-gold-ink transition-colors"
              >
                {SITE.email}
              </a>
              {SITE.telephone ? (
                <a
                  href={`tel:${SITE.telephone}`}
                  dir="ltr"
                  className="font-sans text-sm text-black border-b border-gold-ink pb-0.5 hover:text-gold-ink transition-colors"
                >
                  {SITE.telephoneDisplay}
                </a>
              ) : null}
            </div>
          </motion.div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        {/*
          A closing bar rather than a cell in the grid above. The two actions are
          the last thing on the page and belong on their own line, pushed to
          opposite ends so the primary reads as the primary. Button treatment is
          lifted from the hero, so it is the same object the visitor already
          clicked once on this site.
        */}
        <motion.div
          {...settle(0.66)}
          className={`${BAND} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6`}
        >
          <Link
            href={toHref(localizedPath("/tables", locale))}
            className="bg-black text-white px-8 py-4 text-center uppercase tracking-widest text-xs font-bold hover:bg-black/90 transition-transform active:scale-[0.98] whitespace-nowrap"
          >
            {t("success.actions.browse")}
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="font-sans text-xs uppercase tracking-widest text-black/60 hover:text-black transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            {t("success.actions.again")}
          </button>
        </motion.div>

      </div>
    </section>
  );
}

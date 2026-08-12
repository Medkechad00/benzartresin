import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site-config";

/**
 * Benzart Resin wordmark.
 *
 * The source asset is pure black (RGB 0,0,0) with the shape carried entirely in
 * the alpha channel — verified with sharp: all three colour channels are 0/0/0
 * and only alpha varies. That makes it a perfect mask source.
 *
 * So instead of shipping light and dark variants (two files, two requests, two
 * things to keep in sync), the logo is painted with `background-color:
 * currentColor` and clipped by the asset's alpha via `mask-image`. The mark then
 * inherits whatever `color` its container sets, exactly like a font glyph or an
 * SVG with `fill="currentColor"`.
 *
 * Practical effect: on the transparent hero navbar it renders white, on the
 * scrolled gold navbar it renders black, in the dark footer it renders white —
 * all from one file, with no JS and no duplicated assets. Contrast follows the
 * surface automatically because it is literally the same value as the text.
 *
 * Accessibility: `role="img"` plus `aria-label` because a masked div carries no
 * implicit semantics. Where the logo sits inside an already-labelled link, pass
 * `decorative` so it is hidden from the accessibility tree and the link's own
 * label is not read twice.
 */

/**
 * Asset filename, deliberately left as `benzart-logo.webp`. It is a path on
 * disk, not brand copy — renaming it would 404 the mask for no benefit.
 */
const LOGO_SRC = "/benzart-logo.webp";

/** Intrinsic aspect ratio of the wordmark: 4039 x 1447. */
export const LOGO_ASPECT = 4039 / 1447;

type LogoProps = {
  className?: string;
  /** Hide from assistive tech when the parent link already has a label. */
  decorative?: boolean;
  label?: string;
};

export function Logo({ className, decorative = false, label = SITE.name }: LogoProps) {
  return (
    <span
      className={cn("block bg-current", className)}
      style={{
        // Both properties: `mask` is standard, `WebkitMask` still needed for
        // older WebKit. Without the prefix the mark renders as a solid block on
        // some Safari versions rather than failing invisibly, which is worse.
        WebkitMask: `url(${LOGO_SRC}) center / contain no-repeat`,
        mask: `url(${LOGO_SRC}) center / contain no-repeat`,
        aspectRatio: `${4039} / ${1447}`,
      }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    />
  );
}

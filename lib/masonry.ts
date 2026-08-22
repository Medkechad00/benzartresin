/**
 * Column distribution for the Pinterest-style masonry grids on the homepage and
 * the collection page.
 *
 * WHY THIS IS NOT CSS. The three CSS approaches to masonry each fail here:
 *
 *   - `columns-2` (CSS multi-column) packs correctly but flows content DOWN
 *     column one before starting column two, and it fragments a card across the
 *     column break unless every child is `break-inside: avoid`.
 *   - `grid-template-rows: masonry` is still not shipped outside a Firefox flag.
 *   - A plain `grid-cols-2` aligns rows, which is the thing masonry exists to
 *     avoid — the offset between columns IS the aesthetic.
 *
 * A JS measuring pass is the usual fallback, but it cannot run during
 * prerendering, so the first paint would be a single stack that reflows on
 * hydration — exactly the layout shift the image work went to some trouble to
 * eliminate.
 *
 * So the split happens at render time from data we already have: every cover
 * carries its intrinsic pixel size, which is enough to predict each card's
 * height as a multiple of the column width. Deterministic, identical on server
 * and client, and no measurement.
 *
 * PACKING. Shortest-column-first, which is what Pinterest itself does: each card
 * goes to whichever column is currently shorter. Simple alternation (0,1,0,1…)
 * would leave the columns ragged whenever heights differ, and a ragged bottom on
 * a twelve-item grid is very visible.
 *
 * ORDERING CAVEAT, stated plainly: filling columns means DOM order is
 * column-major, so assistive technology reads all of column one and then all of
 * column two rather than strict catalogue order. That is inherent to CSS-free
 * masonry and is the same behaviour as `columns-2`. It is acceptable here because
 * the collection has no meaningful precedence between pieces — but it would not
 * be acceptable for, say, search results.
 */

export type MasonryItem = {
  /** Rendered width ÷ height of the card's image frame. */
  aspectRatio: number;
  /**
   * Everything below the image — caption band, padding — expressed as a
   * fraction of the column width so the estimate scales with the viewport.
   */
  captionRatio: number;
};

/**
 * Distributes items into `columnCount` columns, shortest column first.
 *
 * Returns arrays of indices into the original list, so the caller keeps its own
 * item type and no data is copied.
 */
export function balanceColumns<T extends MasonryItem>(
  items: T[],
  columnCount = 2
): number[][] {
  const columns: number[][] = Array.from({ length: columnCount }, () => []);
  // Heights are in units of column width, so they are viewport-independent.
  const heights = new Array<number>(columnCount).fill(0);

  items.forEach((item, index) => {
    // 1 / aspectRatio converts "width ÷ height" into height-per-unit-width.
    const cardHeight = 1 / item.aspectRatio + item.captionRatio;

    let target = 0;
    for (let c = 1; c < columnCount; c++) {
      // Strict `<` keeps ties going to the earliest column, which makes the
      // result stable and keeps the first item top-left.
      if (heights[c]! < heights[target]!) target = c;
    }

    columns[target]!.push(index);
    heights[target] = heights[target]! + cardHeight;
  });

  return columns;
}

/**
 * Card aspect ratios, in three portrait tiers.
 *
 * All three are taller than wide, which is the vertical Pinterest proportion the
 * brief asks for — the collection grid previously used `6/5`, a landscape frame.
 *
 * WHY THREE TIERS AND NOT TWO. Masonry only reads as masonry if card heights
 * vary; if they do not, a two-column masonry grid is indistinguishable from a
 * plain grid. An earlier version of this used two tiers keyed on portrait-vs-
 * square, and with twelve cards the shortest-column-first packing equalised them
 * to *exactly* the same total — both columns ended at 9.6333 column-widths, Δ 0.
 * Perfectly level columns are precisely the thing this layout exists to avoid.
 *
 * The covers have three distinct native ratios (0.75, 0.80, 1.00), so mapping
 * each to its own portrait tier restores the variation from the source material
 * rather than inventing it, and keeps every crop modest:
 *
 *   native 0.75 -> 2/3  (0.667)  11% of width cropped
 *   native 0.80 -> 3/4  (0.750)   6% cropped
 *   native 1.00 -> 4/5  (0.800)  20% cropped, centred — safe on these framings
 */
export const CARD_ASPECT = {
  /** 0.667 — tallest tier, for covers that are already markedly portrait. */
  tallest: 'aspect-[2/3]',
  /** 0.75 — for the standard 4:5 covers. */
  tall: 'aspect-[3/4]',
  /** 0.80 — for covers that are square or wider. */
  standard: 'aspect-[4/5]',
} as const;

export const CARD_ASPECT_RATIO = {
  tallest: 2 / 3,
  tall: 3 / 4,
  standard: 4 / 5,
} as const;

export type CardBucket = keyof typeof CARD_ASPECT;

/** Which tier a cover belongs in, from its intrinsic pixel size. */
export function cardBucket(cover: { width: number; height: number }): CardBucket {
  const native = cover.width / cover.height;
  if (native < 0.78) return 'tallest';
  if (native < 0.95) return 'tall';
  return 'standard';
}

/**
 * Top offset applied to the second column.
 *
 * A guarantee rather than an aesthetic flourish. Three height tiers make level
 * columns unlikely, but the catalogue is editable content — add or remove a
 * piece and the packing could equalise again, silently turning the masonry back
 * into a plain grid. Offsetting one column means the two sides can never align
 * regardless of what the data does.
 *
 * Applied only from `md` up: on a phone the columns are narrow enough that an
 * offset wastes visible vertical space above the fold.
 */
export const SECOND_COLUMN_OFFSET = 'md:mt-12 lg:mt-16';


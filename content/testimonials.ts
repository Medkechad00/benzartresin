/**
 * Real client testimonials only.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DO NOT populate this file with invented names, quotes, ratings, review counts,
 * or "customer photos" that are actually studio product shots.
 *
 * Fake reviews are not a soft SEO risk, they are a legal and policy one:
 *   - Google structured-data policy: self-serving/fabricated review markup is a
 *     manual-action trigger, and the penalty lands on the whole domain.
 *   - UK DMCC Act 2024 and the EU Omnibus Directive (2005/29/EC as amended) make
 *     publishing fake consumer reviews an enforceable unfair-practice offence.
 *   - Imitating Google's review UI (the G logo, "Local Guide", star aggregate)
 *     is trademark misuse on top of the above.
 *
 * The section renders an honest "no reviews yet" state while this array is empty.
 * Add entries only for testimonials the studio has in writing, with permission.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Testimonial = {
  /** Verbatim client quote. Never paraphrased or written in-house. */
  quote: string;
  /** How the client agreed to be credited. */
  author: string;
  /** Optional: city/country, e.g. 'Lyon, France'. */
  location?: string;
  /** Optional: the commissioned piece, e.g. 'Atlas Walnut River, 240cm'. */
  commission?: string;
  /** ISO date the testimonial was given. */
  date?: string;
  /**
   * Set true only where the studio holds written permission AND can evidence the
   * commission. Gates whether this entry may ever appear in Review schema.
   */
  verified?: boolean;
};

/** Empty until real, permissioned client quotes are supplied. */
export const testimonials: Testimonial[] = [];

/**
 * Review/AggregateRating schema is deliberately NOT exported from here.
 *
 * It stays unimplemented until there is (a) a real corpus of reviews and (b) a
 * genuine first-party collection mechanism. Aggregate rating markup built from
 * a handful of hand-entered quotes is exactly the pattern Google penalises.
 */
export const hasTestimonials = () => testimonials.length > 0;

import { notFound } from "next/navigation";

/**
 * Catches every unmatched path under /[locale]/ and delegates to the
 * not-found boundary, which renders app/[locale]/not-found.tsx.
 * Next 16.2.11 does not bind route-group not-found for truly unmatched
 * paths at the segment level — this is the workaround.
 */
export default function CatchAllNotFound() {
  notFound();
}

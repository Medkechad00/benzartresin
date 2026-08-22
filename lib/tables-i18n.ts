import type { TableData, TableImage } from '@/content/tables/tables';

/**
 * A table with its translatable fields resolved for the active locale.
 *
 * `content/tables/tables.ts` stays the structural source of truth — slug,
 * image paths, dimensions, shape, availability, price — because none of those
 * are language-dependent. The prose (name, wood, resin colour, story, alt text)
 * lives in `messages/*.json` under the `Tables.<slug>` namespace so it can be
 * translated without touching the data file.
 */
export type LocalizedTable = Omit<
  TableData,
  'name' | 'wood' | 'resinColor' | 'story' | 'images' | 'material' | 'dimensions'
> & {
  name: string;
  wood?: string;
  resinColor: string;
  story: string;
  material?: string;
  dimensions: string;
  images: TableImage[];
};

/**
 * Minimal shape of a next-intl translator scoped to the `Tables` namespace.
 * Accepting the translator rather than the locale lets this work unchanged in
 * both server components (`getTranslations`) and client ones (`useTranslations`).
 */
type TablesTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

/**
 * Falls back to the English values baked into the data file whenever a
 * translation key is absent, so a missing entry degrades to readable English
 * instead of throwing or rendering a raw key path.
 */
export function localizeTable(table: TableData, t: TablesTranslator): LocalizedTable {
  const key = (field: string) => `${table.slug}.${field}`;
  const has = (field: string) => t.has(key(field));
  const pick = (field: string, fallback: string) => (has(field) ? t(key(field)) : fallback);
  const pickOptional = (field: string, fallback?: string) =>
    has(field) ? t(key(field)) : fallback;

  return {
    ...table,
    name: pick('name', table.name),
    // Optional because one piece in the collection has no verifiable timber:
    // its top and edge are a single poured resin surface. Omitting the field is
    // how the detail page knows to drop the "wood species" row rather than
    // print a placeholder.
    wood: pickOptional('wood', table.wood),
    resinColor: pick('resinColor', table.resinColor),
    story: pick('story', table.story),
    material: pickOptional('material', table.material),
    /**
     * Localized because the detail page renders it in the spec table. It was
     * previously read straight from the data file, so the Arabic page showed
     * "coffee table 120 x 75 cm, side table 50 cm diameter" in English, and the
     * French page showed "100 cm diameter".
     */
    dimensions: pick('dimensions', table.dimensions),
    /**
     * Every photograph gets its own translated alt text, keyed by position
     * under `Tables.<slug>.alt.<index>`.
     *
     * This used to localize the cover image only, leaving every subsequent
     * photograph with English alt text on the French and Arabic pages — which
     * defeats the point on the most image-heavy pages on the site. `imageAlt`
     * is still honoured as a fallback for the cover so older message files
     * keep working.
     */
    images: table.images.map((img, i) => {
      const indexed = `alt.${i}`;
      if (has(indexed)) return { ...img, alt: t(key(indexed)) };
      if (i === 0 && has('imageAlt')) return { ...img, alt: t(key('imageAlt')) };
      return img;
    }),
  };
}

/**
 * Material string shared by the detail page and Product schema.
 *
 * `material` is an explicit override for pieces where "wood & resin" would be
 * a false description. Without it, a resin-topped table would be advertised in
 * structured data as being made of a timber that is not there.
 */
export function localizedMaterial(table: LocalizedTable): string {
  if (table.material) return table.material;
  return table.wood ? `${table.wood} & ${table.resinColor}` : table.resinColor;
}

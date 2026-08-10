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
export type LocalizedTable = Omit<TableData, 'name' | 'wood' | 'resinColor' | 'story' | 'images'> & {
  name: string;
  wood: string;
  resinColor: string;
  story: string;
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
  const pick = (field: string, fallback: string) =>
    t.has(key(field)) ? t(key(field)) : fallback;

  const localizedAlt = t.has(key('imageAlt')) ? t(key('imageAlt')) : null;

  return {
    ...table,
    name: pick('name', table.name),
    wood: pick('wood', table.wood),
    resinColor: pick('resinColor', table.resinColor),
    story: pick('story', table.story),
    // Only the cover image has a translated alt; any additional photographs
    // keep the descriptive alt authored alongside them in the data file.
    images: table.images.map((img, i) =>
      i === 0 && localizedAlt ? { ...img, alt: localizedAlt } : img
    ),
  };
}

/** Material string shared by the detail page and Product schema. */
export function localizedMaterial(table: LocalizedTable): string {
  return `${table.wood} & ${table.resinColor}`;
}

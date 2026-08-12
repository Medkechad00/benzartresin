/**
 * The single source of truth for commissioned pieces.
 *
 * Both `/tables` (gallery) and `/tables/[slug]` (detail + Product schema) read
 * from here, plus `FeaturedTablesSection` on the homepage. Nothing may hardcode
 * its own table list: divergent copies are how the gallery ended up linking to
 * three slugs that did not exist.
 *
 * ⚠️ `startingPrice` is emitted into Product schema as `offers.price` AND shown
 * on the detail page. Google requires the two to agree, so never set a price
 * here that the page does not display. Confirm these figures with the studio
 * before launch — set to `undefined` to omit the offer price entirely.
 */

export type TableImage = {
  src: string;
  /**
   * Descriptive alt: wood species, resin colour, shape/setting. Serves
   * accessibility, Google Images, and Pinterest simultaneously. Never the
   * bare product name.
   */
  alt: string;
  /** Tailwind aspect ratio class for the source photograph. */
  aspect: string;
};

export type TableData = {
  slug: string;
  /** French URL slug. Arabic keeps the English slug. */
  slugFr?: string;
  name: string;
  wood: string;
  resinColor: string;
  shape: 'rectangular' | 'organic' | 'round';
  dimensions: string;
  story: string;
  images: TableImage[];
  availability: 'made-to-order' | 'sold';
  startingPrice?: number;
  isPlaceholder?: boolean;
};

export const tables: TableData[] = [
  {
    slug: 'atlas-walnut-river',
    slugFr: 'atlas-noyer-riviere',
    name: 'The Atlas Walnut River',
    wood: 'Moroccan Atlas Walnut',
    resinColor: 'Deep Emerald Green',
    shape: 'rectangular',
    dimensions: '240cm x 100cm',
    story:
      'Sourced from the foothills of the Atlas Mountains, this rare slab of Moroccan Walnut features stunning, chaotic grain patterns. The river is poured with a custom deep emerald epoxy, layered to create a sense of profound depth. Finished with a hard-wax oil for a museum-quality sheen.',
    images: [
      {
        src: '/images/table_walnut_river.png',
        alt: 'Rectangular Moroccan Atlas walnut dining table with a deep emerald green epoxy resin river running its full length',
        aspect: 'aspect-[4/5]',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 4200,
  },
  {
    slug: 'obsidian-grain',
    slugFr: 'obsidienne-grain',
    name: 'Obsidian Grain',
    wood: 'Charred Ash (Shou Sugi Ban)',
    resinColor: 'Opaque Black',
    shape: 'rectangular',
    dimensions: '200cm x 90cm',
    story:
      'Combining the Japanese Shou Sugi Ban charring technique with a modern deep pour. The ash is charred, brushed, and sealed, its blackened grain contrasting against a pure, light-absorbing obsidian resin channel.',
    images: [
      {
        src: '/images/table_obsidian_grain.png',
        alt: 'Rectangular charred ash Shou Sugi Ban dining table with an opaque black epoxy resin channel and visible brushed grain',
        aspect: 'aspect-square',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 3800,
  },
  {
    slug: 'golden-current',
    slugFr: 'courant-dore',
    name: 'Golden Current',
    wood: 'Olive Wood',
    resinColor: 'Metallic Gold',
    shape: 'organic',
    dimensions: '180cm diameter',
    story:
      'A composition of ancient olive wood burls suspended in swirling metallic gold resin. The natural voids of the wood dictated the flow of the pour, producing a piece that reads as organic and deliberate at once.',
    images: [
      {
        src: '/images/table_golden_current.png',
        alt: 'Round organic-edge olive wood table with metallic gold epoxy resin filling the natural burl voids',
        aspect: 'aspect-[16/9]',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 5100,
  },

  /* ─────────────────────────────────────────────────────────────────────────
     PLACEHOLDER PIECES — replace before launch.

     Added only to see how the gallery, the homepage grid, and the detail page
     behave with a fuller collection. Deliberately varied across shape, aspect
     ratio, availability, and price (including one with no price) so every
     rendering branch is exercised: the `sold` state, the "from" price block,
     and the omitted-price case.

     Photography is reused from existing pieces, so the images do NOT match the
     described wood or resin. That is a placeholder tell, not a mistake, and it
     is why `isPlaceholder` is set: nothing here should ship as real inventory.
     ───────────────────────────────────────────────────────────────────────── */
  {
    slug: 'cedar-tide',
    slugFr: 'cedre-maree',
    name: 'Cedar Tide',
    wood: 'Middle Atlas Cedar',
    resinColor: 'Translucent Teal',
    shape: 'rectangular',
    dimensions: '260cm x 110cm',
    story:
      'A long cedar plank split and rejoined around a translucent teal channel. The pour is shallow at the edges and deepens toward the centre, so the colour reads almost clear at the rim and saturated along the middle.',
    images: [
      {
        src: '/images/gallery_table_01.png',
        alt: 'Placeholder photograph for a rectangular cedar dining table with a translucent teal epoxy resin channel',
        aspect: 'aspect-[4/5]',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 4800,
    isPlaceholder: true,
  },
  {
    slug: 'saffron-basin',
    slugFr: 'safran-bassin',
    name: 'Saffron Basin',
    wood: 'Spalted Maple',
    resinColor: 'Amber Saffron',
    shape: 'round',
    dimensions: '150cm diameter',
    story:
      'Spalted maple with its black fungal lines left fully visible, set into a warm amber pour. A round top made from a single wide board, which is the constraint that makes this piece hard to repeat.',
    images: [
      {
        src: '/images/material_detail.png',
        alt: 'Placeholder photograph for a round spalted maple table with an amber saffron epoxy resin pour',
        aspect: 'aspect-square',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 3600,
    isPlaceholder: true,
  },
  {
    slug: 'quarry-edge',
    slugFr: 'carriere-bord',
    name: 'Quarry Edge',
    wood: 'European Oak',
    resinColor: 'Slate Grey',
    shape: 'organic',
    dimensions: '220cm x 95cm',
    story:
      'Oak with an unusually broken live edge, filled with an opaque slate resin so the outline reads as stone rather than water. Delivered to a private client; shown here as a reference for what the treatment looks like at scale.',
    images: [
      {
        src: '/images/hero_detail.png',
        alt: 'Placeholder photograph for an organic-edge European oak table with opaque slate grey epoxy resin',
        aspect: 'aspect-[16/9]',
      },
    ],
    availability: 'sold',
    startingPrice: 6400,
    isPlaceholder: true,
  },
  {
    slug: 'nomad-console',
    slugFr: 'nomade-console',
    name: 'Nomad Console',
    wood: 'Reclaimed Thuya Burl',
    resinColor: 'Smoke Clear',
    shape: 'rectangular',
    dimensions: '180cm x 45cm',
    story:
      'A narrow console in reclaimed thuya burl, stabilised and filled with a lightly smoked clear resin. Priced on enquiry, because thuya of this figure is sourced piece by piece and no two boards cost the same.',
    images: [
      {
        src: '/images/frame_1.png',
        alt: 'Placeholder photograph for a narrow reclaimed thuya burl console with smoke-tinted clear epoxy resin',
        aspect: 'aspect-[3/4]',
      },
    ],
    availability: 'made-to-order',
    // Intentionally no startingPrice: exercises the omitted-price branch on the
    // detail page and the `offers` omission in Product schema.
    isPlaceholder: true,
  },
];

export function getTableBySlug(slug: string): TableData | undefined {
  return tables.find((t) => t.slug === slug || t.slugFr === slug);
}

export function getAllTableSlugs(): string[] {
  return tables.map((t) => t.slug);
}

/** Material string shared by the detail page and Product schema. */
export function tableMaterial(table: TableData): string {
  return `${table.wood} & ${table.resinColor} epoxy resin`;
}

/**
 * Demo pieces still present in the collection.
 *
 * Use this in a pre-launch check: if it returns anything, the catalogue still
 * contains fictional inventory with mismatched photography.
 */
export function placeholderTables(): TableData[] {
  return tables.filter((t) => t.isPlaceholder);
}

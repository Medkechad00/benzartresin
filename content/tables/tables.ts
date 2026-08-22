/**
 * The single source of truth for commissioned pieces.
 *
 * GENERATED from `tables products/_catalogue/verified-*.json` by
 * `_catalogue/generate-site-data.mjs`. Edit the catalogue and rerun rather than
 * editing this file, or the next run will overwrite your changes.
 *
 * Both `/tables` (gallery) and `/tables/[slug]` (detail + Product schema) read
 * from here, plus `FeaturedTablesSection` on the homepage. Nothing may hardcode
 * its own table list: divergent copies are how the gallery ended up linking to
 * three slugs that did not exist.
 *
 * Every entry below is a real piece, photographed by the studio, with its
 * dimensions and price taken from the text file shipped in its source folder
 * and its shape, material and finish confirmed against the photographs.
 *
 * ⚠️ `startingPrice` is emitted into Product schema as `offers.price` AND shown
 * on the detail page. Google requires the two to agree, so never set a price
 * here that the page does not display. Prices are USD: only one source file
 * carried an explicit currency symbol (`450$`), and the rest are bare numbers
 * consistent with that band — see `priceNote` in the catalogue for each piece.
 */

export type TableImage = {
  src: string;
  /**
   * Descriptive alt: wood species, resin colour, shape/setting. Serves
   * accessibility, Google Images, and Pinterest simultaneously. Never the
   * bare product name.
   *
   * This is the English text. Translations live in
   * `messages/*.json` under `Tables.<slug>.alt.<index>`.
   */
  alt: string;
  /** Tailwind aspect ratio class, derived from the file's real pixel dimensions. */
  aspect: string;
  /** Intrinsic pixel size, read from the WebP header — not guessed. */
  width: number;
  height: number;
  /**
   * What the photograph actually shows. Drives thumbnail selection: a whole
   * table in a room identifies a product at card size, a close crop of grain
   * does not.
   */
  role: 'full' | 'overhead' | 'angled' | 'detail' | 'base';
  /**
   * The designated primary thumbnail. Exactly one image per table carries this,
   * chosen by score in the generator, and it is always `images[0]`.
   */
  isCover?: boolean;
  /**
   * True where the photograph shows a DIFFERENT physical table that shared the
   * source folder. Still displayed in the gallery, never used as the thumbnail,
   * because it would advertise a piece the listing does not sell.
   */
  isVariant?: boolean;
  /** 16px inline WebP, ~155 bytes, for a coloured first paint. */
  blurDataURL: string;
};

export type TableData = {
  slug: string;
  /** French URL slug. Arabic keeps the English slug. */
  slugFr?: string;
  name: string;
  /**
   * Optional: one piece in the collection is a single poured resin surface with
   * no timber visible on the top, the edge or the underside. Omitting this is
   * how the detail page knows to drop the wood row instead of inventing a
   * species.
   */
  wood?: string;
  resinColor: string;
  /**
   * Explicit override for the material string used in Product schema and on the
   * detail page. Set it only where "wood & resin" would be untrue.
   */
  material?: string;
  shape: 'rectangular' | 'organic' | 'round' | 'oval';
  dimensions: string;
  story: string;
  images: TableImage[];
  availability: 'made-to-order' | 'sold';
  startingPrice?: number;
  isPlaceholder?: boolean;
};

export const tables: TableData[] = [
  {
    slug: 'walnut-berber-resin-coffee-table',
    slugFr: 'table-basse-noyer-resine-motif-berbere',
    name: 'Walnut Coffee Table with Berber Motif Resin River',
    wood: 'Solid walnut',
    resinColor: 'Opaque black with embroidered Berber panel',
    shape: 'rectangular',
    dimensions: '120 x 75 cm',
    story:
      'A live-edge coffee table in solid walnut, split down its length by a channel of black epoxy that holds a hand-embroidered Berber panel. Cross-stitch diamonds, chevrons and X-forms in white, gold, green, rust and violet sit suspended under a mirror-gloss pour, so the pattern reads clearly from standing height. Both walnut slabs keep their natural edge and the pale sapwood line that runs with it. The base is cut from the same timber: two solid planks, live-edged, carrying the top without an apron. Finished at 120 x 75 cm.',
    images: [
      {
        src: '/tables/walnut-berber-resin-coffee-table/walnut-berber-resin-coffee-table-moroccan-salon.webp',
        alt: 'Live-edge walnut coffee table with a black resin river holding a Berber motif, on a cream rug before a grey corner sofa',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADQAwCdASoQABQAPt1ep00opSOiMAgBEBuJZQCdAB3/hAAOZ/LXAAAA/q9tIKemGw45xPaP9kTIkP+zmHaK7rEfE3QHW2mc+jTgGmstiMp7WHJfAAA=',
      },
      {
        src: '/tables/walnut-berber-resin-coffee-table/walnut-coffee-table-berber-embroidery-resin-detail.webp',
        alt: 'Walnut coffee table seen from above at an angle, the black resin channel showing white and gold cross-stitch Berber diamonds',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAACwAwCdASoQABQAPt1epkyopSOiMAgBEBuJYwC7ACHU8pP9R4hiAAD+5xkWjuiOIk0yFs5mHC2l90EZtH0CKBuihdkLrShtGcQ+tUwkgQAAAA==',
      },
      {
        src: '/tables/walnut-berber-resin-coffee-table/walnut-resin-table-berber-motif-overhead-figured-grain.webp',
        alt: 'Overhead view of the walnut coffee table, figured grain on both slabs framing the embroidered black resin centre',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAADQAwCdASoQABQAPt1cp00opSOiMAgBEBuJYwCdABJqxanLcLc6iwAA/p3GDzznbDXAbuFbeLscKQPFuDTb/Zx7Ech5ri+p+TeDSK3j9KIXcneUjwAAAA==',
      },
      {
        src: '/tables/walnut-berber-resin-coffee-table/walnut-berber-resin-coffee-table-grey-sofa-orange-cushions.webp',
        alt: 'Walnut and black resin coffee table in a Moroccan salon, grey corner sofa with orange and pale blue cushions behind',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADQAwCdASoQABQAPt1cpkyopSOiMAgBEBuJZQCw7B5l6sTzGkCdWgAA/sX8UTN+xYIRyhVE3RwycxqhvQpu7b1WsUF70toF8MNKik6OlyY3oAAA',
      },
      {
        src: '/tables/walnut-berber-resin-coffee-table/walnut-berber-cross-stitch-embroidery-resin-closeup.webp',
        alt: 'Close view of the resin channel, Berber cross-stitch diamonds and chevrons in white, gold, green, rust and violet under gloss epoxy',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'detail',
        blurDataURL:
          'data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAABQBACdASoQABQAPt1ep00opSOiMAgBEBuJYwCdMoMYOT+AdF1obWKSYzEAAPv9qH9aHU1fp6OUsWWWjVjl8US9fQhF025pL/bBCeS3wkoBuPwhgHMS/rLDQAA=',
      },
      {
        src: '/tables/walnut-berber-resin-coffee-table/walnut-berber-coffee-table-plank-base-garden-doors.webp',
        alt: 'The walnut coffee table from the side, twin live-edge plank base visible, garden and pool through glass doors beyond',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAABwAwCdASoQABQAPt1eqE0opSQiMAgBEBuJZQAAOls027Za4EAA/ogI5VghGpoX9KLwJsGYmj7rEXkRx+n6xAs9sAdZPep9f0Ngsmow1jS3XxMPbIewAA==',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 450,
  },
  {
    slug: 'oval-walnut-navy-resin-dining-table',
    slugFr: 'table-repas-ovale-noyer-resine-bleu-nuit',
    name: 'Oval Walnut Dining Table with Navy Resin River',
    wood: 'Solid walnut',
    resinColor: 'Deep navy with pearl and grey marbling',
    shape: 'oval',
    dimensions: '180 x 90 cm',
    story:
      'An oval dining table in solid walnut, its ends fully radiused so nothing catches as chairs are pulled out. Two book-matched walnut slabs are held apart by a river of deep navy epoxy, marbled with pearl and grey where the pour caught the light. It reads almost black indoors and resolves to true navy in daylight. The inner edges are the tree\'s own, left exactly as the slab gave them. The walnut carries heavy figure and burl through both halves, and the whole top is finished to a mirror gloss on splayed walnut legs. Seats six at 180 x 90 cm.',
    images: [
      {
        src: '/tables/oval-walnut-navy-resin-dining-table/oval-walnut-dining-table-navy-resin-river-teal-chairs.webp',
        alt: 'Oval walnut dining table with a deep navy resin river, teal bouclé armchairs around it in a showroom',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADQAwCdASoQABQAPt1cpkyopSOiMAgBEBuJYwCdABrSa2q4WmvQHVwA80g+dB/OsTTfwvRst3pdmJBX78UlXV705UOOZ1JK48kvuo1oMNtWAA==',
      },
      {
        src: '/tables/oval-walnut-navy-resin-dining-table/oval-walnut-resin-table-top-poolside-navy-pearl-veining.webp',
        alt: 'The oval walnut top photographed outdoors beside a pool, navy resin and pearl veining running the full length',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAACQAwCdASoQABQAPt1cp0yopSOiMAgBEBuJQBOkH+AyoCyX/pjgAPJz/kQLkKL5ZK2f0bgkj5xFvI9kjX9hSadf5ftIXXxHI8NAYyYj6csC2ISpQAA=',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 1100,
  },
  {
    slug: 'walnut-3d-textured-clear-resin-dining-table',
    slugFr: 'table-repas-noyer-resine-claire-texture-3d',
    name: 'Walnut Dining Table with 3D-Textured Clear Resin',
    wood: 'Solid walnut',
    resinColor: 'Clear to smoky sage green, 3D cellular relief',
    shape: 'rectangular',
    dimensions: '180 x 90 cm',
    story:
      'A rectangular dining table built the other way round: one broad slab of solid walnut runs down the centre, and the epoxy sits to either side of it rather than between two boards, forming the finished outer edges. The resin is poured almost clear, tinted a pale smoky sage, and carries a deep three-dimensional cell relief — domed cells standing proud of the surface that throw light differently as you move around the table. The walnut is the reason for the piece, a single board of heavy red-brown burl figure with its live edge kept on both flanks. Polished to a mirror and set on a black steel trapezoid frame. Seats six to eight at 180 x 90 cm.',
    images: [
      {
        src: '/tables/walnut-3d-textured-clear-resin-dining-table/walnut-3d-cell-resin-dining-table-poolside-steel-frame.webp',
        alt: 'The walnut table on a lawn beside a pool, 3D cellular resin bands either side of the central slab, black steel trapezoid frame beneath',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADwAwCdASoQABQAPt1cpkyopSOiMAgBEBuJQBOgA0arbHbu4Xb4HxoAAP7JO+7UMbCgdS5o4dJSDTxBHUBXiwwoG8Pyvt33LJTarbHrnytmAAAA',
      },
      {
        src: '/tables/walnut-3d-textured-clear-resin-dining-table/walnut-3d-resin-dining-table-showroom-teal-chairs.webp',
        alt: 'Walnut dining table with a single figured slab and clear 3D-textured resin along both sides, teal bouclé chairs around it',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADQAwCdASoQABQAPt1cp0yopSOiMAgBEBuJYwCdMoABkM5LgC0XpYAAzjoKJH2HjK0IIsfQ6zwMkcZ1KRj13pBV0g/bXvtNFvUYfbMofZ4DytKeLlGTN54AAAA=',
      },
      {
        src: '/tables/walnut-3d-textured-clear-resin-dining-table/walnut-resin-table-gloss-reflection-garden-palms.webp',
        alt: 'Low angle along the walnut table top outdoors, the mirror finish reflecting palms and sky',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'detail',
        blurDataURL:
          'data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAACwAwCdASoQABQAPt1ap0yopSOiMAgBEBuJQBdgAbIRIA6/4HaSAAD+ZZZ7cPoTFgioPVxdLxlDg+doRvHNbYNg/Lx6FI3AHjO8bRdJojFFjt1AkwIv7rP7AAA=',
      },
      {
        src: '/tables/walnut-3d-textured-clear-resin-dining-table/walnut-burl-slab-3d-resin-overhead-full-top.webp',
        alt: 'Overhead view of the full top, deep red-brown walnut burl figure between two bands of 3D-relief resin',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAABQBACdASoQABQAPt1cqE0opSQiMAgBEBuJaACdMoR4PoAC1QyIsAIxHaloAP7YBLG3P8TeZ9lbLcztvRXr6N2l5rhQ3S9SjKcDvsKvJx1iysq/q5f2U9ITBn7LxIAA',
      },
      {
        src: '/tables/walnut-3d-textured-clear-resin-dining-table/walnut-3d-resin-table-salon-floor-lamps-sofas.webp',
        alt: 'The walnut dining table set in a salon, floor lamps and buttoned sofas behind it',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADwAwCdASoQABQAPt1gp00opaOiMAgBEBuJZQCdABQjShZhOg9hSQQAAP6zBLvpHp+ZUUxHwrmG2A2uafGHztAGOeQ/He7KqMVHfFFlIVBYLc55AAA=',
      },
      {
        src: '/tables/walnut-3d-textured-clear-resin-dining-table/walnut-slab-3d-resin-table-teal-seating-warm-light.webp',
        alt: 'The walnut table under warmer light, three teal bouclé chairs along each long side and the 3D resin band catching the room',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAAAQBACdASoQABQAPt1eqU2opSQiMAgBEBuJQBOgBFIyaqNC2H39pFrAAAD+yWCu/JXrJLF3788QrSR+5dTSBSbBhmCQdM+D7Jxd1AoK4YkTBhPey3Cx1QAA',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 1700,
  },
  {
    slug: 'walnut-smoke-resin-dining-table',
    slugFr: 'table-repas-noyer-resine-fumee',
    name: 'Walnut Dining Table with Smoke Resin River',
    wood: 'Solid walnut',
    resinColor: 'Translucent charcoal smoke',
    shape: 'rectangular',
    dimensions: '175 x 85 cm',
    story:
      'A rectangular dining table in solid walnut, lighter and more golden than most of the boards that come through the workshop, with the pale sapwood line left intact along both river edges. Between the two slabs runs a river of translucent charcoal epoxy that reads as smoke in the shallows and near black where it is deepest — clear enough that the floor and whatever stands on the table show through it — so the walnut either side keeps all the attention. The top is polished to a mirror and carried on a black steel closed-loop sled frame that keeps the legs clear of knees. Seats six at 175 x 85 cm.',
    images: [
      {
        src: '/tables/walnut-smoke-resin-dining-table/walnut-smoke-resin-dining-table-six-boucle-chairs.webp',
        alt: 'Honey-toned walnut dining table with a smoky charcoal resin river, six bouclé chairs around it and tufted sofas behind',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAACwAQCdASoQABAAAwBSJYgCdACHunyAAP6cCXLOw8TDgKlLgaX35Hj3OGm1cD6ezFWCDEquIiNNpkJFwPFFUQ8AAAA=',
      },
      {
        src: '/tables/walnut-smoke-resin-dining-table/walnut-smoke-resin-table-relief-wall-red-artwork.webp',
        alt: 'Side view of the walnut dining table against a white relief-panelled wall hung with two red canvases',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADwAQCdASoQABAAAwBSJQBOgBnVZi5DaGAA/vIps+v0CnOngaQo1jDQ8uCU+ahMlyoSbA63vH72YqDbAAA=',
      },
      {
        src: '/tables/walnut-smoke-resin-dining-table/walnut-resin-dining-table-open-plan-kitchen-tagine.webp',
        alt: 'The walnut dining table seen front-on from the kitchen side, tagine on the counter and patterned cement floor tile alongside',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAAAQAgCdASoQABAAAwBSJQBOgBjtE4bOrCdAAP7uIWfMyIlwzedT1IPWQ9nY5KE/VaSC/8WUI1qOyoPRAAA=',
      },
      {
        src: '/tables/walnut-smoke-resin-dining-table/walnut-smoke-resin-table-sapwood-stripe-sideboard.webp',
        alt: 'Corner view of the walnut table showing the wide pale sapwood stripe along each river edge, walnut sideboard and round mirrors behind',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAABQAgCdASoQABAAAwBSJYgCdAEPh5c+oGDUWgAA/k5f1TfIcAUf9UqL1CuvC8ardIc2v2fu1gaFbWHoRvlUAAAA',
      },
      {
        src: '/tables/walnut-smoke-resin-dining-table/walnut-smoke-resin-table-angled-length-view.webp',
        alt: 'High angled view down the length of the walnut dining table, smoky resin turning silver-grey where the light rakes it',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAAAwAgCdASoQABAAAwBSJZACdAEf3Pty2VBI0AD+ygvzfWL9S7PLk9WcfgUInyo+GZSexPnOd/yw3jwAKT3TgAAA',
      },
      {
        src: '/tables/walnut-smoke-resin-dining-table/walnut-smoke-resin-table-top-overhead-serpentine-river.webp',
        alt: 'Overhead view of the walnut top, two matched slabs flanking a wide serpentine charcoal resin river',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADwAQCdASoQABAAAwBSJYgCdACmHwSIvQAAzEh7YPV0AcNMgUD2ith5LxFfuXONXzIGTYqB43ir0b+uAAA=',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 1500,
  },
  {
    slug: 'walnut-turquoise-resin-dining-table',
    slugFr: 'table-repas-noyer-resine-turquoise',
    name: 'Walnut Dining Table with Turquoise Epoxy River',
    wood: 'Solid walnut',
    resinColor: 'Translucent turquoise with black-filled voids',
    shape: 'rectangular',
    dimensions: '180 x 90 cm',
    story:
      'A rectangular dining table in solid walnut, opened down the middle by a deep pour of translucent turquoise epoxy that deepens to emerald where it is thickest. The river keeps the rounded cell structure the resin took as it set, standing proud of the surface, so it reads as moving water rather than flat colour. The bark lines and voids along both live edges are filled opaque black — a deliberate contrast that holds the outline rather than hiding a fault. Both outer edges follow the tree, their notches filled flush so the perimeter finishes straight. The walnut is dense and strongly figured, sanded and polished to a mirror before it was set on a black steel trapezoid frame. Seats six to eight at 180 x 90 cm.',
    images: [
      {
        src: '/tables/walnut-turquoise-resin-dining-table/walnut-turquoise-resin-dining-table-top-workshop-overhead.webp',
        alt: 'Walnut dining table top with a translucent turquoise resin river and black-filled bark voids, photographed flat in the workshop',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'overhead',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAABQBACdASoQABQAPt1cp00opSOiMAgBEBuJbACdMoIjjAPEZAc5kySL43VcAP63hfF/F2M3SwfIHYah+J2D+1Wox9FWWki3qU5RibYN1Jgcjk8k/1Gme6yfKsQESfGu606xrrL9enfMufTlGUGwAA==',
      },
      {
        src: '/tables/walnut-turquoise-resin-dining-table/walnut-turquoise-resin-table-steel-leg-gloss-detail.webp',
        alt: 'Close view along the walnut table edge showing the mirror gloss and one black steel trapezoid leg on a travertine floor',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'detail',
        blurDataURL:
          'data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADwAwCdASoQABQAPt1cpkyopSOiMAgBEBuJQBOmUI7gA58fmK6TV1YAAPyNQsDT1V4XZqtmoBzQxRZLdU0pYvHTNMHePXfJYP01KFrceCh0HVgP/UbF6HkAAAA=',
      },
      {
        src: '/tables/walnut-turquoise-resin-dining-table/walnut-live-edge-turquoise-epoxy-river-full-top.webp',
        alt: 'The full walnut top from one end, turquoise epoxy river with raised rounded cell texture between two live-edge slabs',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAAAwBACdASoQABQAPt1cpkyopSOiMAgBEBuJZgCdACB9DZjX2y39ZY15bQAA4lm80Zb6PAhUKNtp5LI/nSVQSoSE0TuyKsi1yqpIWzzoSG55hfW57hjYJR0ERAAAAA==',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 1700,
  },
    /**
     * PRICE: withheld on purpose. The source reads 8500 against a
     * 450-1700 band across the other eleven pieces, and the studio's own notes
     * price a comparable 3D piece at 1700 in a LARGER size. Leaving
     * `startingPrice` undefined omits `offers` from Product schema and hides the
     * price block, which is the only safe state until the studio confirms.
     */
  {
    slug: 'walnut-emerald-resin-geometric-lattice-table',
    slugFr: 'table-noyer-resine-emeraude-treillis-geometrique',
    name: 'Walnut Table with Green Resin over a Geometric Lattice',
    wood: 'Solid walnut',
    resinColor: 'Bottle green to sage over a 3D geometric lattice',
    shape: 'rectangular',
    dimensions: '150 x 75 cm',
    story:
      'The most technical piece in the collection. Set beneath the resin is a tessellated geometric lattice — a field of interlocking triangles resolving into six-pointed stars — and it is not printed or flat: each facet is raised in pyramidal relief, so the pattern has real depth while the surface above it stays perfectly flat glass. The green shifts with thickness and light, from bottle green where the pour encapsulates the outer live edges, through emerald with cream marbling in the margins, to a pale sage over the lattice itself. The walnut runs warm and golden with dark mineral streaks and natural voids, its live edge kept on both sides and frozen inside the resin so the perimeter finishes straight. Mirror polished and mounted on a black steel U-frame. 150 x 75 cm, seating four.',
    images: [
      {
        src: '/tables/walnut-emerald-resin-geometric-lattice-table/walnut-green-resin-geometric-lattice-table-terrace.webp',
        alt: 'Walnut table with green resin over a tessellated geometric lattice, standing on a travertine terrace beside a lawn',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAACwAwCdASoQABQAPt1cp0yopSOiMAgBEBuJQBWAA3Wh4lebuW7DdAD+FxtYtgX8HxgLYoprEJtZ+ZpIQmqE3AmxhMdPrnXeD77M+6S04MtQ3c8AAAA=',
      },
      {
        src: '/tables/walnut-emerald-resin-geometric-lattice-table/walnut-bottle-green-resin-encapsulated-live-edge.webp',
        alt: 'Raking close view down the long edge, bottle-green resin encapsulating the walnut live edge under a mirror polish',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'detail',
        blurDataURL:
          'data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAABwAwCdASoQABQAPt1apkyopSOiMAgBEBuJYwCdAAs82JUifQAA/sXeJkwLbpx19yFbA3dI0juh+Mcy3VKJEpCpEG9IliCNhRUeiT7jr2CGM6jQmpRkAA==',
      },
      {
        src: '/tables/walnut-emerald-resin-geometric-lattice-table/walnut-green-resin-lattice-table-end-view-garden.webp',
        alt: 'The walnut table seen down its length from one end, green resin margins framing the patterned central channel',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAAAwBACdASoQABQAPt1cpkyopSOiMAgBEBuJZACdMoACr19nXNuvXiRXNQAA97FV4/9kWhk35fF2qtz50Xx0YR4+bU0YAJufqNl54e9W1ScS6N7ICZLvnAK1MTx/kAAA',
      },
      {
        src: '/tables/walnut-emerald-resin-geometric-lattice-table/walnut-emerald-resin-3d-star-lattice-closeup.webp',
        alt: 'Close view of the resin showing the three-dimensional triangle and six-pointed star lattice beneath, walnut burl alongside',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAAAQBACdASoQABQAPt1apkyopSOiMAgBEBuJaACdMoR3AA8tkcx7Om2aUAD+o2vuweeFMK0Y/jf+bt2ZgcKYUxfiSWl/M+cmpAyKx3T70BnWLJI4gSiFgi6fq46EwoAA',
      },
      {
        src: '/tables/walnut-emerald-resin-geometric-lattice-table/walnut-green-resin-lattice-table-cream-marbling.webp',
        alt: 'Angled view from the far long side, emerald resin marbled with cream in the margin and pale sage over the lattice',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAACwAwCdASoQABQAPt1cpkyopSOiMAgBEBuJQBadBBtmi0Q5LGmsAAD9UwVdwOELdFpSW9G/zYkgr3UGctTzjtded+PMPwm1MZnmYqb6evNdM5UgAAA=',
      },
      {
        src: '/tables/walnut-emerald-resin-geometric-lattice-table/walnut-caramel-figure-green-resin-lattice-detail.webp',
        alt: 'Tight angled sweep across the top, honey and caramel walnut figure grading into dark streaks beside the emerald lattice',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAACQAwCdASoQABQAPt1cpkyopSOiMAgBEBuJaACdABD7cI9GkTTAAP45oKXCYheEawpuHallgYzrdHu7mePNr7y6irZc02N4W57aiRhIRm0BFMtRUAwFu/eQAAA=',
      },
      {
        src: '/tables/walnut-emerald-resin-geometric-lattice-table/walnut-lattice-table-black-steel-u-frame-leg.webp',
        alt: 'Corner and leg detail of the walnut table on the terrace, showing the black steel U-frame with its flat foot rail',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'base',
        blurDataURL:
          'data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAACwAwCdASoQABQAPt1cpkyopSOiMAgBEBuJYgCdAA1V3mpBAcln/AD3zI8hisQdr3QkKgKhkpWd6Bve1pfifvYV8Di8szdzoQiHwakpi6w1NkGrHOPpFLr5AAA=',
      },
    ],
    availability: 'made-to-order',
    // startingPrice intentionally omitted — see note above.
  },
    /**
     * SOURCE: this folder mixed two different physical tables. The description
     * states only what is true of both, and the pale inclusion is described
     * per-image rather than as a product feature. Split into two listings once
     * the studio confirms which one the 100 cm belongs to.
     */
  {
    slug: 'round-walnut-emerald-resin-coffee-table',
    slugFr: 'table-basse-ronde-noyer-resine-emeraude',
    name: 'Round Walnut Coffee Table with Emerald Resin River',
    wood: 'Solid walnut',
    resinColor: 'Emerald to turquoise, translucent',
    shape: 'round',
    dimensions: '100 cm diameter',
    story:
      'A round coffee table cut from solid walnut, one metre across, with a river of green epoxy crossing it off-centre so the circle never reads as symmetrical. The colour is not one green: it runs emerald through the body of the river, lifts to a bright turquoise where the pour is thin and light passes through it, and sinks to near-black bottle green in the deeper pools. The walnut carries dense flame and cathedral figure with a pale honey sapwood zone against the resin, and its small natural voids were stabilised and filled before the top was polished to a mirror. Raised on a black steel base so the whole disc appears to float. 100 cm diameter, at coffee-table height.',
    images: [
      {
        src: '/tables/round-walnut-emerald-resin-coffee-table/round-walnut-emerald-resin-coffee-table-living-room.webp',
        alt: 'The round walnut coffee table in a living room with a white panelled wall, its black steel tripod base fully visible',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADwAwCdASoQABQAPt1cpkyopSOiMAgBEBuJYwCdACGvGDHdIMgpn2FAAP7fVnfku/K7IufEEl4k83ASsKDh8FPETYERCGO9wowDIf8fZfFA1YFCLAA=',
      },
      {
        src: '/tables/round-walnut-emerald-resin-coffee-table/round-walnut-emerald-resin-coffee-table-onyx-band-salon.webp',
        alt: 'Round walnut coffee table with an emerald resin river and a pale onyx-effect band, on a cream ribbed rug beside a grey sofa with garden doors open behind',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        isVariant: true,
        blurDataURL:
          'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAACQAwCdASoQABQAPt1cpkyopSOiMAgBEBuJYwCdABOpIlYeycvoAP5rD3/r03RUY+h7ZHZN0XoeqUsbgBwyx+u2mTzh8dTrIcN9vkJQqAGXDwAA',
      },
      {
        src: '/tables/round-walnut-emerald-resin-coffee-table/round-walnut-resin-coffee-table-black-steel-tripod-base.webp',
        alt: 'Low view of the round walnut coffee table showing its black steel three-leg base meeting in a triangular floor hub',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADQAwCdASoQABQAPt1cp0yopSOiMAgBEBuJZQCsACHVau9ExdscuRAA/sXeCFR+pZK3lDkdqDoN3fGz1pEqHMTXV/PY3Lz0RxRHqdVKAAA=',
      },
      {
        src: '/tables/round-walnut-emerald-resin-coffee-table/round-walnut-flame-figure-emerald-resin-river-top.webp',
        alt: 'High-angle view of the round walnut top, dark flame figure crossed off-centre by the emerald resin river',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAQBACdASoQABQAPt1cpkyopSOiMAgBEBuJYgCdMoAC/BbKTEGG3h1WwAD+QBY54MIIrGnN9ftdVs5eWRg/eeVhCG2zAPjNW2GMm2E8p9XiVbiDOAA=',
      },
      {
        src: '/tables/round-walnut-emerald-resin-coffee-table/round-walnut-coffee-table-turquoise-backlit-resin-overhead.webp',
        alt: 'Near-overhead view of the whole round top, the resin lifting to bright turquoise where it thins and pooling deep green at one rim',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADQAwCdASoQABQAPt1cpkyopSOiMAgBEBuJZACw7B5wK/nP58L8BQAA/r+5nQyfP5V+qlfX+kWXKyjnl8zxn5Hyts74CkE17D91ODqHXqP0GZ5QAAA=',
      },
      {
        src: '/tables/round-walnut-emerald-resin-coffee-table/round-walnut-onyx-band-resin-table-blade-pedestal.webp',
        alt: 'The round walnut coffee table on a blade pedestal base, pale onyx-effect band behind the vase and the garden terrace beyond the sliding doors',
        aspect: 'aspect-[4/5]',
        width: 1170,
        height: 1463,
        role: 'full',
        isVariant: true,
        blurDataURL:
          'data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPt1cpkyopSOiMAgBEBuJZwAAQL7A5Jns6MqMOAD+3hW+HXXVXSCPa2FkynxgsSWH4yiCzlDMbGrE9kFwGZ7ASlEvAAA=',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 500,
  },
    /**
     * SOURCE: table9-02.webp is shot in a different house on a darker board and is
     * probably a sibling slab. Its alt text describes the photograph without
     * asserting it is this piece.
     */
  {
    slug: 'solid-walnut-live-edge-dining-table-220',
    slugFr: 'table-repas-noyer-massif-bord-naturel-220',
    name: 'Solid Walnut Live-Edge Dining Table, 220 cm',
    wood: 'Solid walnut',
    resinColor: 'None — clear stabilising fill only',
    shape: 'rectangular',
    dimensions: '220 x 85 cm',
    story:
      'No resin river on this one, and it does not need one. This is a single long board of solid walnut, 220 cm, left to do all the work itself: heavy rippled figure through the centre, dark mineral streaking, and the natural edge kept on both sides exactly as the tree grew it, so the outline is a rectangle only in the general sense. The checks and voids were stabilised and filled to make the surface sound, and those fills read as dark glassy pools rather than disappearing — they are part of how the piece looks, not hidden repairs. The top was finished to a low sheen rather than a gloss, which is the honest choice for a board with this much movement in the grain. Set on a black steel base with the legs inset, so both ends are usable. Seats eight at 220 x 85 cm.',
    images: [
      {
        src: '/tables/solid-walnut-live-edge-dining-table-220/solid-walnut-live-edge-dining-table-220cm-marble-hall.webp',
        alt: 'Long solid walnut live-edge dining table in a marble-floored hall, carved wood balustrade and a black and white zellige panel behind',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAACwAQCdASoQABAAAwBSJYgCdADbo6qYAP6HRYHbiErbRnDDeJhX8H4lP2CMY0UYRvS9fKdKuaGHo7HB7BQoliU0AAA=',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-220/solid-walnut-live-edge-dining-table-glazed-garden-room.webp',
        alt: 'A solid walnut live-edge dining table of the same design in a glazed garden room, eight khaki upholstered chairs and black steel trapezoid legs',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        isVariant: true,
        blurDataURL:
          'data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAACwAQCdASoQABAAAwBSJQBOgBZckOWAAOD/UZBYZy9sqzZkXxivTGsGLunDjRMU5w7rduxAAAA=',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-220/solid-walnut-slab-dining-table-full-top-figure.webp',
        alt: 'High view down the length of the walnut slab, rippled and burl figure running unbroken between two undulating natural edges',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAAAQAgCdASoQABAAAwBSJYgCdAEf/gi6OSmoAP7lO2h+QxZUk8ncNETa3k+MO+8xIl45YF0Ky0Qp498YdwAAAA==',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-220/solid-walnut-dining-table-black-steel-base-inset-legs.webp',
        alt: 'Wide view of the walnut dining table showing the full black steel base, flat-bar trapezoid legs inset at each end with a lengthwise spine',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADwAQCdASoQABAAAwBSJYgCdADbWB0hE4AA/sE++iyQs4fL2NF1ZrjRp1pUer15aWvGmo8kDBOM9CstEKv+WrNMgAA=',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-220/solid-walnut-live-edge-sapwood-stripe-filled-voids.webp',
        alt: 'Close oblique view of the walnut top, pale cream sapwood stripe along the natural edge and two dark glassy resin-filled voids near the centre',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADQAQCdASoQABAAAwBSJZACdAC7Ab7vxADynjt6GyxyoGukXY8c6ecRrKmi3BVExUODaMZSi0rAI5TEAAA=',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 1500,
  },
    /**
     * MATERIAL: walnut is the studio's own stated species (its caption opens
     * "L'elegance du noyer"), but the board photographs unusually pale for walnut.
     * The copy says walnut and describes the board as pale rather than implying
     * dark heartwood.
     */
  {
    slug: 'walnut-woven-carpet-resin-dining-table',
    slugFr: 'table-repas-noyer-tapis-tisse-resine',
    name: 'Walnut Dining Table with Woven Carpet Under Resin',
    wood: 'Pale solid walnut',
    resinColor: 'Milky sage-white over a woven carpet panel',
    shape: 'rectangular',
    dimensions: '180 x 90 cm',
    story:
      'A rectangular dining table where a hand-woven carpet panel is sealed under milky epoxy and set against a slab of pale walnut. The weave keeps its ridges and its banded stripes — ivory and cream alternating with taupe and soft brown, some bands carrying small diamond motifs — visible through the resin but protected from everything a dining table has to survive. The resin is only semi-translucent, with a faint sage-grey cast, so it veils the textile softly rather than showing it under glass. This is an unusually pale, blonde board with dark purple-black streaking rather than the dark heartwood of the other pieces, and its live edge follows the tree along the whole length. Finished satin, not gloss, and carried on a hand-built wooden trestle frame. Seats six at 180 x 90 cm.',
    images: [
      {
        src: '/tables/walnut-woven-carpet-resin-dining-table/walnut-woven-carpet-resin-dining-table-poolside.webp',
        alt: 'Walnut dining table with a woven carpet panel set under milky resin, on a lawn beside a blue mosaic pool with a tiled terrace behind',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAADwAQCdASoQABAAAwBSJYgCdADaeUAwD4AA/KpRnmdfiUkDDsc2MMutcXkuaTjpdn5Q/xf2UFozZiIoSimcFo4O20AAAA==',
      },
      {
        src: '/tables/walnut-woven-carpet-resin-dining-table/walnut-carpet-resin-table-kilim-weave-cane-chairs.webp',
        alt: 'The table seen down its length, banded kilim weave in ivory and taupe suspended under the resin, six cane-back chairs and a wooden trestle base',
        aspect: 'aspect-square',
        width: 1170,
        height: 1170,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAADQAQCdASoQABAAAwBSJZQCdAChnRLoAAD2nbTWagtyj2MM5thnVjTql1kT4MKfKO6TAR23kUrX/S3G3JoAAA==',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 850,
  },
    /**
     * MATERIAL: no timber is visible on the top, the edge, or the underside in any
     * photograph, and there is no studio caption naming a species. `wood` is
     * therefore omitted and `material` states only what is verifiable. Do not add
     * a walnut claim here without a build spec or an underside photograph.
     */
  {
    slug: 'resin-oval-dining-table',
    slugFr: 'table-repas-ovale-resine-effet-marbre',
    name: 'Oval Marble-Effect Resin Dining Table',
    resinColor: 'Chocolate brown and ivory marble effect',
    material: 'Marble-effect epoxy resin on a black steel base',
    shape: 'oval',
    dimensions: '160 x 80 cm',
    story:
      'An oval dining table finished as a single sweep of marble-effect resin. Deep chocolate brown, shot through with oxblood and warm tan, is pulled apart by an ivory vein that meanders the length of the table and breaks out into broad cream fields at one side and around the ends. Fine white veining and discrete white spatter sit inside the dark ground, where the pigments were allowed to break rather than blend. Every one is different because the pour cannot be repeated. The marbling continues over the rim onto the vertical edge, so the top reads as one solid material rather than a surface laid on something else. Straight sides with fully radiused ends, polished to a high gloss and carried on a black steel base. Seats six at 160 x 80 cm.',
    images: [
      {
        src: '/tables/resin-oval-dining-table/oval-marble-effect-resin-dining-table-six-chairs.webp',
        alt: 'Oval dining table with a chocolate and ivory marble-effect resin top, six cream upholstered armchairs around it on grey tiles',
        aspect: 'aspect-[3/4]',
        width: 960,
        height: 1280,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAQBACdASoQABUAPt1cqE0opSQiMAgBEBuJZQAAVLaDMXrRMLaxICVunAD+k6+Bre/W0jZetC7Ck9QHpwr7CTHW/L6M7zwFhFKTTsSGPsgAAA==',
      },
      {
        src: '/tables/resin-oval-dining-table/oval-marble-resin-table-ivory-vein-marquetry-sideboard.webp',
        alt: 'The oval table from the opposite end, ivory vein meandering through the dark resin, marquetry sideboard and organic mirrors behind',
        aspect: 'aspect-[3/4]',
        width: 960,
        height: 1280,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAACQAwCdASoQABUAPt1cp0yopSOiMAgBEBuJZQCdAB5j0XyKADEwAMPmi6tAWp4zIg+E0hZbeO4zz+KMn983UpPZT7hFxQsRFr1+ngAA',
      },
      {
        src: '/tables/resin-oval-dining-table/oval-marble-resin-dining-table-salon-steel-base.webp',
        alt: 'Three-quarter view of the marble-effect oval table in a salon, the poured pattern continuing over the rim onto the vertical edge above a black steel base',
        aspect: 'aspect-[3/4]',
        width: 960,
        height: 1280,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAABQBACdASoQABUAPt1cpkyopSOiMAgBEBuJZQC7ACL3NuCbDAWBHR3w3JoAAP5qEabi1CbKpXyp3QG1XfMI72QJu5wMsjNdAjkFdStrWY7kMAAA',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 800,
  },
  {
    slug: 'walnut-resin-coffee-table-set',
    slugFr: 'ensemble-tables-noyer-resine-magenta',
    name: 'Walnut Coffee Table and Side Table Set with Magenta Resin',
    wood: 'Solid walnut',
    resinColor: 'Fuchsia to crimson, translucent',
    shape: 'organic',
    dimensions: 'coffee table 120 x 75 cm, side table 50 cm diameter',
    story:
      'Two pieces cut from the same walnut and finished together. The larger table takes a freeform kidney shape, its outline following the board rather than a drawing, with a wide S-curve river of translucent pink-red epoxy running the full length. The same colour was poured out to the finished perimeter, so it appears at the rim as well as mid-slab — though it breaks wherever the live edge reaches the outline, which is what gives the profile its rhythm rather than a continuous ring. The colour itself moves with the light: fuchsia under flat overhead daylight, crimson and raspberry in warm sun. The round side table repeats the idea at 50 cm across, a single band laid over dense burl figure, and stands slightly taller than the coffee table as a companion rather than a nesting piece. Both tops are mirror polished on black steel. Coffee table 120 x 75 cm, side table 50 cm diameter.',
    images: [
      {
        src: '/tables/walnut-resin-coffee-table-set/walnut-magenta-resin-kidney-coffee-table-set-overhead.webp',
        alt: 'Overhead view of both walnut pieces on a tiled patio, the kidney-shaped coffee table with its fuchsia resin river and the round side table nested in its concave notch',
        aspect: 'aspect-[4/5]',
        width: 1440,
        height: 1800,
        role: 'overhead',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAACwAwCdASoQABQAPt1ap0yopSOiMAgBEBuJYwCdAB17fRB6nzqC3ADifqk60EJlrQ46bzWsQwxwsp7l5e6EOD1TmdxymoOZ8BSr7RQbsa7bg4v5QAA=',
      },
      {
        src: '/tables/walnut-resin-coffee-table-set/walnut-crimson-resin-coffee-table-set-garden-path.webp',
        alt: 'The walnut coffee table and round side table on a paved garden path, the resin reading crimson in warm light, black steel trestles beneath',
        aspect: 'aspect-[4/5]',
        width: 1440,
        height: 1800,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAADQAwCdASoQABQAPt1apkyopSOiMAgBEBuJYgCdMoAC/aszKppwD44A/qhcgZPXFRylNuPOU06e1Gi0KHs9WmBdKsWqGJfVtKLF4NKouEvjrQ8KA5TX/ViVWwAAAA==',
      },
      {
        src: '/tables/walnut-resin-coffee-table-set/walnut-burl-eye-figure-magenta-resin-live-edge.webp',
        alt: 'Close view of the coffee table\'s right lobe, concentric walnut burl eye figure and pale sapwood tracing the live edge into the magenta resin',
        aspect: 'aspect-[4/5]',
        width: 1440,
        height: 1800,
        role: 'detail',
        blurDataURL:
          'data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAAAQBACdASoQABQAPt1apkyopSOiMAgBEBuJbACdL1ABdFoHJyg/7zjdAAD8jJsj7IoLrN7WI8YE4Wsg2Z9aT75+rQthrXyXL2iHIVVLia27qipaUwiXag5CxaAAAA==',
      },
      {
        src: '/tables/walnut-resin-coffee-table-set/walnut-magenta-resin-side-table-rim-macro.webp',
        alt: 'Macro view across the walnut top toward the round side table, the magenta resin band wrapping the side table\'s rim through the full thickness',
        aspect: 'aspect-[4/5]',
        width: 1440,
        height: 1800,
        role: 'detail',
        blurDataURL:
          'data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADQAwCdASoQABQAPt1apkyopSOiMAgBEBuJQBYdg0TOmqXsJKt3JwAA/o6qx4wNxTVozvDNZag6oQfoq84CxqsKpdtYQLrS9yl7DIwA',
      },
      {
        src: '/tables/walnut-resin-coffee-table-set/walnut-magenta-resin-round-side-table-steel-legs.webp',
        alt: 'The round walnut side table complete with a magenta stripe across its top and a three-leg splayed black steel frame, the coffee table\'s right half alongside',
        aspect: 'aspect-[4/5]',
        width: 1440,
        height: 1800,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADwAwCdASoQABQAPt1apkyopSOiMAgBEBuJYgCdAB6AERC656cA0vSAAP6e5VO/F3y/Lagl8OJptmbYkXEgO3ugyumBpfeN6hek5GqykQumAAAA',
      },
      {
        src: '/tables/walnut-resin-coffee-table-set/walnut-magenta-resin-table-set-terrace-planters.webp',
        alt: 'Both walnut tables on the terrace beside a bollard light and bird-of-paradise planting, the magenta river running the full S-curve of the kidney top',
        aspect: 'aspect-[4/5]',
        width: 1440,
        height: 1800,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPt1cpkyopSOiMAgBEBuJQBOgBA0y4UXg7+yeYAD+uUtlftMKbQtaApxHvhArI9JBthzOLhRy2qLbUQtw6HRzU23MgAA=',
      },
      {
        src: '/tables/walnut-resin-coffee-table-set/walnut-magenta-resin-coffee-table-set-wide-garden-view.webp',
        alt: 'Wide view of the walnut table set in the garden, tiled steps and planters behind, both magenta-edged tops on their black steel bases',
        aspect: 'aspect-[9/16]',
        width: 720,
        height: 1280,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwBACdASoQABwAPt1cpkyopSOiMAgBEBuJYgCdAB+DCOBvX/Tu3ko1XzAA/p6J/3w6z3YEPKlG8GIYRMYV9FlfahrzUpmtTs3QXZQME8wGF+iPAnfwAA==',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 550,
  },
  {
    slug: 'solid-walnut-live-edge-dining-table-180',
    slugFr: 'table-repas-noyer-massif-bord-naturel-180',
    name: 'Solid Walnut Live-Edge Dining Table, 180 cm',
    wood: 'Solid walnut',
    resinColor: 'None — clear stabilising fill only',
    shape: 'rectangular',
    dimensions: '180 x 80 cm',
    story:
      'A dining table for six with nothing added to it. One slab of solid walnut, chocolate brown through the centre with a broad band of pale sapwood following one edge, both long sides left live exactly as the board came off the mill — including a waisted notch on one side that no one straightened out. The figure is dense and strongly rippled, with a crotch eye near the middle and a hairline check running through it, filled flush. There is no resin river here and none was needed. The surface is finished satin rather than gloss, so it can be wiped down and used, and it never mirrors the room back at you. Carried on splayed walnut legs with a wooden cross member. 180 x 80 cm.',
    images: [
      {
        src: '/tables/solid-walnut-live-edge-dining-table-180/solid-walnut-live-edge-dining-table-180cm-marble-floor.webp',
        alt: 'Solid walnut live-edge dining table for six on a marble tile floor, cream bouclé chairs with walnut frames around it',
        aspect: 'aspect-square',
        width: 1440,
        height: 1440,
        role: 'full',
        isCover: true,
        blurDataURL:
          'data:image/webp;base64,UklGRkYAAABXRUJQVlA4IDoAAAAQAgCdASoQABAAAwBSJQBOj+AC83aYePFwAP7tf9II4gA5wxcEAm80R7tzElo3Z1wjJseFxHvZX8AA',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-180/solid-walnut-dining-table-sapwood-band-end-view.webp',
        alt: 'The walnut table seen near end-on, broad pale sapwood bands framing the near-black figured heartwood down the centre',
        aspect: 'aspect-square',
        width: 1440,
        height: 1440,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRkYAAABXRUJQVlA4IDoAAAAQAgCdASoQABAAAwBSJYwCdAECjlhPk/aOAOIwFCvgWAPwChhsT3lp5CKhW1uIRmZYBTrzkz+X3aAA',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-180/solid-walnut-fiddleback-figure-live-edge-closeup.webp',
        alt: 'Steep angled view filling the frame with the walnut top, rippled fiddleback and crotch figure with a dark knot at one live edge',
        aspect: 'aspect-square',
        width: 1440,
        height: 1440,
        role: 'angled',
        blurDataURL:
          'data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAAAQAgCdASoQABAAAwBSJYwCdAC1Jt1zh/MAAP7Vmi86DOCY9G4+JG/1XLP51uurRwnDHdyvc/daBWSyqu2CAAAA',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-180/solid-walnut-live-edge-table-full-top-overhead.webp',
        alt: 'Near-overhead view of the whole walnut top, straight crosscut ends and two undulating natural edges with a waisted notch mid-length',
        aspect: 'aspect-square',
        width: 1440,
        height: 1440,
        role: 'overhead',
        blurDataURL:
          'data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAAAQAgCdASoQABAAAwBSJYwCdACwGbqXRYOAAP7WeBLOh5c+VdbIa9jId+0vjiJMPi6lb1+klkTTCiAAAAA=',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-180/solid-walnut-dining-table-wooden-legs-open-plan.webp',
        alt: 'The walnut dining table from a corner with the open-plan living area beyond, its splayed walnut legs and wooden cross member visible',
        aspect: 'aspect-square',
        width: 1440,
        height: 1440,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAADwAQCdASoQABAAAwBSJYgCdAC7CW7AXYgA+XtkPa1heSKZleDjb7x6Ro+2Kk71UB3H+84exh5hVq8frsbmKdCL0NYAAA==',
      },
      {
        src: '/tables/solid-walnut-live-edge-dining-table-180/solid-walnut-live-edge-dining-table-satin-finish.webp',
        alt: 'Elevated near-end view of the walnut table and its six chairs, the satin finish holding light softly without mirroring the room',
        aspect: 'aspect-square',
        width: 1440,
        height: 1440,
        role: 'full',
        blurDataURL:
          'data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAADwAQCdASoQABAAAwBSJQBYdiFU2V/QRBAA/ufC8+2nn3ONKbYnnlwMNEM0vWl6Q5DNm9kAAAA=',
      },
    ],
    availability: 'made-to-order',
    startingPrice: 800,
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
  if (table.material) return table.material;
  return table.wood ? `${table.wood} & ${table.resinColor} epoxy resin` : table.resinColor;
}

/**
 * The image to use as a product thumbnail.
 *
 * Cards used to render `images[0]`, which was whatever order the source folder
 * happened to sort in — for several pieces that was a macro crop of grain or a
 * photograph of a leg, neither of which reads as a table at card size. The
 * generator now scores every photograph by what it shows, by resolution, and by
 * whether it is even the right physical table, and promotes the winner to
 * position 0.
 *
 * The lookup stays defensive rather than just returning `images[0]`, so a
 * hand-edit to this file that loses the flag degrades to a sensible frame
 * instead of a silent regression.
 */
export function coverImage(table: { images: TableImage[] }): TableImage {
  return (
    table.images.find((img) => img.isCover) ??
    table.images.find((img) => img.role === 'full' && !img.isVariant) ??
    table.images.find((img) => !img.isVariant) ??
    table.images[0]
  );
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

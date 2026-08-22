// Move the section photographs into the app and emit a typed module for them.
//
// Same treatment the product photography gets:
//   - descriptive, lowercase, hyphenated filenames (sources are named
//     "Our Craft..webp", "The pour in progress.webp", "phase3.webp" — none of
//     which is URL-safe or meaningful to a crawler)
//   - intrinsic dimensions read from the WebP header, not guessed
//   - a ~150 byte inline blur placeholder so each frame paints in the
//     photograph's own colours instead of sitting empty
//
// Rerunnable: overwrites the destination files and regenerates the module.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('C:/Users/Mohamed/Desktop/benzresin/site/package.json');
const sharp = require('sharp');

const SRC_DIR = 'C:/Users/Mohamed/Desktop/benzresin/sections images';
const SITE = 'C:/Users/Mohamed/Desktop/benzresin/site';
const OUT_DIR = join(SITE, 'public/images');

/**
 * Slot assignment comes from the source filenames, which name their destination
 * ("herosection", "ctasection", "Our Craft", "The pour in progress", "contact",
 * "Enquiry received", "phase1".."phase5").
 *
 * `describes` is the factual content of each frame, written after opening it.
 * It is the basis for the alt text in `messages/*.json` — several of these slots
 * previously held copy written for a completely different photograph.
 */
const IMAGES = [
  {
    key: 'hero',
    from: 'herosection.webp',
    to: 'hero-walnut-turquoise-resin-river-coffee-table.webp',
    slot: 'Home hero',
    describes:
      'Walnut live-edge coffee table with a turquoise resin river, styled with books and a plant in a bright living room',
  },
  {
    key: 'cta',
    from: 'ctasection.webp',
    to: 'cta-live-edge-walnut-steel-coffee-table.webp',
    slot: 'Inquiry CTA',
    describes:
      'Live-edge walnut coffee table set into a brushed steel surround, beside a dark leather sofa',
  },
  {
    key: 'craftLead',
    from: 'Our Craft..webp',
    to: 'our-craft-blue-resin-river-table-workshop.webp',
    slot: 'Our Craft — lead image',
    describes:
      'Finished walnut table with a vivid blue resin river, on trestles in the workshop, seen from above',
  },
  {
    key: 'craftPour',
    from: 'The pour in progress.webp',
    to: 'our-craft-green-resin-pour-in-progress.webp',
    slot: 'Our Craft — cinematic break',
    describes: 'Green epoxy resin being poured from a bucket into a mould around a walnut slab',
  },
  {
    key: 'contact',
    from: 'contact.webp',
    to: 'contact-round-walnut-resin-table-in-workshop.webp',
    slot: 'Contact page',
    describes:
      'Round walnut coffee table with a dark resin river on a black steel base, standing on a workbench in the workshop with slabs racked behind it',
  },
  {
    key: 'enquiryReceived',
    from: 'Enquiry received.webp',
    to: 'enquiry-received-walnut-emerald-resin-dining-table.webp',
    slot: 'Inquiry success',
    describes:
      'Walnut dining table with an emerald resin river in a client dining room, six cream chairs around it and a pool through the glass doors',
  },

  /*
    The five process phases, mapped to the steps in `OurCraft.phases` by filename
    order as specified.

    Worth knowing: phases 3, 4 and 5 depict their step literally (a slab being
    milled, a cured top being trimmed, a wrapped table being carried in). Phases
    1 and 2 do not — both are finished tables, standing in for "Consultation"
    and "Design", which are hard to photograph. The alt text describes what is
    actually in frame rather than the step name, so the page never claims to show
    a consultation that is not there.
  */
  {
    key: 'craftPhase1',
    from: 'phase1.webp',
    to: 'craft-phase-1-walnut-black-resin-dining-table-client-home.webp',
    slot: 'Our Craft — phase 1 (Consultation)',
    describes:
      'Finished walnut dining table with a black resin river, six cream chairs around it in a client dining room',
  },
  {
    key: 'craftPhase2',
    from: 'phase2.webp',
    to: 'craft-phase-2-finished-walnut-resin-table-in-workshop.webp',
    slot: 'Our Craft — phase 2 (Design)',
    describes:
      'Completed walnut table with a black resin river and a sculpted timber base, photographed head-on in the workshop',
  },
  {
    key: 'craftPhase3',
    from: 'phase3.webp',
    to: 'craft-phase-3-walnut-slab-milled-on-bandsaw.webp',
    slot: 'Our Craft — phase 3 (Selection)',
    describes:
      'Craftsman guiding a rough walnut slab with its bark edge intact through a workshop bandsaw',
  },
  {
    key: 'craftPhase4',
    from: 'phase4.webp',
    to: 'craft-phase-4-trimming-cured-resin-table-top.webp',
    slot: 'Our Craft — phase 4 (Production)',
    describes:
      'Craftsman trimming the edge of a cured walnut and resin table top with a circular saw against a straight guide',
  },
  {
    key: 'craftPhase5',
    from: 'phase5.webp',
    to: 'craft-phase-5-wrapped-table-delivered-to-villa.webp',
    slot: 'Our Craft — phase 5 (Delivery)',
    describes:
      'Two Benzart Resin staff in branded coats carrying a wrapped table through the doorway of a client villa',
  },
];

function webpSize(buf) {
  let off = 12;
  while (off + 8 <= buf.length) {
    const fourcc = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = off + 8;
    if (fourcc === 'VP8X') {
      return {
        w: 1 + (buf[body + 4] | (buf[body + 5] << 8) | (buf[body + 6] << 16)),
        h: 1 + (buf[body + 7] | (buf[body + 8] << 8) | (buf[body + 9] << 16)),
      };
    }
    if (fourcc === 'VP8 ') {
      return { w: buf.readUInt16LE(body + 6) & 0x3fff, h: buf.readUInt16LE(body + 8) & 0x3fff };
    }
    if (fourcc === 'VP8L') {
      const bits = buf.readUInt32LE(body + 1);
      return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
    }
    off = body + size + (size % 2);
  }
  throw new Error('unreadable WebP header');
}

const entries = [];

for (const img of IMAGES) {
  const srcPath = join(SRC_DIR, img.from);
  const buf = readFileSync(srcPath);
  const { w, h } = webpSize(buf);

  copyFileSync(srcPath, join(OUT_DIR, img.to));

  const thumb = await sharp(srcPath)
    .resize(16, null, { fit: 'inside' })
    .blur(1.2)
    .webp({ quality: 45, effort: 6 })
    .toBuffer();
  const blurDataURL = `data:image/webp;base64,${thumb.toString('base64')}`;

  entries.push({ ...img, w, h, blurDataURL });
  console.log(
    `${img.slot.padEnd(36)} ${String(w).padStart(4)}x${String(h).padEnd(4)} ${String(Math.round(buf.length / 1024)).padStart(4)} KB  ${img.to}`
  );
}

const ts = `/**
 * Photography used by the marketing sections, as opposed to the product
 * catalogue in \`content/tables/tables.ts\`.
 *
 * GENERATED by \`scripts/import-section-images.mjs\` from the \`sections images/\`
 * folder in the workspace root. Rerun that script rather than editing this file.
 *
 * Each entry carries its intrinsic size and a 16px inline blur placeholder, so a
 * section can render a fixed-ratio frame that paints in the photograph's own
 * colours before the full file arrives. Alt text is NOT here — it lives in
 * \`messages/*.json\` so it can be translated.
 */

export type SectionImage = {
  src: string;
  width: number;
  height: number;
  /** ~150 byte inline WebP for first paint. */
  blurDataURL: string;
};

${entries
  .map(
    (e) => `/** ${e.slot}: ${e.describes} */
export const ${e.key}Image: SectionImage = {
  src: '/images/${e.to}',
  width: ${e.w},
  height: ${e.h},
  blurDataURL:
    '${e.blurDataURL}',
};`
  )
  .join('\n\n')}

/**
 * The five commissioning phases, in the order they appear on Our Craft.
 *
 * Exported as an array because \`OurCraftClient\` renders \`OurCraft.phases\` from
 * the message files and needs to pair each authored step with its photograph by
 * index. Previously the component held a local array of five \`/images/*.png\`
 * paths, three of which duplicated images used elsewhere on the same page.
 */
export const craftPhaseImages: SectionImage[] = [
  craftPhase1Image,
  craftPhase2Image,
  craftPhase3Image,
  craftPhase4Image,
  craftPhase5Image,
];
`;

writeFileSync(join(SITE, 'content/section-images.ts'), ts, 'utf8');
console.log('\nwrote content/section-images.ts');
console.log(`${entries.length} images, placeholder weight ${entries.reduce((n, e) => n + e.blurDataURL.length, 0)} bytes`);

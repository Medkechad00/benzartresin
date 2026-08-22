// Which files in public/images are still referenced anywhere in the app?
//
// Eleven supplied photographs have now displaced the placeholder library. Any
// PNG left unreferenced is dead weight in the deploy, and any reference to a
// missing file is a broken image — next/image renders an empty src as a re-request
// of the current document, so it fails loudly in bandwidth rather than visibly.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'C:/Users/Mohamed/Desktop/benzresin/site';

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    // `scripts` is excluded deliberately: the migration scripts name the old
    // placeholders in their comments, which made two dead files look referenced.
    if (['node_modules', '.next', 'public', 'scripts', '.preview'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    // `.mdx` matters: every blog post sets a `heroImage` in its frontmatter, and
    // omitting the extension reported all 15 of those images as orphaned when
    // they are in fact still rendering on the homepage and the blog index.
    else if (/\.(tsx?|mjs|json|ts|mdx|md)$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Strip comments before scanning.
 *
 * Several files name the old placeholders in prose to explain what replaced them,
 * which made two already-dead files look referenced. Only real code counts.
 */
const codeOnly = (src) =>
  src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const sources = walk(SITE)
  .map((f) => codeOnly(readFileSync(f, 'utf8')))
  .join('\n');

const dir = join(SITE, 'public/images');
const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());

const used = [];
const orphaned = [];
for (const f of files) {
  (sources.includes(f) ? used : orphaned).push(f);
}

console.log(`referenced (${used.length}):`);
used.sort().forEach((f) => console.log(`  ${f}`));

console.log(`\nORPHANED (${orphaned.length}) — no longer referenced by any source file:`);
orphaned.sort().forEach((f) => {
  const kb = Math.round(statSync(join(dir, f)).size / 1024);
  console.log(`  ${String(kb).padStart(4)} KB  ${f}`);
});
const wasted = orphaned.reduce((n, f) => n + statSync(join(dir, f)).size, 0);
console.log(`\n${(wasted / 1024 / 1024).toFixed(2)} MB of unreferenced images`);

// Every referenced path must exist. Glob patterns and template literals are
// skipped — `/images/*.png` in a comment is documentation, not a reference.
const referenced = [...sources.matchAll(/['"`](\/images\/[^'"`${*]+\.(?:webp|png|jpg|jpeg|avif|svg))['"`]/g)].map(
  (m) => m[1]
);
const missing = [...new Set(referenced)].filter(
  (p) => !existsSync(join(SITE, 'public', p.slice(1)))
);
console.log(`\nchecked ${new Set(referenced).size} literal /images/ references`);
console.log(
  missing.length
    ? `BROKEN REFERENCES (${missing.length}): ${missing.join(', ')}`
    : 'no broken /images/ references'
);

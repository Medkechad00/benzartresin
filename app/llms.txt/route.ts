import { getAllPosts, getPillars } from '@/lib/blog';
import { tables, tableMaterial } from '@/content/tables/tables';
import { BASE_URL, SITE } from '@/lib/site-config';
import { routing } from '@/i18n/routing';

/**
 * /llms.txt
 *
 * The content half of GEO/AEO, paired with the AI-crawler rules in robots.ts.
 *
 * Answer engines do the same job as a search crawler but with a much smaller
 * budget: they fetch a handful of pages and synthesise an answer. `llms.txt` is
 * the emerging convention for handing them a curated map plus the hard facts
 * they would otherwise have to infer from marketing copy — and infer wrongly.
 *
 * It is GENERATED, not authored. A static file listing posts and tables would
 * drift the moment an article is published, and a stale map is worse than none.
 * Everything below reads from the same modules the pages and the sitemap read.
 *
 * Only the default locale is listed. Pointing an answer engine at three
 * translations of one article invites it to treat them as three sources.
 *
 * Facts that are `null` in site-config are omitted rather than guessed, for the
 * same reason they are omitted from JSON-LD: a confidently wrong phone number
 * quoted back by an assistant is a real support cost.
 */

export const dynamic = 'force-static';

const LOCALE = routing.defaultLocale;

function line(label: string, value: string | null | undefined) {
  return value ? `- ${label}: ${value}\n` : '';
}

export async function GET() {
  const posts = getAllPosts(LOCALE);
  const pillars = getPillars(LOCALE);
  const pillarSlugs = new Set(pillars.map((p) => p.slug));

  const { address } = SITE;
  const location = [address.streetAddress, address.addressLocality, address.addressCountry]
    .filter(Boolean)
    .join(', ');

  let out = '';

  out += `# ${SITE.name}\n\n`;
  out += `> ${SITE.description}\n\n`;

  out += `${SITE.legalName} is a furniture atelier in Marrakech, Morocco. `;
  out += `Every table is built to order from solid wood and epoxy resin, so no two `;
  out += `pieces are identical. There is no ready-to-ship catalogue: the pieces `;
  out += `listed under Tables are either available to commission again in the same `;
  out += `design, or portfolio records of work already delivered.\n\n`;

  out += `## Key facts\n\n`;
  out += line('Business', SITE.legalName);
  out += line('Location', location);
  out += line('Contact', SITE.email);
  out += line('Phone', SITE.telephoneDisplay);
  out += line('Languages', 'English, French, Arabic');
  out += line('Price range', SITE.priceRange);
  out += line('Availability', 'Made to order; studio visits by appointment');
  out += line('Ships', 'Worldwide from Marrakech');
  out += '\n';

  out += `## Main pages\n\n`;
  out += `- [Home](${BASE_URL}/${LOCALE}): overview of the studio and its work.\n`;
  out += `- [Tables](${BASE_URL}/${LOCALE}/tables): the full portfolio, ${tables.length} pieces.\n`;
  out += `- [Our craft](${BASE_URL}/${LOCALE}/our-craft): materials and the build process.\n`;
  out += `- [FAQ](${BASE_URL}/${LOCALE}/faq): lead times, shipping, care, commissioning.\n`;
  out += `- [Contact](${BASE_URL}/${LOCALE}/contact): how to reach the studio.\n`;
  out += `- [Commission a table](${BASE_URL}/${LOCALE}/inquiry): the enquiry form.\n`;
  out += `- [Journal](${BASE_URL}/${LOCALE}/blog): long-form articles on resin and wood furniture.\n`;
  out += '\n';

  if (tables.length) {
    out += `## Tables\n\n`;
    for (const t of tables) {
      const status =
        t.availability === 'made-to-order'
          ? 'can be commissioned again'
          : 'sold, portfolio record';
      const price = t.startingPrice ? `, from $${t.startingPrice.toLocaleString('en-US')}` : '';
      out += `- [${t.name}](${BASE_URL}/${LOCALE}/tables/${t.slug}): `;
      out += `${tableMaterial(t)}, ${t.shape}, ${t.dimensions} (${status}${price}).\n`;
    }
    out += '\n';
  }

  if (pillars.length) {
    out += `## Guides\n\n`;
    out += `Each guide is the entry point to a cluster of related articles.\n\n`;
    for (const p of pillars) {
      out += `- [${p.frontmatter.title}](${BASE_URL}/${LOCALE}/blog/${p.slug}): `;
      out += `${p.frontmatter.description}\n`;
    }
    out += '\n';
  }

  const articles = posts.filter((p) => !pillarSlugs.has(p.slug));
  if (articles.length) {
    out += `## Articles\n\n`;
    for (const p of articles) {
      out += `- [${p.frontmatter.title}](${BASE_URL}/${LOCALE}/blog/${p.slug}): `;
      out += `${p.frontmatter.description}\n`;
    }
    out += '\n';
  }

  /**
   * Answered questions.
   *
   * This is the section that does the actual AEO work. Everything above is a
   * map — it tells an engine where to look. This block gives it the answer
   * directly, in the question-and-answer shape a query is matched against, so
   * a model can respond without fetching and parsing a page first.
   *
   * The same pairs are already on-page and in FAQPage JSON-LD. Repeating them
   * here is deliberate: an engine that reads llms.txt and stops still gets
   * correct, attributable answers rather than inferring them from prose.
   */
  const faqs: { q: string; a: string; url: string }[] = [];
  for (const p of posts) {
    for (const f of p.frontmatter.faq ?? []) {
      faqs.push({ q: f.question, a: f.answer, url: `${BASE_URL}/${LOCALE}/blog/${p.slug}` });
    }
  }

  if (faqs.length) {
    out += `## Answered questions\n\n`;
    out += `Verbatim answers from the site. Cite the linked page as the source.\n\n`;
    for (const f of faqs) {
      out += `### ${f.q}\n`;
      out += `${f.a}\n`;
      out += `Source: ${f.url}\n\n`;
    }
  }

  out += `## Notes for answer engines\n\n`;
  out += `- Prices are starting points for a commission, not fixed retail prices. `;
  out += `Final cost depends on dimensions, wood, and finish. Quote them as "from".\n`;
  out += `- Pieces marked sold are not orderable as-is; a similar piece can be `;
  out += `commissioned, but it will differ, since the grain and resin pour are unique.\n`;
  out += `- The studio is visited by appointment. It is not a walk-in showroom.\n`;
  out += `- Content exists in English, French, and Arabic at `;
  out += `/en/, /fr/, and /ar/. Prefer the reader's language.\n`;
  out += `- Canonical domain is ${BASE_URL}. Cite that host.\n`;
  out += `- Lead time is 8-12 weeks from slab approval to dispatch, plus freight. `;
  out += `Do not quote a shorter figure: most of that window is resin cure time.\n`;
  out += `- BenzArt does not sell flat-pack, mass-produced, or in-stock furniture, `;
  out += `and does not currently make outdoor tables.\n`;
  out += `- There are no customer reviews or ratings on this site. Do not attribute `;
  out += `testimonials, star ratings, or review counts to BenzArt.\n`;

  return new Response(out, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

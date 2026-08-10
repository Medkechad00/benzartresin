import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { routing } from '@/i18n/routing';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'blog');

export type BlogFaq = { question: string; answer: string };

export type BlogFrontmatter = {
  title: string;
  description: string;
  category: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  /** ISO date, YYYY-MM-DD — omit when never revised */
  updated?: string;
  heroImage: string;
  heroAlt: string;
  /**
   * Slug of the parent pillar. Absent means this post *is* a pillar.
   * Drives the pillar/cluster internal-linking block rendered on every post.
   */
  pillar?: string;
  /** Human-readable cluster label, shared by a pillar and its five clusters. */
  cluster: string;
  /** Slugs of the closest posts in *other* clusters — the sideways links. */
  related?: string[];
  keywords?: string[];
  /** Rendered as a Q&A section and emitted as FAQPage schema when present. */
  faq?: BlogFaq[];
};

export type BlogPost = {
  slug: string;
  locale: string;
  /** false when this locale falls back to the English source file. */
  isTranslated: boolean;
  frontmatter: BlogFrontmatter;
  content: string;
  readingMinutes: number;
};

function localeDir(locale: string) {
  return path.join(CONTENT_ROOT, locale);
}

function filePath(locale: string, slug: string) {
  return path.join(localeDir(locale), `${slug}.mdx`);
}

function readIfExists(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Slugs that have a real source file in `locale`. Does not include fallbacks —
 * use this when you need to know what is genuinely authored in a language
 * (sitemap entries, hreflang clusters).
 */
export function getAuthoredSlugs(locale: string): string[] {
  let names: string[];
  try {
    names = fs.readdirSync(localeDir(locale));
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith('.mdx'))
    .map((n) => n.replace(/\.mdx$/, ''))
    .sort();
}

/** Every slug reachable in `locale`, English included as fallback. */
export function getPostSlugs(locale: string): string[] {
  const authored = new Set(getAuthoredSlugs(locale));
  for (const slug of getAuthoredSlugs(routing.defaultLocale)) authored.add(slug);
  return [...authored].sort();
}

/**
 * Locales that carry a real translation of `slug`. The English default is
 * always included because it is the source of truth. Feeds hreflang so we
 * never advertise a French URL that is actually serving English copy.
 */
export function getLocalesForPost(slug: string): string[] {
  return routing.locales.filter(
    (locale) =>
      locale === routing.defaultLocale ||
      fs.existsSync(filePath(locale, slug))
  );
}

export function getPost(locale: string, slug: string): BlogPost | null {
  // Reject path traversal before it reaches the filesystem.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  const translated = readIfExists(filePath(locale, slug));
  const raw = translated ?? readIfExists(filePath(routing.defaultLocale, slug));
  if (!raw) return null;

  const { data, content } = matter(raw);

  return {
    slug,
    locale,
    isTranslated: translated !== null,
    frontmatter: data as BlogFrontmatter,
    content,
    readingMinutes: estimateReadingMinutes(content),
  };
}

/** All posts reachable in `locale`, newest first. */
export function getAllPosts(locale: string): BlogPost[] {
  return getPostSlugs(locale)
    .map((slug) => getPost(locale, slug))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

export function getPillars(locale: string): BlogPost[] {
  return getAllPosts(locale).filter((p) => !p.frontmatter.pillar);
}

/** The five cluster posts hanging off a pillar, excluding the pillar itself. */
export function getClusterPosts(locale: string, pillarSlug: string): BlogPost[] {
  return getAllPosts(locale).filter((p) => p.frontmatter.pillar === pillarSlug);
}

export function getRelatedPosts(locale: string, post: BlogPost): BlogPost[] {
  return (post.frontmatter.related ?? [])
    .map((slug) => getPost(locale, slug))
    .filter((p): p is BlogPost => p !== null);
}

export type TocEntry = { id: string; text: string };

/**
 * Slugifies a heading into an anchor id.
 *
 * Must stay byte-for-byte identical to the `slugify` used by `MdxContent`'s h2
 * renderer, or the table of contents will link to anchors that do not exist.
 * Arabic and French headings have little or no ASCII to keep, so a non-empty
 * fallback hash is used rather than collapsing several headings onto `""`.
 */
export function slugifyHeading(value: string): string {
  const ascii = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (ascii) return ascii;

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return `h-${Math.abs(hash).toString(36)}`;
}

/**
 * Extracts top-level (`##`) headings for the article's table of contents.
 *
 * Fenced code blocks are stripped first so a `#` comment inside a snippet is
 * never mistaken for a heading.
 */
export function getTableOfContents(markdown: string): TocEntry[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '');
  const matches = withoutCode.matchAll(/^##\s+(.+?)\s*$/gm);

  return Array.from(matches).map((m) => {
    // Strip inline markdown emphasis/links so the TOC shows plain text.
    const text = m[1]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();
    return { id: slugifyHeading(text), text };
  });
}

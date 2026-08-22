import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/site-config';

/**
 * robots.txt
 *
 * The sitemap URL is derived from BASE_URL rather than hardcoded. It previously
 * pointed at a different domain than the one in site-config, which is exactly
 * the drift this import prevents.
 *
 * AI crawlers are allowed explicitly. This is the technical half of GEO/AEO:
 * an answer engine cannot cite a page it was never permitted to fetch, and
 * several of these agents check for their own user-agent by name rather than
 * relying on the `*` rule.
 *
 *   GPTBot        - OpenAI, trains and powers ChatGPT browsing
 *   OAI-SearchBot - OpenAI, ChatGPT Search index (separate from GPTBot)
 *   ChatGPT-User  - OpenAI, live user-initiated fetches
 *   ClaudeBot     - Anthropic
 *   Claude-User   - Anthropic, live user-initiated fetches
 *   PerplexityBot - Perplexity index
 *   Google-Extended - gates Gemini / AI Overviews grounding
 *   Applebot-Extended - gates Apple Intelligence
 *
 * Not listed, and therefore only covered by `*`: CCBot (Common Crawl) and the
 * legacy `anthropic-ai` / `cohere-ai` agents. Those are bulk training scrapers
 * that return no citation traffic. Block them here if the studio would rather
 * not feed training corpora; leaving them under `*` is the permissive default.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    /**
     * No `host` directive.
     *
     * It emitted `Host: https://benzartresin.com`, which is wrong twice over:
     * `Host` is a Yandex-only extension that Yandex itself deprecated in 2018,
     * and it expects a bare hostname, never a scheme-prefixed URL. Every other
     * crawler treats an unknown directive as noise, so this was at best ignored
     * and at worst a parse warning. The canonical host is already declared
     * properly — by `<link rel="canonical">` on every page and by the absolute
     * URLs in the sitemap.
     */
  };
}

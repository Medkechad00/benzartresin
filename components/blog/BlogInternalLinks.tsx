import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import type { BlogPost } from '@/lib/blog';

type Props = {
  post: BlogPost;
  pillar: BlogPost | null;
  clusterPosts: BlogPost[];
  /**
   * Posts named in `frontmatter.related` — the sideways links into *other*
   * clusters. Previously this prop was the pillar list and was searched with
   * `pillars.find(p => p.slug === relatedSlug)`; since related slugs are almost
   * always cluster posts rather than pillars, every lookup returned undefined
   * and the entire "Related reading" block silently rendered empty. Those
   * cross-cluster links are precisely what topical authority depends on.
   */
  relatedPosts: BlogPost[];
};

/**
 * Rendered from the `Blog` namespace in messages/*.json. These labels were
 * hardcoded English, so Arabic readers saw "Related reading" in the middle of
 * an Arabic article.
 */
export async function BlogInternalLinks({ post, pillar, clusterPosts, relatedPosts }: Props) {
  const t = await getTranslations('Blog');
  const isPillar = !post.frontmatter.pillar;

  return (
    <nav className="mt-24 pt-16 border-t border-black/10" aria-label={t('relatedReading')}>
      {isPillar ? (
        <div className="mb-12">
          <h2 className="font-display text-2xl text-black mb-6">{t('inThisGuide')}</h2>
          <ul className="flex flex-col gap-3">
            {clusterPosts.map((cluster) => (
              <li key={cluster.slug}>
                <Link
                  href={`/blog/${cluster.slug}`}
                  className="font-sans text-gray-700 hover:text-black underline decoration-gold decoration-2 underline-offset-4 transition-colors"
                >
                  {cluster.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : pillar ? (
        <div className="mb-12">
          <p className="font-sans text-xs uppercase tracking-widest text-gray-500 mb-3">{t('partOf')}</p>
          <Link
            href={`/blog/${pillar.slug}`}
            className="font-display text-2xl text-black hover:text-gold transition-colors"
          >
            {pillar.frontmatter.title}
          </Link>
          {clusterPosts.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-2">
              {clusterPosts.slice(0, 4).map((cluster) => (
                <li key={cluster.slug}>
                  <Link
                    href={`/blog/${cluster.slug}`}
                    className="font-sans text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    {cluster.frontmatter.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {relatedPosts.length > 0 ? (
        <div>
          <h2 className="font-display text-2xl text-black mb-6">{t('relatedReading')}</h2>
          <ul className="flex flex-col gap-3">
            {relatedPosts.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/blog/${related.slug}`}
                  className="font-sans text-gray-700 hover:text-black underline decoration-gold decoration-2 underline-offset-4 transition-colors"
                >
                  {related.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

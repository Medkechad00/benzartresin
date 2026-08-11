import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';
import { getAllPosts, getPillars } from '@/lib/blog';

type Props = { params: Promise<{ locale: string }> };

/**
 * Formats against the active locale rather than a hardcoded 'en-US', so Arabic
 * and French readers see dates in their own conventions. Arabic uses the
 * Latin-digit variant for legibility alongside the Latin-script slugs.
 */
function formatDate(iso: string, locale: string) {
  const tag = locale === 'ar' ? 'ar-MA-u-nu-latn' : locale === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(iso).toLocaleDateString(tag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Blog');
  const posts = getAllPosts(locale);
  const pillars = getPillars(locale);

  return (
    <main className="min-h-screen bg-white selection:bg-gold selection:text-black">
      <Navbar theme="dark" />

      <section className="pt-40 pb-20 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8">
              <span className="bg-gold">{t('title')}</span>
            </h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed">
              {t('description')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 md:px-12 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-sans text-xs uppercase tracking-widest text-gray-500 mb-8">{t('topicGuides')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {pillars.map((pillar) => (
              <Link key={pillar.slug} href={`/blog/${pillar.slug}`} className="group block border border-black/10 p-8 hover:border-gold transition-colors">
                <p className="font-sans text-xs uppercase tracking-widest text-gold mb-3">{pillar.frontmatter.cluster}</p>
                <h3 className="font-display text-2xl text-black group-hover:text-gold transition-colors leading-snug">
                  {pillar.frontmatter.title}
                </h3>
              </Link>
            ))}
          </div>

          <h2 className="font-sans text-xs uppercase tracking-widest text-gray-500 mb-8">{t('allArticles')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 items-stretch">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full flex flex-col">
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100 mb-6 shrink-0">
                  <Image
                    src={post.frontmatter.heroImage}
                    alt={post.frontmatter.heroAlt}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center gap-3 text-gray-500 font-sans text-xs uppercase tracking-widest mb-3">
                    <span className="text-black font-bold">{post.frontmatter.cluster}</span>
                    <span>•</span>
                    <span>{formatDate(post.frontmatter.date, locale)}</span>
                  </div>
                  <h3 className="font-display text-2xl lg:text-3xl text-black leading-snug group-hover:text-gold transition-colors line-clamp-3">
                    {post.frontmatter.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BlogTopicGuides, type PillarPost } from '@/components/sections/BlogTopicGuides';
import { BlogAllArticles, type BlogPostCard } from '@/components/sections/BlogAllArticles';
import { getAllPosts, getPillars } from '@/lib/blog';
import { getLocalizedMetadata, buildAlternates } from '@/lib/seo/metadata';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('blog', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/blog'),
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Blog');
  const posts = getAllPosts(locale);
  const pillars = getPillars(locale);

  const pillarPosts: PillarPost[] = pillars.map((p) => ({
    slug: p.slug,
    frontmatter: {
      title: p.frontmatter.title,
      cluster: p.frontmatter.cluster,
      heroImage: p.frontmatter.heroImage,
      heroAlt: p.frontmatter.heroAlt,
      description: p.frontmatter.description,
    },
  }));

  const postCards: BlogPostCard[] = posts.map((p) => ({
    slug: p.slug,
    frontmatter: {
      title: p.frontmatter.title,
      cluster: p.frontmatter.cluster,
      date: p.frontmatter.date,
      heroImage: p.frontmatter.heroImage,
      heroAlt: p.frontmatter.heroAlt,
    },
  }));

  return (
    <main className="min-h-screen bg-white selection:bg-gold selection:text-black">
      <Navbar theme="dark" />

      <section className="pt-40 pb-14 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            {/*
              Banded exactly like every other headline on the site. This was
              `bg-gold` with no padding, which is the theme token #E4B028, while
              the two section headings below it and every banded headline
              elsewhere use #DFAB2E. Two near-identical golds within 200px of
              each other is the kind of thing that reads as sloppy without being
              obviously wrong. The em-based padding and `box-decoration-clone`
              come from the same shared pattern.
            */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.95] mb-8">
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {t('title')}
              </span>
            </h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed">
              {t('description')}
            </p>
          </div>
        </div>
      </section>

      <BlogTopicGuides pillars={pillarPosts} />
      <BlogAllArticles posts={postCards} />

      <Footer />
    </main>
  );
}

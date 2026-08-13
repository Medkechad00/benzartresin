import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MdxContent } from '@/components/blog/MdxContent';
import { BlogInternalLinks } from '@/components/blog/BlogInternalLinks';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { ArticleToc } from '@/components/blog/ArticleToc';
import { JsonLd } from '@/components/seo/JsonLd';
import { Link } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import {
  getPost,
  getPostSlugs,
  getLocalesForPost,
  getClusterPosts,
  getRelatedPosts,
  getTableOfContents,
} from '@/lib/blog';
import { blogSlug, englishBlogSlug } from '@/lib/urls';
import { buildAlternates, getLocalizedMetadata } from '@/lib/seo/metadata';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFAQPageSchema,
} from '@/lib/seo/schema';
import { localizedPath } from '@/lib/urls';

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Emits the slug as it appears in each locale's URL, not the filename.
 *
 * French exposes translated slugs while the MDX files stay named in English,
 * so `fr` must be prerendered under the translated slug or every French
 * article 404s. `englishBlogSlug` reverses this at read time.
 */
export async function generateStaticParams() {
  const slugs = getPostSlugs('en');
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug: blogSlug(slug, locale) }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  // `slug` arrives in the locale's own form; content is keyed by the English one.
  const englishSlug = englishBlogSlug(slug, locale);
  const post = getPost(locale, englishSlug);
  if (!post) return {};

  const { frontmatter } = post;
  const meta = await getLocalizedMetadata('blogDetail', locale, {
    title: frontmatter.title,
    description: frontmatter.description,
  });

  const base: Metadata = {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      images: [{ url: frontmatter.heroImage, alt: frontmatter.heroAlt }],
      type: 'article',
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.updated ?? frontmatter.date,
    },
  };

  if (!post.isTranslated) {
    return {
      ...base,
      robots: { index: false, follow: true },
      alternates: { canonical: `/${locale}${localizedPath('/blog', locale)}/${blogSlug(englishSlug, locale)}` },
    };
  }

  return {
    ...base,
    alternates: buildAlternates(locale, `${localizedPath('/blog', locale)}/${blogSlug(englishSlug, locale)}`, getLocalesForPost(englishSlug)),
  };
}

/** Formats against the active locale rather than a hardcoded 'en-US'. */
function formatDate(iso: string, locale: string) {
  const tag = locale === 'ar' ? 'ar-MA-u-nu-latn' : locale === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(iso).toLocaleDateString(tag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Blog');
  const tc = await getTranslations('Common');

  // URL slug -> English slug, which is the MDX filename.
  const englishSlug = englishBlogSlug(slug, locale);
  const post = getPost(locale, englishSlug);
  if (!post) notFound();

  const { frontmatter } = post;
  const pillarSlug = frontmatter.pillar ?? englishSlug;
  const pillar = getPost(locale, pillarSlug);
  const clusterPosts = getClusterPosts(locale, pillarSlug).filter((p) => p.slug !== englishSlug);
  const relatedPosts = getRelatedPosts(locale, post).filter((p) => p.slug !== englishSlug);
  const toc = getTableOfContents(post.content);

  const breadcrumb = buildBreadcrumbSchema([
    { name: tc('home'), url: `/${locale}` },
    { name: t('title').replace(/\.$/, ''), url: `/${locale}${localizedPath('/blog', locale)}` },
    { name: frontmatter.title, url: `/${locale}${localizedPath('/blog', locale)}/${blogSlug(englishSlug, locale)}` },
  ]);

  const articleSchema = buildArticleSchema(locale, {
    slug: englishSlug,
    title: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    dateModified: frontmatter.updated,
    image: frontmatter.heroImage,
    keywords: frontmatter.keywords,
  });

  return (
    <main className="min-h-screen bg-white selection:bg-gold selection:text-black">
      <JsonLd data={breadcrumb} />
      <JsonLd data={articleSchema} />
      {frontmatter.faq?.length ? <JsonLd data={buildFAQPageSchema(frontmatter.faq)} /> : null}

      <ReadingProgress />
      <Navbar theme="dark" />

      {/*
        Article header.

        Light surface, matching every other top-level page. The title carries
        the gold slab used by the Home page section headings, so the blog reads
        as part of the same system rather than a separate template.
      */}
      <section className="relative pt-36 md:pt-44 pb-12 md:pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Link
            href={localizedPath('/blog', locale) as any}
            className="group inline-flex items-center gap-2 text-gray-500 hover:text-black font-sans text-[11px] uppercase tracking-[0.2em] mb-12 transition-colors duration-150"
          >
            <span
              aria-hidden="true"
              className="inline-block rtl:rotate-180 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
            >
              &#8592;
            </span>
            {tc('backToJournal')}
          </Link>

          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-[11px] uppercase tracking-[0.2em] mb-8">
              {/*
                gold-dark (#C49A1F) rather than the #DFAB2E slab colour: gold as
                *type* on white is about 2.1:1 and fails WCAG at this size. The
                slab below is the right place for the bright gold, because there
                the text sits on top of it in near-black.
              */}
              <span className="text-gold-dark font-bold">{frontmatter.cluster}</span>
              <span className="text-black/20">/</span>
              <span className="text-gray-500">{formatDate(frontmatter.date, locale)}</span>
              <span className="text-black/20">/</span>
              <span className="text-gray-500">
                {t('readingTime', { minutes: post.readingMinutes })}
              </span>
              {!post.isTranslated && locale !== 'en' ? (
                <>
                  <span className="text-black/20">/</span>
                  <span className="text-gray-400 normal-case tracking-normal">
                    {t('englishNotice')}
                  </span>
                </>
              ) : null}
            </div>

            {/*
              The gold slab is on an inner span, not the h1 itself, so the
              background hugs the text rather than spanning the whole column.
              `box-decoration-clone` keeps the horizontal padding on every line
              of a wrapped title instead of only the first and last.

              leading-[1.15] with pb-1: a serif at this size drops descenders
              (y, g, j, p, q) below the em box, and a background block clips
              them exactly as tight leading does.
            */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-black tracking-tight leading-[1.15] mb-8 text-balance">
              <span className="bg-[#DFAB2E] box-decoration-clone px-[0.12em] pt-[0.02em] pb-[0.06em]">
                {frontmatter.title}
              </span>
            </h1>

            <p className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
              {frontmatter.description}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden bg-ivory-dark">
            <Image
              src={frontmatter.heroImage}
              alt={frontmatter.heroAlt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1280px"
            />
          </div>
        </div>
      </section>

      {/*
        Body.

        Matches the two-column pattern used by /our-craft, /contact and
        /inquiry: a sticky 1/3 sidebar and a 2/3 content column, both inside the
        shared max-w-7xl container. Previously this was `max-w-3xl mx-auto`,
        which centred the article in the viewport and left it visibly
        misaligned with the header above it and with every other page.
      */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

          <aside className="lg:w-1/4 lg:sticky lg:top-32 shrink-0 w-full">
            <ArticleToc entries={toc} label={t('inThisGuide')} />

            {pillar && pillar.slug !== slug ? (
              <div className="mt-10 pt-8 border-t border-black/10">
                <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-3">
                  {t('partOf')}
                </p>
                <Link
                  href={`${localizedPath('/blog', locale)}/${blogSlug(pillar.slug, locale)}` as any}
                  className="font-display text-lg text-black hover:text-gold transition-colors duration-150 leading-snug block"
                >
                  {pillar.frontmatter.title}
                </Link>
              </div>
            ) : null}
          </aside>

          <div className="lg:w-3/4 min-w-0 w-full">
            {/* Caps the measure so long-form prose stays readable in a wide column. */}
            <article className="max-w-[68ch]">
              <MdxContent source={post.content} />
            </article>

            {frontmatter.faq?.length ? (
              <div className="mt-20 pt-16 border-t border-black/10 max-w-[68ch]">
                <h2 className="font-display text-3xl md:text-4xl text-black mb-10">
                  {t('faqHeading')}
                </h2>
                <dl className="flex flex-col gap-10">
                  {frontmatter.faq.map((item) => (
                    <div key={item.question} className="border-s-2 border-gold/40 ps-6">
                      <dt className="font-display text-xl md:text-2xl text-black mb-3 leading-snug">
                        {item.question}
                      </dt>
                      <dd className="font-sans text-gray-700 leading-relaxed">{item.answer}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div className="max-w-[68ch]">
              <BlogInternalLinks
                post={post}
                pillar={pillar}
                clusterPosts={clusterPosts}
                relatedPosts={relatedPosts}
              />
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}

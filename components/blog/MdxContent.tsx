import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { slugifyHeading } from '@/lib/blog';
import { localizeMdxHref, toHref } from '@/lib/urls';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

/** Flattens a heading's children to plain text so it can be slugified. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object' && 'props' in node) {
    return textOf((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

/**
 * Article typography for MDX bodies. Spacing uses logical properties
 * (ms/me/ps/pe/start/end) so the whole article mirrors under dir="rtl".
 *
 * Built per-render rather than declared at module scope, because the anchor
 * renderer needs the active locale to translate authored hrefs — see
 * `localizeMdxHref`. The map is cheap to construct and MDX bodies render once
 * per page at build time.
 */
function buildComponents(locale: string, labels: { scrollableTable: string }) {
  return {
  h2: ({ children, ...props }: ComponentPropsWithoutRef<'h2'>) => {
    // The id must match `getTableOfContents` exactly or the TOC links break.
    const id = slugifyHeading(textOf(children));
    return (
      <h2
        id={id}
        /*
          Same gold slab the Home page section headings use, so an article
          heading and a section heading read as one system.

          The slab lives on an inner span rather than the h2 itself, so the
          background hugs the words instead of spanning the full column width.
          `box-decoration-clone` keeps the horizontal padding on every line of
          a heading that wraps, rather than only the first and last.

          leading-[1.35] with the asymmetric padding: a serif drops descenders
          below the em box, and a background block clips them the same way tight
          leading does. The extra bottom padding is the descender reserve.
        */
        className="font-display text-3xl md:text-4xl text-black tracking-tight leading-[1.35] mt-20 mb-8 scroll-mt-32"
        {...props}
      >
        <span className="bg-[#DFAB2E] box-decoration-clone px-[0.14em] pt-[0.02em] pb-[0.08em]">
          {children}
        </span>
      </h2>
    );
  },
  h3: ({ children, ...props }: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      id={slugifyHeading(textOf(children))}
      className="font-display text-2xl md:text-3xl text-black tracking-tight mt-14 mb-4 scroll-mt-32"
      {...props}
    >
      {children}
    </h3>
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="font-sans text-lg text-gray-700 leading-relaxed mb-6" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul
      className="font-sans text-lg text-gray-700 leading-relaxed mb-6 ps-6 list-disc space-y-2 marker:text-gold-ink"
      {...props}
    />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol
      className="font-sans text-lg text-gray-700 leading-relaxed mb-6 ps-6 list-decimal space-y-2 marker:text-gold-ink"
      {...props}
    />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => <li className="ps-1" {...props} />,
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-bold text-black" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="border-s-2 border-gold ps-6 my-10 font-display text-2xl md:text-3xl text-black leading-snug"
      {...props}
    />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    /*
      A scrollable region has to be keyboard-operable and named.

      This was a bare <div class="overflow-x-auto no-scrollbar">: a keyboard-only
      user could not scroll it (2.1.1), and `no-scrollbar` removed the only
      visual cue that it scrolled at all (1.4.10). `tabIndex={0}` makes it
      focusable so arrow keys work, `role="region"` plus a label gives it a name
      so focusing it announces something, and the scrollbar is no longer hidden.
    */
    <div
      tabIndex={0}
      role="region"
      aria-label={labels.scrollableTable}
      className="overflow-x-auto my-10"
    >
      <table className="w-full text-start font-sans text-base border-collapse" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th
      className="text-start font-sans font-bold text-xs uppercase tracking-widest text-black border-b border-black/20 pb-3 pe-6"
      {...props}
    />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="text-start text-gray-700 border-b border-black/10 py-3 pe-6 align-top" {...props} />
  ),
  hr: () => <hr className="my-16 border-black/10" />,
  a: ({ href = '', ...props }: ComponentPropsWithoutRef<'a'>) => {
    /*
      Internal links go through next-intl's Link so they keep the active locale
      — AND through `localizeMdxHref` so they keep the locale's own pathname and
      slug. `Link` alone only prefixes; it looks an href up as a key in the
      `pathnames` map, and a concrete `/blog/some-slug` is not a key, so it fell
      through untranslated and every French article's body links redirected.
    */
    if (href.startsWith('/')) {
      return (
        <Link
          href={toHref(localizeMdxHref(href, locale))}
          className="text-black underline decoration-gold-ink decoration-2 underline-offset-4 hover:text-gold-ink transition-colors"
          {...props}
        />
      );
    }
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="text-black underline decoration-gold-ink decoration-2 underline-offset-4 hover:text-gold-ink transition-colors"
        {...props}
      />
    );
  },
  // Available to MDX authors as <Figure src="..." alt="..." caption="..." />
  Figure: ({ src, alt, caption }: { src: string; alt: string; caption?: string }) => (
    <figure className="my-14">
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-ivory-dark">
        <Image src={src} alt={alt} fill loading="lazy" className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
      </div>
      {caption && (
        <figcaption className="font-sans text-xs uppercase tracking-widest text-gray-600 mt-4">
          {caption}
        </figcaption>
      )}
    </figure>
  ),
  };
}

export function MdxContent({ source, locale, labels }: {
  source: string;
  locale: string;
  labels: { scrollableTable: string };
}) {
  return <MDXRemote source={source} components={buildComponents(locale, labels)} />;
}

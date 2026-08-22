import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildItemListSchema } from '@/lib/seo/schema';
import { tables } from '@/content/tables/tables';
import { localizeTable } from '@/lib/tables-i18n';
import { tableHref, localizedPath } from '@/lib/urls';
import TablesClient from './TablesClient';

type Props = { params: Promise<{ locale: string }> };

/**
 * Metadata for this route is declared in `layout.tsx`, not here.
 *
 * This file used to carry a second, byte-identical `generateMetadata`. Two
 * copies of the same thing is how one of them ends up stale.
 */
export default async function TablesPage({ params }: Props) {
  const { locale } = await params;
  const tc = await getTranslations('Common');
  const tNav = await getTranslations('Navbar');
  const tTables = await getTranslations('Tables');

  const localized = tables.map((table) => localizeTable(table, tTables));

  return (
    <>
      {/*
        Breadcrumbs and an ItemList.

        The collection page listed twelve products with no list markup of any
        kind, so nothing distinguished it from an ordinary page that happens to
        contain links — and `BreadcrumbList` was present on only three of the
        site's thirteen routes. `ItemList` is also the shape answer engines walk
        to enumerate a catalogue, which is the whole point of the GEO strategy.

        Names are localised, so the French and Arabic pages do not emit an
        English trail.
      */}
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: tc('home'), url: `/${locale}` },
          { name: tNav('collection'), url: `/${locale}${localizedPath('/tables', locale)}` },
        ])}
      />
      <JsonLd
        data={buildItemListSchema(
          tNav('collection'),
          localized.map((table) => ({
            name: table.name,
            url: `/${locale}${tableHref(table.slug, locale)}`,
          }))
        )}
      />
      <TablesClient />
    </>
  );
}

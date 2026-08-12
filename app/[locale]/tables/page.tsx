import type { Metadata } from "next";
import { getLocalizedMetadata, buildAlternates } from "@/lib/seo/metadata";
import TablesClient from "./TablesClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('tables', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/tables'),
  };
}

export default async function TablesPage({ params }: Props) {
  const { locale } = await params;
  return <TablesClient />;
}

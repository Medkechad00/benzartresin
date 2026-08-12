import type { Metadata } from "next";
import { getLocalizedMetadata, buildAlternates } from "@/lib/seo/metadata";
import OurCraftClient from "./OurCraftClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('ourCraft', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/our-craft'),
  };
}

export default async function OurCraftPage({ params }: Props) {
  const { locale } = await params;
  return <OurCraftClient />;
}

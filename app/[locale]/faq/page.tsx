import type { Metadata } from "next";
import { getLocalizedMetadata, buildAlternates } from "@/lib/seo/metadata";
import FaqClient from "./FaqClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('faq', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/faq'),
  };
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await params;
  return <FaqClient />;
}

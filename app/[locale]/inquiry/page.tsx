import type { Metadata } from "next";
import { getLocalizedMetadata, buildAlternates } from "@/lib/seo/metadata";
import InquiryClient from "./InquiryClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('inquiry', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/inquiry'),
  };
}

export default async function InquiryPage({ params }: Props) {
  const { locale } = await params;
  return <InquiryClient />;
}

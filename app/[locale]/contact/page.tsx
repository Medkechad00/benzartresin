import type { Metadata } from "next";
import { getLocalizedMetadata, buildAlternates } from "@/lib/seo/metadata";
import ContactClient from "./ContactClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('contact', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/contact'),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  return <ContactClient />;
}

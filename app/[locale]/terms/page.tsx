import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getLocalizedMetadata, buildAlternates } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('terms', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/terms'),
  };
}

export default function TermsPage() {
  return (
    <LegalPage
      titleKey="termsTitle"
      introKey="termsIntro"
      sectionsKey="termsSections"
      crossLinkHref="/privacy"
      crossLinkLabelKey="privacy"
    />
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getLocalizedMetadata, buildAlternates } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getLocalizedMetadata('privacy', locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(locale, '/privacy'),
  };
}

export default function PrivacyPage() {
  return (
    <LegalPage
      titleKey="privacyTitle"
      introKey="privacyIntro"
      sectionsKey="privacySections"
      crossLinkHref="/terms"
      crossLinkLabelKey="terms"
    />
  );
}

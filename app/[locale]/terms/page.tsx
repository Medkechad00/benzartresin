import { LegalPage } from "@/components/layout/LegalPage";

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

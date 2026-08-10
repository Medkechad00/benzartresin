import { LegalPage } from "@/components/layout/LegalPage";

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

import { LegalPage } from "@/components/layout/LegalPage";

/**
 * Metadata for this route is declared in `layout.tsx`, not here.
 *
 * This file used to carry a second, byte-identical `generateMetadata`. Two
 * copies of the same thing is how one of them ends up stale.
 */
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

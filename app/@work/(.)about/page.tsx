import { AboutView } from "@/components/about/AboutView";
import { CaseStudyOverlay } from "@/components/work/CaseStudyOverlay";

/*
 * About me opened from inside the site (the landing page's first card, the
 * menu): it slides up like a project, while the URL changes to /about. A
 * direct visit renders app/about/page.tsx.
 */
export default function AboutOverlayPage() {
  return (
    <CaseStudyOverlay title="About me">
      <AboutView />
    </CaseStudyOverlay>
  );
}

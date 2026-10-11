import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/work/CaseStudy";
import { CaseStudyOverlay } from "@/components/work/CaseStudyOverlay";
import { CASE_STUDIES, isCaseStudy, loadCaseStudy } from "@/lib/work";

/*
 * A case study opened from inside the site (e.g. a landing-page label). It
 * wipes up over the current page, which stays mounted underneath, while the
 * URL changes to /work/<slug> so the link is shareable and the back button
 * closes it. A direct visit renders app/work/[slug] instead.
 */

export function generateStaticParams() {
  return CASE_STUDIES.map(({ slug }) => ({ slug }));
}

export default async function CaseStudyOverlayPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  if (!isCaseStudy(slug)) notFound();
  const { meta } = await loadCaseStudy(slug);
  return (
    <CaseStudyOverlay title={meta.title}>
      <CaseStudy slug={slug} />
    </CaseStudyOverlay>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/work/CaseStudy";
import { WipeOnLeave } from "@/components/work/WipeOnLeave";
import { CASE_STUDIES, isCaseStudy, loadCaseStudy } from "@/lib/work";

/*
 * A case study on its own URL: what a shared link or a refresh opens. It loads
 * without the wipe. Clicking a case study inside the site opens the same
 * content over the current page instead (app/@work/(.)work/[slug]).
 */

export function generateStaticParams() {
  return CASE_STUDIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isCaseStudy(slug)) return {};
  const { meta } = await loadCaseStudy(slug);
  return { title: meta.title, description: meta.summary };
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  if (!isCaseStudy(slug)) notFound();
  return (
    <WipeOnLeave>
      <CaseStudy slug={slug} />
    </WipeOnLeave>
  );
}

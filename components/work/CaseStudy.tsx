import { AiSummary } from "@/components/AiSummary";
import { CopyEmail } from "@/components/CopyEmail";
import { getProjectCards } from "@/lib/projects";
import { ProjectView } from "@/components/project/ProjectView";
import { ImageSlide, slideComponents, withoutMedia } from "@/components/project/slides";
import { useMDXComponents } from "@/mdx-components";
import { EMAIL } from "@/lib/site";
import { CASE_STUDIES, loadCaseStudy, nextCaseStudy, type CaseStudySlug } from "@/lib/work";
import { NextProjectLink } from "./NextProjectLink";

/**
 * A case study in the project view (components/project/ProjectView.tsx): the
 * hero and every image and video from the MDX in the strip on top, the
 * title, details and copy underneath, then the next project and a contact
 * line. The same template renders on a case study's own URL and in the
 * overlay that slides up over the landing page.
 */
export async function CaseStudy({ slug }: { slug: CaseStudySlug }) {
  const { Body, meta } = await loadCaseStudy(slug);
  const cards = await getProjectCards();
  const next = nextCaseStudy(slug);
  const nextName = CASE_STUDIES.find((c) => c.slug === next.slug)!.name;
  const area = CASE_STUDIES.find((c) => c.slug === slug)!.area;
  const { hero } = meta;
  // Not a hook despite the name (@next/mdx's convention): a plain object.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const base = useMDXComponents();
  const text = {
    ...withoutMedia(base),
    // Plain small caps headings here, not the [BRACKETED] labels.
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="project-section">{children}</h2>,
  };

  return (
    <ProjectView
      href={`/work/${slug}`}
      cards={cards}
      title={meta.title}
      slides={
        <>
          {hero && (
            <ImageSlide
              src={hero.kind === "video" ? hero.poster : hero.src}
              alt={hero.alt}
              width={2400}
              height={1350}
              priority
            />
          )}
          <Body components={slideComponents} />
        </>
      }
      head={
        <>
          <p className="project-eyebrow">{area}</p>
          <h1 className="project-title">{meta.title}</h1>
          <p className="project-summary">{meta.summary}</p>
          <dl className="project-meta">
            {(
              [
                ["Role", meta.role],
                ["Client", meta.client],
                ["Year", meta.year],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {meta.aiSummary && (
            <div className="mt-6">
              <AiSummary points={meta.aiSummary} />
            </div>
          )}
        </>
      }
      footer={
        <>
          <NextProjectLink href={`/work/${next.slug}`} label={nextName} />
          <p className="project-contact">
            {/* TODO(ryker): approve line */}
            <span>
              Like what you see? I&rsquo;m <a href={`mailto:${EMAIL}`}>one email away</a>.
            </span>
            <CopyEmail email={EMAIL} />
          </p>
        </>
      }
    >
      <Body components={text} />
    </ProjectView>
  );
}

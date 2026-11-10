import { CloseCaseStudy } from "@/components/work/CloseCaseStudy";
import { SiteHeader } from "@/components/SiteHeader";
import { ProjectGallery } from "./ProjectGallery";

/**
 * How every project opens, case studies and blog posts alike: the name
 * centered at the top, a strip of all the project's images and videos across
 * the top half, and the write-up underneath, with the title and details in a
 * column beside the text on wider screens. Opened from a card it slides up
 * over the page (CaseStudyOverlay), and the strip slides in from the right.
 * Styles live in globals.css under `.project`.
 */
export function ProjectView({
  title,
  slides,
  head,
  children,
  footer,
}: {
  title: string;
  /** Rendered with `slideComponents` (components/project/slides.tsx). */
  slides: React.ReactNode;
  /** Title, summary and details: the left column on wider screens. */
  head: React.ReactNode;
  /** The write-up, without its images. */
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <article className="project">
      <SiteHeader centered />
      <div className="project-back">
        <CloseCaseStudy />
      </div>
      <ProjectGallery label={`Images from ${title}`}>{slides}</ProjectGallery>
      <div className="project-content">
        <header className="project-head">{head}</header>
        <div className="project-body">{children}</div>
      </div>
      <footer className="project-footer">{footer}</footer>
    </article>
  );
}

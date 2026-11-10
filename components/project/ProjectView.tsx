import { NameAndTime } from "@/components/NameAndTime";
import { ProjectCards } from "@/components/ProjectCards";
import { SiteMenu } from "@/components/SiteMenu";
import { CloseCaseStudy } from "@/components/work/CloseCaseStudy";
import type { ProjectCard } from "@/lib/projects";
import { ProjectGallery } from "./ProjectGallery";

/**
 * How every project opens, case studies and blog posts alike (after Porto
 * Rocha's site). On wider screens the left column holds still: "Show all
 * projects", my name with the date and time, and every project's card, with
 * this one highlighted. The right column scrolls: the project's images and
 * videos on top, then a gray panel with the write-up. Phones get the images
 * and the panel. Styles live in globals.css under `.project`.
 */
export function ProjectView({
  title,
  href,
  cards,
  slides,
  head,
  children,
  footer,
}: {
  title: string;
  /** This project's URL, to highlight its card. */
  href: string;
  cards: ProjectCard[];
  /** Rendered with `slideComponents` (components/project/slides.tsx). */
  slides: React.ReactNode;
  /** Title, summary and details, at the top of the panel. */
  head: React.ReactNode;
  /** The write-up, without its images. */
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <article className="project">
      <aside className="project-side">
        <div className="project-side-bar">
          <CloseCaseStudy />
          <SiteMenu />
        </div>
        <div className="project-side-name">
          <NameAndTime />
        </div>
        <nav aria-label="All projects" className="project-side-cards">
          <ProjectCards items={cards} current={href} scrollSelf />
        </nav>
      </aside>
      <div className="project-main">
        <ProjectGallery label={`Images from ${title}`}>{slides}</ProjectGallery>
        <section className="project-panel">
          <header className="project-head">{head}</header>
          <div className="project-body">{children}</div>
          <footer className="project-footer">{footer}</footer>
        </section>
      </div>
    </article>
  );
}

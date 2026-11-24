import { getPosts } from "@/lib/blog";
import { ABOUT_HEADLINE } from "@/lib/site";
import { CASE_STUDIES, loadCaseStudy } from "@/lib/work";

/** One card in the project list (components/ProjectCards.tsx). */
export type ProjectCard = {
  href: string;
  /** Path under /public: the hero or cover, cropped square for the thumbnail. */
  image: string;
  title: string;
  /** One line under the title. */
  summary: string;
  /** Topics, for the landing page's structured data. */
  tags: string[];
};

/**
 * Every project as a card: the case studies first, in their landing order,
 * then the blog posts, newest first. Used on the landing page and down the
 * left side of every project screen.
 */
export async function getProjectCards(): Promise<ProjectCard[]> {
  const cases = await Promise.all(
    CASE_STUDIES.map(async ({ slug, name }): Promise<ProjectCard | undefined> => {
      const { meta } = await loadCaseStudy(slug);
      const image = meta.hero?.kind === "video" ? meta.hero.poster : meta.hero?.src;
      if (!image) return undefined;
      return { href: `/work/${slug}`, image, title: name, summary: meta.summary, tags: meta.tags ?? [] };
    }),
  );
  const posts = getPosts().map((p) => ({ href: `/blog/${p.slug}`, image: p.cover, title: p.title, summary: p.summary, tags: p.tags }));
  return [...cases.filter((c): c is ProjectCard => !!c), ...posts];
}

/**
 * The About page as a card, for the top of the landing list: the portrait,
 * with the /about headline as its line, so the two never drift apart.
 */
export const ABOUT_CARD: ProjectCard = {
  href: "/about",
  image: "/ryker-marble.webp",
  title: "About me",
  summary: ABOUT_HEADLINE,
  tags: [],
};

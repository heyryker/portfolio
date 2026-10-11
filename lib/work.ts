import type { MDXContent } from "mdx/types";

/** The five case studies, in landing-page order (CLAUDE.md §4). */
export const CASE_STUDIES = [
  { slug: "hackathon", label: "HACKATHON" },
  { slug: "tron", label: "TRON" },
  { slug: "motion", label: "MOTION" },
  { slug: "email", label: "EMAIL" },
  { slug: "editorial", label: "EDITORIAL" },
] as const;

export type CaseStudySlug = (typeof CASE_STUDIES)[number]["slug"];

/**
 * What each MDX file in /content/work exports as `meta`. The copy lives in
 * the MDX so Ryker can edit it without touching components.
 */
export type CaseStudyMeta = {
  title: string;
  /** One line under the title. Also the page's meta description. */
  summary: string;
  role: string;
  client: string;
  year: string;
  /** Full-bleed hero. Leave `src` out to show a marked placeholder. */
  hero?: {
    kind?: "image" | "video";
    src?: string;
    poster?: string;
    alt: string;
  };
};

export function isCaseStudy(slug: string): slug is CaseStudySlug {
  return CASE_STUDIES.some((c) => c.slug === slug);
}

export async function loadCaseStudy(slug: CaseStudySlug) {
  const mod = (await import(`@/content/work/${slug}.mdx`)) as {
    default: MDXContent;
    meta: CaseStudyMeta;
  };
  return { Body: mod.default, meta: mod.meta };
}

/** The case study after this one; the last loops back to the first (§7). */
export function nextCaseStudy(slug: CaseStudySlug) {
  const i = CASE_STUDIES.findIndex((c) => c.slug === slug);
  return CASE_STUDIES[(i + 1) % CASE_STUDIES.length];
}

export function caseStudyLabel(slug: CaseStudySlug) {
  return CASE_STUDIES.find((c) => c.slug === slug)!.label;
}

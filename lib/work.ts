import type { MDXContent } from "mdx/types";

/**
 * The five case studies, in landing-page order (CLAUDE.md §4). `hint` is the
 * kind of work, shown when someone hovers or focuses the landing
 * button, so a stranger knows what's behind a one-word label.
 */
export const CASE_STUDIES = [
  { slug: "hackathon", label: "HACKATHON", hint: "Event identity" },
  { slug: "tron", label: "TRON", hint: "Brand system" },
  { slug: "motion", label: "MOTION", hint: "Video art direction" },
  { slug: "email", label: "EMAIL", hint: "Email campaigns" },
  { slug: "editorial", label: "EDITORIAL", hint: "Editorial report" },
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
  /**
   * Three or four plain points for the "AI summary" button
   * (components/AiSummary.tsx). Written ahead of time from this page's copy;
   * edit freely, but keep them to what the page actually says.
   */
  aiSummary?: string[];
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

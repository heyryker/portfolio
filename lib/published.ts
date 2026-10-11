import { existsSync } from "node:fs";
import path from "node:path";
import { CASE_STUDIES } from "./work";

/**
 * The case studies that have a page yet (content/work/<slug>.mdx), so the
 * sitemap and /llms.txt never point at a 404. Build time only, which is why
 * it lives apart from lib/work.ts (client components import that one).
 */
export function publishedCaseStudies() {
  return CASE_STUDIES.filter(({ slug }) =>
    existsSync(path.join(process.cwd(), "content/work", `${slug}.mdx`)),
  );
}

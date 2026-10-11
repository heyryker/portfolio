import { getPosts } from "@/lib/blog";
import { EDUCATION, EMAIL, EXPERIENCE, PROFILES, RESUME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/site";
import { publishedCaseStudies } from "@/lib/published";

/*
 * /llms.txt (https://llmstxt.org): a plain Markdown summary of the site for
 * answer engines and AI assistants, built from the same data as the pages.
 */

export function GET() {
  const caseStudies = publishedCaseStudies();
  const lines = [
    "# Ryker Marble",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Ryker Marble is a senior brand designer and art director based in Utah who builds brand systems and keeps them working at scale for enterprise SaaS and Web3 teams, and art directs the campaigns, events and videos that bring them to life. Currently a Senior Brand Designer at Lucid Software.",
    "",
    "## Pages",
    "",
    `- [About and contact](${absoluteUrl("/about")}): bio, experience, education and contact details`,
    `- [Resume (PDF)](${absoluteUrl(RESUME)})`,
    `- [Blog](${absoluteUrl("/blog")}): process notes and side projects`,
    `- [Village](${absoluteUrl("/village")}): a playful pixel town where the homepage's five meeples live`,
    "",
    ...(caseStudies.length
      ? [
          "## Case studies",
          "",
          ...caseStudies.map(({ slug, label }) => `- [${label}](${absoluteUrl(`/work/${slug}`)})`),
          "",
        ]
      : []),
    "## Blog posts",
    "",
    ...getPosts().map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}) (${p.date}): ${p.summary}`),
    "",
    "## Experience",
    "",
    ...EXPERIENCE.map(({ role, org, years }) => `- ${role}, ${org} (${years})`),
    "",
    "## Education",
    "",
    `- ${EDUCATION.school}: ${EDUCATION.degrees}`,
    "",
    "## Contact",
    "",
    `- Email: ${EMAIL}`,
    `- LinkedIn: ${PROFILES.linkedin}`,
    `- GitHub: ${PROFILES.github}`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

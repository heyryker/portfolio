import { getPosts } from "@/lib/blog";
import { EDUCATION, EMAIL, EXPERIENCE, PROFILES, RESUME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/site";
import { publishedCaseStudies } from "@/lib/published";
import { loadCaseStudy } from "@/lib/work";
import { caseStudySource, durationSeconds, mediaInSource } from "@/lib/media";

/*
 * /llms.txt (https://llmstxt.org): a plain Markdown summary of the site for
 * answer engines and AI assistants, built from the same data as the pages.
 */

export async function GET() {
  const caseStudies = await Promise.all(
    publishedCaseStudies().map(async (c) => ({ ...c, meta: (await loadCaseStudy(c.slug)).meta })),
  );
  const known = (v: string) => !v.startsWith("TODO");
  // Every video on the site, with the page it sits on, since a model can't
  // watch them and the page copy only hints at what's in each one.
  const videos = [
    ...caseStudies.map((c) => ({ page: `/work/${c.slug}`, videos: mediaInSource(caseStudySource(c.slug)).videos })),
    ...getPosts().map((p) => ({ page: `/blog/${p.slug}`, videos: mediaInSource(p.source).videos })),
  ].flatMap(({ page, videos }) => videos.map((v) => ({ page, ...v })));
  const length = (iso?: string) => {
    const s = durationSeconds(iso);
    return s ? `, ${s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`}` : "";
  };
  const tagList = (tags: readonly string[] | undefined) => (tags?.length ? ` Tags: ${tags.join(", ")}.` : "");
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
    `- [Projects](${absoluteUrl("/")}): the home page lists every case study and blog post as a card`,
    `- [Blog](${absoluteUrl("/blog")}): process notes and side projects`,
    `- [Village](${absoluteUrl("/village")}): a playful pixel town where the site's five meeples live`,
    "",
    ...(caseStudies.length
      ? [
          "## Case studies",
          "",
          ...caseStudies.map(({ slug, area, meta }) => {
            const details = [meta.role, meta.client, meta.year].filter(known).join(", ");
            return `- [${meta.seoTitle ?? meta.title}](${absoluteUrl(`/work/${slug}`)}) (${area}; ${details}): ${meta.summary}${tagList(meta.tags)}`;
          }),
          "",
        ]
      : []),
    ...(videos.length
      ? [
          "## Videos",
          "",
          ...videos.map(
            (v) => `- [${v.title}](${absoluteUrl(v.page)}) (${v.youtubeId ? "YouTube" : "video"}${length(v.duration)}): ${v.description}`,
          ),
          "",
        ]
      : []),
    "## Blog posts",
    "",
    ...getPosts().map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}) (${p.date}): ${p.summary}${tagList(p.tags)}`),
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

import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { RESUME, absoluteUrl } from "@/lib/site";
import { publishedCaseStudies } from "@/lib/published";
import { loadCaseStudy } from "@/lib/work";

/*
 * Every public page. Case studies and posts also list their hero or cover
 * image: for a design portfolio, image search is a real way in.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = getPosts();
  const caseStudies = await Promise.all(
    publishedCaseStudies().map(async ({ slug }) => {
      const { hero } = (await loadCaseStudy(slug)).meta;
      const image = hero?.kind === "video" ? hero.poster : hero?.src;
      return {
        url: absoluteUrl(`/work/${slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.9,
        ...(image && !image.startsWith("TODO") && { images: [absoluteUrl(image)] }),
      };
    }),
  );
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...caseStudies,
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.8, images: [absoluteUrl("/ryker-marble.jpg")] },
    { url: absoluteUrl("/blog"), lastModified: posts[0]?.date, changeFrequency: "monthly", priority: 0.6 },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.5,
      images: [absoluteUrl(post.cover)],
    })),
    { url: absoluteUrl("/village"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl(RESUME), changeFrequency: "yearly", priority: 0.7 },
  ];
}

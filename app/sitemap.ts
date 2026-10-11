import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { RESUME, absoluteUrl } from "@/lib/site";
import { publishedCaseStudies } from "@/lib/published";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...publishedCaseStudies().map(({ slug }) => ({
      url: absoluteUrl(`/work/${slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/blog"), lastModified: posts[0]?.date, changeFrequency: "monthly", priority: 0.6 },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    { url: absoluteUrl("/village"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl(RESUME), changeFrequency: "yearly", priority: 0.7 },
  ];
}

import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { caseStudySource, durationSeconds, mediaInSource, xmlText, type PageVideo } from "@/lib/media";
import { RESUME, absoluteUrl } from "@/lib/site";
import { publishedCaseStudies } from "@/lib/published";
import { loadCaseStudy } from "@/lib/work";

/*
 * Every public page, with every image on it and every video (Google's image
 * and video sitemap extensions). For a design portfolio, image and video
 * search are real ways in, and answer engines use the same lists to find the
 * work. The media come from each page's own MDX (lib/media.ts).
 */

const unique = (urls: (string | undefined)[]) =>
  [...new Set(urls.filter((u): u is string => !!u && !u.startsWith("TODO")))].map((u) => absoluteUrl(u));

function sitemapVideo(video: PageVideo): NonNullable<MetadataRoute.Sitemap[number]["videos"]>[number] | undefined {
  if (!video.poster) return undefined; // Google needs a thumbnail.
  return {
    title: xmlText(video.title),
    description: xmlText(video.description),
    thumbnail_loc: video.poster.startsWith("http") ? video.poster : absoluteUrl(video.poster),
    ...(video.src && { content_loc: absoluteUrl(video.src) }),
    ...(video.youtubeId && { player_loc: `https://www.youtube-nocookie.com/embed/${video.youtubeId}` }),
    ...(durationSeconds(video.duration) && { duration: durationSeconds(video.duration) }),
    ...(video.uploadDate && { publication_date: video.uploadDate }),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = getPosts();
  const caseStudies = await Promise.all(
    publishedCaseStudies().map(async ({ slug }) => {
      const { hero } = (await loadCaseStudy(slug)).meta;
      const { images, videos } = mediaInSource(caseStudySource(slug));
      const heroImage = hero?.kind === "video" ? hero.poster : hero?.src;
      return {
        url: absoluteUrl(`/work/${slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.9,
        images: unique([heroImage, ...images.map((i) => i.src), ...videos.map((v) => v.src && v.poster)]),
        videos: videos.map(sitemapVideo).filter((v) => !!v),
      };
    }),
  );
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...caseStudies,
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.8, images: [absoluteUrl("/ryker-marble.jpg")] },
    { url: absoluteUrl("/blog"), lastModified: posts[0]?.date, changeFrequency: "monthly", priority: 0.6 },
    ...posts.map((post) => {
      const { images, videos } = mediaInSource(post.source);
      return {
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.date,
        changeFrequency: "yearly" as const,
        priority: 0.5,
        images: unique([post.cover, ...images.map((i) => i.src)]),
        videos: videos.map(sitemapVideo).filter((v) => !!v),
      };
    }),
    { url: absoluteUrl("/village"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl(RESUME), changeFrequency: "yearly", priority: 0.7 },
  ];
}

import { readFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl, person } from "./site";

/*
 * Every image and video on a page, read straight from its MDX source, so the
 * structured data, the sitemap and /llms.txt describe the same media the page
 * shows without a second list to keep in sync. Build time only (node:fs).
 *
 * It reads the <Figure>, <Video> and <YouTube> tags the case studies and blog
 * posts already use (components/work/blocks.tsx). Videos can carry extra
 * props that only feed search and answer engines:
 *
 *   title        the video's name (falls back to the caption, then the alt)
 *   description  a sentence or two on what it is and who made it
 *   duration     ISO 8601, e.g. PT25S or PT1M27S (ffprobe gives the seconds)
 *   uploadDate   ISO date it went up on this site
 */

export type PageImage = { src: string; alt: string; caption?: string };
export type PageVideo = {
  /** Self-hosted file, or undefined for a YouTube embed. */
  src?: string;
  youtubeId?: string;
  poster?: string;
  title: string;
  description: string;
  duration?: string;
  uploadDate?: string;
};

const TAG = /<(Figure|Video|YouTube)\b([^>]*?)\/?>/g;
const ATTR = /(\w+)=(?:"([^"]*)"|\{([^}]*)\})/g;

function attributes(raw: string) {
  const out: Record<string, string> = {};
  for (const [, name, quoted, braced] of raw.matchAll(ATTR)) out[name] = quoted ?? braced;
  return out;
}

const known = (v: string | undefined): v is string => !!v && !v.startsWith("TODO");

/** Media in one MDX body, in page order. TODO placeholders are left out. */
export function mediaInSource(source: string) {
  const images: PageImage[] = [];
  const videos: PageVideo[] = [];
  for (const [, tag, raw] of source.matchAll(TAG)) {
    const a = attributes(raw);
    if (tag === "Figure") {
      if (known(a.src) && known(a.alt)) images.push({ src: a.src, alt: a.alt, caption: a.caption });
    } else if (tag === "Video") {
      if (!known(a.src)) continue;
      const title = a.title ?? a.caption ?? a.alt;
      videos.push({
        src: a.src,
        poster: a.poster,
        title,
        description: a.description ?? a.alt ?? title,
        duration: a.duration,
        uploadDate: a.uploadDate,
      });
    } else if (known(a.id)) {
      videos.push({
        youtubeId: a.id,
        poster: `https://i.ytimg.com/vi/${a.id}/hqdefault.jpg`,
        title: a.title ?? a.caption ?? "Video",
        description: a.description ?? a.title ?? a.caption ?? "Video",
        duration: a.duration,
        uploadDate: a.uploadDate,
      });
    }
  }
  return { images, videos };
}

/** The MDX source of a case study, for mediaInSource(). */
export function caseStudySource(slug: string) {
  return readFileSync(path.join(process.cwd(), "content/work", `${slug}.mdx`), "utf8");
}

/** schema.org ImageObject for structured data. */
export function imageObject(image: PageImage) {
  return {
    "@type": "ImageObject",
    contentUrl: absoluteUrl(image.src),
    url: absoluteUrl(image.src),
    description: image.alt,
    ...(image.caption && { caption: image.caption }),
    creator: { "@id": person["@id"] },
    creditText: person.name,
  };
}

/** schema.org VideoObject for structured data (Google's video rich results). */
export function videoObject(video: PageVideo) {
  return {
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    ...(video.poster && { thumbnailUrl: video.poster.startsWith("http") ? video.poster : absoluteUrl(video.poster) }),
    ...(video.src && { contentUrl: absoluteUrl(video.src) }),
    ...(video.youtubeId && {
      embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
      url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    }),
    ...(video.duration && { duration: video.duration }),
    ...(video.uploadDate && { uploadDate: video.uploadDate }),
    creator: { "@id": person["@id"] },
    inLanguage: "en-US",
  };
}

/** Escapes text for the sitemap's XML (Next writes these fields raw). */
export function xmlText(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Seconds from an ISO 8601 duration like PT1M27S, for the video sitemap. */
export function durationSeconds(iso: string | undefined) {
  const m = iso?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return undefined;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

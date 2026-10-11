import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Everything is public, and that includes AI crawlers: being quoted by answer
 * engines (ChatGPT, Perplexity, Claude, Google's AI results) is the point, so
 * none of them are blocked. /llms.txt gives them a plain-text summary.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

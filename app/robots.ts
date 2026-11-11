import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/*
 * Everything is public, and that includes AI crawlers: being quoted by answer
 * engines (ChatGPT, Gemini, Perplexity, Claude, Google's AI results) is the
 * point. `*` already lets them all in; the named ones are listed too so the
 * intent is plain to anyone checking, and so a future rule for `*` can't
 * shut them out by accident. /llms.txt gives them a plain-text summary.
 *
 * Nothing is disallowed. The hidden /chartahealth concept carries its own
 * noindex tag, which crawlers can only see if they're allowed to fetch it.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
  "CCBot",
  "DuckAssistBot",
  "MistralAI-User",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/*
 * Blog posts are MDX files in /content/blog with a small frontmatter block
 * (CLAUDE.md §2). The file name is the URL: content/blog/food-truck.mdx is
 * /blog/food-truck.
 *
 * Reads are synchronous on purpose: they only run at build time (every post
 * is statically generated), and sync reads keep prerendering simple.
 */

const DIR = path.join(process.cwd(), "content/blog");

type PostMeta = {
  slug: string;
  title: string;
  /** ISO date, e.g. 2025-09-02. */
  date: string;
  /** One line for the index and the page's meta description. */
  summary: string;
  /** Path under /public. */
  cover: string;
  coverAlt: string;
  coverWidth: number;
  coverHeight: number;
  /** Shown as [BRACKET] tags. */
  tags: string[];
};

export type Post = PostMeta & { source: string };

/**
 * Parses the frontmatter we use: one `key: value` per line, values optionally
 * quoted, and lists written as [a, b]. Deliberately tiny so there's no YAML
 * dependency; anything fancier belongs in the MDX body.
 */
function parseFrontmatter(raw: string) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!match) throw new Error("Blog post is missing its --- frontmatter --- block");
  const data: Record<string, string | string[]> = {};
  for (const line of match[1].split("\n")) {
    const m = /^(\w+):\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const value = m[2].trim();
    data[m[1]] = value.startsWith("[")
      ? value.slice(1, -1).split(",").map(unquote).filter(Boolean)
      : unquote(value);
  }
  return { data, body: raw.slice(match[0].length) };
}

function unquote(s: string) {
  return s.trim().replace(/^(["'])(.*)\1$/, "$2");
}

function readPost(slug: string): Post {
  const { data, body } = parseFrontmatter(readFileSync(path.join(DIR, `${slug}.mdx`), "utf8"));
  const str = (key: string) => {
    const v = data[key];
    if (typeof v !== "string" || !v) throw new Error(`content/blog/${slug}.mdx needs "${key}"`);
    return v;
  };
  return {
    slug,
    title: str("title"),
    date: str("date"),
    summary: str("summary"),
    cover: str("cover"),
    coverAlt: str("coverAlt"),
    coverWidth: Number(str("coverWidth")),
    coverHeight: Number(str("coverHeight")),
    tags: Array.isArray(data.tags) ? data.tags : [],
    source: body,
  };
}

/** Every post, newest first. */
export function getPosts(): Post[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => readPost(f.replace(/\.mdx$/, "")))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

/** The next older post, looping back to the newest (like the case studies). */
export function nextPost(slug: string) {
  const posts = getPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  return posts.length > 1 ? posts[(i + 1) % posts.length] : undefined;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** 2025-09-02 → SEP 2, 2025 (no Date object, so no time zone surprises). */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

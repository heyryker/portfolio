import type { Metadata } from "next";
import { BlogBrowser, type BlogCard } from "@/components/blog/BlogBrowser";
import { JsonLd } from "@/components/JsonLd";
import { NameAndTime } from "@/components/NameAndTime";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteMenu } from "@/components/SiteMenu";
import { LandingMarker } from "@/components/work/LandingMarker";
import { formatDate, getPosts } from "@/lib/blog";
import { SITE_NAME, SITE_URL, WEBSITE_ID, absoluteUrl, pageKeywords, pageMetadata, person } from "@/lib/site";

/** Every tag, most used first, then alphabetical, with how many posts use it. */
function tagsByUse(posts: { tags: string[] }[]) {
  const counts = new Map<string, number>();
  for (const t of posts.flatMap((p) => p.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const posts = getPosts();
const tagCounts = tagsByUse(posts);
const tags = tagCounts.map(([t]) => t);
// Only tags shared by two or more posts become filter buttons, so the bar
// stays one calm row. The rest still match in search, and a post's own tag
// link (?tag=…) still filters by any of them.
const filterTags = tagCounts.filter(([, n]) => n > 1).map(([t]) => t);

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Process notes from Ryker Marble on event branding, trade show booths, editorial design, design challenges and side projects.",
  path: "/blog",
  keywords: pageKeywords(tags, "Design blog", "Brand design process"),
});

/** SEP 2, 2025 → Sep 2, 2025, to sit with the sans serif cards. */
const sentenceDate = (iso: string) => formatDate(iso).replace(/^(\w)(\w+)/, (_, a, b) => a + b.toLowerCase());

/*
 * The blog, laid out like the landing page: the menu button, my name with
 * the date and time, then the posts as gray cards, here in a grid with a
 * search box and tag filters on top (components/blog/BlogBrowser.tsx).
 * Posts open over this page, like they do from the landing page.
 */
export default function BlogIndex() {
  const cards: BlogCard[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    date: p.date,
    dateLabel: sentenceDate(p.date),
    cover: p.cover,
    coverAlt: p.coverAlt,
    tags: p.tags,
  }));

  return (
    <div className="relative overflow-x-clip">
      <JsonLd
        data={{
          "@type": "Blog",
          "@id": `${absoluteUrl("/blog")}#blog`,
          url: absoluteUrl("/blog"),
          name: `${SITE_NAME}'s blog`,
          keywords: tags.join(", "),
          isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE_URL },
          author: person,
          blogPost: posts.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            url: absoluteUrl(`/blog/${post.slug}`),
            datePublished: post.date,
            image: absoluteUrl(post.cover),
            keywords: post.tags.join(", "),
          })),
        }}
      />
      <header className="landing-top">
        <SiteMenu />
      </header>
      {/* Posts open over this page, so closing one can come back here. */}
      <LandingMarker />
      <main className="blog-page">
        <NameAndTime />
        <h1 className="blog-heading">Blog</h1>
        <p className="blog-intro">Process notes, side projects and the occasional food truck.</p>
        <BlogBrowser posts={cards} tags={filterTags} allTags={tags} />
      </main>
      <SiteFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { JsonLd } from "@/components/JsonLd";
import { formatDate, getPosts } from "@/lib/blog";
import { SITE_URL, WEBSITE_ID, absoluteUrl, pageMetadata, person } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Process notes from Ryker Marble: a TRON design challenge and a food truck that only exists on paper.",
  path: "/blog",
});

export default function BlogIndex() {
  const posts = getPosts();
  return (
    <div className="min-h-svh">
      <JsonLd
        data={{
          "@type": "Blog",
          url: absoluteUrl("/blog"),
          name: "Ryker Marble's blog",
          isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE_URL },
          author: person,
          blogPost: posts.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            url: absoluteUrl(`/blog/${post.slug}`),
            datePublished: post.date,
          })),
        }}
      />
      <BlogHeader back={{ href: "/", label: "BACK" }} />

      <main className="mx-auto max-w-[968px] px-[22px] pt-11 pb-22 md:px-11">
        <p className="text-sm tracking-[0.08em] text-accent uppercase">[BLOG]</p>
        <h1 className="mt-5 text-[clamp(32px,5.2vw,56px)] leading-[1.05] font-extrabold tracking-[-0.015em] text-balance">
          {/* TODO(ryker): approve line */}
          Process, side projects and the occasional food truck.
        </h1>

        <ol className="mt-11 divide-y divide-grid border-y border-grid">
          {posts.map((post, i) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group grid gap-x-6 gap-y-4 py-[22px] sm:grid-cols-[264px_1fr]"
              >
                <div className="relative aspect-[4/3] overflow-hidden border border-grid">
                  <Image
                    src={post.cover}
                    alt={post.coverAlt}
                    fill
                    sizes="(min-width: 640px) 264px, 100vw"
                    priority={i < 2}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
                <div>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-pixel text-xs leading-[22px] text-muted">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    {post.tags.map((tag) => (
                      <span key={tag}>[{tag.toUpperCase()}]</span>
                    ))}
                  </p>
                  <h2 className="mt-2 text-2xl leading-tight font-extrabold tracking-[-0.01em] text-balance transition-colors group-hover:text-accent group-focus-visible:text-accent">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-lg leading-relaxed">{post.summary}</p>
                  <p aria-hidden="true" className="mt-3 text-sm tracking-[0.08em] text-muted uppercase transition-colors group-hover:text-accent">
                    [READ &rarr;]
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>

        {/* TODO(ryker): approve line */}
        <p className="mt-22 font-pixel text-xs text-muted">
          Designed by Ryker. Animated by five very small coworkers.
        </p>
      </main>
    </div>
  );
}

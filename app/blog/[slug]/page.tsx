import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiSummary } from "@/components/AiSummary";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { PostBody } from "@/components/blog/PostBody";
import { CopyEmail } from "@/components/CopyEmail";
import { JsonLd } from "@/components/JsonLd";
import { formatDate, getPost, getPosts, nextPost } from "@/lib/blog";
import { EMAIL, SITE_NAME, SITE_URL, WEBSITE_ID, absoluteUrl, pageMetadata, person } from "@/lib/site";

export function generateStaticParams() {
  return getPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const meta = pageMetadata({
    title: post.title,
    description: post.summary,
    path: `/blog/${post.slug}`,
    openGraph: {
      type: "article",
      publishedTime: post.date,
      authors: [SITE_URL],
      tags: post.tags,
      images: [{ url: post.cover, width: post.coverWidth, height: post.coverHeight, alt: post.coverAlt }],
    },
  });
  return { ...meta, twitter: { ...meta.twitter, images: [{ url: post.cover, alt: post.coverAlt }] } };
}

export default async function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const next = nextPost(slug);
  const url = absoluteUrl(`/blog/${slug}`);

  return (
    <div className="min-h-svh">
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "BlogPosting",
              "@id": `${url}#post`,
              mainEntityOfPage: url,
              url,
              headline: post.title,
              description: post.summary,
              datePublished: post.date,
              image: absoluteUrl(post.cover),
              keywords: post.tags.join(", "),
              inLanguage: "en-US",
              author: person,
              publisher: { "@id": person["@id"] },
              isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE_URL },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
                { "@type": "ListItem", position: 3, name: post.title, item: url },
              ],
            },
          ],
        }}
      />
      <BlogHeader back={{ href: "/blog", label: "BLOG" }} />

      <main className="mx-auto max-w-[968px] px-[22px] pt-11 pb-22 md:px-11">
        <article>
          <header>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-pixel text-xs leading-[22px] text-muted">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.tags.map((tag) => (
                <span key={tag}>[{tag.toUpperCase()}]</span>
              ))}
            </p>
            <h1 className="mt-4 text-[clamp(32px,5.2vw,56px)] leading-[1.05] font-extrabold tracking-[-0.015em] text-balance">
              {post.title}
            </h1>
            <p className="mt-5 max-w-[660px] text-xl leading-relaxed text-ink-soft">{post.summary}</p>
            {post.aiSummary.length > 0 && (
              <div className="mt-6">
                <AiSummary points={post.aiSummary} />
              </div>
            )}
            <Image
              src={post.cover}
              alt={post.coverAlt}
              width={post.coverWidth}
              height={post.coverHeight}
              priority
              sizes="(min-width: 1056px) 968px, 100vw"
              className="mt-11 h-auto w-full border border-grid"
            />
          </header>

          <div className="mt-11">
            <PostBody source={post.source} />
          </div>
        </article>

        <footer className="mt-22 border-t border-grid pt-11">
          {next && (
            <Link href={`/blog/${next.slug}`} className="group block">
              <span className="text-sm tracking-[0.08em] text-muted uppercase">[NEXT POST]</span>
              <span className="mt-2 block text-[clamp(24px,3vw,32px)] leading-tight font-extrabold text-balance transition-colors group-hover:text-accent group-focus-visible:text-accent">
                {next.title} &rarr;
              </span>
            </Link>
          )}
          {/* TODO(ryker): approve line */}
          <p className="mt-11 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg">
            <span>
              Like what you see? I&rsquo;m{" "}
              <a
                href={`mailto:${EMAIL}`}
                className="underline decoration-grid underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:text-accent"
              >
                one email away
              </a>
              .
            </span>
            <CopyEmail email={EMAIL} />
          </p>
          <p className="mt-22 font-pixel text-xs text-muted">
            Designed by Ryker. Animated by five very small coworkers.
          </p>
        </footer>
      </main>
    </div>
  );
}

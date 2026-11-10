import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPost } from "@/components/blog/BlogPost";
import { JsonLd } from "@/components/JsonLd";
import { WipeOnLeave } from "@/components/work/WipeOnLeave";
import { getPost, getPosts } from "@/lib/blog";
import { SITE_NAME, SITE_URL, WEBSITE_ID, absoluteUrl, pageKeywords, pageMetadata, person } from "@/lib/site";

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
    keywords: pageKeywords(post.tags),
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

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const url = absoluteUrl(`/blog/${slug}`);

  return (
    <>
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
              about: post.tags.map((name) => ({ "@type": "Thing", name })),
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
      <WipeOnLeave>
        <BlogPost post={post} />
      </WipeOnLeave>
    </>
  );
}

import { notFound } from "next/navigation";
import { BlogPost } from "@/components/blog/BlogPost";
import { CaseStudyOverlay } from "@/components/work/CaseStudyOverlay";
import { getPost, getPosts } from "@/lib/blog";

/*
 * A blog post opened from inside the site (a landing-page card, the blog
 * index): it slides up over the current page like a case study does, while
 * the URL changes to /blog/<slug>. A direct visit renders app/blog/[slug].
 */

export function generateStaticParams() {
  return getPosts().map(({ slug }) => ({ slug }));
}

export default async function BlogPostOverlayPage({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return (
    <CaseStudyOverlay title={post.title}>
      <BlogPost post={post} />
    </CaseStudyOverlay>
  );
}

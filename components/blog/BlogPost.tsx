import { AiSummary } from "@/components/AiSummary";
import { CopyEmail } from "@/components/CopyEmail";
import { TagPills } from "@/components/TagPills";
import { getProjectCards } from "@/lib/projects";
import { ProjectView } from "@/components/project/ProjectView";
import { ImageSlide } from "@/components/project/slides";
import { NextProjectLink } from "@/components/work/NextProjectLink";
import { formatDate, nextPost, type Post } from "@/lib/blog";
import { EMAIL } from "@/lib/site";
import { PostBody } from "./PostBody";

/**
 * A blog post in the project view, like the case studies: the cover and every
 * figure in the strip on top, the date, title and write-up underneath. Used
 * on the post's own URL and in the overlay that slides up from a card.
 */
export async function BlogPost({ post }: { post: Post }) {
  const cards = await getProjectCards();
  const next = nextPost(post.slug);
  return (
    <ProjectView
      href={`/blog/${post.slug}`}
      cards={cards}
      title={post.title}
      slides={
        <>
          <ImageSlide
            src={post.cover}
            alt={post.coverAlt}
            width={post.coverWidth}
            height={post.coverHeight}
            priority
          />
          <PostBody source={post.source} part="slides" />
        </>
      }
      head={
        <>
          <p className="project-eyebrow">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </p>
          <h1 className="project-title">{post.title}</h1>
          <p className="project-summary">{post.summary}</p>
          {post.tags.length > 0 && (
            <dl className="project-meta">
              <div>
                <dt>Tags</dt>
                <dd>
                  <TagPills tags={post.tags} link />
                </dd>
              </div>
            </dl>
          )}
          {post.aiSummary.length > 0 && (
            <div className="mt-6">
              <AiSummary points={post.aiSummary} />
            </div>
          )}
        </>
      }
      footer={
        <>
          {next && <NextProjectLink href={`/blog/${next.slug}`} label={next.title} kicker="Next post" />}
          <p className="project-contact">
            {/* TODO(ryker): approve line */}
            <span>
              Like what you see? I&rsquo;m <a href={`mailto:${EMAIL}`}>one email away</a>.
            </span>
            <CopyEmail email={EMAIL} />
          </p>
        </>
      }
    >
      <PostBody source={post.source} part="text" />
    </ProjectView>
  );
}

import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import { Fragment } from "react";
import { LazyVideo } from "@/components/work/LazyVideo";
import { Placeholder } from "@/components/work/Placeholder";

/*
 * The top half of a project view (components/project/ProjectView.tsx) is a
 * strip of every image and video in the project, in the order the MDX lists
 * them. Rather than keeping a second list of assets in sync by hand, the same
 * MDX body is rendered twice: once with `slideComponents`, where the media
 * blocks become slides and all the text renders as nothing, and once with
 * the text components and the media blocks left out (see `withoutMedia`).
 */

type SlideProps = {
  src?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

function Caption({ children }: { children?: React.ReactNode }) {
  return <figcaption className="project-slide-caption">{children}</figcaption>;
}

/** One image in the strip, at the strip's height and its own width. */
export function ImageSlide({ src, alt, caption, width = 2400, height = 1350, priority }: SlideProps & { priority?: boolean }) {
  return (
    <figure className="project-slide">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          // The strip is at most ~62% of the screen tall, so even wide images
          // rarely need more than the screen's width.
          sizes="(min-width: 768px) 90vw, 100vw"
          className="project-slide-media"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      ) : (
        <Placeholder label={alt.replace(/^TODO\(ryker\):\s*/i, "")} className="project-slide-media aspect-[4/3]" />
      )}
      <Caption>{caption}</Caption>
    </figure>
  );
}

function VideoSlide({ src, poster, alt, caption }: SlideProps & { poster?: string }) {
  return (
    <figure className="project-slide">
      {src ? (
        <div className="project-slide-media project-slide-video">
          <LazyVideo src={src} poster={poster} alt={alt} className="h-full w-full object-cover" />
        </div>
      ) : (
        <Placeholder label={alt.replace(/^TODO\(ryker\):\s*/i, "")} className="project-slide-media aspect-video" />
      )}
      <Caption>{caption}</Caption>
    </figure>
  );
}

function YouTubeSlide({ id, title, caption }: { id: string; title: string; caption?: string }) {
  return (
    <figure className="project-slide">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="project-slide-media aspect-video border-0 bg-ink"
      />
      <Caption>{caption}</Caption>
    </figure>
  );
}

const nothing = () => null;
const passThrough = ({ children }: { children?: React.ReactNode }) => <Fragment>{children}</Fragment>;

/** MDX components for the strip: media become slides, text disappears. */
export const slideComponents: MDXComponents = {
  h1: nothing,
  h2: nothing,
  h3: nothing,
  h4: nothing,
  h5: nothing,
  h6: nothing,
  p: nothing,
  ul: nothing,
  ol: nothing,
  blockquote: nothing,
  hr: nothing,
  pre: nothing,
  table: nothing,
  Figure: ImageSlide,
  Video: VideoSlide,
  YouTube: YouTubeSlide,
  // Groups of figures (case study pairs, blog galleries) just add their
  // figures to the strip.
  Pair: passThrough,
  Gallery: passThrough,
  Results: nothing,
  Todo: nothing,
};

/** MDX components for the text half: the media blocks are in the strip. */
export function withoutMedia(components: MDXComponents): MDXComponents {
  return { ...components, Figure: nothing, Video: nothing, YouTube: nothing, Pair: nothing, Gallery: nothing };
}

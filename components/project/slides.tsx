import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import { Fragment } from "react";
import { LazyVideo } from "@/components/work/LazyVideo";
import { Placeholder } from "@/components/work/Placeholder";

/*
 * The top of a project screen (components/project/ProjectView.tsx) shows
 * every image and video in the project, one at a time, in the order the MDX lists
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
  /**
   * "contain" shows the whole image inside the frame on the gray card
   * instead of cropping it to 16:10. For images far from 16:10, like a
   * wide banner, where full bleed would cut off most of the piece.
   */
  fit?: "cover" | "contain";
};

function Caption({ children }: { children?: React.ReactNode }) {
  return <figcaption className="project-slide-caption">{children}</figcaption>;
}

/** One image in the gallery, filling the gallery's frame. */
export function ImageSlide({
  src,
  alt,
  caption,
  width = 2400,
  height = 1350,
  fit = "cover",
  priority,
}: SlideProps & { priority?: boolean }) {
  return (
    <figure className="project-slide">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          // The right column is 60% of a wide screen, all of a phone's.
          sizes="(min-width: 1024px) 60vw, 100vw"
          className={`project-slide-media${fit === "contain" ? " project-slide-contain" : ""}`}
        />
      ) : (
        <Placeholder label={alt.replace(/^TODO\(ryker\):\s*/i, "")} className="project-slide-media" />
      )}
      <Caption>{caption}</Caption>
    </figure>
  );
}

/**
 * A blog gallery with `slide="row"` becomes one slide with its figures side
 * by side, whole, rather than one tall phone story per slide cropped to 16:10.
 */
function GallerySlide({ children, slide }: { children?: React.ReactNode; slide?: "row" }) {
  if (slide !== "row") return <Fragment>{children}</Fragment>;
  return <div className="project-slide project-slide-row">{children}</div>;
}

function VideoSlide({ src, poster, alt, caption }: SlideProps & { poster?: string }) {
  return (
    <figure className="project-slide">
      {src ? (
        <div className="project-slide-media project-slide-video">
          <LazyVideo src={src} poster={poster} alt={alt} className="h-full w-full object-cover" />
        </div>
      ) : (
        <Placeholder label={alt.replace(/^TODO\(ryker\):\s*/i, "")} className="project-slide-media" />
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
        className="project-slide-media border-0"
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
  Gallery: GallerySlide,
  Results: nothing,
  Todo: nothing,
};

/** MDX components for the text half: the media blocks are in the strip. */
export function withoutMedia(components: MDXComponents): MDXComponents {
  return { ...components, Figure: nothing, Video: nothing, YouTube: nothing, Pair: nothing, Gallery: nothing };
}

import { evaluate } from "@mdx-js/mdx";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import * as runtime from "react/jsx-runtime";
import { slideComponents, withoutMedia } from "@/components/project/slides";

/*
 * Renders a post's MDX at build time. Text sits in a readable column; figures
 * can run a little wider than the text so the work does the talking.
 *
 * Uses @mdx-js/mdx directly rather than @next/mdx so the blog doesn't need a
 * root mdx-components.tsx (the case studies set that up separately).
 */

const link =
  "underline decoration-grid underline-offset-4 transition-colors hover:marker focus-visible:marker";

type FigureProps = {
  /** Path under /public. */
  src: string;
  /** Required. Use "TODO(ryker): …" when unknown. */
  alt: string;
  width: number;
  height: number;
  caption?: string;
  /** Keep a tall image at the text column's width so it doesn't fill several screens. */
  narrow?: boolean;
};

/** An image at the full width of the post, with an optional caption. */
function Figure({ src, alt, width, height, caption, narrow }: FigureProps) {
  return (
    <figure className={`my-11 [.blog-gallery_&]:my-0 ${narrow ? "max-w-[660px]" : ""}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={narrow ? "660px" : "(min-width: 1056px) 968px, 100vw"}
        className="h-auto w-full border border-grid"
      />
      {caption && <figcaption className="mt-3 text-sm leading-[22px] text-muted">{caption}</figcaption>}
    </figure>
  );
}

/**
 * Several figures in a two-column grid (one column on phones). `cols={4}` is
 * for small tall pieces like phone stories: two across on phones, four on wider screens.
 * `cols={3}` is for a set of three phone-sized pieces: one column on phones, three on wider screens.
 */
const GALLERY_GRID = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" } as const;

function Gallery({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const grid = GALLERY_GRID[cols];
  return <div className={`blog-gallery my-11 grid gap-[22px] ${grid}`}>{children}</div>;
}

const components: MDXComponents = {
  h2: (props) => (
    <h2 className="mt-16 mb-4 max-w-[660px] text-2xl leading-tight font-extrabold tracking-[-0.01em]" {...props} />
  ),
  h3: (props) => <h3 className="mt-11 mb-3 max-w-[660px] text-xl leading-snug font-bold" {...props} />,
  p: (props) => <p className="my-4 max-w-[660px] text-lg leading-relaxed" {...props} />,
  // Plain round bullets (the yellow pixel squares came out in 2026-11).
  ul: (props) => (
    <ul className="my-4 max-w-[660px] list-disc space-y-2 pl-5 text-lg leading-relaxed marker:text-muted" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-11 max-w-[660px] border-l-[6px] border-accent pl-5 text-xl leading-snug font-semibold [&_p]:m-0 [&_p]:text-xl [&_p]:leading-snug"
      {...props}
    />
  ),
  a: (props) => <a className={link} {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  Figure,
  Gallery,
};

/**
 * `part="text"` renders the write-up without its images, and `part="slides"`
 * only the images, as slides for the project view's strip
 * (components/project/slides.tsx).
 */
export async function PostBody({ source, part }: { source: string; part?: "text" | "slides" }) {
  const { default: Content } = await evaluate(source, { ...runtime });
  const use = part === "slides" ? slideComponents : part === "text" ? withoutMedia(components) : components;
  return <Content components={use} />;
}

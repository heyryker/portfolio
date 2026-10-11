import type { MDXComponents } from "mdx/types";
import { Figure, Pair, Results, SectionLabel, Todo, Video } from "@/components/work/blocks";

/*
 * How MDX renders across the site (required by @next/mdx). Text elements sit
 * in the narrow `.case-col` column; the custom blocks (Figure, Video, …) can
 * run full-bleed.
 */
const components: MDXComponents = {
  h2: SectionLabel,
  h3: (props) => <h3 className="case-col mt-11 mb-3 text-xl leading-[22px] font-bold" {...props} />,
  p: (props) => <p className="case-col my-4 max-w-[660px] text-lg leading-relaxed" {...props} />,
  ul: (props) => <ul className="case-col my-4 max-w-[660px] space-y-2 text-lg leading-relaxed" {...props} />,
  ol: (props) => <ol className="case-col my-4 max-w-[660px] list-decimal space-y-2 pl-6 text-lg leading-relaxed" {...props} />,
  li: (props) => (
    <li className="relative pl-5 [ol_&]:pl-1" {...props}>
      {/* A pixel-square bullet (§3). */}
      <span aria-hidden="true" className="absolute top-[0.7em] left-0 size-[6px] bg-accent [ol_&]:hidden" />
      {props.children}
    </li>
  ),
  blockquote: (props) => (
    <blockquote className="case-col my-11 text-[clamp(24px,3vw,32px)] leading-tight font-extrabold [&_p]:m-0 [&_p]:p-0" {...props} />
  ),
  a: (props) => (
    <a
      className="underline decoration-grid underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:text-accent"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  Figure,
  Video,
  Pair,
  Results,
  Todo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

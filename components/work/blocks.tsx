import Image from "next/image";
import { PixelSquare } from "@/components/PixelSquare";
import { LazyVideo } from "./LazyVideo";
import { Placeholder } from "./Placeholder";

/*
 * Building blocks for the case-study MDX files (registered in
 * mdx-components.tsx, so the MDX can use them without imports). The layout is
 * visual-first: figures run full-bleed and text stays in a narrow column that
 * starts on a grid line (`.case-col` in globals.css).
 */

type Media = {
  /** Path under /public. Leave out to show a marked placeholder. */
  src?: string;
  /** Required. Use "TODO(ryker): …" when unknown. */
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

function Caption({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <figcaption className="case-col mt-3 text-sm leading-[22px] text-muted">{children}</figcaption>
  );
}

/**
 * A full-bleed image with a short caption. `narrow` keeps a tall image in the
 * text column instead, so it doesn't fill several screens.
 */
export function Figure({ src, alt, caption, width = 2400, height = 1350, narrow }: Media & { narrow?: boolean }) {
  return (
    <figure className="my-11">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={narrow ? "880px" : "100vw"}
          className={narrow ? "case-col block h-auto w-auto" : "h-auto w-full"}
        />
      ) : (
        <Placeholder label={alt.replace(/^TODO\(ryker\):\s*/i, "")} className="h-[calc(var(--grid-cell)*12)]" />
      )}
      <Caption>{caption}</Caption>
    </figure>
  );
}

/** A full-bleed, muted, looping video. Lazy: it only loads once near the screen. */
export function Video({ src, poster, alt, caption }: Media & { poster?: string }) {
  return (
    <figure className="my-11">
      {src ? (
        <LazyVideo src={src} poster={poster} alt={alt} className="h-auto w-full" />
      ) : (
        <Placeholder label={alt.replace(/^TODO\(ryker\):\s*/i, "")} className="h-[calc(var(--grid-cell)*12)]" />
      )}
      <Caption>{caption}</Caption>
    </figure>
  );
}

/**
 * A YouTube video for work with sound worth hearing, so it doesn't autoplay.
 * Uses the no-cookie player and only loads the iframe when it scrolls near.
 */
export function YouTube({ id, title, caption }: { id: string; title: string; caption?: string }) {
  return (
    <figure className="my-11">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="block aspect-video h-auto w-full border-0 bg-ink"
      />
      <Caption>{caption}</Caption>
    </figure>
  );
}

/** Two visuals side by side (stacked on phones), e.g. a before and after. */
export function Pair({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <figure className="my-11">
      <div className="grid gap-[22px] md:grid-cols-2 [&_figure]:my-0">{children}</div>
      <Caption>{caption}</Caption>
    </figure>
  );
}

/**
 * The optional results band (§7). Only for real numbers: never invent one.
 * A value of "TODO" renders as a marked gap instead of a number.
 */
export function Results({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section aria-label="Results" className="bg-graph my-11 border-y border-grid py-11">
      <dl className="case-col grid gap-x-11 gap-y-[22px] sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ value, label }) => (
          <div key={value + label}>
            <dt className="sr-only">{label}</dt>
            <dd>
              <span className="block text-[clamp(44px,6vw,66px)] leading-[66px] font-extrabold tracking-[-0.02em]">
                {value}
              </span>
              <span className="mt-1 block text-sm leading-[22px] text-muted">{label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** "## Process" in MDX renders as a bracketed label: [PROCESS]. */
export function SectionLabel({ children }: { children?: React.ReactNode }) {
  return (
    <h2 className="case-col mt-22 mb-3 flex h-11 items-center gap-3 text-sm tracking-[0.08em] text-muted uppercase">
      <PixelSquare className="size-[7px]" />[{children}]
    </h2>
  );
}

/** A note for Ryker that shows on the page until it's filled in. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p className="case-col my-4 font-pixel text-xs leading-[22px] text-accent uppercase">
      TODO(ryker): {children}
    </p>
  );
}

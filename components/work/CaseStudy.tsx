import Image from "next/image";
import { AiSummary } from "@/components/AiSummary";
import { CopyEmail } from "@/components/CopyEmail";
import { Meeple } from "@/components/Meeple";
import { PixelSquare } from "@/components/PixelSquare";
import { PixelGarden } from "@/components/PixelGarden";
import { SiteHeader } from "@/components/SiteHeader";
import { caseStudyLabel, loadCaseStudy, nextCaseStudy, type CaseStudySlug } from "@/lib/work";
import { CloseCaseStudy } from "./CloseCaseStudy";
import { NextProjectLink } from "./NextProjectLink";
import { Placeholder } from "./Placeholder";

const EMAIL = "rykermarble@gmail.com";

/**
 * The visual-first case-study template (CLAUDE.md §7): hero, title and
 * metadata, the MDX body (mostly full-bleed visuals), then the next project
 * and a contact line. The same template renders on a case study's own URL and
 * in the overlay that wipes up over the landing page.
 */
export async function CaseStudy({ slug }: { slug: CaseStudySlug }) {
  const { Body, meta } = await loadCaseStudy(slug);
  const next = nextCaseStudy(slug);
  const { hero } = meta;

  return (
    <article className="min-h-svh bg-bg">
      {/* The header band, matching About and the blog: a strip of pixel grass. */}
      <div className="bg-graph relative h-[calc(var(--grid-cell)*6)] md:h-[calc(var(--grid-cell)*3)]">
        <PixelGarden />
        <SiteHeader />
        <div className="absolute flex top-[34px] left-[66px] md:top-[33px] md:left-[88px]">
          <CloseCaseStudy />
        </div>
        {/* Sits just above the grass. */}
        <p className="absolute right-[22px] bottom-[17px] flex h-11 items-center gap-3 text-sm tracking-[0.08em] text-accent uppercase max-md:hidden md:right-[88px]">
          <PixelSquare className="size-[7px]" />[{caseStudyLabel(slug)}]
        </p>
      </div>

      {/* Hero: a full-bleed image or muted video loop. */}
      {hero?.src ? (
        hero.kind === "video" ? (
          <video
            src={hero.src}
            poster={hero.poster}
            aria-label={hero.alt}
            autoPlay
            muted
            loop
            playsInline
            className="h-[calc(var(--grid-cell)*14)] w-full object-cover"
          />
        ) : (
          <Image
            src={hero.src}
            alt={hero.alt}
            width={2400}
            height={1350}
            priority
            sizes="100vw"
            className="h-[calc(var(--grid-cell)*14)] w-full object-cover"
          />
        )
      ) : (
        <Placeholder
          label={hero?.alt.replace(/^TODO\(ryker\):\s*/i, "") ?? "hero image or video loop"}
          className="h-[calc(var(--grid-cell)*14)]"
        />
      )}

      <header className="pt-11">
        <h1 className="case-col text-[clamp(32px,5.2vw,56px)] leading-[1.05] font-extrabold tracking-[-0.015em] text-balance">
          {meta.title}
        </h1>
        <p className="case-col mt-5 max-w-[660px] text-xl leading-snug text-balance">{meta.summary}</p>
        {meta.aiSummary && (
          <div className="case-col mt-6">
            <AiSummary points={meta.aiSummary} />
          </div>
        )}
        <dl className="case-col mt-11 flex flex-wrap gap-x-11 gap-y-3 border-y border-grid py-3">
          {(
            [
              ["ROLE", meta.role],
              ["CLIENT", meta.client],
              ["YEAR", meta.year],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-3">
              <dt className="text-sm tracking-[0.08em] text-muted uppercase">[{label}]</dt>
              <dd className={value.startsWith("TODO") ? "font-pixel text-xs text-accent uppercase" : ""}>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="pb-11">
        <Body />
      </div>

      {/* End of page: the next project, then a way to get in touch (§7). */}
      <footer className="bg-graph border-t border-grid">
        <div className="case-col py-11">
          <NextProjectLink slug={next.slug} label={next.label} />

          <div className="mt-11 flex flex-wrap items-center gap-x-4 gap-y-2 bg-bg py-1 text-lg">
            {/* TODO(ryker): approve line */}
            <span>Like what you see? I&rsquo;m one email away.</span>
            <a
              href={`mailto:${EMAIL}`}
              className="underline decoration-grid underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:text-accent"
            >
              {EMAIL}
            </a>
            <CopyEmail email={EMAIL} />
          </div>

          <div className="mt-11 flex items-end justify-between gap-4">
            {/* TODO(ryker): approve line */}
            <p className="bg-bg font-pixel text-xs text-muted">
              Designed by Ryker. Animated by five very small coworkers.
            </p>
            <span aria-hidden="true" className="flex items-end gap-[11px]">
              <Meeple color="var(--color-meeple-yellow)" />
              <Meeple color="var(--color-meeple-green)" />
            </span>
          </div>
        </div>
      </footer>
    </article>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * The band at the top of the blog pages, matching About: the header and a
 * back link. (The pixel grass and meeple came out in 2026-11.)
 */
export function BlogHeader({ back }: { back: { href: string; label: string } }) {
  return (
    <div className="bg-graph relative h-[calc(var(--grid-cell)*6)] md:h-[calc(var(--grid-cell)*3)]">
      <SiteHeader />
      <Link
        href={back.href}
        className="absolute -mx-2 -my-1 bg-bg px-2 py-1 top-[34px] left-[200px] text-sm tracking-[0.08em] text-muted uppercase transition-colors hover:text-ink focus-visible:text-ink md:top-[33px] md:left-[236px]"
      >
        [&larr; {back.label}]
      </Link>
    </div>
  );
}

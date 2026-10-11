import Link from "next/link";
import { Meeple } from "@/components/Meeple";
import { PixelGarden } from "@/components/PixelGarden";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * The band at the top of the blog pages, matching About: a meeple peeking out
 * of a strip of pixel grass and flowers.
 */
export function BlogHeader({ back }: { back: { href: string; label: string } }) {
  return (
    <div className="bg-graph relative h-[calc(var(--grid-cell)*6)] md:h-[calc(var(--grid-cell)*3)]">
      <SiteHeader />
      <Link
        href={back.href}
        className="absolute -mx-2 -my-1 bg-bg px-2 py-1 top-[34px] left-[66px] text-sm tracking-[0.08em] text-muted uppercase transition-colors hover:text-ink focus-visible:text-ink md:top-[33px] md:left-[88px]"
      >
        [&larr; {back.label}]
      </Link>
      <PixelGarden />
      {/* The yellow one reads everything first. */}
      <div aria-hidden="true" className="absolute right-[88px] bottom-0 flex items-end overflow-hidden max-md:right-[110px]">
        <Meeple color="var(--color-meeple-yellow)" className="translate-y-[11px]" />
      </div>
    </div>
  );
}

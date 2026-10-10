import Link from "next/link";
import { CASE_STUDIES } from "@/lib/work";

/** The five bracketed case-study links along the bottom of the landing page. */
export function CaseStudyNav() {
  return (
    <nav
      aria-label="Case studies"
      className="absolute inset-x-0 bottom-[clamp(24px,9.5vh,104px)] z-10 px-6 md:px-[9%]"
    >
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 md:flex-nowrap md:justify-between">
        {CASE_STUDIES.map(({ slug, label }) => (
          <li key={slug}>
            <Link
              href={`/work/${slug}`}
              className="block py-2 text-[clamp(13px,1.5vw,22px)] leading-none font-normal tracking-[0.02em] text-muted uppercase transition-colors duration-200 hover:text-ink focus-visible:text-ink"
            >
              [{label}]
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

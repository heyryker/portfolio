import Link from "next/link";
import { CASE_STUDIES } from "@/lib/work";

/**
 * The five bracketed case-study links along the bottom of the landing page.
 * Each label starts on a vertical grid line and is centered in a grid row;
 * the column widths and placement live in globals.css under `.case-nav`.
 * Like the headline's blue elements, each label is tinted by a meeple that
 * crosses it.
 */
export function CaseStudyNav() {
  return (
    <nav aria-label="Case studies" className="case-nav">
      <ul>
        {CASE_STUDIES.map(({ slug, label }) => (
          <li key={slug}>
            <Link
              href={`/work/${slug}`}
              // The padding and matching negative margin keep a comfortable tap
              // target without moving the label off the grid.
              className="case-nav-link -my-3 block py-3 leading-none font-normal tracking-[0.02em] whitespace-nowrap text-muted uppercase transition-colors duration-200 hover:text-ink focus-visible:text-ink"
            >
              {/* Takes on a meeple's color while one walks over it (lib/meeple-engine.ts). */}
              <span data-meeple-tint="text" className="transition-colors duration-200">
                [{label}]
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

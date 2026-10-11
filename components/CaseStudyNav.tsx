import Link from "next/link";
import { CASE_STUDIES } from "@/lib/work";

/**
 * The five case-study buttons along the bottom of the landing page, each one
 * filling a grid row; the spacing and placement live in globals.css under
 * `.case-nav`.
 * Like the headline's blue elements, each button is tinted by a meeple that
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
              // Takes on a meeple's color, outline and all, while one walks
              // over it (lib/meeple-engine.ts).
              data-meeple-tint="text"
              className="landing-button"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

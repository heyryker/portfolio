import Link from "next/link";
import { CASE_STUDIES } from "@/lib/work";

/**
 * The five case-study buttons along the bottom of the landing page, each one
 * filling a grid row; the spacing and placement live in globals.css under
 * `.case-nav`.
 * Like the headline's blue elements, each button is tinted by a meeple that
 * crosses it.
 *
 * Hovering or focusing a button shows a small hint above it: the kind of
 * work. Screen readers get the same line as the link's
 * description.
 */
export function CaseStudyNav() {
  return (
    <nav aria-label="Case studies" className="case-nav">
      <ul>
        {CASE_STUDIES.map(({ slug, label, hint }) => (
          <li key={slug} className="case-nav-item">
            <Link
              href={`/work/${slug}`}
              aria-describedby={`case-hint-${slug}`}
              // Takes on a meeple's color, outline and all, while one walks
              // over it (lib/meeple-engine.ts).
              data-meeple-tint="text"
              className="landing-button"
            >
              {label}
            </Link>
            <span id={`case-hint-${slug}`} aria-hidden="true" className="case-hint">
              {hint}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

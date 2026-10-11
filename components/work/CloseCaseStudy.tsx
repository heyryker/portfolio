"use client";

import Link from "next/link";
import { useCaseStudyOverlay } from "./CaseStudyOverlay";

const className =
  "-mx-2 -my-1 inline-block cursor-pointer bg-bg px-2 py-1 text-sm tracking-[0.08em] text-muted uppercase transition-colors hover:text-ink focus-visible:text-ink";

/**
 * [← BACK]: wipes the case study down to whatever is underneath. On a case
 * study's own URL (opened directly) it goes to the landing page.
 */
export function CloseCaseStudy() {
  const overlay = useCaseStudyOverlay();

  if (overlay) {
    return (
      <button type="button" onClick={overlay.close} className={className}>
        [&larr; BACK]
      </button>
    );
  }

  return (
    <Link href="/" className={className}>
      [&larr; BACK]
    </Link>
  );
}

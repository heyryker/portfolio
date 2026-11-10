"use client";

import Link from "next/link";
import { useCaseStudyOverlay } from "./CaseStudyOverlay";

const className = "project-back-link";

/**
 * ← Back: wipes the case study down to whatever is underneath. On a case
 * study's own URL (opened directly) it goes to the landing page.
 */
export function CloseCaseStudy() {
  const overlay = useCaseStudyOverlay();

  if (overlay) {
    return (
      <button type="button" onClick={overlay.close} className={className}>
        <span aria-hidden="true">&larr;</span> Back
      </button>
    );
  }

  return (
    <Link href="/" className={className}>
      <span aria-hidden="true">&larr;</span> Back
    </Link>
  );
}

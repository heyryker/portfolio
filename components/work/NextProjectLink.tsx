"use client";

import Link from "next/link";
import { markNextProject } from "./wipe";

/** "Next: [BRAND GUIDES]": wipes the next case study up over this one (§7). */
export function NextProjectLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link
      href={`/work/${slug}`}
      // Replace, so closing (or the back button) still lands on the page the
      // first case study was opened from.
      replace
      onClick={markNextProject}
      className="group inline-flex items-baseline gap-4 bg-bg pr-2 text-[clamp(32px,5.2vw,56px)] leading-[1.1] font-extrabold tracking-[-0.015em]"
    >
      <span>Next:</span>
      <span className="text-muted transition-colors group-hover:text-accent group-focus-visible:text-accent">
        [{label}]
      </span>
    </Link>
  );
}

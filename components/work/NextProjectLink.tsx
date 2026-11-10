"use client";

import Link from "next/link";
import { markNextProject } from "./wipe";

/** "Next project: TRON DAO": slides the next project up over this one (§7). */
export function NextProjectLink({ href, label, kicker = "Next project" }: { href: string; label: string; kicker?: string }) {
  return (
    <Link
      href={href}
      // Replace, so closing (or the back button) still lands on the page the
      // first project was opened from.
      replace
      onClick={markNextProject}
      className="project-next group"
    >
      <span className="project-next-kicker">{kicker}</span>
      <span className="project-next-name">
        {label} <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  );
}

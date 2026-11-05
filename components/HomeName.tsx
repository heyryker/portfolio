"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * "Ryker Marble", the link home in the top-left corner (it replaced the blue
 * pixel square in 2026-11).
 *
 * With `revealAfter` (the id of the landing intro's heading), it starts hidden
 * and slides in once that heading has scrolled up out of view, and the header
 * gets `data-scrolled` for its white band. The server renders it hidden, so
 * nothing shifts; without JavaScript it simply stays hidden there, where the
 * intro already says who this is.
 */
export function HomeName({ revealAfter }: { revealAfter?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = ref.current;
    const target = revealAfter && document.getElementById(revealAfter);
    if (!link || !target) return;
    const header = link.closest("header");
    const io = new IntersectionObserver(([entry]) => {
      // Shown once the heading is above the top of the screen.
      const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      link.toggleAttribute("data-shown", past);
      header?.toggleAttribute("data-scrolled", past);
    });
    io.observe(target);
    return () => io.disconnect();
  }, [revealAfter]);

  return (
    <Link
      ref={ref}
      href="/"
      className="home-name pointer-events-auto"
      // Hidden (visibility, so out of the tab order too) until revealed.
      data-reveal={revealAfter ? "" : undefined}
    >
      Ryker Marble
    </Link>
  );
}

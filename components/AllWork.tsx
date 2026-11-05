"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Showcase, type ShowcaseItem } from "./Showcase";

/**
 * Under the case study stack: a button that fades in once it's scrolled
 * into view, and brings in every case study and blog post as the carousel
 * (components/Showcase.tsx) when pressed. The cards sweep in from the right.
 * Without JavaScript the button can't work, so it's a link to the blog.
 */
export function AllWork({ items }: { items: ShowcaseItem[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rackRef = useRef<HTMLDivElement>(null);

  // Fade the button in once it's on screen.
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          button.dataset.shown = "";
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(button);
    return () => io.disconnect();
  }, []);

  // Bring the carousel into view once it's in the page.
  useEffect(() => {
    if (!open) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rackRef.current?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
    rackRef.current?.querySelector<HTMLAnchorElement>(".showcase-card a")?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div className="all-work">
      {!open && (
        <>
          <button ref={buttonRef} type="button" className="all-work-button" onClick={() => setOpen(true)}>
            See all work and writing
          </button>
          <noscript>
            <Link href="/blog" className="all-work-button" data-shown="">
              See all writing
            </Link>
          </noscript>
        </>
      )}
      {open && (
        <div ref={rackRef} className="all-work-rack">
          <Showcase items={items} enterFrom={-10} />
        </div>
      )}
    </div>
  );
}

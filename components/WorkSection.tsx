"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CaseStack } from "./CaseStack";
import { Showcase, type ShowcaseItem } from "./Showcase";

/**
 * The landing page's work, with a toggle under it between two views:
 *
 * - Featured: the four case studies as a stack (components/CaseStack.tsx),
 *   which deals itself in when the page loads.
 * - All work: the carousel of every case study and blog post
 *   (components/Showcase.tsx). Switching to it drops the four case studies
 *   from the stack into the carousel, then the rest fill in. Switching back
 *   deals the stack in again.
 *
 * The toggle fades in once it's scrolled into view. Without JavaScript it's a
 * link to the blog.
 */
export function WorkSection({ cases, all }: { cases: ShowcaseItem[]; all: ShowcaseItem[] }) {
  const [from, setFrom] = useState<DOMRect[] | null>(null);
  const stackRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  // Where the toggle was on screen before switching back to Featured.
  const toggleTop = useRef<number | null>(null);

  // Fade the toggle in once it's on screen.
  useEffect(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          toggle.dataset.shown = "";
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(toggle);
    return () => io.disconnect();
  }, []);

  // The stack is shorter than the carousel, so switching back would pull the
  // toggle up from under the cursor (and flip a card under it). Scroll so the
  // toggle stays where it was.
  useLayoutEffect(() => {
    const top = toggleTop.current;
    toggleTop.current = null;
    if (top === null || !toggleRef.current) return;
    window.scrollBy(0, toggleRef.current.getBoundingClientRect().top - top);
  }, [from]);

  const showFeatured = () => {
    if (!from) return;
    toggleTop.current = toggleRef.current?.getBoundingClientRect().top ?? null;
    setFrom(null);
  };

  const showAll = () => {
    if (from) return;
    // Where each case study card is now, so it can drop from there.
    const cards = stackRef.current?.querySelectorAll(".case-stack-card") ?? [];
    // The stack is in reverse order (first case study at the front).
    setFrom(Array.from(cards, (c) => c.getBoundingClientRect()).reverse());
  };

  return (
    <section aria-labelledby="work-title" className="case-stack-section">
      <h2 id="work-title" className="sr-only">
        {from ? "All work and writing" : "Featured case studies"}
      </h2>
      {from ? (
        <Showcase items={all} from={from} />
      ) : (
        // The first case study sits at the front of the stack, nearest the viewer.
        <CaseStack items={[...cases].reverse()} stackRef={stackRef} />
      )}
      <div className="all-work">
        <div ref={toggleRef} className="work-toggle" role="group" aria-label="Show">
          <button type="button" aria-pressed={!from} onClick={showFeatured}>
            Featured
          </button>
          <button type="button" aria-pressed={!!from} onClick={showAll}>
            All work
          </button>
        </div>
        <noscript>
          <Link href="/blog" className="work-toggle-link">
            All writing
          </Link>
        </noscript>
      </div>
    </section>
  );
}

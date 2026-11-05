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
 *   (components/Showcase.tsx). Switching to it flies the four case studies
 *   from the stack into the carousel, then the rest sweep in. Switching back
 *   deals the stack in again.
 *
 * The toggle fades in once it's scrolled into view. Without JavaScript it's a
 * link to the blog.
 */
export function WorkSection({ cases, all }: { cases: ShowcaseItem[]; all: ShowcaseItem[] }) {
  const [from, setFrom] = useState<DOMRect[] | null>(null);
  const stackRef = useRef<HTMLUListElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  // Before switching views: where the toggle was on screen, and how tall the
  // old view was.
  const before = useRef<{ top: number; height: number } | null>(null);

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

  // The stack and the carousel are different heights. Rather than jump, the
  // space between them eases from one height to the other, and the page
  // scrolls along so the toggle stays under the cursor: the intro glides in
  // (or out) above while the cards fly.
  useLayoutEffect(() => {
    const was = before.current;
    before.current = null;
    const view = viewRef.current;
    const toggle = toggleRef.current;
    if (!was || !view || !toggle) return;
    const keep = () => window.scrollBy(0, toggle.getBoundingClientRect().top - was.top);
    view.style.height = "";
    const to = view.offsetHeight;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || to === was.height) {
      keep();
      return;
    }
    const start = performance.now();
    const length = 900;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / length);
      const t = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
      view.style.height = p < 1 ? `${was.height + (to - was.height) * t}px` : "";
      keep();
      if (p < 1) raf = requestAnimationFrame(step);
    };
    step(start);
    return () => {
      cancelAnimationFrame(raf);
      view.style.height = "";
    };
  }, [from]);

  const remember = () => {
    const top = toggleRef.current?.getBoundingClientRect().top;
    const height = viewRef.current?.offsetHeight;
    before.current = top === undefined || height === undefined ? null : { top, height };
  };

  const showFeatured = () => {
    if (!from) return;
    remember();
    setFrom(null);
  };

  const showAll = () => {
    const stack = stackRef.current;
    if (from || !stack) return;
    remember();
    // Where each case study card is now, relative to the top of the view (the
    // carousel starts there too), so it can fly from there.
    const top = viewRef.current!.getBoundingClientRect().top;
    const cards = Array.from(stack.querySelectorAll(".case-stack-card"), (c) => {
      const r = c.getBoundingClientRect();
      return new DOMRect(r.left, r.top - top, r.width, r.height);
    });
    // The stack is in reverse order (first case study at the front).
    setFrom(cards.reverse());
  };

  return (
    <section aria-labelledby="work-title" className="case-stack-section">
      <h2 id="work-title" className="sr-only">
        {from ? "All work and writing" : "Featured case studies"}
      </h2>
      <div ref={viewRef} className="work-view">
        {from ? (
          <Showcase items={all} from={from} />
        ) : (
          // The first case study sits at the front of the stack, nearest the viewer.
          <CaseStack items={[...cases].reverse()} stackRef={stackRef} />
        )}
      </div>
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

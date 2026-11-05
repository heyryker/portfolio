"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaseStack } from "./CaseStack";
import { Showcase, type ShowcaseItem } from "./Showcase";

/**
 * The landing page's work: the four case studies as a stack
 * (components/CaseStack.tsx) with an "All work" button under it that fades
 * in once it's scrolled into view. Pressing it swaps the stack for the
 * carousel of every case study and blog post (components/Showcase.tsx): the
 * four case studies drop from the stack into the carousel, then the rest fill
 * in. Without JavaScript the button is a link to the blog.
 */
export function WorkSection({ cases, all }: { cases: ShowcaseItem[]; all: ShowcaseItem[] }) {
  const [from, setFrom] = useState<DOMRect[] | null>(null);
  const stackRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const open = () => {
    // Where each case study card is now, so it can drop from there.
    const cards = stackRef.current?.querySelectorAll(".case-stack-card") ?? [];
    // The stack is in reverse order (first case study at the front).
    setFrom(Array.from(cards, (c) => c.getBoundingClientRect()).reverse());
  };

  if (from) {
    return (
      <div className="all-work-rack">
        <Showcase items={all} from={from} />
      </div>
    );
  }

  return (
    <section aria-labelledby="case-stack-title" className="case-stack-section">
      <h2 id="case-stack-title" className="showcase-title">
        Case studies
      </h2>
      {/* The first case study sits at the front of the stack, nearest the viewer. */}
      <CaseStack items={[...cases].reverse()} stackRef={stackRef} />
      <div className="all-work">
        <button ref={buttonRef} type="button" className="all-work-button" onClick={open}>
          All work
        </button>
        <noscript>
          <Link href="/blog" className="all-work-button" data-shown="">
            All writing
          </Link>
        </noscript>
      </div>
    </section>
  );
}

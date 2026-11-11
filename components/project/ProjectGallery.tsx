"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

/**
 * The project's images and videos, one at a time, across the top of the
 * right column. Swipe or scroll sideways, use the arrows, or the arrow keys
 * once it has focus; the count shows where you are. Vertical scrolling is
 * left alone, so the page always scrolls on to the write-up.
 */
export function ProjectGallery({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    const update = () => {
      const slides = strip.querySelectorAll(":scope > .project-slide").length;
      setCount(slides);
      setIndex(Math.min(slides - 1, Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))));
    };
    update();
    strip.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      strip.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (to: number) => {
    const strip = ref.current;
    if (!strip) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = (to + count) % count;
    strip.scrollTo({ left: target * strip.clientWidth, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="project-gallery">
      <div ref={ref} role="region" aria-label={label} tabIndex={0} className="project-gallery-strip">
        {children}
      </div>
      {count > 1 && (
        <div className="project-gallery-controls">
          <button type="button" aria-label="Previous image" onClick={() => go(index - 1)} className="project-gallery-arrow">
            <Icon name="arrow_back" className="size-5" />
          </button>
          <span className="project-gallery-count" aria-live="polite">
            {index + 1} / {count}
          </span>
          <button type="button" aria-label="Next image" onClick={() => go(index + 1)} className="project-gallery-arrow">
            <Icon name="arrow_forward" className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

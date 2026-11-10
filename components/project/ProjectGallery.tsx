"use client";

import { useRef } from "react";
import { Icon } from "@/components/Icon";

/**
 * The strip of images along the top of a project view. It scrolls sideways:
 * with a trackpad or a swipe, by dragging with the mouse, with the arrow
 * buttons, or with the arrow keys once it has focus. Vertical scrolling is
 * left alone, so the page always scrolls down to the write-up.
 */
export function ProjectGallery({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const step = (dir: 1 | -1) => {
    const strip = ref.current;
    if (!strip) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="project-gallery">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="project-gallery-strip"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          const strip = e.currentTarget;
          drag.current = { x: e.clientX, left: strip.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (!d.moved && Math.abs(dx) < 6) return;
          if (!d.moved) {
            d.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            e.currentTarget.dataset.dragging = "";
          }
          e.currentTarget.scrollLeft = d.left - dx;
        }}
        onPointerUp={(e) => {
          drag.current = null;
          delete e.currentTarget.dataset.dragging;
        }}
        onPointerCancel={(e) => {
          drag.current = null;
          delete e.currentTarget.dataset.dragging;
        }}
        // A drag shouldn't also click a video's sound button or drag an image.
        onClickCapture={(e) => {
          if (e.currentTarget.dataset.dragging !== undefined) e.stopPropagation();
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="project-gallery-track">{children}</div>
      </div>
      <div className="project-gallery-arrows">
        <button type="button" aria-label="Previous images" onClick={() => step(-1)} className="project-gallery-arrow">
          <Icon name="arrow_back" className="size-5" />
        </button>
        <button type="button" aria-label="Next images" onClick={() => step(1)} className="project-gallery-arrow">
          <Icon name="arrow_forward" className="size-5" />
        </button>
      </div>
    </div>
  );
}

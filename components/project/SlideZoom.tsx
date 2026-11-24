"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

type Shot = { src: string; alt: string };

/**
 * Click or tap a slide to see the image whole, as large as the screen
 * allows, on white. Guideline pages, one-pagers and posters carry text that
 * a 16:10 slide can't hold at a readable size, especially on a phone; this
 * is where it gets read (and pinch-zoomed).
 *
 * The viewer is a carousel of every image in the same gallery: arrows,
 * the arrow keys, or a swipe flip through them, each fit whole inside the
 * same box. The images are read from the gallery's zoom buttons when it
 * opens, so the MDX stays the only list. On close the gallery behind
 * follows along to the last image seen. Full-size files load lazily, only
 * once the viewer opens. A native modal <dialog>, like the menu: Esc,
 * the close button or a click on the white closes it.
 */
export function SlideZoom({ src, alt, children }: { src: string; alt: string; children: React.ReactNode }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [shots, setShots] = useState<Shot[] | null>(null);
  const [index, setIndex] = useState(0);
  const [start, setStart] = useState(0);

  const buttons = () => {
    const root = trigger.current?.closest(".project-gallery-strip") ?? document;
    return Array.from(root.querySelectorAll<HTMLButtonElement>("[data-zoom-src]"));
  };

  const show = () => {
    const all = buttons();
    const at = Math.max(0, all.indexOf(trigger.current!));
    setStart(at);
    setIndex(at);
    setShots(all.map((b) => ({ src: b.dataset.zoomSrc!, alt: b.dataset.zoomAlt ?? "" })));
    dialog.current?.showModal();
  };

  // Jump (no animation) to the image that was tapped once the strip exists.
  useEffect(() => {
    const el = strip.current;
    if (!shots || !el) return;
    el.scrollLeft = start * el.clientWidth;
  }, [shots, start]);

  useEffect(() => {
    const el = strip.current;
    if (!shots || !el) return;
    const update = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [shots]);

  const go = useCallback(
    (to: number) => {
      const el = strip.current;
      if (!el || !shots) return;
      const n = shots.length;
      const target = (to + n) % n;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Wrapping from last to first jumps rather than racing back past every image.
      const far = Math.abs(target - index) > 1;
      el.scrollTo({ left: target * el.clientWidth, behavior: reduced || far ? "auto" : "smooth" });
    },
    [shots, index],
  );

  const onClose = () => {
    // Leave the gallery behind on the image the viewer ended on.
    const target = buttons()[index]?.closest<HTMLElement>(".project-slide");
    const gallery = target?.parentElement;
    if (target && gallery?.classList.contains("project-gallery-strip")) {
      gallery.scrollTo({ left: target.offsetLeft - gallery.offsetLeft, behavior: "auto" });
    }
    setShots(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  };

  const many = (shots?.length ?? 0) > 1;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={show}
        aria-label={`View larger: ${alt}`}
        data-zoom-src={src}
        data-zoom-alt={alt}
        className="project-slide-zoom"
      >
        {children}
      </button>
      <dialog
        ref={dialog}
        aria-label="Images, larger"
        aria-roledescription="carousel"
        data-meeple-ignore=""
        onClose={onClose}
        onKeyDown={onKeyDown}
        onClick={() => dialog.current?.close()}
        className="slide-zoom"
      >
        <button type="button" aria-label="Close" autoFocus className="menu-button slide-zoom-close">
          <Icon name="close" className="size-6" />
        </button>
        {shots && (
          <div ref={strip} className="slide-zoom-strip">
            {shots.map((shot, i) => (
              <div
                key={shot.src + i}
                className="slide-zoom-frame"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${shots.length}`}
              >
                {/* The original file, unresized: the point is to read the small print. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.src}
                  alt={shot.alt}
                  // Only the image shown and its neighbours load right away.
                  loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
                  draggable={false}
                  className="slide-zoom-image"
                />
              </div>
            ))}
          </div>
        )}
        {many && shots && (
          <div className="slide-zoom-controls" onClick={stop}>
            <button type="button" aria-label="Previous image" onClick={() => go(index - 1)} className="menu-button">
              <Icon name="arrow_back" className="size-6" />
            </button>
            <span className="slide-zoom-count" aria-live="polite">
              {index + 1} / {shots.length}
            </span>
            <button type="button" aria-label="Next image" onClick={() => go(index + 1)} className="menu-button">
              <Icon name="arrow_forward" className="size-6" />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}

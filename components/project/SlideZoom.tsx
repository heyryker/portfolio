"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";

/**
 * Click or tap a slide to see the image whole, as large as the screen
 * allows, on white. Guideline pages, one-pagers and posters carry text that
 * a 16:10 slide can't hold at a readable size, especially on a phone; this
 * is where it gets read (and pinch-zoomed). The full-size file only loads
 * once the viewer opens. A native modal <dialog>, like the menu: Esc,
 * the close button or a click anywhere closes it.
 */
export function SlideZoom({ src, alt, children }: { src: string; alt: string; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    setOpen(true);
    dialog.current?.showModal();
  };

  return (
    <>
      <button type="button" onClick={show} aria-label={`View larger: ${alt}`} className="project-slide-zoom">
        {children}
      </button>
      <dialog
        ref={dialog}
        aria-label="Image, larger"
        data-meeple-ignore=""
        onClose={() => setOpen(false)}
        onClick={() => dialog.current?.close()}
        className="slide-zoom"
      >
        <button type="button" aria-label="Close" autoFocus className="menu-button slide-zoom-close">
          <Icon name="close" className="size-6" />
        </button>
        {open && (
          // The original file, unresized: the point is to read the small print.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="slide-zoom-image" />
        )}
      </dialog>
    </>
  );
}

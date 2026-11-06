"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { ShowcaseItem } from "./Showcase";

/**
 * The four case studies as records in a crate, after Ryker's reference:
 * large square-cornered image cards tip forward, toward the viewer, in a stack that runs down the page, each showing a
 * strip with its title over the image. As the cursor moves over the stack,
 * the card under it flips upright and the cards in front drop back to show
 * it. On touch screens, scrolling the stack past the middle of the screen
 * flips through it instead. Clicking the upright card opens the case study;
 * tapping one that's still leaning flips it up first.
 *
 * Each card's place is CSS variables set from the flipped card, so the server
 * renders the resting stack and nothing shifts. Reduced motion keeps the
 * flips but drops the animation. Styles live in globals.css under `.case-stack`.
 */
export function CaseStack({
  items,
  stackRef,
}: {
  items: ShowcaseItem[];
  /** The list, so the "All work" transition can see where each card is. */
  stackRef: RefObject<HTMLUListElement | null>;
}) {
  // The upright card, or -1 for none (the resting stack).
  const [up, setUp] = useState(-1);
  const n = items.length;
  const router = useRouter();
  // How the last press came in, so a click knows if it was a mouse.
  const pointer = useRef("mouse");

  // Without a cursor, the stack flips through as it scrolls past the middle
  // of the screen.
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack || window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = stack.getBoundingClientRect();
      const p = (window.innerHeight * 0.55 - r.top) / r.height;
      setUp(p < 0 || p > 1 ? -1 : Math.min(n - 1, Math.floor(p * n)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [n, stackRef]);

  return (
    <ul
      ref={stackRef}
      className="case-stack"
      data-up={up >= 0 ? "" : undefined}
      // The cursor's height over the stack picks the card, in even bands from
      // the back (top) to the front (bottom). Going by position rather than by
      // which card is under the cursor keeps it steady: the cards move as one
      // flips up, and picking by element made them flicker back and forth.
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        setUp(Math.max(0, Math.min(n - 1, Math.floor(((e.clientY - r.top) / r.height) * n))));
      }}
      onPointerDown={(e) => {
        pointer.current = e.pointerType;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") {
          setUp(-1);
        }
      }}
    >
      {items.map((item, i) => (
        <li
          key={item.href}
          className="case-stack-card"
          data-upright={i === up ? "" : undefined}
          style={{ "--i": i, "--after": up >= 0 && i > up ? 1 : 0 } as React.CSSProperties}
        >
          <Link
            href={item.href}
            className="case-stack-link"
            draggable={false}
            onClick={(e) => {
              if (i === up) return;
              e.preventDefault();
              // With a mouse, a click opens the card that's up, whichever card
              // edge happens to be under the cursor. A tap on a card that's
              // still tipped flips it up first.
              if (pointer.current === "mouse" && up >= 0) router.push(items[up].href);
              else setUp(i);
            }}
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible")) setUp(i);
            }}
          >
            <Image
              src={item.image}
              alt={item.alt}
              fill
              sizes="(min-width: 1104px) 1080px, 100vw"
              priority={i === n - 1}
              draggable={false}
            />
            <span className="case-stack-title">
              <span className="case-stack-name">{item.name ?? item.title}</span>
              {item.area && <span className="case-stack-area">{item.area}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

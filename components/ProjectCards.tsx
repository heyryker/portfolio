"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ProjectCard } from "@/lib/projects";
import { markNextProject } from "@/components/work/wipe";

/** How many cards show in the pile at the bottom before the rest fade out. */
const PILE = 3;
/** How far each card in the pile sits below the one in front (px). */
const PEEK = 14;
/** How much smaller each card in the pile gets. */
const SHRINK = 0.05;

/**
 * Every project as a card: a square thumbnail, the name and one line about
 * it (after Porto Rocha's project list). Cards still below the bottom edge
 * of the screen don't hide off it: they pile up there, each a little smaller
 * and tucked behind the one in front, and peel off the pile into the list as
 * you scroll. The pile is only transforms, so the page's layout and scroll
 * length never change, and without JavaScript it's a plain list.
 *
 * `scrollSelf` makes the list its own scroll area (the left column of a
 * project screen), piling against its own bottom edge instead of the
 * window's. `current` marks the card of the project that's open.
 */
export function ProjectCards({
  items,
  current,
  scrollSelf = false,
}: {
  items: ProjectCard[];
  current?: string;
  scrollSelf?: boolean;
}) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    let frame = 0;

    const layout = () => {
      frame = 0;
      const cards = [...list.children] as HTMLElement[];
      const listTop = list.getBoundingClientRect().top;
      const bottom = scrollSelf ? list.getBoundingClientRect().bottom : window.innerHeight;
      const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      // Room under the pile, which the landing page grows on narrow screens to
      // clear the meeple button (`--pile-bottom` in globals.css).
      const padBottom = parseFloat(getComputedStyle(list).getPropertyValue("--pile-bottom")) || (scrollSelf ? 12 : 16);
      cards.forEach((card, i) => {
        // Where the card sits in the list, ignoring any transform.
        const top = listTop + card.offsetTop - (scrollSelf ? list.scrollTop : 0);
        const h = card.offsetHeight;
        const limit = bottom - padBottom - h;
        const over = top - limit;
        // Each card sits in front of the ones after it, so a card joining the
        // pile tucks in behind the one above.
        card.style.zIndex = String(items.length - i);
        if (over <= 0) {
          card.style.transform = "";
          card.style.opacity = "";
          card.removeAttribute("data-piled");
          return;
        }
        // How deep in the pile, as a smooth number: 0 just as it reaches the
        // edge, 1 a whole card further down, and so on.
        const depth = over / (h + gap);
        const shown = Math.min(depth, PILE);
        const y = limit + shown * PEEK - top;
        card.style.transform = `translateY(${y}px) scale(${1 - shown * SHRINK})`;
        card.style.opacity = depth > PILE ? String(Math.max(0, PILE + 1 - depth)) : "";
        card.setAttribute("data-piled", "");
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout);
    };
    layout();
    // The landing page scrolls the window; a list on a project screen opened
    // over it scrolls itself. Capture catches either.
    const target: HTMLElement | Document = scrollSelf ? list : document;
    target.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(list);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [items.length, scrollSelf]);

  return (
    <ul ref={ref} className="project-cards" data-scroll-self={scrollSelf ? "" : undefined}>
      {items.map((item, i) => (
        <li key={item.href} className="project-card-item">
          <Link
            href={item.href}
            className="project-card"
            aria-current={item.href === current ? "page" : undefined}
            // From one project to another: replace, so closing still goes
            // back to where the first one was opened.
            replace={!!current}
            onClick={current ? markNextProject : undefined}
          >
            <span className="project-card-thumb">
              <Image src={item.image} alt="" fill sizes="128px" priority={i < 4} className="object-cover" />
            </span>
            <span className="project-card-text">
              <span className="project-card-title">{item.title}</span>
              <span className="project-card-summary">{item.summary}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

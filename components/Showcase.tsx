"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

export type ShowcaseItem = {
  href: string;
  /** Small line above the title: "Case study · Brand guides", "Blog · 2025". */
  eyebrow: string;
  title: string;
  image: string;
  alt: string;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Without the rack (no JavaScript): the plain grid, as with reduced motion. */
const NO_RACK = `
.showcase { height: auto }
.showcase .showcase-stage { position: static; height: auto; overflow: visible; display: block }
.showcase .showcase-rack { display: grid; height: auto }
.showcase .showcase-card { position: static; opacity: 1; transform: none; width: auto }
.showcase .showcase-text { display: block }
.showcase .showcase-caption { display: none }
`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Screens of scroll spent folding the row into the rack. Matches globals.css. */
const FOLD_SHARE = 0.4;

/**
 * Every case study and blog post as one rack of cards, after Ryker's two
 * reference recordings: a flat row of cards that folds into an angled stack
 * in 3D, and a file of standing cards where the one under the cursor lifts
 * out with its neighbours rising a little less.
 *
 * As the section scrolls in, the cards fold from a small flat row into the
 * rack. The section then holds still on screen while scrolling flips through
 * the rack, one card at a time; moving the cursor across it does the same,
 * and Tab moves through the cards as links. The lifted card turns to face
 * the viewer and its title shows underneath. Click or tap opens it.
 *
 * The rack's frame (the section's scroll height and the sticky stage) is in
 * the CSS, so the server renders it and nothing shifts when the script takes
 * over. With reduced motion, or without JavaScript, it's a still grid of
 * tiles with their titles. Placement lives in globals.css under `.showcase`.
 */
export function Showcase({ items }: { items: ShowcaseItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const n = items.length;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia(REDUCED_MOTION).matches) return;

    let raf = 0;
    let focus = 0; // the card that's lifted, as a float while moving
    let target = 0;
    let fold = -1; // 0 is the flat row, 1 the rack
    let shown = -1;
    // Whichever moved last steers the rack: scrolling or the cursor.
    let steer: "scroll" | "pointer" = "scroll";

    // The first stretch of the held scroll folds the row into the rack (the
    // extra 40svh in globals.css); the rest flips through the cards.
    const measure = () => {
      const vh = window.innerHeight;
      const top = section.getBoundingClientRect().top;
      const folding = vh * FOLD_SHARE;
      const travel = section.offsetHeight - vh - folding;
      return {
        top,
        fold: clamp(-top / folding, 0, 1),
        progress: clamp((-top - folding) / travel, 0, 1),
      };
    };

    const layout = () => {
      raf = 0;
      const first = cardRefs.current[0];
      if (!first) return;
      const m = measure();
      if (steer === "scroll") target = m.progress * (n - 1);
      const foldTarget = ease(m.fold);
      fold = fold < 0 ? foldTarget : lerp(fold, foldTarget, 0.25);
      focus = lerp(focus, target, 0.16);
      if (Math.abs(focus - target) < 0.002) focus = target;

      const vw = section.clientWidth;
      const w = first.offsetWidth;
      const h = first.offsetHeight;
      const wide = vw >= 860;
      const spacing = w * (wide ? 0.13 : 0.1);
      // The flat row: every card small, side by side across the screen.
      const gap = wide ? 10 : 4;
      // At least a readable size: past that the row runs off both edges.
      const flatW = Math.min(w, Math.max(wide ? 120 : 64, (vw - (wide ? 96 : 32) - gap * (n - 1)) / n));
      const flatScale = flatW / w;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const d = i - focus;
        const near = Math.exp(-(d * d) / 1.4); // 1 on the lifted card, fading out
        // Cards part around the lifted one, so it stands clear of its neighbours.
        const rackX = d * spacing + Math.tanh(d * 1.2) * w * 0.55;
        const rackY = -near * h * 0.16;
        const rackZ = near * w * 0.22 - Math.abs(d) * 6;
        const rackRot = -clamp(d, -1, 1) * 48 * (1 - near * 0.15);
        const flatX = (i - (n - 1) / 2) * (flatW + gap);

        const x = lerp(flatX, rackX, fold);
        const y = lerp(0, rackY, fold);
        const z = lerp(0, rackZ, fold);
        const rot = lerp(0, rackRot, fold);
        const s = lerp(flatScale, 1, fold);
        card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rot}deg) scale(${s})`;
        card.style.zIndex = String(1000 - Math.round(Math.abs(d) * 10));
      });

      const now = Math.round(clamp(focus, 0, n - 1));
      if (now !== shown) {
        shown = now;
        setActive(now);
      }
      section.style.setProperty("--fold", fold.toFixed(3));
      if (Math.abs(focus - target) > 0.002 || Math.abs(fold - foldTarget) > 0.002) schedule();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(layout);
    };

    const onScroll = () => {
      steer = "scroll";
      schedule();
    };

    // The cursor scrubs across the rack: its position across the stage picks the card.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || measure().fold < 1) return;
      const r = section.getBoundingClientRect();
      steer = "pointer";
      target = clamp(((e.clientX - r.left) / r.width - 0.1) / 0.8, 0, 1) * (n - 1);
      schedule();
    };

    // Tabbing to a card lifts it.
    const onFocus = (e: FocusEvent) => {
      const i = cardRefs.current.findIndex((c) => c?.contains(e.target as Node));
      if (i < 0) return;
      steer = "pointer";
      target = i;
      schedule();
    };

    layout();
    section.dataset.ready = "";
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    section.addEventListener("pointermove", onPointer);
    section.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      section.removeEventListener("pointermove", onPointer);
      section.removeEventListener("focusin", onFocus);
      delete section.dataset.ready;
    };
  }, [n]);

  const current = items[active];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="showcase-title"
      className="showcase"
      style={{ "--n": n } as React.CSSProperties}
    >
      <noscript>
        <style>{NO_RACK}</style>
      </noscript>
      <div className="showcase-stage">
        <h2 id="showcase-title" className="showcase-title">
          Work and writing
        </h2>
        <ul className="showcase-rack">
          {items.map((item, i) => (
            <li
              key={item.href}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="showcase-card"
              data-active={i === active ? "" : undefined}
            >
              <Link href={item.href} className="showcase-tile">
                <span className="showcase-image">
                  <Image src={item.image} alt={item.alt} fill sizes="(min-width: 860px) 420px, 70vw" />
                </span>
                <span className="showcase-text">
                  <span className="showcase-eyebrow">{item.eyebrow}</span>
                  <span className="showcase-name">{item.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {/* The lifted card's title. The links above carry the same text for
            screen readers, so this is only for sighted visitors. */}
        <p className="showcase-caption" aria-hidden="true">
          <span key={active} className="showcase-caption-inner">
            <span className="showcase-eyebrow">{current.eyebrow}</span>
            <Link href={current.href} tabIndex={-1} className="showcase-name">
              {current.title}
            </Link>
          </span>
        </p>
      </div>
    </section>
  );
}

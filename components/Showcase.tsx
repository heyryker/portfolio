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
  /** One line about it, where there is one (case studies). */
  summary?: string;
  /** Short card label for the case study crate: what it is, then the design area. */
  name?: string;
  area?: string;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Without the motion (no JavaScript): the same still layout as reduced motion. */
const STILL = `
.showcase { height: auto }
.showcase .showcase-stage { position: static; height: auto; overflow: visible }
.showcase .showcase-title { position: static }
.showcase .showcase-rack { position: static; display: grid; perspective: none; padding: 0 16px 64px }
.showcase .showcase-card { position: static; opacity: 1; transform: none; width: auto }
.showcase .showcase-text { display: block }
.showcase .showcase-caption { display: none }
`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * Every case study and blog post as one angled rack of cards, like a card
 * file, after Ryker's reference recordings. The cursor scrubs across it (or a
 * sideways swipe on phones, the arrow keys and Tab) and lifts one card at a
 * time: it rises, turns to face the viewer and its title shows underneath.
 * Clicking the lifted card opens it; clicking any other card lifts that one
 * first. Page scrolling is left alone.
 *
 * The rack's frame is in the CSS, so the server renders it and nothing
 * shifts when the script takes over; the cards stay hidden until placed.
 * With reduced motion, or without JavaScript, it's a still grid of tiles
 * with titles. Placement lives in globals.css under `.showcase`.
 */
export function Showcase({ items, from }: { items: ShowcaseItem[]; from?: DOMRect[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const n = items.length;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia(REDUCED_MOTION).matches) return;

    let raf = 0;
    let visible = true;
    let focus = 0; // the lifted card, as a float while moving
    let target = 0;
    let shown = -1;
    let swipe: { x: number; from: number; moved: boolean } | undefined;
    let swiped = false;

    // The entrance, when opened from the case study stack (`from` holds where
    // those cards were on screen): they drop from there into the rack, then
    // the rest fill in from the right, one after another.
    const start = performance.now();
    const stage = section.querySelector(".showcase-rack")!.getBoundingClientRect();
    const entering = (i: number, now: number) => {
      if (!from) return 1;
      const delay = i < from.length ? i * 90 : 450 + (i - from.length) * 45;
      return ease(clamp((now - start - delay) / (i < from.length ? 900 : 700), 0, 1));
    };

    const layout = () => {
      raf = 0;
      const first = cardRefs.current[0];
      if (!first) return;
      const now = performance.now();
      focus = lerp(focus, target, 0.16);
      if (Math.abs(focus - target) < 0.002) focus = target;

      const vw = section.clientWidth;
      const w = first.offsetWidth;
      const h = first.offsetHeight;
      const wide = vw >= 860;
      const spacing = w * (wide ? 0.13 : 0.1);

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const d = i - focus;
        const near = Math.exp(-(d * d) / 1.4); // 1 on the lifted card, fading out
        // Cards part around the lifted one, so it stands clear of its neighbours.
        const x = d * spacing + Math.tanh(d * 1.2) * w * 0.55;
        const y = -near * h * 0.16;
        const z = near * w * 0.22 - Math.abs(d) * 6;
        const rot = -clamp(d, -1, 1) * 48 * (1 - near * 0.15);
        const t = entering(i, now);
        const r = from?.[i];
        if (t >= 1) {
          card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rot}deg)`;
          card.style.opacity = "";
        } else if (r) {
          // From where it sat in the stack (relative to the card's resting
          // spot, the centre of the rack) down into its place in the rack.
          const fx = r.left + r.width / 2 - (stage.left + stage.width / 2);
          const fy = r.top + r.height / 2 - (stage.top + stage.height / 2);
          const fs = r.width / w;
          card.style.transform = `translate3d(${lerp(fx, x, t)}px, ${lerp(fy, y, t)}px, ${lerp(0, z, t)}px) rotateY(${lerp(0, rot, t)}deg) scale(${lerp(fs, 1, t)})`;
        } else {
          card.style.transform = `translate3d(${x + (1 - t) * w * 1.2}px, ${y}px, ${z}px) rotateY(${rot}deg)`;
          card.style.opacity = String(t);
        }
        card.style.zIndex = String(1000 - Math.round(Math.abs(d) * 10) + (r && t < 1 ? 100 : 0));
      });

      const now_ = Math.round(clamp(focus, 0, n - 1));
      if (now_ !== shown) {
        shown = now_;
        setActive(now_);
      }
      // Keep going until the rack is still.
      const arriving = !!from && now - start < 450 + n * 45 + 900;
      if (visible && !document.hidden && (focus !== target || arriving)) schedule();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(layout);
    };

    const cardAt = (el: EventTarget | null) =>
      el instanceof Node ? cardRefs.current.findIndex((c) => c?.contains(el)) : -1;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        // The cursor's position across the rack picks the card.
        const r = section.getBoundingClientRect();
        target = clamp(((e.clientX - r.left) / r.width - 0.1) / 0.8, 0, 1) * (n - 1);
      } else if (swipe) {
        // A sideways swipe flips through the rack; vertical scrolling is left alone.
        const dx = e.clientX - swipe.x;
        if (Math.abs(dx) > 8) swipe.moved = true;
        const w = cardRefs.current[0]?.offsetWidth ?? 300;
        target = clamp(swipe.from - dx / (w * 0.3), 0, n - 1);
      }
      schedule();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") swipe = { x: e.clientX, from: target, moved: false };
    };

    const onPointerUp = () => {
      if (!swipe) return;
      swiped = swipe.moved;
      if (swipe.moved) target = Math.round(target);
      swipe = undefined;
      schedule();
    };

    // A click opens the lifted card; on any other card it lifts that one first.
    const onClick = (e: MouseEvent) => {
      const i = cardAt(e.target);
      if (i < 0) return;
      if (swiped || i !== Math.round(focus)) {
        e.preventDefault();
        if (!swiped) target = i;
        swiped = false;
        schedule();
      }
    };

    const onFocus = (e: FocusEvent) => {
      const i = cardAt(e.target);
      if (i < 0) return;
      target = i;
      schedule();
    };

    const onKey = (e: KeyboardEvent) => {
      if (cardAt(e.target) < 0) return;
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const i = clamp(Math.round(target) + step, 0, n - 1);
      cardRefs.current[i]?.querySelector("a")?.focus({ preventScroll: true });
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });

    layout();
    section.dataset.ready = "";
    io.observe(section);
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    section.addEventListener("click", onClick);
    section.addEventListener("focusin", onFocus);
    section.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      section.removeEventListener("click", onClick);
      section.removeEventListener("focusin", onFocus);
      section.removeEventListener("keydown", onKey);
      delete section.dataset.ready;
    };
  }, [n, from]);

  const current = items[active];

  return (
    <section ref={sectionRef} aria-labelledby="showcase-title" className="showcase">
      <noscript>
        <style>{STILL}</style>
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
              <Link href={item.href} className="showcase-tile" draggable={false}>
                <span className="showcase-image">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 860px) 420px, 70vw"
                    draggable={false}
                  />
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

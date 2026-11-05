"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

export type ShowcaseItem = {
  href: string;
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
 * file, after Ryker's reference recordings. Arrow buttons at the sides (or a
 * sideways swipe or trackpad scroll, the arrow keys and Tab) step through it,
 * lifting one card at a time: it rises, turns to face the viewer and its title
 * shows underneath. The cursor used to scrub across the rack; that fought with
 * the side buttons, so it's gone.
 * Clicking the lifted card opens it; clicking any other card lifts that one
 * first. Page scrolling is left alone.
 *
 * The rack's frame is in the CSS, so the server renders it and nothing
 * shifts when the script takes over; the cards stay hidden until placed.
 * With reduced motion, or without JavaScript, it's a still grid of tiles
 * with titles. Placement lives in globals.css under `.showcase`.
 */
export function Showcase({
  items,
  from,
}: {
  items: ShowcaseItem[];
  /** Where the case study cards were, with `top` measured from the bottom of this section. */
  from?: DOMRect[];
}) {
  const sectionRef = useRef<HTMLDivElement>(null); // WorkSection has the heading
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
    let settle = 0;

    // The entrance, when opened from the case study stack (`from` holds where
    // those cards were on screen): they drop from there into the rack, then
    // the rest fill in from the right, one after another.
    const start = performance.now();
    // The rack's centre, measured like `from`: x on screen, y from the
    // section's bottom (the toggle under it, which stays put on screen).
    const rack = section.querySelector(".showcase-rack")!.getBoundingClientRect();
    const sectionBottom = section.getBoundingClientRect().bottom;
    const cx = rack.left + rack.width / 2;
    const cy = rack.top - sectionBottom + rack.height / 2;
    // The rack's vanishing point (its perspective and perspective-origin in the CSS).
    const P = parseFloat(getComputedStyle(section.querySelector(".showcase-rack")!).perspective) || 1400;
    const oy = rack.top - sectionBottom + rack.height * 0.45;
    // Each stack card is tipped back from its top edge (CaseStack's --tilt),
    // seen through its own perspective. The rack's perspective is different,
    // so find the tip that makes the card look the same height through it:
    // then the first frame matches the stack exactly and nothing jumps.
    const tip = (r: DOMRect) => {
      const full = r.width * 0.6; // the stack card's real height (5:3)
      const seen = (deg: number) => {
        const a = (deg * Math.PI) / 180;
        return oy + ((r.top + full * Math.cos(a) - oy) * P) / (P + full * Math.sin(a)) - r.top;
      };
      let lo = 0;
      let hi = 85;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (seen(mid) > r.height) lo = mid;
        else hi = mid;
      }
      return -(lo + hi) / 2;
    };
    const tips = from?.map(tip) ?? [];
    const entering = (i: number, now: number) => {
      if (!from) return 1;
      const delay = i < from.length ? i * 90 : 450 + (i - from.length) * 45;
      return ease(clamp((now - start - delay) / (i < from.length ? 1000 : 700), 0, 1));
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
      const h = w * 0.75; // the cards are 4:3
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
        const image = r ? card.querySelector<HTMLElement>(".showcase-image") : null;
        if (t >= 1) {
          card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rot}deg)`;
          card.style.opacity = "";
          if (image) image.style.height = "";
        } else if (r) {
          // From where it sat in the stack down into its place in the rack.
          // It starts exactly as it was: the stack's size, 5:3, tipped back
          // from its top edge. On the way it grows to 4:3 (the image box
          // itself, so the picture is never squashed), stands up, shrinks
          // and turns to its angle in the rack.
          const box = lerp(0.6, 0.75, t) * w; // the image box's height now
          image!.style.height = `${box}px`;
          const sc = lerp(r.width / w, 1, t);
          // The top edge's centre, relative to the centre of the rack.
          const tx = lerp(r.left + r.width / 2 - cx, x, t);
          const ty = lerp(r.top - cy, y - h / 2, t);
          // The card's box is placed for a 4:3 card, so a shorter box has its
          // centre higher by half the difference.
          const c0 = (box - h) / 2;
          card.style.transform =
            `translate3d(${tx}px, ${ty - c0}px, ${lerp(0, z, t)}px) rotateY(${lerp(0, rot, t)}deg) ` +
            `rotateX(${lerp(tips[i], 0, t)}deg) translateY(${(sc * box) / 2}px) scale(${sc})`;
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
      const arriving = !!from && now - start < 450 + n * 45 + 1000;
      if (visible && !document.hidden && (focus !== target || arriving)) schedule();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(layout);
    };

    const cardAt = (el: EventTarget | null) =>
      el instanceof Node ? cardRefs.current.findIndex((c) => c?.contains(el)) : -1;

    const onPointerMove = (e: PointerEvent) => {
      if (swipe) {
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
      // The side buttons step one card either way.
      const arrow = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-step]") : null;
      if (arrow) {
        target = clamp(Math.round(target) + Number(arrow.dataset.step), 0, n - 1);
        schedule();
        return;
      }
      const i = cardAt(e.target);
      if (i < 0) return;
      if (swiped || i !== Math.round(focus)) {
        e.preventDefault();
        if (!swiped) target = i;
        swiped = false;
        schedule();
      }
    };

    // A sideways trackpad scroll flips through too, settling on a card when it
    // stops. Up and down scrolling is left to the page.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      target = clamp(target + e.deltaX / 160, 0, n - 1);
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        target = Math.round(target);
        schedule();
      }, 140);
      schedule();
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
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      section.removeEventListener("wheel", onWheel);
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
    <div ref={sectionRef} className="showcase">
      <noscript>
        <style>{STILL}</style>
      </noscript>
      <div className="showcase-stage">
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
                    // The case study cards reuse the stack's image size (already
                    // loaded), so they don't blank out on the way in.
                    sizes={from && i < from.length ? "(min-width: 1104px) 1080px, 100vw" : "(min-width: 860px) 420px, 70vw"}
                    loading={from ? "eager" : undefined}
                    draggable={false}
                  />
                </span>
                <span className="showcase-text">
                  <span className="showcase-name">{item.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {/* The side buttons. Keyboard users have the arrow keys on the cards,
            so these stay out of the tab order. */}
        <button
          type="button"
          className="showcase-arrow"
          data-step="-1"
          aria-label="Previous"
          tabIndex={-1}
          disabled={active === 0}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <button
          type="button"
          className="showcase-arrow"
          data-step="1"
          aria-label="Next"
          tabIndex={-1}
          disabled={active === n - 1}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
        {/* The lifted card's title. The links above carry the same text for
            screen readers, so this is only for sighted visitors. */}
        <p className="showcase-caption" aria-hidden="true">
          <span key={active} className="showcase-caption-inner">
            <Link href={current.href} tabIndex={-1} className="showcase-name">
              {current.title}
            </Link>
          </span>
        </p>
      </div>
    </div>
  );
}

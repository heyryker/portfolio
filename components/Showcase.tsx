"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type ShowcaseItem = {
  href: string;
  /** Small line above the title: "Case study · Brand guides", "Blog · 2025". */
  eyebrow: string;
  title: string;
  image: string;
  alt: string;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Without the motion (no JavaScript): the same still layout as reduced motion. */
const STILL = `
.showcase { height: auto }
.showcase .showcase-stage { position: static; height: auto; overflow: visible }
.showcase .showcase-intro { position: static; opacity: 1; transform: none }
.showcase .showcase-title { position: static; opacity: 1 }
.showcase .showcase-rack { position: static; display: grid; perspective: none; padding: 0 16px 64px }
.showcase .showcase-card { position: static; opacity: 1; transform: none; width: auto }
.showcase .showcase-text { display: block }
.showcase .showcase-caption { display: none }
`;

/** Screens of scroll it takes the floating cards to condense into the rack. Matches globals.css. */
const CONDENSE = 0.75;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** A steady pseudo-random number in [0, 1) per card, so the float looks the same every visit. */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Every case study and blog post, after Ryker's references: on arrival the
 * cards float around the intro at different sizes and depths, drifting
 * slowly and leaning away from the cursor. Scrolling condenses them into one
 * angled rack of cards, like a card file, and the intro fades away.
 *
 * Once in the rack, the cursor scrubs across it (or a swipe on phones, or the
 * arrow keys and Tab) and lifts one card at a time: it rises, turns to face
 * the viewer and its title shows underneath. Clicking the lifted card opens
 * it; clicking any other card lifts that one first. The page scrolls on
 * normally after a short hold, so scrolling is never used to flip cards.
 *
 * The frame (the section's scroll height and the sticky stage) is in the CSS,
 * so the server renders it and nothing shifts when the script takes over.
 * The cards stay hidden until placed. With reduced motion, or without
 * JavaScript, it's the intro and then a still grid of tiles with titles.
 * Placement lives in globals.css under `.showcase`.
 */
export function Showcase({ items, intro }: { items: ShowcaseItem[]; intro: ReactNode }) {
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
    let fold = -1; // 0 is floating, 1 the rack
    let shown = -1;
    let mx = 0; // cursor from the centre, -1 to 1, for the float's parallax
    let my = 0;
    let px = 0;
    let py = 0;
    let swipe: { x: number; from: number; moved: boolean } | undefined;
    let swiped = false;

    // How far the section has scrolled, in screens: 0 to CONDENSE condenses.
    const condensed = () => {
      const vh = window.innerHeight;
      return clamp(-section.getBoundingClientRect().top / (vh * CONDENSE), 0, 1);
    };

    const layout = (now: number) => {
      raf = 0;
      const first = cardRefs.current[0];
      if (!first) return;
      const foldTarget = condensed();
      fold = fold < 0 ? foldTarget : lerp(fold, foldTarget, 0.2);
      if (Math.abs(fold - foldTarget) < 0.001) fold = foldTarget;
      focus = lerp(focus, target, 0.16);
      if (Math.abs(focus - target) < 0.002) focus = target;
      px = lerp(px, mx, 0.06);
      py = lerp(py, my, 0.06);

      const vw = section.clientWidth;
      const vh = window.innerHeight;
      const w = first.offsetWidth;
      const h = first.offsetHeight;
      const wide = vw >= 860;
      const spacing = w * (wide ? 0.13 : 0.1);
      const time = now / 1000;
      const introBox = section.querySelector<HTMLElement>(".landing-intro");
      const introW = introBox?.offsetWidth ?? 0;
      const introH = introBox?.offsetHeight ?? 0;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        // The rack.
        const d = i - focus;
        const near = Math.exp(-(d * d) / 1.4); // 1 on the lifted card, fading out
        const rackX = d * spacing + Math.tanh(d * 1.2) * w * 0.55;
        const rackY = -near * h * 0.16;
        const rackZ = near * w * 0.22 - Math.abs(d) * 6;
        const rackRot = -clamp(d, -1, 1) * 48 * (1 - near * 0.15);

        // The float: cards spread on a ring around the intro, spiralling out
        // by the golden angle so none line up, nearer ones bigger.
        const depth = rand(i, 1);
        const angle = i * 2.39996 + 0.6;
        const ring = (wide ? 0.68 : 0.78) + rand(i, 2) * (wide ? 0.42 : 0.4);
        const scale = (wide ? 0.3 : 0.32) + depth * (wide ? 0.32 : 0.16);
        let fx = Math.cos(angle) * ring * vw * 0.5;
        let fy = Math.sin(angle) * ring * vh * 0.46;
        // Keep the words clear: a card that would cover the intro is pushed
        // straight out from the centre until it clears it.
        const clearX = introW / 2 + (w * scale) / 2 + 16;
        const clearY = introH / 2 + (h * scale) / 2 + 16;
        if (Math.abs(fx) < clearX && Math.abs(fy) < clearY) {
          const k = Math.min(clearX / Math.max(Math.abs(fx), 1), clearY / Math.max(Math.abs(fy), 1));
          fx *= k;
          fy *= k;
        }
        const floatX = fx + Math.cos(time * 0.35 + i) * 8 - px * (10 + depth * 30);
        const floatY = fy + Math.sin(time * 0.5 + i * 1.7) * 12 - py * (8 + depth * 24);
        const floatRotY = (rand(i, 3) - 0.5) * 30 + px * 10;
        const floatRotX = (rand(i, 4) - 0.5) * 16 - py * 8;

        // Each card sets off at its own moment, so they gather rather than march.
        const t = ease(clamp(fold * 1.5 - rand(i, 5) * 0.5, 0, 1));
        const x = lerp(floatX, rackX, t);
        const y = lerp(floatY, rackY, t);
        const z = lerp(-200 + depth * 200, rackZ, t);
        const rotY = lerp(floatRotY, rackRot, t);
        const rotX = lerp(floatRotX, 0, t);
        const s = lerp(scale, 1, t);
        card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${s})`;
        card.style.zIndex = String(t > 0.5 ? 1000 - Math.round(Math.abs(d) * 10) : Math.round(depth * 100));
      });

      const now_ = Math.round(clamp(focus, 0, n - 1));
      if (now_ !== shown) {
        shown = now_;
        setActive(now_);
      }
      section.style.setProperty("--fold", fold.toFixed(3));
      section.toggleAttribute("data-racked", fold > 0.97);

      // Keep going while anything floats or settles; rest once the rack is still.
      const settling = fold !== foldTarget || focus !== target || Math.abs(px - mx) > 0.002;
      if (visible && !document.hidden && (fold < 1 || settling)) schedule();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(layout);
    };

    const racked = () => fold > 0.97;
    const cardAt = (el: EventTarget | null) =>
      el instanceof Node ? cardRefs.current.findIndex((c) => c?.contains(el)) : -1;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        mx = (e.clientX / window.innerWidth) * 2 - 1;
        my = (e.clientY / window.innerHeight) * 2 - 1;
        // In the rack, the cursor's position across the stage picks the card.
        if (racked()) target = clamp((e.clientX / window.innerWidth - 0.1) / 0.8, 0, 1) * (n - 1);
      } else if (swipe && racked()) {
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
      if (swiped || (racked() && i !== Math.round(focus))) {
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
      if (!racked() || cardAt(e.target) < 0) return;
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

    layout(performance.now());
    section.dataset.ready = "";
    io.observe(section);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    section.addEventListener("click", onClick);
    section.addEventListener("focusin", onFocus);
    section.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      section.removeEventListener("click", onClick);
      section.removeEventListener("focusin", onFocus);
      section.removeEventListener("keydown", onKey);
      delete section.dataset.ready;
    };
  }, [n]);

  const current = items[active];

  return (
    <section ref={sectionRef} aria-labelledby="showcase-title" className="showcase">
      <noscript>
        <style>{STILL}</style>
      </noscript>
      <div className="showcase-stage">
        <div className="showcase-intro">{intro}</div>
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ShowcaseItem } from "./Showcase";

/** How long each case study stays in front before the next comes up. */
const DWELL_MS = 4500;

/**
 * The four case studies as a stack of image cards under the intro, after
 * Ryker's reference, turning like a carousel: the front card shows its image
 * whole, the ones behind step up and back so only their top edges peek, and
 * every few seconds the front card drops away and comes round to the back
 * while the next one steps forward.
 *
 * It pauses while the cursor or keyboard focus is on it, and when it's off
 * screen. Clicking a card behind (or a dot, or swiping sideways) brings that
 * one forward; clicking the front card opens the case study. The front card's
 * title and one-line summary sit under the stack.
 *
 * Each card's place in the stack is a CSS variable (--pos, 0 at the front),
 * so the server renders the stack as it first appears and nothing shifts.
 * With reduced motion it doesn't turn by itself and the moves are instant.
 * Styles live in globals.css under `.case-stack`.
 */
export function CaseStack({ items }: { items: ShowcaseItem[] }) {
  const [front, setFront] = useState(0);
  // Counts each step forward, so the card going round gets a fresh animation.
  const [turns, setTurns] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const paused = useRef(false);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  const n = items.length;
  const pos = (i: number) => (i - front + n) % n;

  const go = (i: number) => {
    const next = (i + n) % n;
    if (next === front) return;
    if (next === (front + 1) % n) setTurns((t) => t + 1);
    setFront(next);
  };

  // Turn by itself every few seconds, unless paused or off screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(section);
    const timer = window.setInterval(() => {
      if (visible && !paused.current && !document.hidden) {
        setFront((f) => (f + 1) % n);
        setTurns((t) => t + 1);
      }
    }, DWELL_MS);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [n]);

  const current = items[front];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="case-stack-title"
      aria-roledescription="carousel"
      className="case-stack-section"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") paused.current = true;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") paused.current = false;
      }}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      <h2 id="case-stack-title" className="showcase-title">
        Case studies
      </h2>
      <ul
        className="case-stack"
        // A sideways swipe turns the stack; up and down still scroll the page.
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          const s = swipe.current;
          if (!s || s.moved || Math.abs(e.clientX - s.x) < 40) return;
          s.moved = true;
          go(front + (e.clientX < s.x ? 1 : -1));
        }}
        onPointerUp={() => {
          // Leave it set until the click that follows has been ignored.
          if (!swipe.current?.moved) swipe.current = null;
        }}
      >
        {items.map((item, i) => (
          <li
            key={item.href}
            className="case-stack-card"
            data-front={pos(i) === 0 ? "" : undefined}
            // The card that just left the front drops away and comes round to the back.
            data-turn={pos(i) === n - 1 && turns > 0 ? turns % 2 : undefined}
            style={{ "--pos": pos(i) } as React.CSSProperties}
          >
            <Link
              href={item.href}
              className="case-stack-link"
              aria-label={item.title}
              draggable={false}
              onClick={(e) => {
                if (swipe.current?.moved) {
                  e.preventDefault();
                  swipe.current = null;
                  return;
                }
                // A card behind comes to the front first; the front one opens.
                if (pos(i) !== 0) {
                  e.preventDefault();
                  go(i);
                }
              }}
              // Tabbing to a card brings it forward. Only keyboard focus: a
              // mouse press focuses too, and would make the click open it.
              onFocus={(e) => {
                if (e.currentTarget.matches(":focus-visible")) go(i);
              }}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(min-width: 720px) 680px, 100vw"
                priority={i === 0}
                draggable={false}
              />
            </Link>
          </li>
        ))}
      </ul>
      <div className="case-stack-dots">
        {items.map((item, i) => (
          <button
            key={item.href}
            type="button"
            aria-label={`Show ${item.title}`}
            aria-current={i === front ? "true" : undefined}
            className="case-stack-dot"
            onClick={() => go(i)}
          />
        ))}
      </div>
      <p key={front} className="case-stack-caption" aria-live="polite">
        <Link href={current.href} className="case-stack-name">
          {current.title}
        </Link>
        <span className="case-stack-summary">{current.summary}</span>
      </p>
    </section>
  );
}

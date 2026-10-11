"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

export type CaseCard = {
  slug: string;
  label: string;
  title: string;
  summary: string;
  image?: string;
  alt: string;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** One row of cards when spread out; two by two below this. Matches globals.css. */
const ROW_QUERY = "(min-width: 860px)";

/** Undoes the fan's frame from globals.css, for when there's no script to fan. */
const NO_FAN = `
.case-deck { margin-top: calc(var(--card-h) * -0.4); height: auto; padding: 0 16px 48px; pointer-events: auto }
.case-deck .case-deck-stage { display: flex; position: static; height: auto; overflow: visible }
.case-deck .case-card, .case-deck:not([data-ready]) .case-card { position: static; opacity: 1 }
`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The case studies as a hand of cards on the landing page's fold: fanned out
 * from the middle and overlapping, with only their images showing above the
 * bottom edge. Scrolling down deals them out into a row (two by two on
 * phones) in the middle of the screen, while the headline scrolls away.
 *
 * Without JavaScript, or with reduced motion, the cards skip the fan: they
 * sit straight, side by side, peeking over the fold, and scroll like the
 * rest of the page. The fan's frame is in the CSS, so the server renders it
 * and nothing shifts when the script takes over.
 * Placement lives in globals.css under `.case-deck`.
 */
export function CaseDeck({ cards }: { cards: CaseCard[] }) {
  const deckRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  useLayoutEffect(() => {
    const deck = deckRef.current;
    if (!deck || window.matchMedia(REDUCED_MOTION).matches) return;

    const row = window.matchMedia(ROW_QUERY);
    let raf = 0;

    const layout = () => {
      raf = 0;
      const n = cardRefs.current.length;
      const first = cardRefs.current[0];
      if (!first) return;
      const vw = deck.clientWidth;
      const vh = window.innerHeight;
      const w = first.offsetWidth;
      const h = first.offsetHeight;
      // The deck starts at the top of the page; how far it's been scrolled
      // through its extra height is how far the cards are dealt out.
      const travel = deck.offsetHeight - vh;
      const t = ease(clamp(-deck.getBoundingClientRect().top / travel, 0, 1));
      const inRow = row.matches;
      const gap = inRow ? 24 : 12;
      const mid = (n - 1) / 2;

      // The fan: cards turned around a point well below the fold, so the
      // outer ones dip lower, like a hand of cards. Only the top `peek` of
      // the middle cards shows.
      const peek = h * (inRow ? 0.4 : 0.34);
      const radius = h * (inRow ? 2.4 : 1.6);
      const step = inRow ? 7 : 7.5;
      const pivotY = vh - peek + h / 2 + radius;

      const cols = inRow ? n : 2;
      const rows = Math.ceil(n / cols);

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const deg = (i - mid) * step;
        const rad = (deg * Math.PI) / 180;
        const fanX = vw / 2 + radius * Math.sin(rad);
        const fanY = pivotY - radius * Math.cos(rad);

        const col = i % cols;
        const r = Math.floor(i / cols);
        const outX = vw / 2 + (col - (cols - 1) / 2) * (w + gap);
        const outY = vh / 2 + (r - (rows - 1) / 2) * (h + gap);

        const x = lerp(fanX, outX, t) - w / 2;
        const y = lerp(fanY, outY, t) - h / 2;
        card.style.transform = `translate(${x}px, ${y}px) rotate(${lerp(deg, 0, t)}deg)`;
        // The middle cards sit on top of the fan.
        card.style.setProperty("--z", String(n - Math.round(Math.abs(i - mid) * 2)));
      });
      // Hovering a fanned card pulls it up out of the hand; once they're
      // dealt out it only lifts a little.
      deck.style.setProperty("--lift", `${lerp(peek * 0.35, 6, t)}px`);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(layout);
    };

    layout();
    deck.dataset.ready = "";
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    row.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      row.removeEventListener("change", schedule);
      delete deck.dataset.ready;
    };
  }, []);

  return (
    <nav ref={deckRef} aria-label="Case studies" className="case-deck">
      {/* Without JavaScript the cards never get fanned, so lay them out flat. */}
      <noscript>
        <style>{NO_FAN}</style>
      </noscript>
      <ul className="case-deck-stage">
        {cards.map((c, i) => (
          <li
            key={c.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="case-card"
          >
            <Link href={`/work/${c.slug}`} className="case-card-link">
              <span className="case-card-image">
                {c.image && (
                  <Image src={c.image} alt={c.alt} fill sizes="(min-width: 860px) 300px, 50vw" priority={i < 2} />
                )}
              </span>
              <span className="case-card-text">
                <span className="case-card-label">[{c.label}]</span>
                <span className="case-card-title">{c.title}</span>
                <span className="case-card-summary">{c.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

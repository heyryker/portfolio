"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ShowcaseItem } from "./Showcase";

/**
 * The four case studies as a stack of cards under the intro, after Ryker's
 * reference: the front card shows its image whole, and the ones behind it
 * step up and back, so only their title bands peek over the top.
 *
 * Clicking (or tapping, or tabbing to) a card behind brings it to the front;
 * clicking the front card opens the case study. The front card's one-line
 * summary sits under the stack.
 *
 * Each card's place in the stack is a CSS variable (--pos, 0 at the front),
 * so the server renders the stack as it first appears and nothing shifts.
 * The moves are CSS transitions, which reduced motion turns off.
 * Styles live in globals.css under `.case-stack`.
 */
export function CaseStack({ items }: { items: ShowcaseItem[] }) {
  const [front, setFront] = useState(0);
  const n = items.length;
  const pos = (i: number) => (i - front + n) % n;

  return (
    <section aria-labelledby="case-stack-title" className="case-stack-section">
      <h2 id="case-stack-title" className="showcase-title">
        Case studies
      </h2>
      <ul className="case-stack">
        {items.map((item, i) => (
          <li
            key={item.href}
            className="case-stack-card"
            data-front={pos(i) === 0 ? "" : undefined}
            style={{ "--pos": pos(i) } as React.CSSProperties}
          >
            <Link
              href={item.href}
              className="case-stack-link"
              onClick={(e) => {
                // A card behind comes to the front first; the front one opens.
                if (pos(i) !== 0) {
                  e.preventDefault();
                  setFront(i);
                }
              }}
              // Tabbing to a card brings it forward. Only keyboard focus: a
              // mouse press focuses too, and would make the click open it.
              onFocus={(e) => {
                if (e.currentTarget.matches(":focus-visible")) setFront(i);
              }}
            >
              <span className="case-stack-band">
                <span className="case-stack-name">{item.title}</span>
                <span className="case-stack-eyebrow">{item.eyebrow.replace("Case study · ", "")}</span>
              </span>
              <span className="case-stack-image">
                <Image src={item.image} alt={item.alt} fill sizes="(min-width: 720px) 680px, 100vw" priority={i === 0} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p key={front} className="case-stack-summary">
        {items[front].summary}
      </p>
    </section>
  );
}

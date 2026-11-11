"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./magic8.css";

// Short fortunes, sized to fit the triangle (about 40 characters at most).
const FORTUNES = [
  "A small risk pays off this week",
  "Someone is about to make you laugh",
  "Say yes to the next invitation",
  "Good news arrives by text",
  "Your next idea is a good one",
  "A lost thing turns up soon",
  "Trust the first draft",
  "Call the person you're thinking of",
  "Luck favors the early riser tomorrow",
  "A kind word comes back to you",
  "You'll find what you need in plain sight",
  "Today is good for starting over",
  "A stranger will teach you something",
  "Your patience is about to pay off",
  "Take the long way home",
  "Something you planted is about to bloom",
  "Expect a pleasant surprise",
  "The answer is simpler than you think",
  "An old friend is thinking of you",
  "Make the thing you want to see",
  "Rest now. Big things are coming",
  "Your hunch is right",
  "Adventure is closer than it looks",
  "Good things come in small packages",
  "Leave room for dessert",
  "You'll be glad you went",
  "Someone admires your work",
  "Change is coming. It looks good on you",
  "Your next move is the right one",
  "Today rewards the curious",
];

type Phase = "idle" | "sinking" | "rising" | "shown";

/**
 * A full-screen magic 8 ball. Tapping sinks the die into the dark liquid,
 * shakes the window, and floats a fortune back up into it.
 */
export function MagicEightBall() {
  const [text, setText] = useState("Tap to start");
  const [phase, setPhase] = useState<Phase>("idle");
  const [asked, setAsked] = useState(false);
  const last = useRef(-1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const ask = useCallback(() => {
    if (phase === "sinking" || phase === "rising") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = Math.floor(Math.random() * FORTUNES.length);
    if (i === last.current) i = (i + 1 + Math.floor(Math.random() * (FORTUNES.length - 1))) % FORTUNES.length;
    last.current = i;
    setPhase("sinking");
    const sink = reduced ? 250 : 900;
    timers.current.push(
      window.setTimeout(() => {
        setText(FORTUNES[i]);
        setAsked(true);
        setPhase("rising");
        // Two frames so the die starts hidden, then transitions up.
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase("shown")));
      }, sink),
    );
  }, [phase]);

  const hidden = phase === "sinking" || phase === "rising";

  return (
    <main className="m8-screen">
      <h1 className="sr-only">Magic 8 Ball</h1>
      <button
        type="button"
        onClick={ask}
        className="m8-ball"
        aria-label={asked ? "Get another fortune" : "Tap to start"}
      >
        <span className="m8-gloss" aria-hidden="true" />
        <span className={`m8-window ${phase === "sinking" ? "m8-shake" : ""}`} aria-hidden="true">
          <span className={`m8-die ${hidden ? "m8-die-hidden" : ""} ${phase === "rising" ? "m8-no-transition" : ""}`}>
            <svg viewBox="0 0 100 88" className="m8-triangle">
              <defs>
                <linearGradient id="m8-face" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e4d4ff" />
                  <stop offset="1" stopColor="#b994f5" />
                </linearGradient>
              </defs>
              <polygon points="50,3 97,85 3,85" fill="url(#m8-face)" stroke="#f3ebff" strokeOpacity="0.5" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span className="m8-answer">{text}</span>
          </span>
        </span>
      </button>
      <p className="m8-hint" aria-live="polite">
        {asked ? "Tap again for another fortune." : "Tap the ball to get your fortune."}
      </p>
    </main>
  );
}

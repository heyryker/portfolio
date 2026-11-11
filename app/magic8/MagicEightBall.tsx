"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./magic8.css";

// The twenty answers from the classic toy: ten yes, five maybe, five no.
const ANSWERS = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes, definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
];

type Phase = "idle" | "sinking" | "rising" | "shown";

/**
 * A full-screen magic 8 ball. Tapping sinks the die into the dark liquid,
 * shakes the ball, and floats a new answer back up into the window.
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
    let i = Math.floor(Math.random() * ANSWERS.length);
    if (i === last.current) i = (i + 1 + Math.floor(Math.random() * (ANSWERS.length - 1))) % ANSWERS.length;
    last.current = i;
    setPhase("sinking");
    const sink = reduced ? 250 : 900;
    timers.current.push(
      window.setTimeout(() => {
        setText(ANSWERS[i]);
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
        aria-label={asked ? "Ask again" : "Tap to start"}
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
        {asked ? "Ask another question, then tap again." : "Think of a yes or no question."}
      </p>
    </main>
  );
}

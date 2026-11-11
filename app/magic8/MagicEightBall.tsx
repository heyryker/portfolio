"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./magic8.css";

// Short, silly fortunes (bad luck, then good luck), sized to fit the triangle (about 40 characters at most).
const FORTUNES = [
  "Your wifi will go out at the worst time",
  "You will step in something wet. In socks",
  "A pigeon is judging you right now",
  "Your phone will die at 2%",
  "You'll reply all by accident",
  "Someone will spoil a show you love",
  "Your next sneeze will be in public",
  "You will lose a sock in the dryer",
  "The cashier will say 'you too'",
  "A self-checkout will call for help",
  "You'll forget why you walked in here",
  "Your toast will land butter side down",
  "You will bite your tongue at dinner",
  "A printer will betray you this week",
  "You'll wave at someone waving behind you",
  "Your earbuds will knot themselves",
  "You'll find a fry in your bag later",
  "The microwave will beep at 0:01",
  "A dog will like you more than its owner",
  "You'll say 'you're muted' twice today",
  "Your Uber driver will want to chat",
  "The last cookie will be gone",
  "You'll get the wobbly table",
  "Your password will need one more symbol",
  "A captcha will ask about traffic lights",
  "Your plant is plotting something",
  "You'll hit every red light",
  "Leftovers will be better than dinner",
  "Your cat has a secret second family",
  "You'll open the fridge for no reason",
  "A raccoon knows your name",
  "The update will take 47 minutes",
  "Your shoelace is about to untie",
  "You'll pull a door marked push",
  "Someone ate your yogurt. Again",
  "Your hiccups will return at noon",
  "You'll laugh at your own joke. Alone",
  "The group chat is talking about you",
  "Ask again after coffee",
  "Outlook hazy. Wifi hazier",
  // The good ones.
  "You'll find $20 in an old jacket",
  "Every light will be green today",
  "Your fries will come with extras",
  "You'll get the spot right by the door",
  "Your hair will look great all day",
  "A dog will choose you at the park",
  "The barista will spell your name right",
  "Your package arrives a day early",
  "You'll get the last slice. Guilt free",
  "Your playlist will read the room",
  "A nap will fix everything",
  "You'll catch the elevator just in time",
  "Your phone will hit 100% right on time",
  "Someone will laugh at your joke. Hard",
  "Your plants will forgive you",
  "The wifi will be strong wherever you go",
  "You'll nail the parallel park first try",
  "Free samples are in your future",
  "Your inbox will hit zero. Briefly",
  "Today your socks will match",
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
    const sink = reduced ? 250 : 1000;
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
          <span className={`m8-die ${hidden ? "m8-die-hidden" : ""} ${phase === "rising" ? "m8-die-rising" : ""}`}>
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

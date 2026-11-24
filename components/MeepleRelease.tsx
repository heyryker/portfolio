"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MeepleRelease as Release } from "@/lib/meeple-release";

/**
 * The meeple button, fixed in the bottom-left corner. Hover it and it says
 * "Release the meeples"; press it and all five burst out of it as confetti,
 * pull themselves together and make a nuisance of themselves for a while
 * before running back in (lib/meeple-release.ts). Pressed again while they're
 * out, it calls them home early.
 *
 * While they're out, a second round button with a little pixel house pops up
 * beside it: the way to the village (/village). It's the only way in from the
 * site now that there's no menu, and it goes again once the cop car has
 * brought everyone home (Ryker's call, 2026-11-24). The page itself stays
 * live and in the sitemap.
 *
 * The meeples are decorative and drawn on a canvas that ignores the pointer,
 * so the button is the only part a keyboard or screen reader meets.
 */
export function MeepleRelease() {
  const button = useRef<HTMLButtonElement>(null);
  const engine = useRef<Release | null>(null);
  const [out, setOut] = useState(false);

  // Leaving the page puts the meeples away. With cacheComponents, Next keeps
  // the landing page alive but hidden (React <Activity>) while you're on
  // another route, so this cleanup runs without unmounting: reset the state
  // too, or coming back from the village shows the "out" buttons with no
  // meeples. Also covers the back button restoring the page.
  useEffect(
    () => () => {
      engine.current?.destroy();
      engine.current = null;
      setOut(false);
    },
    [],
  );

  const onClick = () => {
    if (engine.current) {
      engine.current.recall();
      return;
    }
    const el = button.current;
    if (!el) return;
    const release = new Release({
      button: el,
      // A little gulp as each one jumps back in.
      onHome: () => el.animate([{ scale: "1" }, { scale: "1.14" }, { scale: "1" }], { duration: 220, easing: "ease-out" }),
      onDone: () => {
        engine.current = null;
        setOut(false);
      },
    });
    engine.current = release;
    setOut(true);
    release.start();
  };

  const label = out ? "Call the meeples home" : "Release the meeples";

  return (
    <div className="meeple-release">
      <button
        ref={button}
        type="button"
        aria-label={label}
        onClick={onClick}
        data-out={out ? "" : undefined}
        className="meeple-release-button"
      >
        {/* The meeple from CLAUDE.md §5: head with eyes, arms, body, legs. */}
        <svg viewBox="0 0 33 44" aria-hidden="true" className="meeple-release-icon">
          <rect x="11" y="0" width="11" height="11" />
          <rect x="0" y="11" width="33" height="11" />
          <rect x="11" y="22" width="11" height="11" />
          <rect x="0" y="33" width="11" height="11" />
          <rect x="22" y="33" width="11" height="11" />
          <rect x="14" y="2" width="2" height="4" className="meeple-release-eye" />
          <rect x="17" y="2" width="2" height="4" className="meeple-release-eye" />
        </svg>
      </button>
      {out && (
        <Link href="/village" aria-label="Visit the meeples' village" className="meeple-village-button">
          {/* A pixel house on the meeple's 11-unit grid: stepped roof, door. */}
          <svg viewBox="0 0 55 55" aria-hidden="true" className="meeple-village-icon">
            <rect x="22" y="0" width="11" height="11" />
            <rect x="11" y="11" width="33" height="11" />
            <rect x="0" y="22" width="55" height="11" />
            <rect x="0" y="33" width="22" height="22" />
            <rect x="33" y="33" width="22" height="22" />
          </svg>
        </Link>
      )}
      {/* Both tips share one spot, so each starts just right of the buttons. */}
      <span aria-hidden="true" className="meeple-release-tips">
        <span className="meeple-release-tip" data-tip="release">
          {out ? "Call them home" : "Release the meeples"}
        </span>
        <span className="meeple-release-tip" data-tip="village">
          Visit the village
        </span>
      </span>
    </div>
  );
}

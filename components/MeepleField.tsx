"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MeepleEngine } from "@/lib/meeple-engine";
import { StaticMeeples } from "./StaticMeeples";
import { Icon } from "./Icon";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * The live meeples. The server (and anyone who prefers reduced motion) gets
 * the static meeples in their mockup poses; in the browser they're swapped
 * for the canvas engine, which starts from exactly the same positions.
 *
 * Must be rendered inside the landing page's [data-meeple-root] container,
 * which holds the headline elements the meeples recolor.
 */
export function MeepleField() {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MeepleEngine | null>(null);
  // The whistle wiggles and toots while it's blown, and stops nudging for
  // attention once it's been found.
  const [blowing, setBlowing] = useState(false);
  const [used, setUsed] = useState(false);

  useEffect(() => {
    if (!blowing) return;
    const id = setTimeout(() => setBlowing(false), 700);
    return () => clearTimeout(id);
  }, [blowing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.closest<HTMLElement>("[data-meeple-root]");
    if (reduced || !canvas || !root) return;
    const engine = new MeepleEngine(root, canvas);
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [reduced]);

  // Reduced motion: the meeples stand still, so there's no whistle either.
  if (reduced) return <StaticMeeples />;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        // Above the case-study cards (z-20), so meeples walk over them; below the header.
        className="pointer-events-none absolute inset-0 z-[25] size-full"
      />
      {/* Calls a dance break (lib/meeple-engine.ts). Unlike the other meeple
          tricks this one is meant to be found: a floating button that nudges
          now and then until it's been tried. Fixed to the corner so it's there
          wherever the visitor has scrolled; the dance happens in view. */}
      <button
        type="button"
        aria-label="Blow the whistle"
        title="Blow the whistle"
        data-blowing={blowing ? "" : undefined}
        data-used={used ? "" : undefined}
        onClick={() => {
          if (!engineRef.current?.whistle()) return;
          setBlowing(true);
          setUsed(true);
        }}
        className="whistle"
      >
        <Icon name="sports" className="whistle-icon" />
        <span aria-hidden="true" className="whistle-toot" />
      </button>
    </>
  );
}

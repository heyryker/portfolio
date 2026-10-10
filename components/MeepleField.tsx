"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { MeepleEngine } from "@/lib/meeple-engine";
import { StaticMeeples } from "./StaticMeeples";

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.closest<HTMLElement>("[data-meeple-root]");
    if (reduced || !canvas || !root) return;
    const engine = new MeepleEngine(root, canvas);
    engine.start();
    return () => engine.destroy();
  }, [reduced]);

  if (reduced) return <StaticMeeples />;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[5] size-full"
    />
  );
}

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { VillageEngine } from "@/lib/village-engine";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * The village canvas and the two town buttons. With reduced motion the
 * village is drawn once, everyone standing at home, and the buttons go.
 *
 * Must be rendered inside the village page's [data-village-root] container,
 * which the engine sizes to fit the village.
 */
export function VillageField() {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VillageEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.closest<HTMLElement>("[data-village-root]");
    if (!canvas || !root) return;
    const engine = new VillageEngine(root, canvas, reduced);
    engine.start();
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [reduced]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
      {!reduced && (
        <div className="absolute bottom-[52px] left-[22px] z-10 flex gap-[22px] md:right-[44px] md:bottom-[22px] md:left-auto">
          <button type="button" onClick={() => engineRef.current?.ringBell()} className="cursor-pointer text-sm tracking-[0.08em] whitespace-nowrap text-muted uppercase transition-colors hover:text-ink focus-visible:text-ink">
            [RING THE BELL]
          </button>
          <button type="button" onClick={() => engineRef.current?.holdCourt()} className="cursor-pointer text-sm tracking-[0.08em] whitespace-nowrap text-muted uppercase transition-colors hover:text-ink focus-visible:text-ink">
            [HOLD COURT]
          </button>
        </div>
      )}
    </>
  );
}

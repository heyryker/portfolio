import { MEEPLES } from "@/lib/meeples";
import { Meeple } from "./Meeple";

/**
 * The five meeples, standing still in their mockup positions.
 *
 * Build step 2 only: the engine in step 3 replaces this with the moving,
 * draggable version. These poses stay as the reduced-motion fallback.
 *
 * The layer sits above the headline (so meeples can walk over it) but below
 * the nav and header, and ignores pointer events so it never blocks a click.
 */
export function StaticMeeples() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
      {MEEPLES.map((m) => (
        <Meeple
          key={m.id}
          color={m.color}
          className="absolute"
          style={{
            // Keep the meeple fully on screen on narrow viewports.
            left: `min(${m.home.x * 100}%, calc(100% - var(--meeple-px) * 3 - 8px))`,
            top: `min(${m.home.y * 100}%, calc(100% - var(--meeple-px) * 4 - 8px))`,
          }}
        />
      ))}
    </div>
  );
}

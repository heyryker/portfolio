import { MEEPLES } from "@/lib/meeples";
import { Meeple } from "./Meeple";

/**
 * The five meeples, standing still in their mockup positions.
 *
 * This is what the server renders and what anyone with reduced motion sees.
 * MeepleField swaps it for the live canvas engine in the browser.
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
          className="static-meeple absolute"
          style={
            {
              "--home-x": `${m.home.x * 100}%`,
              "--home-y": `${m.home.y * 100}%`,
              "--phone-home-x": `${(m.phoneHome ?? m.home).x * 100}%`,
              "--phone-home-y": `${(m.phoneHome ?? m.home).y * 100}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

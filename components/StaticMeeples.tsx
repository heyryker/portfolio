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
    // On the landing screen, the top of the scrolling page.
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-svh min-h-[480px]">
      {MEEPLES.map((m) => (
        <Meeple
          key={m.id}
          color={m.color}
          hat={m.id}
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

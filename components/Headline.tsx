import { PixelSquare } from "./PixelSquare";

/**
 * HEY [I'M] / RYKER, staggered as in the mockup.
 *
 * Everything is sized in em off one font size, so the whole lockup scales
 * with the viewport and keeps its proportions. The offsets were measured
 * from design/landing-mockup.png (HEY cap height ≈ 140px at a 1490px-wide
 * viewport).
 *
 * The blue elements carry data-meeple-tint ("fill" or "text") so the meeple
 * engine can recolor them when a meeple walks over. Their 900ms transition is
 * the fade back to the accent; the engine shortens it while tinting.
 */
export function Headline() {
  return (
    <h1
      aria-label="Hey, I'm Ryker."
      // The brief asks for 800–900. The mockup reads closer to 700, so this
      // uses 800: the lighter end of the brief's range.
      className="relative font-extrabold leading-none tracking-[-0.015em] text-ink select-none"
      style={{ fontSize: "var(--headline-size)" }}
    >
      <span aria-hidden="true" className="relative block whitespace-nowrap">
        <PixelSquare
          data-meeple-tint="fill"
          className="absolute transition-colors duration-900"
          style={{
            width: "0.13em",
            height: "0.13em",
            left: "-0.07em",
            // Inter's cap top sits ~0.136em below the line box at line-height 1.
            top: "0.135em",
          }}
        />
        HEY
        <span
          data-meeple-tint="text"
          className="transition-colors duration-900 ml-[0.04em] text-[0.6em] font-semibold tracking-normal text-accent"
        >
          [I&rsquo;M]
        </span>
      </span>
      <span
        aria-hidden="true"
        className="mt-[0.03em] block whitespace-nowrap pl-[2em]"
      >
        RYKER
        <PixelSquare
          data-meeple-tint="fill"
          className="-ml-[0.08em] transition-colors duration-900"
          style={{ width: "0.13em", height: "0.13em" }}
        />
      </span>
    </h1>
  );
}

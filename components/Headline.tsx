import { PixelSquare } from "./PixelSquare";

/**
 * HEY [I'M] / RYKER, staggered as in the mockup and locked to the graph-paper
 * grid: the cap tops and baselines of both lines sit on horizontal grid lines,
 * and the left edges of H and R sit on vertical ones. The sizes in cells
 * (cap height, line gap, RYKER's indent) are set per breakpoint in
 * globals.css under `.headline-grid`.
 *
 * The two pixel squares are deliberately askew from the letters, as Ryker drew
 * them in the mockup: the top-left one sits just outside H's corner, and the
 * bottom-right one overlaps the end of R's leg.
 *
 * The blue elements carry data-meeple-tint so the meeple engine (step 3) can
 * find them and recolor them when a meeple walks over.
 */
export function Headline() {
  return (
    <h1
      aria-label="Hey, I'm Ryker."
      // The brief asks for 800–900. The mockup reads closer to 700, so this
      // uses 800: the lighter end of the brief's range.
      className="headline-grid font-extrabold leading-none tracking-[-0.015em] text-ink select-none"
    >
      <PixelSquare
        data-meeple-tint=""
        className="absolute"
        style={{
          width: "var(--hl-square)",
          height: "var(--hl-square)",
          top: 0,
          left: "calc(var(--hl-square) * -1)",
        }}
      />
      <span aria-hidden="true" className="headline-line" style={{ top: 0, left: 0 }}>
        HEY
        <span
          data-meeple-tint=""
          className="ml-[0.04em] text-[0.6em] font-semibold tracking-normal text-accent"
        >
          [I&rsquo;M]
        </span>
      </span>
      <span
        aria-hidden="true"
        className="headline-line"
        style={{ top: "var(--hl-line2-top)", left: "var(--hl-indent)" }}
      >
        RYKER
      </span>
      <PixelSquare
        data-meeple-tint=""
        className="absolute"
        style={{
          width: "var(--hl-square)",
          height: "var(--hl-square)",
          top: "calc(var(--hl-height) - var(--hl-square))",
          left: "calc(var(--hl-indent) + var(--hl-ryker-ink) - var(--hl-square) / 3)",
        }}
      />
    </h1>
  );
}

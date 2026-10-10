import { PixelSquare } from "./PixelSquare";

/**
 * HEY [I'M] / RYKER, staggered as in the mockup and locked to the graph-paper
 * grid: the cap tops and baselines of both lines sit on horizontal grid lines,
 * and the left edges of H and R sit on vertical ones. The sizes in cells
 * (cap height, line gap, RYKER's indent) are set per breakpoint in
 * globals.css under `.headline-grid`.
 *
 * The type is Inter with two letters modified, as Ryker drew it: the top-left
 * corner of H's stem and the bottom of R's leg are cut out, and each cut-out
 * block is pushed out diagonally as a blue pixel square that touches the
 * letter only at a corner. The cuts are clip-paths on `.hl-h` and `.hl-r`.
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
      <span aria-hidden="true" className="headline-line" style={{ top: 0, left: 0 }}>
        <span className="hl-letter">
          <span className="hl-h">H</span>
          <PixelSquare data-meeple-tint="" className="hl-square hl-square-h" />
        </span>
        EY
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
        RYKE
        <span className="hl-letter">
          <span className="hl-r">R</span>
          <PixelSquare data-meeple-tint="" className="hl-square hl-square-r" />
        </span>
      </span>
    </h1>
  );
}

import Link from "next/link";
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
 * The blue elements carry data-meeple-tint ("fill" or "text") so the meeple
 * engine can recolor them when a meeple walks over. Their 900ms transition is
 * the fade back to the accent; the engine shortens it while tinting.
 * data-meeple-click says what a click on a square does (see the engine).
 *
 * "[I'M]" links to the About page, where the rest of the sentence lives. The
 * link wraps the tinted span without padding, so nothing moves off the grid.
 */
export function Headline() {
  return (
    <h1
      // The brief asks for 800–900. The mockup reads closer to 700, so this
      // uses 800: the lighter end of the brief's range.
      className="headline-grid font-extrabold leading-none tracking-[-0.015em] text-ink select-none"
    >
      {/* Screen readers hear "Hey, I'm Ryker", with the link on "I'm Ryker". */}
      <span className="sr-only">Hey, </span>
      <span className="headline-line" style={{ top: 0, left: 0 }}>
        <span aria-hidden="true">
          <span className="hl-letter">
            <span className="hl-h">H</span>
            <PixelSquare data-meeple-tint="fill" data-meeple-click="burst" className="transition-colors duration-900 hl-square hl-square-h" />
          </span>
          EY
        </span>
        <Link
          href="/about"
          aria-label="I'm Ryker (about and contact)"
          data-meeple-glance=""
          className="group ml-[0.04em] text-[0.6em] font-semibold tracking-normal"
        >
          <span
            aria-hidden="true"
            data-meeple-tint="text"
            className="transition-colors duration-900 text-accent group-hover:text-ink group-focus-visible:text-ink"
          >
            [I&rsquo;M]
          </span>
        </Link>
      </span>
      <span
        aria-hidden="true"
        className="headline-line"
        style={{ top: "var(--hl-line2-top)", left: "var(--hl-indent)" }}
      >
        RYKE
        <span className="hl-letter">
          <span className="hl-r">R</span>
          <PixelSquare data-meeple-tint="fill" data-meeple-click="squash" className="transition-colors duration-900 hl-square hl-square-r" />
        </span>
      </span>
    </h1>
  );
}

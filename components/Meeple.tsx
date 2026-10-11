import { HATS } from "@/lib/meeple-hats";
import { MEEPLE_BLOCKS, MEEPLE_COLS, MEEPLE_ROWS, type MeepleId } from "@/lib/meeples";

// Work in 1/11ths of a block so the eye slits land on whole device pixels at
// the default 11px block size.
const U = 11;

type MeepleProps = {
  color: string;
  /** Size of one meeple pixel in CSS px. */
  px?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Put this meeple's hat on (lib/meeple-hats.ts). It sits above the box. */
  hat?: MeepleId;
};

/** A single pixel meeple, rendered as crisp SVG rects. Decorative only. */
export function Meeple({ color, px = 11, className, style, hat }: MeepleProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={MEEPLE_COLS * px}
      height={MEEPLE_ROWS * px}
      viewBox={`0 0 ${MEEPLE_COLS * U} ${MEEPLE_ROWS * U}`}
      className={`pixelated ${className ?? ""}`}
      style={style}
      overflow="visible"
    >
      {MEEPLE_BLOCKS.map((b) => (
        <rect
          key={`${b.x}-${b.y}`}
          x={b.x * U}
          y={b.y * U}
          width={U}
          height={U}
          fill={color}
        />
      ))}
      {hat &&
        HATS[hat].map((r, i) => (
          <rect key={`hat-${i}`} x={U + r.x} y={r.y} width={r.w} height={r.h} fill={r.c} />
        ))}
      {/* Two small eye slits, as in the mockup. */}
      <rect x={U + 3} y={2} width={2} height={4} fill="var(--color-bg)" />
      <rect x={U + 6} y={2} width={2} height={4} fill="var(--color-bg)" />
    </svg>
  );
}

import { MEEPLE_BLOCKS, MEEPLE_COLS, MEEPLE_ROWS } from "@/lib/meeples";

// Work in 1/11ths of a block so the eye slits land on whole device pixels at
// the default 11px block size.
const U = 11;

type MeepleProps = {
  color: string;
  /** Size of one meeple pixel in CSS px. */
  px?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** A single pixel meeple, rendered as crisp SVG rects. Decorative only. */
export function Meeple({ color, px = 11, className, style }: MeepleProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={MEEPLE_COLS * px}
      height={MEEPLE_ROWS * px}
      viewBox={`0 0 ${MEEPLE_COLS * U} ${MEEPLE_ROWS * U}`}
      className={`pixelated ${className ?? ""}`}
      style={style}
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
      {/* Two small eye slits, as in the mockup. */}
      <rect x={U + 3} y={2} width={2} height={4} fill="var(--color-bg)" />
      <rect x={U + 6} y={2} width={2} height={4} fill="var(--color-bg)" />
    </svg>
  );
}

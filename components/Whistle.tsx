// A coach's whistle in pixels: a short mouthpiece on the left, the round
// chamber with its air slot on top, and the lanyard ring hanging off the
// back. X is the whistle, O the slot, R the ring, "." empty. Kept chunky and
// short-nosed so it reads as a whistle at 4px a pixel.
const ROWS = [
  "......XXXX...",
  "XXXX.XOOXXX..",
  "XXXXXXXXXXXX.",
  "XXXXXXXXXXXX.",
  ".....XXXXXXX.",
  "......XXXXX.R",
  "..........R.R",
  "...........R.",
];
const COLORS: Record<string, string> = { X: "var(--whistle-color)", O: "var(--color-bg)", R: "var(--color-ink-soft)" };

/** The whistle's pixel art. Decorative; the button around it carries the label. */
export function WhistleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={ROWS[0].length * 4}
      height={ROWS.length * 4}
      viewBox={`0 0 ${ROWS[0].length} ${ROWS.length}`}
      className={`pixelated ${className ?? ""}`}
    >
      {ROWS.flatMap((row, y) =>
        [...row].map((ch, x) =>
          COLORS[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[ch]} /> : null,
        ),
      )}
    </svg>
  );
}

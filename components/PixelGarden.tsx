/**
 * A strip of pixel grass with a few flowers along the bottom of the About and
 * blog headers. Same pixel size, patterns and colors as the garden the meeples
 * plant on the landing page (lib/meeple-engine.ts), but static. Decorative only.
 */

// Half a meeple pixel, like the landing page's flowers.
const F = 5.5;
const STEM = "var(--color-meeple-green)";

// Grass: one blade height per column, repeated across the header. Picked by
// hand: a low turf line with taller tufts and the odd gap.
const BLADES = [
  1, 1, 2, 1, 1, 0, 1, 2, 3, 2, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 0, 1, 1, 1,
  2, 1, 3, 2, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 0, 1, 2, 1, 1, 2, 3, 1, 1, 0,
]
const TILE = BLADES.length * F;

// Rows top to bottom, as on the landing page. S stem, L leaf, P petal, C center.
const BLOOM = [".P.", "PCP", ".P.", ".S.", "LS.", ".S."];

type Bloom = { left: string; petal: string; phone?: boolean; desktop?: boolean };

// Spots chosen to stay clear of the back link and the peeking meeples.
const BLOOMS: Bloom[] = [
  { left: "16%", petal: "var(--color-meeple-purple)", desktop: true },
  { left: "31%", petal: "var(--color-meeple-yellow)", desktop: true },
  { left: "33%", petal: "var(--color-meeple-red)", phone: true },
  { left: "47%", petal: "var(--color-meeple-blue)", desktop: true },
  { left: "44%", petal: "var(--color-meeple-yellow)", phone: true },
  { left: "61%", petal: "var(--color-meeple-purple)", desktop: true },
  { left: "73%", petal: "var(--color-meeple-red)", desktop: true },
  { left: "88%", petal: "var(--color-meeple-blue)", phone: true },
];

function Flower({ petal }: { petal: string }) {
  // Yellow flowers get a red middle, the rest a yellow one (as on the landing page).
  const middle = petal.includes("yellow") ? "var(--color-meeple-red)" : "var(--color-meeple-yellow)";
  return (
    <svg width={3 * F} height={BLOOM.length * F} shapeRendering="crispEdges" className="pixelated block">
      {BLOOM.flatMap((row, y) =>
        [...row].map((ch, x) => {
          const fill = ch === "P" ? petal : ch === "C" ? middle : ch === "S" || ch === "L" ? STEM : null;
          return fill ? <rect key={`${x}-${y}`} x={x * F} y={y * F} width={F} height={F} fill={fill} /> : null;
        }),
      )}
    </svg>
  );
}

export function PixelGarden() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0">
      <svg width="100%" height={3 * F} shapeRendering="crispEdges" className="pixelated block">
        <defs>
          <pattern id="pixel-grass" width={TILE} height={3 * F} patternUnits="userSpaceOnUse">
            {BLADES.map((h, x) =>
              h ? <rect key={x} x={x * F} y={(3 - h) * F} width={F} height={h * F} fill={STEM} /> : null,
            )}
          </pattern>
        </defs>
        <rect width="100%" height={3 * F} fill="url(#pixel-grass)" />
      </svg>
      {BLOOMS.map((b) => (
        <div
          key={b.left}
          className={`absolute bottom-0 ${b.phone ? "md:hidden" : ""} ${b.desktop ? "max-md:hidden" : ""}`}
          style={{ left: `round(nearest, ${b.left}, ${F}px)` }}
        >
          <Flower petal={b.petal} />
        </div>
      ))}
    </div>
  );
}

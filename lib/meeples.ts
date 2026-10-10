export type MeepleId = "yellow" | "green" | "purple" | "red" | "blue";

export type MeepleConfig = {
  id: MeepleId;
  name: string;
  /** The little name tag drawn over its head on the landing page. */
  tag: string;
  /** CSS color, from the meeple tokens in globals.css. */
  color: string;
  /** The same color as a hex literal, for the canvas (keep in sync with globals.css). */
  hex: string;
  /** Short note on how it reacts to the cursor (CLAUDE.md §5). */
  personality: string;
  /**
   * Resting position from design/landing-mockup.png, as a fraction of the
   * viewport (top-left corner of the meeple). Used for the static layout and,
   * later, as the reduced-motion pose.
   */
  home: { x: number; y: number };
};

export const MEEPLES: MeepleConfig[] = [
  {
    id: "yellow",
    name: "The Curious One",
    tag: "CURIOUS AGENT",
    color: "var(--color-meeple-yellow)",
    hex: "#FBEC5A",
    personality: "Drifts toward the cursor and follows at a polite distance.",
    home: { x: 0.221, y: 0.143 },
  },
  {
    id: "purple",
    name: "The Watcher",
    tag: "WATCHFUL AGENT",
    color: "var(--color-meeple-purple)",
    hex: "#985DF6",
    personality: "Perches near the headline and follows the cursor with its eyes.",
    home: { x: 0.528, y: 0.13 },
  },
  {
    id: "green",
    name: "The Shy One",
    tag: "SCARED AGENT",
    color: "var(--color-meeple-green)",
    hex: "#5FCC8A",
    personality: "Scoots away when the cursor gets close, then peeks back. Keeps a carrot patch in the bottom-left corner.",
    // Starts in its bottom-left hideout, between HEY and the case-study links.
    home: { x: 0.27, y: 0.67 },
  },
  {
    id: "red",
    name: "The Chaotic One",
    tag: "CHAOTIC AGENT",
    color: "var(--color-meeple-red)",
    hex: "#E05A32",
    personality: "Fast. Bumps into the others and rushes the cursor.",
    home: { x: 0.11, y: 0.609 },
  },
  {
    id: "blue",
    name: "The Sleepy One",
    tag: "SLEEPY AGENT",
    color: "var(--color-meeple-blue)",
    hex: "#58B9F8",
    personality: "Naps. Only wakes if clicked or hit by a thrown meeple.",
    home: { x: 0.937, y: 0.871 },
  },
];

/**
 * The meeple on a 3x4 pixel grid (CLAUDE.md §5):
 *
 *    . H .
 *    X X X
 *    . X .
 *    X . X
 *
 * Each entry is one block, in pixel units. Keeping blocks separate (rather
 * than one path) lets the engine scatter them individually when it explodes.
 */
export const MEEPLE_BLOCKS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 1, y: 0 }, // head
  { x: 0, y: 1 }, // left arm
  { x: 1, y: 1 }, // shoulders
  { x: 2, y: 1 }, // right arm
  { x: 1, y: 2 }, // body
  { x: 0, y: 3 }, // left leg
  { x: 2, y: 3 }, // right leg
];

export const MEEPLE_COLS = 3;
export const MEEPLE_ROWS = 4;

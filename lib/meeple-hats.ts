import type { MeepleId } from "./meeples";

/**
 * Each meeple's hat, as rects in px from the top-left of its head block (one
 * 11px meeple pixel), so negative y is above the head. Shared by the landing
 * engine, the village engine and the static SVG meeples so a meeple wears the
 * same hat everywhere.
 */
export type HatRect = { x: number; y: number; w: number; h: number; c: string };

const INK = "#221F20"; // `ink-soft`
const GOLD = "#F5C518";
const RED = "#E05A32";
const YELLOW = "#FBEC5A";
const PURPLE = "#985DF6";
const LEATHER = "#A0673A";
const LEATHER_DARK = "#5E3B21";
const STRAW = "#E9CC88";
const STRAW_DARK = "#C9A55A";

export const HATS: Record<MeepleId, HatRect[]> = {
  // The Curious One: a cowboy hat, to go with the lasso. Dented crown, brim
  // curled up at the tips.
  yellow: [
    { x: -4, y: -2, w: 19, h: 2, c: LEATHER },
    { x: -6, y: -4, w: 2, h: 2, c: LEATHER },
    { x: 15, y: -4, w: 2, h: 2, c: LEATHER },
    { x: 1, y: -7, w: 9, h: 5, c: LEATHER },
    { x: 1, y: -8, w: 3, h: 1, c: LEATHER },
    { x: 7, y: -8, w: 3, h: 1, c: LEATHER },
    { x: 1, y: -4, w: 9, h: 1, c: LEATHER_DARK },
  ],
  // The Shy One: a floppy straw sun hat for gardening, brim drooping low, with
  // a flower in the band.
  green: [
    { x: -4, y: -2, w: 19, h: 2, c: STRAW },
    { x: -5, y: 0, w: 2, h: 2, c: STRAW },
    { x: 14, y: 0, w: 2, h: 2, c: STRAW },
    { x: 1, y: -6, w: 9, h: 4, c: STRAW },
    { x: 2, y: -7, w: 7, h: 1, c: STRAW },
    { x: 1, y: -3, w: 9, h: 1, c: STRAW_DARK },
    { x: 7, y: -5, w: 3, h: 3, c: PURPLE },
    { x: 8, y: -4, w: 1, h: 1, c: YELLOW },
  ],
  // The Watcher, the village mayor: a top hat with a gold band.
  purple: [
    { x: -2, y: -2, w: 15, h: 2, c: INK },
    { x: 1, y: -10, w: 9, h: 8, c: INK },
    { x: 1, y: -5, w: 9, h: 2, c: GOLD },
  ],
  // The Chaotic One: little devil horns, curving up and out.
  red: [
    { x: 0, y: -2, w: 3, h: 2, c: INK },
    { x: -1, y: -4, w: 2, h: 2, c: INK },
    { x: -2, y: -6, w: 2, h: 2, c: INK },
    { x: 8, y: -2, w: 3, h: 2, c: INK },
    { x: 10, y: -4, w: 2, h: 2, c: INK },
    { x: 11, y: -6, w: 2, h: 2, c: INK },
  ],
  // The Sleepy One: a nightcap. It droops to the left so it stays clear of
  // the z's.
  blue: [
    { x: -1, y: -3, w: 13, h: 4, c: RED },
    { x: 1, y: -6, w: 8, h: 3, c: RED },
    { x: -2, y: -8, w: 5, h: 2, c: RED },
    { x: -5, y: -9, w: 3, h: 3, c: YELLOW },
  ],
};

/** How far a meeple's hat rises above its head, in px. */
export function hatHeight(id: MeepleId) {
  return -Math.min(0, ...HATS[id].map((r) => r.y));
}

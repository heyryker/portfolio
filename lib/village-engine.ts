/**
 * The village (/village): the meeples' own town.
 *
 * A pale green field with a house for each meeple (roof in its color), a
 * fenced community garden in the middle, the Town Hall at the top and the
 * courthouse at the bottom, all joined by sand paths. The layout is rolled
 * fresh on every visit: which houses go where, the trees, rocks, flowers and
 * the odd pond.
 *
 * The meeples live their lives on the paths: they garden (plant, water and
 * harvest), carry the harvest to a friend's door, knock and visit, go home
 * (lights on, smoke from the chimney), nap and say hi when they pass. The town
 * runs on a few community moments:
 *
 * - Town meetings: the bell rings (on its own now and then, or when someone
 *   clicks the Town Hall), everyone gathers, the Watcher (the mayor) puts a
 *   motion, they vote and then act on it.
 * - Court: when the Chaotic One tramples the garden (or someone clicks the
 *   courthouse), the town holds court and the sentence is three flowers.
 * - Helping out: when a meeple explodes, the neighbors run over and wait
 *   while it pulls itself back together.
 *
 * Cows, sheep and bunnies roam the open grass. Tap one and it reacts: the
 * cows moo in a chorus, a sheep loses its wool (it grows back) and a bunny
 * has a baby bunny.
 *
 * The post office and the church sit on house plots. Meeples post letters to
 * each other and pick up their own mail (tap the post office and a letter
 * arrives); tap the church, or wait, for choir practice on its steps.
 *
 * Everything the meeples do on the homepage (lib/meeple-engine.ts) works here
 * too, so they keep their tricks if the homepage changes: the Curious One
 * follows the cursor and lassos it, the Chaotic One rushes it, they plant
 * flowers, grass and carrots out on the grass (which the Chaotic One
 * tramples), the Sleepy One sleepwalks, and the whistle calls a dance break.
 * The two blue squares from the homepage headline stand on a monument near
 * the Town Hall: fast meeples knock them loose, the Curious One lassos them
 * home, and they can be thrown. Click HEY's square and it bursts and
 * reassembles; click the period and it squashes flat, a gold flower pops up
 * and the whole town gathers round to hop in praise.
 *
 * As on the landing page (lib/meeple-engine.ts, whose look and physics this
 * shares), meeples can be dragged, thrown and clicked to explode, and it's one
 * small requestAnimationFrame loop on one canvas. The world is seen from a
 * little above, so things further down the page are drawn in front.
 *
 * The page grows taller than the screen on phones when the village needs the
 * room. Touches only claim the page when they land on a meeple, so swiping the
 * grass still scrolls.
 */
import { MEEPLE_BLOCKS, MEEPLES, type MeepleConfig, type MeepleId } from "./meeples";
import { HATS, hatHeight } from "./meeple-hats";

/** One meeple pixel, in CSS px. Buildings, plants and trees use half pixels (U). */
const P = 11;
const W = 3 * P;
const H = 4 * P;
const U = P / 2;

const FRICTION = 1.8;
const BOUNCE = 0.7;
const COLLIDE = 0.75;
const TUMBLE_SPEED = 70;
const MAX_THROW = 2200;
const SHAKE_TIME = 0.45;
const SCATTER_TIME = 2.4;
const FADE_TIME = 0.3; // stepping through a door
const HOP_TIME = 0.42;
const HOP_HEIGHT = 14;

// Building sizes, in half pixels. The post office and the church take a
// house's plot.
const HOUSE = { w: 16, h: 17 };
const HALL = { w: 32, h: 30 };
const COURT = { w: 30, h: 22 };

/*
 * The village's own colors. The meeple colors (lib/meeples.ts) stay the
 * accents: roofs, petals, bunting. Everything else is soft and light so the
 * page still feels like the rest of the site.
 */
const C = {
  grass: "#EAF6EE",
  tuft: "#C6EAD3",
  tuftDark: "#A9DEBC",
  path: "#F5ECDB",
  pebble: "#E6D7B9",
  soil: "#F1E3C8",
  furrow: "#E3CFA8",
  wet: "#D5BC92",
  fence: "#C9A27A",
  wall: "#FFFFFF",
  wallShade: "#EEEFEF",
  stone: "#F7F7F8",
  stoneShade: "#E4E5E7",
  stoneDark: "#CDCFD2",
  ink: "#221F20",
  muted: "#A1A3A6",
  glass: "#D9EEFC",
  glow: "#FBEC5A",
  gold: "#F5C518",
  leaf: "#5FCC8A",
  leafDark: "#43B373",
  leafLight: "#9EDDB6",
  pine: "#3FA866",
  trunk: "#B08660",
  water: "#C6E6FC",
  waterLight: "#E8F5FE",
  rock: "#D3D5D8",
  rockLight: "#E9EAEC",
  white: "#FFFFFF",
  accent: "#58B9F8",
  red: "#E05A32",
  yellow: "#FBEC5A",
  purple: "#985DF6",
  green: "#5FCC8A",
  apple: "#E05A32",
};

const MEEPLE_HEXES = MEEPLES.map((m) => m.hex);

// ---- Brought over from the landing page (lib/meeple-engine.ts), so the
// meeples keep all their tricks here even if the homepage changes.

// The founders' monument: the two blue squares from the homepage headline
// (HEY's mark and RYKER's period) on a stone plinth. Fast meeples knock them
// loose, the Curious One lassos them home, and they can be thrown. Click
// HEY's square and it bursts and reassembles; click the period and it
// squashes flat, a gold flower pops up and the whole town gathers round to
// hop in praise.
const SQ = 2 * P; // a square's side
const PLINTH = { w: 8 * P, h: 1.5 * P };
const PUSH_SPEED = 100;
const SQUARE_FRICTION = 2.6;
const SQUARE_REST = 1.2; // seconds at rest before the lasso goes after it
const SQUARE_GIVE_UP = 10; // seconds loose before it glides home by itself
const SQUARE_SHAKE = 0.35;
const SQUARE_SPLIT = 4;
const FLATTEN_TIME = 0.14;
const GOLD_LIFE = 9;
const GOLD_FADE = 0.6;
const SPRING_BACK = 0.6;
const SHOCKWAVE_SPEED = 900; // px/s, so far meeples hop a beat later
const GOLD_BLOOM = [".HPP.", "HPCPP", ".PPP.", "..S..", ".LS..", "..SL.", "..S.."];
const GOLD_COLORS: Record<string, string> = { H: "#FFF1A8", P: "#F5C518", C: "#E0860B", S: "#5FCC8A", L: "#5FCC8A" };
const GOLD_SPARKLES: [number, number, number][] = [
  [-3.6, -0.6, 0],
  [3.4, 0.4, 0.35],
  [-2.8, 3.2, 0.6],
  [3.1, 2.6, 0.15],
  [0.4, -1.8, 0.8],
];

// The Curious One's lasso.
const ROPE = 64;
const LASSO_TWIRL = 0.7;
const LASSO_THROW = 0.3;
const LASSO_HOLD = 1.2;
const LASSO_PULL = 2.4; // how long a roped cursor can drag the Curious One around
const ROPE_SNAP = 160; // a cursor that jumps further than this in a frame slips the loop
const LASSO_REEL = 0.3;

// Wild planting: out on the grass, away from the community garden, they plant
// flowers most, then grass; only the Shy One adds carrots. The Chaotic One
// tramples them.
const PLANT_TIME = 0.9;
const MAX_WILD = 24;
const WILD_LIFE = 120;
const WILT_TIME = 2;
const TRAMPLED_TIME = 3;
const GRASS = ["..L..", "L.L.L", "LLLLL"];
const GRASS_FLAT = ["LLLLL"];
const PLANTS: WildKind[] = ["flower", "grass", "flower"];
const SHY_PLANTS: WildKind[] = ["flower", "grass", "flower", "grass", "flower", "carrot"];

// The whistle's dance break (and the choir's music notes).
const DANCE_TIME = 5;
const DANCE_BEAT = 0.2;
const DANCE_SPACING = W + 30;
const KICK_UP = 5;
const KICK_OUT = 3;
const NOTE_EVERY = 0.13;
const NOTE_LIFE = 1.7;
const NOTE_COLORS = ["#985DF6", "#E05A32", "#58B9F8", "#5FCC8A", "#221F20"];
const NOTE_GLYPHS = [
  ["..XX.", "..X.X", "..X..", "..X..", "XXX..", "XXX.."],
  ["..XXXXX", "..X...X", "..X...X", "XXX.XXX", "XXX.XXX"],
];

// A letter, drawn at 2px per pixel: K ink, W paper.
const ENVELOPE = ["KKKKKKK", "KKWWWKK", "KWKWKWK", "KWWKWWK", "KKKKKKK"];
const PETALS = [C.purple, C.red, C.accent, C.yellow];

// Plants, as on the landing page. Rows top to bottom: S stem, L leaf,
// P petal, C center, D dirt, O carrot, G cabbage heart.
const SEED = ["DDD"];
const SPROUT = ["L.L", ".S.", ".S."];
const BLOOM = [".P.", "PCP", ".P.", ".S.", "LS.", ".S."];
const BLOOM_FLAT = ["LSSPCP"];
const CARROT = ["L.L", ".L.", "OOO", "OOO", ".O."];
const CARROT_FLAT = ["LLOOO."];
const CABBAGE = [".LL.", "LGGL", "LGGL", ".LL."];
const CABBAGE_FLAT = ["LGGGGL"];

// Trees and the like, in half pixels. L leaf, H highlight, D shade, T trunk,
// N pine needles, R rock, A apple.
const TREE_BIG = ["..LLLL..", ".LHHLLL.", "LHLLLLLL", "LLLLLLLD", "DLLLLLDD", ".DDDDDD.", "...TT...", "...TT..."];
const TREE_SMALL = [".LLL.", "LHLLL", "LLLLD", ".DDD.", "..T..", "..T.."];
const TREE_PINE = ["..N..", ".NNN.", "..N..", ".NNN.", "NNNNN", ".NNN.", "NNNNN", "..T.."];
const BUSH = [".LLL.", "LHLLL", "DLLLD"];
const ROCK = [".HR.", "RRRR"];
const TREE_COLORS: Record<string, string> = {
  L: C.leaf,
  H: C.leafLight,
  D: C.leafDark,
  T: C.trunk,
  N: C.pine,
  R: C.rock,
  A: C.apple,
};

// Farm animals, in half pixels, facing right. W coat, K ink (eyes, spots,
// legs), S coat shade, N nose, E horn, B fur, I ear, T tail. Each has two
// leg frames.
type AnimalKind = "cow" | "sheep" | "bunny";
const COW_BODY = [
  "........E..E",
  "........WWWW",
  ".WWWKKWWWWKW",
  "KWKKKWWWWWNN",
  ".WKKWWWKKWNN",
  ".WWWWWWKKW..",
];
const SHEEP_BODY = ["..WWWW...", ".WWWWWWKK", "WWWWWWKKK", "SWWWWWSKK", ".SSSSSS.."];
const SHORN_BODY = [".........", "..WWWWWKK", ".WWWWWKKK", ".SWWWWSKK", "..SSSS..."];
const BUNNY_BODY = ["....I.", "....IB", ".BBBKB", "TBBBBB"];
const ANIMALS: Record<AnimalKind, { legs: [string[], string[]]; speed: number }> = {
  cow: { legs: [[".K.K...K.K..", ".K.K...K.K.."], [".K..K..K..K.", ".K..K..K..K."]], speed: 11 },
  sheep: { legs: [[".K.K.K.K.", ".K.K.K.K."], ["..KK..KK.", "..KK..KK."]], speed: 15 },
  bunny: { legs: [[".BB.BB"], ["BB..BB"]], speed: 120 },
};
const COAT = { white: "#FFFFFF", brown: "#B08660", cream: "#F1E3C8", gray: "#C4C6C9", tan: "#D9B48F", pink: "#F4B6C2", skin: "#F6D9D3", skinShade: "#EDC3BA" };
const HOP = 0.32; // one bunny hop, in seconds
const BABY_TIME = 30; // seconds for a baby bunny to grow up
const MAX_BUNNIES = 12;

// The pixel z drifting up from a napping meeple (and the Sleepy One's chimney).
const Z_GLYPH = ["XXX", "..X", ".X.", "X..", "XXX"];

// Little pictures for speech bubbles, in 2px pixels.
type IconKind = "heart" | "flower" | "carrot" | "star" | "letter";
const ICONS: Record<IconKind, { rows: string[]; colors: Record<string, string> }> = {
  heart: { rows: [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."], colors: { X: C.red } },
  flower: { rows: [".P.", "PCP", ".P.", ".S.", ".S."], colors: { P: C.purple, C: C.yellow, S: C.green } },
  carrot: { rows: ["L.L", ".L.", "OOO", ".O.", ".O."], colors: { L: C.green, O: C.red } },
  star: { rows: ["..X..", ".XXX.", "XXXXX", ".XXX.", ".X.X."], colors: { X: C.gold } },
  letter: { rows: ENVELOPE, colors: { K: C.ink, W: C.white } },
};

type Say = { text?: string; icon?: IconKind; life?: number; delay?: number };
const SMALL_TALK: Say[] = [
  { icon: "heart" },
  { icon: "flower" },
  { icon: "carrot" },
  { icon: "star" },
  { text: "HA" },
  { text: "..." },
  { text: "?" },
  { text: "!" },
  { text: "NICE" },
  { text: "SAME" },
];
const HELLOS = ["HI", "HEY", "YO", "HOWDY"];

/** What the mayor puts to the town at a meeting, and what happens if it passes. */
type Motion = { text: string; icon?: IconKind; effect: "plant" | "share" | "nap" | "hug" | "party" | "dance" };
const MOTIONS: Motion[] = [
  { text: "MORE FLOWERS?", icon: "flower", effect: "plant" },
  { text: "SHARE CARROTS?", icon: "carrot", effect: "share" },
  { text: "NAP TIME?", effect: "nap" },
  { text: "GROUP HUG?", icon: "heart", effect: "hug" },
  { text: "PARTY?", icon: "star", effect: "party" },
  { text: "DANCE BREAK?", effect: "dance" },
];

/** How each meeple likes to spend its time, as relative weights. */
type Plan = "home" | "stroll" | "garden" | "visit" | "nap" | "zoom" | "mail";
const PLANS: Record<MeepleId, Partial<Record<Plan, number>>> = {
  yellow: { visit: 3, garden: 2, stroll: 2, home: 1, mail: 1 },
  green: { garden: 5, home: 1.5, stroll: 1.5, visit: 0.8, mail: 0.5 },
  purple: { stroll: 2.5, visit: 1.5, home: 1.5, garden: 1, mail: 1 },
  red: { zoom: 4, visit: 1, garden: 0.6, home: 0.5, stroll: 0.5, mail: 0.3 },
  blue: { home: 3, nap: 3, garden: 1, visit: 0.4, mail: 0.3 },
};

const GAIT: Record<MeepleId, { speed: number; step: number }> = {
  yellow: { speed: 55, step: 0.14 },
  green: { speed: 50, step: 0.14 },
  purple: { speed: 40, step: 0.18 },
  red: { speed: 115, step: 0.08 },
  blue: { speed: 36, step: 0.2 },
};

type Vec = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };

type PlantKind = "flower" | "carrot" | "cabbage";
/** Something carried over the head: harvest, or a letter. */
type Item = { kind: PlantKind | "letter"; petal: string };

type Plant = {
  kind: PlantKind;
  petal: string;
  /** 0 is a seed, 1 is grown. */
  grow: number;
  /** Seconds of water left; growing is faster while wet. */
  wet: number;
  /** Seconds since it was flattened, or -1. */
  flat: number;
};

type Slot = { x: number; y: number; plant: Plant | null; claimed: Meeple | null; stand: Vec };

type Building = {
  kind: "house" | "hall" | "court" | "post" | "church";
  box: Box;
  /** Where feet go in the doorway, and the path node just outside. */
  doorway: Vec;
  doorNode: number;
  /** Where a visitor and the host stand to talk. */
  guestSpot: Vec;
  hostSpot: Vec;
  owner: Meeple | null;
  chimney: -1 | 0 | 1;
  flowerBox: string[] | null;
  knock: number;
  ring: number;
  /** A present left on the doorstep while the owner was out. */
  gift: Item | null;
  puffIn: number;
  /** The post office: who the letters waiting there are for. */
  mail: MeepleId[];
};

type Tree = { x: number; y: number; rows: string[]; shake: number };

type Animal = {
  kind: AnimalKind;
  /** Feet, centered. */
  x: number;
  y: number;
  dir: 1 | -1;
  goal: Vec | null;
  pause: number;
  stepT: number;
  frame: 0 | 1;
  /** Time into the current bunny hop, or -1. */
  hop: number;
  /** Time left on a startled jump. */
  jump: number;
  /** Seconds until a sheep's wool grows back. */
  shorn: number;
  /** Seconds until a baby bunny is grown. */
  baby: number;
  mom: Animal | null;
  /** Running from the cursor or a flying meeple. */
  flee: number;
  calm: number;
  coat: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  t: number;
  life: number;
  size: number;
  color: string;
  z?: boolean;
};

type Bubble = { text: string; icon: IconKind | null; t: number; life: number };
type Sign = Bubble & Vec;

type Block = Vec & { vx: number; vy: number; delay: number };

type Mode = "walk" | "drag" | "shake" | "exploded" | "reassemble";

type WildKind = "flower" | "grass" | "carrot";
type Wild = {
  /** Middle and baseline. */
  x: number;
  y: number;
  kind: WildKind;
  petal: string;
  /** Negative while it waits to pop up. */
  age: number;
  life: number;
  /** Seconds since it started wilting or was trampled; -1 while healthy. */
  fade: number;
  trampled: boolean;
};

type Square = {
  click: "burst" | "squash";
  /** Top-left in its socket on the plinth. */
  home: Vec;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "home" | "loose" | "towed" | "gliding" | "burst" | "held" | "gone";
  looseFor: number;
  restFor: number;
  /** Seconds into a burst (-1 when not), and its pieces. */
  clickT: number;
  blocks: Block[];
  /** The period: seconds since it was squashed (-1 when not), through the gold flower and springing back. */
  bloomT: number;
};

type Lasso = {
  phase: "twirl" | "throw" | "hold" | "tow" | "reel";
  t: number;
  /** A loose square to rope back, or null to rope the cursor. */
  square: Square | null;
  loop: Vec;
  rope: number;
  pull: number;
  tugging: boolean;
  last: Vec;
};

type Note = { x: number; y: number; age: number; color: string; glyph: string[]; sway: number };

type Dance = {
  phase: "gather" | "dance";
  t: number;
  /** Each dancer's spot in the line (feet). */
  spots: Map<Meeple, Vec>;
  nextNote: number;
};

type Task =
  | { kind: "home"; phase: "go" | "in"; t: number; stay: number }
  | { kind: "stroll"; phase: "go" | "rest"; t: number; rest: number; to: Vec }
  | { kind: "garden"; phase: "go" | "work"; t: number; slot: Slot; job: "plant" | "water" | "harvest"; plant: PlantKind }
  | { kind: "deliver"; phase: "go" | "knock" | "wait" | "talk"; t: number; to: Meeple; said: number }
  | { kind: "host"; phase: "go" | "meet"; t: number; guest: Meeple | null }
  | { kind: "spot"; at: Vec; face: Vec | null; arrived: boolean; why: "event" | "help" | "praise" | "dance" }
  | { kind: "nap"; phase: "go" | "sleep"; t: number; dur: number; at: Vec; walk: Vec | null; next: number }
  | { kind: "post"; phase: "go" | "drop" | "wait" | "read"; t: number; to: Meeple | null }
  | { kind: "zoom"; to: Vec; legs: number };

type Meeple = {
  cfg: MeepleConfig;
  speed: number;
  stepEvery: number;
  house: Building;
  /** Top-left corner. */
  x: number;
  y: number;
  /** Physics velocity, from throws and bumps. */
  vx: number;
  vy: number;
  /** Walking velocity, set each frame. */
  wx: number;
  wy: number;
  mode: Mode;
  modeT: number;
  inside: boolean;
  alpha: number;
  /** 1 while stepping out of a door, -1 while stepping in. */
  fading: number;
  task: Task | null;
  /** The point the current route leads to, so a new goal re-routes. */
  goal: Vec | null;
  route: Vec[];
  pause: number;
  face: Vec | null;
  look: Vec;
  blinkIn: number;
  blinkFor: number;
  asleep: boolean;
  stepT: number;
  stepFrame: 0 | 1;
  hop: number | null;
  carry: Item | null;
  /** Flowers it has promised to plant (a court sentence or a meeting vote). */
  owed: number;
  wantHarvest: boolean;
  tool: "dig" | "water" | null;
  bubble: Bubble | null;
  blocks: Block[];
  helpers: Meeple[];
  prev: Vec;
  greetIn: number;
  scared: number;
  tagWidth: number;
  lasso: Lasso | null;
  lassoCooldown: number;
  /** Wild planting: seconds until it next plants, digging progress (-1 when not), and how many so far. */
  plantIn: number;
  planting: number;
  planted: number;
  /** The Chaotic One charging the cursor. */
  rush: boolean;
  rushCooldown: number;
};

type Beat = { at: number; who: "lead" | "dock" | "crowd"; text?: string; icon?: IconKind; life: number; hop?: boolean };

type TownEvent = {
  kind: "meeting" | "court" | "choir";
  phase: "gather" | "talk";
  t: number;
  beats: Beat[];
  next: number;
  motion: Motion | null;
  lead: Meeple;
  dock: Meeple | null;
};

type Drag = {
  m: Meeple;
  pointerId: number;
  offX: number;
  offY: number;
  t0: number;
  start: Vec;
  moved: number;
  samples: { t: number; x: number; y: number }[];
};

type Press = { pointerId: number; start: Vec; t0: number; moved: number };

type SquareDrag = Omit<Drag, "m"> & { sq: Square };

type Node = Vec & { links: number[] };
type Edge = { a: number; b: number; w: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const snap = (v: number, s = U) => Math.round(v / s) * s;
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const inBox = (p: Vec, b: Box) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const pad = (b: Box, d: number): Box => ({ x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d });

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Darken a hex color by k (0 to 1). */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) =>
    Math.round(v * (1 - k))
      .toString(16)
      .padStart(2, "0");
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

function weighted<K extends string>(w: Partial<Record<K, number>>): K {
  const entries = Object.entries(w) as [K, number][];
  let r = Math.random() * entries.reduce((s, [, v]) => s + v, 0);
  for (const [k, v] of entries) {
    r -= v;
    if (r <= 0) return k;
  }
  return entries[0][0];
}

const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], [data-meeple-ignore]";

export class VillageEngine {
  private ctx: CanvasRenderingContext2D;
  private ground: HTMLCanvasElement;
  private vw = 0;
  private viewH = 0;
  private worldH = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private font = "700 8px monospace";

  private nodes: Node[] = [];
  private edges: Edge[] = [];
  private buildings: Building[] = [];
  private houses: Building[] = [];
  private hall!: Building;
  private court!: Building;
  private garden: Box = { x: 0, y: 0, w: 0, h: 0 };
  private gardenNodes: number[] = [];
  private slots: Slot[] = [];
  private trees: Tree[] = [];
  private animals: Animal[] = [];
  private pond: Box | null = null;
  private restSpots: Vec[] = [];
  private meetSpots: { lead: Vec; crowd: Vec[] } = { lead: { x: 0, y: 0 }, crowd: [] };
  private courtSpots: { judge: Vec; dock: Vec; jury: Vec[] } = { judge: { x: 0, y: 0 }, dock: { x: 0, y: 0 }, jury: [] };

  private meeples: Meeple[] = [];
  private particles: Particle[] = [];
  private signs: Sign[] = [];
  private event: TownEvent | null = null;
  private meetingIn = rand(40, 70);
  private courtCooldown = 20;
  private pendingCourt = 0;

  private post: Building | null = null;
  private church: Building | null = null;
  private mailIn = rand(30, 60);
  private plinth: Box | null = null;
  private squares: Square[] = [];
  private squareDrag: SquareDrag | null = null;
  private nextShove = rand(10, 20);
  private wild: Wild[] = [];
  private praise: { sq: Square; head: Vec } | null = null;
  private dance: Dance | null = null;
  private notes: Note[] = [];
  private bar = 0;

  private cursor = { x: -999, y: -999, inside: false, lastMove: -Infinity };
  private drag: Drag | null = null;
  private press: Press | null = null;
  private cleanups: (() => void)[] = [];

  constructor(
    private root: HTMLElement,
    private canvas: HTMLCanvasElement,
    /** Reduced motion: draw the village once, with everyone standing at home. */
    private still = false,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    this.ground = document.createElement("canvas");

    const pixel = getComputedStyle(document.documentElement).getPropertyValue("--font-silkscreen").trim();
    if (pixel) this.font = `700 8px ${pixel}`;

    this.build();

    document.fonts
      ?.load(this.font)
      .then(() => {
        for (const m of this.meeples) m.tagWidth = 0;
        if (this.still || !this.raf) this.render();
      })
      .catch(() => {});

    this.listen(window, "resize", this.onResize);
    if (still) return;
    this.listen(root, "pointerdown", this.onPointerDown);
    // Non-passive so a touch that starts on a meeple can stop the page from
    // scrolling. Touches anywhere else are left alone.
    this.listen(root, "touchstart", this.onTouchStart, { passive: false });
    this.listen(window, "pointermove", this.onPointerMove);
    this.listen(window, "pointerup", this.onPointerUp);
    this.listen(window, "pointercancel", this.onPointerUp);
    this.listen(document.documentElement, "pointerleave", this.onPointerLeave);
    this.listen(document, "visibilitychange", this.onVisibility);
  }

  start() {
    this.render();
    if (!this.still && document.visibilityState === "visible") this.resume();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    for (const off of this.cleanups) off();
    this.root.style.cursor = "";
    this.root.style.height = "";
  }

  /** Ring the Town Hall bell and call a meeting. */
  ringBell() {
    if (this.still || this.busy()) return;
    this.hall.ring = 2.4;
    this.sign(this.hall.box.x + this.hall.box.w / 2, this.hall.box.y + 9 * U, { text: "DING DONG", life: 2.2 });
    const lead = this.byId("purple");
    const crowd = this.meeples.filter((m) => m !== lead).sort((a, b) => a.x - b.x);
    const motion = pick(MOTIONS);
    const beats: Beat[] = [
      { at: 0, who: "lead", text: "WELCOME", life: 1.4 },
      { at: 1.6, who: "lead", text: motion.text, icon: motion.icon, life: 2.2 },
      { at: 4, who: "crowd", text: "AYE", life: 1.6 },
      { at: 6, who: "lead", text: "PASSED", life: 1.4, hop: true },
    ];
    this.event = { kind: "meeting", phase: "gather", t: 0, beats, next: 0, motion, lead, dock: null };
    this.gather(lead, this.meetSpots.lead, { x: this.meetSpots.lead.x, y: this.meetSpots.lead.y + 60 });
    crowd.forEach((m, i) => this.gather(m, this.meetSpots.crowd[i], this.meetSpots.lead));
  }

  /** Hold court. The Chaotic One is always the one in the dock. */
  holdCourt() {
    if (this.still || this.busy()) return;
    this.pendingCourt = 0;
    const judge = this.byId("purple");
    const dock = this.byId("red");
    const jury = this.meeples.filter((m) => m !== judge && m !== dock).sort((a, b) => a.x - b.x);
    const beats: Beat[] = [
      { at: 0, who: "lead", text: "ORDER", life: 1.2, hop: true },
      { at: 1.4, who: "dock", text: "?", life: 1.2 },
      { at: 2.8, who: "lead", text: "PLANT 3", icon: "flower", life: 1.8 },
      { at: 4.8, who: "crowd", text: "AYE", life: 1.4 },
      { at: 6.4, who: "dock", text: "SORRY", life: 1.4 },
    ];
    this.event = { kind: "court", phase: "gather", t: 0, beats, next: 0, motion: null, lead: judge, dock };
    const s = this.courtSpots;
    this.gather(judge, s.judge, s.dock);
    this.gather(dock, s.dock, s.judge);
    jury.forEach((m, i) => this.gather(m, s.jury[i], s.dock));
  }

  /** Choir practice on the church steps, with the Watcher conducting. */
  choir() {
    const ch = this.church;
    if (this.still || this.busy() || !ch) return;
    ch.ring = 2.4;
    this.sign(ch.doorway.x, ch.box.y + 2 * U, { text: "DONG", life: 1.6 });
    const lead = this.byId("purple");
    const crowd = this.meeples.filter((m) => m !== lead).sort((a, b) => a.x - b.x);
    const beats: Beat[] = [
      { at: 0, who: "lead", text: "ONE, TWO", life: 1.2 },
      { at: 1.4, who: "crowd", text: "LA LA", life: 1.4 },
      { at: 3.2, who: "crowd", text: "LA LA LA", life: 1.6 },
      { at: 5.2, who: "lead", icon: "heart", life: 1.4, hop: true },
    ];
    this.event = { kind: "choir", phase: "gather", t: 0, beats, next: 0, motion: null, lead, dock: null };
    const d = ch.doorway;
    this.gather(lead, { x: d.x, y: d.y + 6 }, { x: d.x, y: d.y + 60 });
    const row = this.choirRow();
    crowd.forEach((m, i) => this.gather(m, row[i], { x: d.x, y: d.y }));
  }

  /**
   * Blows the whistle: everyone hurries into a line somewhere on screen and
   * does a quick Irish step dance while music notes float up, as on the
   * homepage. Returns whether it started.
   */
  whistle(): boolean {
    if (this.still || this.busy()) return false;
    const spots = this.danceLine();
    const order = [...this.meeples].sort((a, b) => a.x - b.x);
    const map = new Map<Meeple, Vec>();
    order.forEach((m, i) => {
      map.set(m, spots[i]);
      this.gather(m, spots[i], { x: spots[i].x, y: spots[i].y + 60 });
      if (m.task?.kind === "spot") m.task.why = "dance";
    });
    this.dance = { phase: "gather", t: 0, spots: map, nextNote: 0 };
    return true;
  }

  /** A letter arrives at the post office, and whoever it's for goes to get it. */
  deliverMail() {
    const po = this.post;
    if (this.still || !po) return;
    const free = this.meeples.filter((m) => this.interruptible(m, true) && m.cfg.id !== "blue");
    const to = free.length ? pick(free) : pick(this.meeples);
    po.mail.push(to.cfg.id);
    po.knock = 0.8;
    this.sign(po.doorway.x, po.box.y + 4 * U, { icon: "letter", text: "MAIL", life: 1.6 });
    if (free.includes(to)) this.setTask(to, { kind: "post", phase: "go", t: 0, to: null });
  }

  /** A meeting, court, choir, dance or the gold flower: something everyone's at. */
  private busy() {
    return !!(this.event || this.dance || this.praise);
  }

  // ---------------------------------------------------------------- setup

  private listen<E extends Event>(
    target: EventTarget,
    type: string,
    handler: (e: E) => void,
    options?: AddEventListenerOptions,
  ) {
    const fn = handler as EventListener;
    target.addEventListener(type, fn, options);
    this.cleanups.push(() => target.removeEventListener(type, fn, options));
  }

  private byId(id: MeepleId) {
    return this.meeples.find((m) => m.cfg.id === id)!;
  }

  /** Lay out a fresh village for this screen and put everyone at home. */
  private build() {
    this.vw = this.root.clientWidth;
    this.viewH = document.documentElement.clientHeight || window.innerHeight;
    this.layout();
    this.root.style.height = `${this.worldH}px`;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.worldH * this.dpr);
    this.ground.width = this.canvas.width;
    this.ground.height = this.canvas.height;
    this.paintGround();

    this.event = null;
    this.particles = [];
    this.signs = [];
    this.drag = null;
    this.press = null;
    this.squareDrag = null;
    this.wild = [];
    this.praise = null;
    this.dance = null;
    this.notes = [];
    const houses = shuffle([...this.houses]);
    this.meeples = MEEPLES.map((cfg, i) => this.createMeeple(cfg, houses[i]));
    for (const m of this.meeples) m.house.owner = m;
  }

  private onResize = () => {
    const w = this.root.clientWidth;
    const h = document.documentElement.clientHeight || window.innerHeight;
    // Phone toolbars change the height as the page scrolls; only a real
    // resize rebuilds the village there.
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (w === this.vw && (h === this.viewH || (touch && Math.abs(h - this.viewH) < 140))) return;
    this.build();
    this.render();
  };

  private createMeeple(cfg: MeepleConfig, house: Building): Meeple {
    const gait = GAIT[cfg.id];
    // Reduced motion: stand beside the door, not in front of it.
    const at = this.still ? house.guestSpot : house.doorway;
    // Everyone starts out on their doorstep, except the Sleepy One, who's in bed.
    const sleepy = cfg.id === "blue" && !this.still;
    const m: Meeple = {
      cfg,
      speed: gait.speed,
      stepEvery: gait.step,
      house,
      x: at.x - W / 2 + (this.still ? 0 : rand(-6, 6)),
      y: at.y + (this.still ? 0 : 4) - H,
      vx: 0,
      vy: 0,
      wx: 0,
      wy: 0,
      mode: "walk",
      modeT: 0,
      inside: sleepy,
      alpha: sleepy ? 0 : 1,
      fading: 0,
      task: sleepy ? { kind: "home", phase: "in", t: 0, stay: rand(10, 20) } : null,
      goal: null,
      route: [],
      pause: this.still ? 0 : rand(0, 1.5),
      face: null,
      look: { x: 0, y: 0.4 },
      blinkIn: rand(2, 6),
      blinkFor: 0,
      asleep: cfg.id === "blue",
      stepT: 0,
      stepFrame: 0,
      hop: null,
      carry: null,
      owed: 0,
      wantHarvest: false,
      tool: null,
      bubble: null,
      blocks: [],
      helpers: [],
      prev: { x: 0, y: 0 },
      greetIn: rand(4, 10),
      scared: 0,
      tagWidth: 0,
      lasso: null,
      lassoCooldown: rand(3, 6),
      plantIn: rand(0.5, 3),
      planting: -1,
      planted: 0,
      rush: false,
      rushCooldown: rand(2, 5),
    };
    m.prev = { x: m.x, y: m.y };
    return m;
  }

  // --------------------------------------------------------------- layout

  /**
   * Roll a village for the current width. Top to bottom: the Town Hall, a
   * street, the garden inside a ring road, and the courthouse with the road
   * running round it to the front steps. Houses sit along the street (either
   * side of the Town Hall) or beside the ring, and five spots are picked at
   * random from all that fit.
   */
  private layout() {
    const vw = this.vw;
    const phone = vw < 768; // matches Tailwind's md breakpoint, where the caption row splits in two
    const road = phone ? 2 * P : 3 * P;
    const lane = 2 * P;
    const margin = phone ? U : 2 * P;
    const bar = phone ? 8 * P : 6 * P; // the caption and buttons along the bottom
    const label = 1.5 * P; // house name over the roof
    const cx = snap(vw / 2, P);
    const sw = HOUSE.w * U;
    const sh = HOUSE.h * U;
    const hw = HALL.w * U;
    const hh = HALL.h * U;
    const cw = COURT.w * U;
    const chh = COURT.h * U;

    const hallBox: Box = { x: cx - hw / 2, y: 2 * P, w: hw, h: hh };
    const yTop = hallBox.y + hh + P + road / 2;

    // Half the ring road's width. Phones keep a column for houses either side.
    let half = phone ? cx - (margin + sw + P + road / 2) : clamp(snap(vw * 0.17, P), 7 * P + road, 26 * P);
    half = Math.max(half, 5 * P + road / 2);
    const ringL = cx - half;
    const ringR = cx + half;

    type HouseSpot = { box: Box; side: -1 | 0 | 1; spurY: number; row: number };
    const spots: HouseSpot[] = [];

    // Along the street, either side of the Town Hall.
    for (const side of [-1, 1] as const) {
      const a = side < 0 ? margin : hallBox.x + hw + P;
      const b = side < 0 ? hallBox.x - P : vw - margin;
      const n = Math.floor((b - a + 2 * P) / (sw + 2 * P));
      for (let i = 0; i < n; i++) {
        const cell = (b - a) / n;
        const slack = Math.max(0, cell - sw - P);
        const x = snap(a + i * cell + (cell - sw - slack) / 2 + rand(0, slack));
        const lift = snap(rand(0, P));
        spots.push({ box: { x, y: yTop - road / 2 - U - sh - lift, w: sw, h: sh }, side: 0, spurY: yTop, row: -1 });
      }
    }

    // Beside the ring, in rows.
    const band = label + sh + U + lane + P;
    const firstY = yTop + road / 2 + P + label;
    const spurOf = (k: number) => firstY + k * band + sh + U + lane / 2;
    const below = (k: number) => spurOf(k) + lane / 2 + P + road / 2;
    const S = road / 2 + P + chh + U + P + road + P + bar; // from the ring's bottom road to the page's end
    const gardenMin = phone ? 10 * P : 8 * P;
    const yBotMin = yTop + road + 2 * P + gardenMin;
    const sideX = (side: -1 | 1): [number, number] =>
      side < 0 ? [margin, ringL - road / 2 - P - sw] : [ringR + road / 2 + P, vw - margin - sw];
    const sides = ([-1, 1] as const).filter((s) => sideX(s)[1] >= sideX(s)[0]);
    let rows = 0;
    while (sides.length && below(rows) <= Math.max(this.viewH - S, yBotMin)) rows++;
    // Five houses, the post office and the church.
    while (sides.length && spots.length + sides.length * rows < 7) rows++;
    for (let k = 0; k < rows; k++) {
      for (const side of sides) {
        const [a, b] = sideX(side);
        spots.push({ box: { x: snap(rand(a, b)), y: firstY + k * band, w: sw, h: sh }, side, spurY: spurOf(k), row: k });
      }
    }

    const chosen = shuffle(spots).slice(0, 7);
    const yBotNeed = Math.max(yBotMin, ...chosen.filter((s) => s.row >= 0).map((s) => below(s.row)));
    this.worldH = Math.ceil(Math.max(this.viewH, yBotNeed + S));
    const yBot = snap(this.worldH - S);

    const courtBox: Box = { x: cx - cw / 2, y: yBot + road / 2 + P, w: cw, h: chh };
    // A little plaza in front of the steps, for court.
    const yFront = courtBox.y + chh + U + P + road / 2;
    const xL = courtBox.x - P - road / 2;
    const xR = courtBox.x + cw + P + road / 2;

    const g: Box = { x: ringL + road / 2 + P, y: yTop + road / 2 + P, w: 2 * half - road - 2 * P, h: yBot - yTop - road - 2 * P };
    const gy = snap(g.y + g.h / 2, P);
    this.garden = g;

    // ---- paths: nodes on a graph, every edge straight and axis-aligned.
    this.nodes = [];
    this.edges = [];
    const node = (x: number, y: number) => {
      const i = this.nodes.findIndex((n) => Math.abs(n.x - x) < 1 && Math.abs(n.y - y) < 1);
      if (i >= 0) return i;
      this.nodes.push({ x, y, links: [] });
      return this.nodes.length - 1;
    };
    const link = (a: number, b: number, w: number) => {
      if (a === b || this.nodes[a].links.includes(b)) return;
      this.edges.push({ a, b, w });
      this.nodes[a].links.push(b);
      this.nodes[b].links.push(a);
    };
    const chain = (ids: number[], axis: "x" | "y", w: number) => {
      const sorted = [...new Set(ids)].sort((a, b) => this.nodes[a][axis] - this.nodes[b][axis]);
      for (let i = 1; i < sorted.length; i++) link(sorted[i - 1], sorted[i], w);
    };

    const street = [node(ringL, yTop), node(cx, yTop), node(ringR, yTop)];
    const left = [node(ringL, yTop), node(ringL, gy), node(ringL, yBot)];
    const right = [node(ringR, yTop), node(ringR, gy), node(ringR, yBot)];

    const plots = chosen.map((s) => {
      const doorX = s.box.x + sw / 2;
      const door = node(doorX, s.box.y + sh + U);
      if (s.side === 0) {
        const j = node(doorX, yTop);
        street.push(j);
        link(door, j, lane);
      } else {
        const bend = node(doorX, s.spurY);
        const j = node(s.side < 0 ? ringL : ringR, s.spurY);
        (s.side < 0 ? left : right).push(j);
        link(door, bend, lane);
        link(bend, j, lane);
      }
      return { box: s.box, door };
    });
    const kinds = ["house", "house", "house", "house", "house", "post", "church"] as const;
    const lots = plots.map((pl, i) => this.makeBuilding(kinds[i], pl.box, pl.door));
    this.houses = lots.filter((b) => b.kind === "house");
    this.post = lots.find((b) => b.kind === "post") ?? null;
    this.church = lots.find((b) => b.kind === "church") ?? null;

    chain(street, "x", road);
    chain(left, "y", road);
    chain(right, "y", road);
    chain([node(xL, yBot), node(ringL, yBot), node(cx, yBot), node(ringR, yBot), node(xR, yBot)], "x", road);
    link(node(xL, yBot), node(xL, yFront), road);
    link(node(xL, yFront), node(cx, yFront), road);
    link(node(cx, yFront), node(xR, yFront), road);
    link(node(xR, yFront), node(xR, yBot), road);

    const hallDoor = node(cx, hallBox.y + hh + U);
    link(hallDoor, node(cx, yTop), road);
    this.hall = this.makeBuilding("hall", hallBox, hallDoor);
    this.court = this.makeBuilding("court", courtBox, node(cx, yFront));
    this.buildings = [this.hall, this.court, ...lots];

    // The garden's cross paths, with stops along them so gardeners can step off
    // close to their plants.
    const vert = [node(cx, g.y), node(cx, gy), node(cx, g.y + g.h)];
    const horiz = [node(g.x, gy), node(cx, gy), node(g.x + g.w, gy)];
    for (let y = g.y + 4 * P; y < g.y + g.h - 2 * P; y += 4 * P) vert.push(node(cx, snap(y, P)));
    for (let x = g.x + 4 * P; x < g.x + g.w - 2 * P; x += 4 * P) horiz.push(node(snap(x, P), gy));
    chain(vert, "y", lane);
    chain(horiz, "x", lane);
    link(node(cx, yTop), node(cx, g.y), lane);
    link(node(cx, g.y + g.h), node(cx, yBot), lane);
    link(node(ringL, gy), node(g.x, gy), lane);
    link(node(g.x + g.w, gy), node(ringR, gy), lane);
    this.gardenNodes = [...new Set([...vert, ...horiz])];

    // Planting spots in rows, clear of the cross paths.
    this.slots = [];
    for (let y = g.y + 3 * P + U; y <= g.y + g.h - U; y += 3 * P) {
      if (y > gy - lane / 2 - U && y - 3 * P < gy + lane / 2 + U) continue;
      for (let x = g.x + 1.5 * P; x <= g.x + g.w - 1.5 * P; x += 2 * P) {
        if (Math.abs(x - cx) < lane / 2 + 1.5 * P) continue;
        const plant: Plant | null =
          Math.random() < 0.7
            ? { ...this.randomItem(pick(["flower", "flower", "carrot", "cabbage"] as const)), grow: rand(0.1, 1.6), wet: 0, flat: -1 }
            : null;
        this.slots.push({ x, y, plant, claimed: null, stand: { x: x - 2 * P, y: y + 2 } });
      }
    }

    // Where everyone stands for meetings and court.
    this.meetSpots = {
      lead: this.hall.doorway,
      crowd: [-66, -22, 22, 66].map((dx) => ({ x: cx + dx, y: yTop + 4 })),
    };
    this.courtSpots = {
      judge: this.court.doorway,
      dock: { x: cx, y: yFront + 4 },
      jury: [-92, -48, 48, 92].map((dx) => ({ x: cx + dx, y: yFront + 2 })),
    };

    this.scatter(phone, bar, label);
  }

  private makeBuilding(kind: Building["kind"], box: Box, doorNode: number): Building {
    const doorway = { x: box.x + box.w / 2, y: box.y + box.h + 1 };
    return {
      kind,
      box,
      doorway,
      doorNode,
      guestSpot: { x: doorway.x + 24, y: doorway.y + 10 },
      hostSpot: { x: doorway.x - 8, y: doorway.y + 7 },
      owner: null,
      chimney: pick([-1, 1, 1, 0] as const),
      flowerBox: Math.random() < 0.6 ? [pick(PETALS), pick(PETALS), pick(PETALS)] : null,
      knock: 0,
      ring: 0,
      gift: null,
      puffIn: rand(0, 1),
      mail: [],
    };
  }

  /** Trees, bushes, rocks, wildflowers and maybe a pond, on whatever grass is free. */
  private scatter(phone: boolean, bar: number, label: number) {
    const vw = this.vw;
    const taken: Box[] = [
      ...this.buildings.map((b) => pad({ ...b.box, y: b.box.y - label, h: b.box.h + label }, U)),
      pad(this.garden, P),
      ...this.edges.map((e) => pad(this.edgeBox(e), U)),
      { x: 0, y: 0, w: 99, h: 88 },
      { x: vw - 99, y: 0, w: 99, h: 88 },
      { x: 0, y: this.worldH - bar, w: vw, h: bar },
    ];
    const fits = (b: Box) =>
      b.x > U && b.y > U && b.x + b.w < vw - U && b.y + b.h < this.worldH - U && !taken.some((t) => overlap(t, b));
    const place = (w: number, h: number, tries: number, gap = U) => {
      for (let i = 0; i < tries; i++) {
        const b = { x: snap(rand(0, vw - w)), y: snap(rand(0, this.worldH - h)), w, h };
        if (fits(pad(b, gap))) {
          taken.push(pad(b, gap));
          return b;
        }
      }
      return null;
    };

    this.pond = null;
    if (!phone && Math.random() < 0.75) this.pond = place(10 * P, 5 * P, 80, P);
    this.bar = bar;
    this.placeMonument(fits, taken);

    const area = vw * this.worldH;
    this.trees = [];
    this.restSpots = [];
    const treeCount = clamp(Math.round(area / (phone ? 24000 : 30000)), 6, 44);
    // About half as many trees as there's room for, so the animals have
    // open pasture.
    for (let i = 0; i < Math.round(treeCount * 0.45); i++) {
      const rows = pick([TREE_BIG, TREE_BIG, TREE_SMALL, TREE_PINE]);
      const b = place(rows[0].length * U, rows.length * U, 40, P);
      if (!b) continue;
      let r = rows;
      if (rows === TREE_BIG && Math.random() < 0.4) {
        // Some trees have apples.
        r = rows.map((row, y) => (y === 2 || y === 3 ? row.replace(/L(?=LL)/, "A") : row));
      }
      this.trees.push({ x: b.x, y: b.y + b.h, rows: r, shake: 0 });
      const side = Math.random() < 0.5 ? -1 : 1;
      const spot = { x: b.x + b.w / 2 + side * (b.w / 2 + 14), y: b.y + b.h + 4 };
      if (spot.x > W && spot.x < vw - W) this.restSpots.push(spot);
    }
    for (let i = 0; i < 6; i++) {
      const b = place(W, H, 30, U);
      if (b) {
        this.restSpots.push({ x: b.x + W / 2, y: b.y + H });
        taken.pop(); // a resting spot leaves the grass free for flowers
      }
    }

    this.bushes = [];
    for (let i = 0; i < Math.round(treeCount * 0.7); i++) {
      const b = place(BUSH[0].length * U, BUSH.length * U, 30);
      if (b) this.bushes.push({ x: b.x, y: b.y + b.h, rows: BUSH, shake: 0 });
    }
    this.rocks = [];
    for (let i = 0; i < Math.round(treeCount * 0.5); i++) {
      const b = place(ROCK[0].length * U, ROCK.length * U, 30);
      if (b) this.rocks.push(b);
    }
    this.wildflowers = [];
    for (let i = 0; i < treeCount * 1.5; i++) {
      const b = place(3 * U, BLOOM.length * U, 20);
      if (b) this.wildflowers.push({ x: b.x, y: b.y + b.h, petal: pick(PETALS) });
    }
    this.spawnAnimals(phone, bar);
  }

  // -------------------------------------------------------------- animals

  private pasture = { x0: 0, x1: 0, y0: 0, y1: 0 };

  /** A few cows, sheep and bunnies, wherever there's open grass. */
  private spawnAnimals(phone: boolean, bar: number) {
    this.pasture = { x0: 3 * P, x1: this.vw - 3 * P, y0: 100, y1: this.worldH - bar - 4 };
    const area = this.vw * this.worldH;
    const counts: Record<AnimalKind, number> = {
      cow: clamp(Math.round(area / 500000), 1, 3),
      sheep: clamp(Math.round(area / 300000), 2, 5),
      bunny: clamp(Math.round(area / 250000), 3, 6),
    };
    this.animals = [];
    for (const kind of ["cow", "sheep", "bunny"] as AnimalKind[]) {
      // Sheep stick together, so the rest of the flock starts near the first.
      let flock: Vec | null = null;
      for (let i = 0; i < counts[kind]; i++) {
        const at = this.freeGrass(kind === "sheep" ? flock : null, kind === "sheep" ? 90 : 0);
        if (!at) continue;
        if (kind === "sheep") flock ??= at;
        this.animals.push(this.makeAnimal(kind, at));
      }
    }
    if (phone) for (const a of this.animals) a.pause = rand(0, 3);
  }

  private makeAnimal(kind: AnimalKind, at: Vec, mom: Animal | null = null): Animal {
    const coat =
      kind === "cow"
        ? pick([COAT.white, COAT.white, COAT.cream])
        : kind === "bunny"
          ? (mom?.coat ?? pick([COAT.tan, COAT.tan, COAT.gray]))
          : COAT.white;
    return {
      kind,
      x: at.x,
      y: at.y,
      dir: Math.random() < 0.5 ? 1 : -1,
      goal: null,
      pause: this.still ? 0 : rand(0, 4),
      stepT: 0,
      frame: 0,
      hop: -1,
      jump: 0,
      shorn: 0,
      baby: mom ? BABY_TIME : 0,
      mom,
      flee: 0,
      calm: 0,
      coat,
    };
  }

  /** Feet can stand here: open grass, off the buildings, pond and garden. */
  private grazable(p: Vec) {
    const q = this.pasture;
    if (p.x < q.x0 || p.x > q.x1 || p.y < q.y0 || p.y > q.y1) return false;
    if (inBox(p, pad(this.garden, P))) return false;
    if (this.pond && inBox(p, pad(this.pond, 2 * P))) return false;
    return !this.buildings.some((b) => inBox(p, pad(this.footprint(b), P)));
  }

  private grazePath(a: Vec, b: Vec) {
    const n = Math.max(1, Math.ceil(dist(a, b) / 8));
    for (let i = 1; i <= n; i++) {
      if (!this.grazable({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n })) return false;
    }
    return true;
  }

  private freeGrass(near: Vec | null, spread: number): Vec | null {
    const q = this.pasture;
    for (let i = 0; i < 60; i++) {
      const p = near
        ? { x: near.x + rand(-spread, spread), y: near.y + rand(-spread, spread) * 0.6 }
        : { x: rand(q.x0, q.x1), y: rand(q.y0, q.y1) };
      if (this.grazable(p) && !this.animals.some((a) => dist(a, p) < 40)) return p;
    }
    return null;
  }

  /** Somewhere to wander next. Sheep drift toward the flock, babies follow mom. */
  private nextGoal(a: Animal): Vec | null {
    let center: Vec = a;
    let reach = a.kind === "bunny" ? 110 : a.kind === "cow" ? 140 : 120;
    if (a.mom && a.baby > 0) {
      center = a.mom;
      reach = 30;
    } else if (a.kind === "sheep" && Math.random() < 0.5) {
      const others = this.animals.filter((o) => o.kind === "sheep" && o !== a);
      if (others.length) {
        center = pick(others);
        reach = 50;
      }
    }
    for (let i = 0; i < 12; i++) {
      const ang = rand(0, Math.PI * 2);
      const r = rand(reach * 0.3, reach);
      const p = { x: center.x + Math.cos(ang) * r, y: center.y + Math.sin(ang) * r * 0.6 };
      if (this.grazable(p) && this.grazePath(a, p)) return p;
    }
    return null;
  }

  private updateAnimals(dt: number) {
    const cursor = this.cursorActive() ? this.cursor : null;
    for (const a of this.animals) {
      a.jump = Math.max(0, a.jump - dt);
      a.calm = Math.max(0, a.calm - dt);
      a.flee = Math.max(0, a.flee - dt);
      a.baby = Math.max(0, a.baby - dt);
      if (a.shorn > 0) {
        a.shorn -= dt;
        if (a.shorn <= 0) this.sign(a.x, this.animalBox(a).y, { text: "FLUFFY", life: 1.4 });
      }
      if (a.baby <= 0) a.mom = null;

      // Bunnies are skittish: the cursor, or a meeple flying past, sends them off.
      if (a.kind === "bunny" && cursor && a.flee <= 0 && dist(cursor, a) < 70) this.scare(a, cursor);
      for (const m of this.meeples) {
        if (m.inside || m.mode !== "walk" || Math.hypot(m.vx, m.vy) < TUMBLE_SPEED * 2) continue;
        if (a.calm > 0 || !overlap({ x: m.x, y: m.y, w: W, h: H }, this.animalBox(a))) continue;
        a.jump = 0.5;
        a.calm = 1.5;
        this.sign(a.x, this.animalBox(a).y, { text: "!", life: 0.8 });
        if (a.kind === "bunny") this.scare(a, center(m));
      }

      if (a.kind === "bunny") this.hopAlong(a, dt);
      else this.walkAlong(a, dt);
    }
  }

  /** Run directly away from p, as far as the grass allows. */
  private scare(a: Animal, from: Vec) {
    const d = Math.hypot(a.x - from.x, a.y - from.y) || 1;
    for (const r of [110, 70, 40]) {
      const p = { x: a.x + ((a.x - from.x) / d) * r, y: a.y + ((a.y - from.y) / d) * r * 0.7 };
      if (this.grazable(p) && this.grazePath(a, p)) {
        a.goal = p;
        a.pause = 0;
        a.flee = 1.2;
        return;
      }
    }
  }

  private arrive(a: Animal) {
    a.goal = null;
    a.pause = a.kind === "bunny" ? rand(0.6, 3) : rand(2, 7); // grazing
  }

  private walkAlong(a: Animal, dt: number) {
    if (a.pause > 0) {
      a.pause -= dt;
      return;
    }
    a.goal ??= this.nextGoal(a);
    if (!a.goal) return void (a.pause = 1);
    const dx = a.goal.x - a.x;
    const dy = a.goal.y - a.y;
    const d = Math.hypot(dx, dy);
    const step = ANIMALS[a.kind].speed * dt;
    if (d <= step) {
      a.x = a.goal.x;
      a.y = a.goal.y;
      return this.arrive(a);
    }
    if (Math.abs(dx) > 2) a.dir = dx > 0 ? 1 : -1;
    a.x += (dx / d) * step;
    a.y += (dy / d) * step;
    a.stepT += dt;
    if (a.stepT > 0.28) {
      a.stepT = 0;
      a.frame = a.frame ? 0 : 1;
    }
  }

  /** Bunnies only move mid-hop, with a short sit between hops. */
  private hopAlong(a: Animal, dt: number) {
    if (a.hop >= 0) {
      a.hop += dt;
      if (a.goal) {
        const dx = a.goal.x - a.x;
        const dy = a.goal.y - a.y;
        const d = Math.hypot(dx, dy);
        const step = ANIMALS.bunny.speed * (a.flee > 0 ? 1.6 : 1) * (a.baby > 0 ? 0.8 : 1) * dt;
        if (d <= step) {
          a.x = a.goal.x;
          a.y = a.goal.y;
          a.hop = -1;
          return this.arrive(a);
        }
        a.x += (dx / d) * step;
        a.y += (dy / d) * step;
      }
      if (a.hop >= HOP) {
        a.hop = -1;
        a.pause = a.flee > 0 ? 0.04 : rand(0.15, 0.5);
      }
      a.frame = a.hop >= 0 ? 1 : 0;
      return;
    }
    if (a.pause > 0) {
      a.pause -= dt;
      return;
    }
    a.goal ??= this.nextGoal(a);
    if (!a.goal) return void (a.pause = 1);
    if (Math.abs(a.goal.x - a.x) > 2) a.dir = a.goal.x > a.x ? 1 : -1;
    a.hop = 0;
  }

  private animalUnit(a: Animal) {
    return a.baby > 0 ? 4 : U;
  }

  private animalRows(a: Animal) {
    const body = a.kind === "cow" ? COW_BODY : a.kind === "bunny" ? BUNNY_BODY : a.shorn > 0 ? SHORN_BODY : SHEEP_BODY;
    return [...body, ...ANIMALS[a.kind].legs[a.frame]];
  }

  private animalLift(a: Animal) {
    let lift = 0;
    if (a.hop >= 0) lift += Math.sin((Math.PI * a.hop) / HOP) * (a.flee > 0 ? 10 : 7);
    if (a.jump > 0) lift += Math.sin((Math.PI * a.jump) / 0.5) * 12;
    return Math.round(lift);
  }

  private animalBox(a: Animal): Box {
    const rows = this.animalRows(a);
    const u = this.animalUnit(a);
    const w = rows[0].length * u;
    const h = rows.length * u;
    return { x: a.x - w / 2, y: a.y - h - this.animalLift(a), w, h };
  }

  private hitAnimal(p: Vec, padding: number) {
    let best: Animal | null = null;
    for (const a of this.animals) {
      if (!inBox(p, pad(this.animalBox(a), padding))) continue;
      if (!best || a.y > best.y) best = a; // the one in front
    }
    return best;
  }

  /** Tap a cow and the herd moos; tap a sheep for its wool; tap a bunny and there are more bunnies. */
  private tapAnimal(a: Animal) {
    const top = this.animalBox(a).y;
    a.jump = 0.5;
    a.pause = Math.max(a.pause, 0.6);
    if (a.kind === "cow") {
      this.sign(a.x, top, { text: "MOO", life: 1.4 });
      let delay = 0.5;
      for (const o of this.animals) {
        if (o.kind !== "cow" || o === a) continue;
        this.sign(o.x, this.animalBox(o).y, { text: "MOO", delay, life: 1.2 });
        delay += 0.35;
      }
      const m = this.nearestMeeple(a, 220);
      if (m) this.say(m, { text: "MOO", delay: delay + 0.2 });
    } else if (a.kind === "sheep") {
      if (a.shorn > 0) {
        this.sign(a.x, top, { text: "BAA?", life: 1.2 });
        return;
      }
      a.shorn = rand(12, 18);
      this.sign(a.x, top, { text: "BAA", life: 1.4 });
      const box = this.animalBox(a);
      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: box.x + rand(0, box.w),
          y: box.y + rand(0, box.h * 0.6),
          vx: rand(-60, 60),
          vy: rand(-110, -40),
          g: 240,
          t: 0,
          life: rand(0.9, 1.5),
          size: pick([4, 5, 6]),
          color: pick([COAT.white, COAT.white, C.stoneShade]),
        });
      }
      const m = this.nearestMeeple(a, 220);
      if (m) this.say(m, { text: "COZY", delay: 0.5 });
    } else {
      const bunnies = this.animals.filter((o) => o.kind === "bunny");
      if (a.baby > 0 || bunnies.length >= MAX_BUNNIES) {
        this.sign(a.x, top, { icon: "carrot", life: 1.2 });
        return;
      }
      this.sign(a.x, top, { icon: "heart", life: 1.4 });
      const at = [-1, 1]
        .map((s) => ({ x: a.x + s * 22, y: a.y + 4 }))
        .find((p) => this.grazable(p));
      if (at) {
        const kid = this.makeAnimal("bunny", at, a);
        kid.pause = 0.6;
        kid.jump = 0.5;
        this.animals.push(kid);
      }
    }
  }

  private nearestMeeple(p: Vec, within: number) {
    return this.meeples
      .filter((m) => m.mode === "walk" && !m.inside && !m.asleep && !m.bubble)
      .map((m) => ({ m, d: dist(feet(m), p) }))
      .filter((o) => o.d < within)
      .sort((a, b) => a.d - b.d)[0]?.m;
  }

  private drawAnimal(a: Animal) {
    const rows = this.animalRows(a);
    const u = this.animalUnit(a);
    const box = this.animalBox(a);
    const w = rows[0].length;
    const shorn = a.shorn > 0;
    const colors: Record<string, string> = {
      W: shorn ? COAT.skin : a.coat,
      S: shorn ? COAT.skinShade : C.stoneShade,
      K: a.kind === "cow" && a.coat === COAT.cream ? COAT.brown : C.ink,
      N: COAT.pink,
      E: C.pebble,
      B: a.coat,
      I: a.coat === COAT.white ? COAT.pink : a.coat,
      T: COAT.white,
    };
    // The legs and eyes stay ink on a brown-spotted cow.
    const ink = (ch: string, ry: number, rx: number) =>
      a.kind === "cow" && ch === "K" && (ry >= COW_BODY.length || (ry === 2 && rx === 10)) ? C.ink : colors[ch];
    // A shadow on the grass that stays put while it hops.
    const sw = Math.round(box.w * 0.7);
    this.rect(Math.round(a.x - sw / 2), Math.round(a.y) - 1, sw, 2, C.tuftDark);
    const x0 = Math.round(box.x);
    const y0 = Math.round(box.y);
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === ".") return;
        const c = ink(ch, ry, rx);
        if (!c) return;
        const cx = a.dir > 0 ? rx : w - 1 - rx;
        this.rect(x0 + cx * u, y0 + ry * u, u, u, c);
      }),
    );
  }

  private bushes: Tree[] = [];
  private rocks: Box[] = [];
  private wildflowers: (Vec & { petal: string })[] = [];

  private edgeBox(e: Edge): Box {
    const a = this.nodes[e.a];
    const b = this.nodes[e.b];
    return {
      x: Math.min(a.x, b.x) - e.w / 2,
      y: Math.min(a.y, b.y) - e.w / 2,
      w: Math.abs(a.x - b.x) + e.w,
      h: Math.abs(a.y - b.y) + e.w,
    };
  }

  /** Where a building blocks feet: its lower part, as seen from a little above. */
  private footprint(b: Building): Box {
    const { x, y, w, h } = b.box;
    return { x: x - W / 2 + 6, y: y + h * 0.4, w: w + W - 12, h: h * 0.6 - 1 };
  }

  private blocked(p: Vec) {
    if (this.pond && inBox(p, pad(this.pond, 4))) return true;
    return this.buildings.some((b) => inBox(p, this.footprint(b)));
  }

  /** Can feet walk straight from a to b without going through a building? */
  private clear(a: Vec, b: Vec) {
    const n = Math.max(1, Math.ceil(dist(a, b) / 5));
    for (let i = 1; i <= n; i++) {
      if (this.blocked({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n })) return false;
    }
    return true;
  }

  private nearest(p: Vec, among?: number[]) {
    const ids = among ?? this.nodes.map((_, i) => i);
    const sorted = [...ids].sort((a, b) => dist(p, this.nodes[a]) - dist(p, this.nodes[b]));
    return sorted.find((i) => this.clear(p, this.nodes[i])) ?? sorted[0];
  }

  private shortest(from: number, to: number): number[] {
    const n = this.nodes.length;
    const d = new Array<number>(n).fill(Infinity);
    const prev = new Array<number>(n).fill(-1);
    const done = new Array<boolean>(n).fill(false);
    d[from] = 0;
    for (;;) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
      if (u < 0 || d[u] === Infinity || u === to) break;
      done[u] = true;
      for (const v of this.nodes[u].links) {
        const nd = d[u] + dist(this.nodes[u], this.nodes[v]);
        if (nd < d[v]) {
          d[v] = nd;
          prev[v] = u;
        }
      }
    }
    const path = [to];
    while (path[0] !== from && prev[path[0]] >= 0) path.unshift(prev[path[0]]);
    return path[0] === from ? path : [to];
  }

  private routeTo(m: Meeple, at: Vec, ends?: number[]) {
    const from = feet(m);
    if (dist(from, at) < 120 && this.clear(from, at)) {
      m.route = [at];
      return;
    }
    const pts: Vec[] = this.shortest(this.nearest(from), this.nearest(at, ends)).map((i) => this.nodes[i]);
    // Don't walk back to a node that's behind us, or past the last one.
    while (pts.length > 1 && dist(from, pts[1]) < dist(pts[0], pts[1]) && this.clear(from, pts[1])) pts.shift();
    const n = pts.length;
    if (n > 1 && dist(pts[n - 2], at) < dist(pts[n - 2], pts[n - 1]) && this.clear(pts[n - 2], at)) pts.pop();
    m.route = [...pts, at];
  }

  // ----------------------------------------------------------------- loop

  private resume() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private pause() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private onVisibility = () => {
    if (document.visibilityState === "visible") this.resume();
    else {
      this.pause();
      if (this.drag) this.release(this.drag, performance.now(), false);
      if (this.squareDrag) this.releaseSquare(this.squareDrag, performance.now(), false);
    }
  };

  private frame = (now: number) => {
    const dt = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number) {
    this.updateEvent(dt);
    this.updateDance(dt);
    this.updatePraise();
    this.courtCooldown -= dt;
    if (this.pendingCourt > 0) {
      this.pendingCourt -= dt;
      if (this.pendingCourt <= 0) this.holdCourt();
    }
    if (!this.busy()) {
      this.meetingIn -= dt;
      // Now and then it's choir practice instead of a meeting.
      if (this.meetingIn <= 0) {
        if (this.church && Math.random() < 0.3) this.choir();
        else this.ringBell();
      }
    }
    if (this.post) {
      this.mailIn -= dt;
      if (this.mailIn <= 0) {
        this.mailIn = rand(50, 90);
        this.deliverMail();
      }
    }

    for (const m of this.meeples) {
      m.modeT += dt;
      m.greetIn -= dt;
      if (m.fading) {
        m.alpha = clamp(m.alpha + (m.fading * dt) / FADE_TIME, 0, 1);
        if (m.fading > 0 && m.alpha >= 1) m.fading = 0;
        if (m.fading < 0 && m.alpha <= 0) {
          m.fading = 0;
          m.inside = true;
        }
      }
      if (m.bubble) {
        m.bubble.t += dt;
        if (m.bubble.t > m.bubble.life) m.bubble = null;
      }
      if (m.hop !== null) {
        m.hop += dt;
        if (m.hop > HOP_TIME * 2) m.hop = null;
      }
      // Round the gold flower: hop, hop, a breath, again.
      const t = m.task;
      if (t?.kind === "spot" && t.why === "praise" && t.arrived && m.hop === null && m.mode === "walk") m.hop = -rand(0.05, 0.35);
      m.lassoCooldown -= dt;
      m.rushCooldown -= dt;
      switch (m.mode) {
        case "walk":
          this.think(m, dt);
          this.integrate(m, dt);
          break;
        case "shake":
          if (m.modeT > SHAKE_TIME) this.explode(m);
          break;
        case "exploded":
          this.moveBlocks(m.blocks, dt);
          if (m.modeT > SCATTER_TIME) this.startReassembly(m);
          break;
        case "reassemble":
          this.reassemble(m, dt);
          break;
      }
      if (!m.inside && (m.task?.kind === "zoom" || m.rush || Math.hypot(m.vx, m.vy) > TUMBLE_SPEED)) this.trample(m);
      this.updateFace(m, dt);
      m.prev = { x: m.x, y: m.y };
    }
    this.collide();
    this.greetings();
    this.shoveSquares();
    this.updateSquares(dt);
    this.updateWild(dt);

    for (const s of this.slots) {
      const p = s.plant;
      if (!p) continue;
      if (p.flat >= 0) {
        p.flat += dt;
        if (p.flat > 3) s.plant = null;
        continue;
      }
      p.wet = Math.max(0, p.wet - dt);
      p.grow = Math.min(2, p.grow + dt / (p.wet > 0 ? 10 : 45));
    }

    for (const b of this.buildings) {
      b.knock = Math.max(0, b.knock - dt);
      b.ring = Math.max(0, b.ring - dt);
      const home = b.owner?.inside;
      if (!home || b.kind !== "house") continue;
      b.puffIn -= dt;
      if (b.puffIn > 0) continue;
      const sleepy = b.owner!.cfg.id === "blue";
      b.puffIn = sleepy ? 1.5 : rand(0.5, 0.9);
      const cx = b.chimney ? b.box.x + (b.chimney < 0 ? 4 : 12) * U : b.box.x + 8 * U;
      this.particles.push({
        x: cx + rand(-2, 2),
        y: b.box.y + (b.chimney ? 0 : U),
        vx: rand(-4, 6),
        vy: sleepy ? -16 : -20,
        g: 0,
        t: 0,
        life: sleepy ? 2.6 : 2,
        size: sleepy ? 2 : 4,
        color: C.muted,
        z: sleepy,
      });
    }
    for (const t of this.trees) t.shake = Math.max(0, t.shake - dt);
    this.updateAnimals(dt);

    for (const p of this.particles) {
      p.t += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.t < p.life);
    for (const s of this.signs) s.t += dt;
    this.signs = this.signs.filter((s) => s.t < s.life);
  }

  // ---------------------------------------------------------------- brains

  private setTask(m: Meeple, task: Task | null) {
    const old = m.task;
    if (old?.kind === "garden" && old.slot.claimed === m) old.slot.claimed = null;
    this.cancelLasso(m);
    m.planting = -1;
    m.rush = false;
    m.task = task;
    m.goal = null;
    m.route = [];
    m.tool = null;
    m.face = null;
  }

  private pickTask(m: Meeple): Task {
    const others = this.meeples.filter((o) => o !== m);
    if (m.carry) return { kind: "deliver", phase: "go", t: 0, to: pick(others), said: 0 };
    if (this.post?.mail.includes(m.cfg.id) && Math.random() < 0.6) return { kind: "post", phase: "go", t: 0, to: null };
    if (m.owed > 0) {
      const s = this.findSlot("empty");
      if (s) return this.gardenTask(m, s, "plant", "flower");
      m.owed = 0;
    }
    if (m.wantHarvest) {
      m.wantHarvest = false;
      const s = this.findSlot("ripe");
      if (s) return this.gardenTask(m, s, "harvest", s.plant!.kind);
    }
    switch (weighted(PLANS[m.cfg.id])) {
      case "home":
        return { kind: "home", phase: "go", t: 0, stay: m.cfg.id === "blue" ? rand(16, 30) : rand(6, 14) };
      case "garden":
        return this.gardenJob(m) ?? this.strollTask();
      case "visit": {
        const home = others.filter((o) => o.inside);
        const to = home.length && Math.random() < 0.7 ? pick(home) : pick(others);
        return { kind: "deliver", phase: "go", t: 0, to, said: 0 };
      }
      case "nap": {
        const dur = m.cfg.id === "blue" ? rand(24, 40) : rand(14, 26);
        const at = pick(this.restSpots.length ? this.restSpots : [m.house.hostSpot]);
        return { kind: "nap", phase: "go", t: 0, dur, at, walk: null, next: rand(6, 11) };
      }
      case "mail":
        return this.post ? { kind: "post", phase: "go", t: 0, to: pick(others) } : this.strollTask();
      case "zoom":
        return { kind: "zoom", to: this.zoomTarget(), legs: 2 + Math.floor(Math.random() * 3) };
      default:
        return this.strollTask();
    }
  }

  private strollTask(): Task {
    const to =
      this.restSpots.length && Math.random() < 0.5 ? pick(this.restSpots) : { ...pick(this.nodes) };
    return { kind: "stroll", phase: "go", t: 0, rest: rand(2, 5), to };
  }

  /** The Chaotic One's next dash: somewhere on the paths, straight through the garden, or the monument. */
  private zoomTarget(): Vec {
    const g = this.garden;
    const home = this.squares.filter((s) => s.state === "home");
    if (home.length && this.time > this.nextShove && Math.random() < 0.5) {
      // Charge straight through one of the founders' squares.
      this.nextShove = this.time + rand(18, 30);
      const s = pick(home);
      return { x: s.x + SQ / 2, y: s.y + SQ + 6 };
    }
    if (Math.random() < 0.35 && g.w > 4 * P) {
      return { x: rand(g.x + P, g.x + g.w - P), y: rand(g.y + 2 * P, g.y + g.h - U) };
    }
    return { ...pick(this.nodes) };
  }

  private findSlot(want: "empty" | "ripe" | "dry"): Slot | null {
    const ok = this.slots.filter((s) => {
      if (s.claimed) return false;
      const p = s.plant;
      if (want === "empty") return !p;
      if (!p || p.flat >= 0) return false;
      if (want === "ripe") return p.grow >= 1 && (p.kind !== "flower" || Math.random() < 0.3);
      return p.grow < 1 && p.wet <= 0;
    });
    return ok.length ? pick(ok) : null;
  }

  private gardenJob(m: Meeple): Task | null {
    const ripe = !m.carry && Math.random() < 0.55 ? this.findSlot("ripe") : null;
    if (ripe) return this.gardenTask(m, ripe, "harvest", ripe.plant!.kind);
    const dry = Math.random() < 0.6 ? this.findSlot("dry") : null;
    if (dry) return this.gardenTask(m, dry, "water", dry.plant!.kind);
    const empty = this.findSlot("empty");
    if (!empty) return null;
    const kind: PlantKind =
      m.cfg.id === "green" ? pick(["carrot", "carrot", "cabbage", "flower", "flower"] as const) : pick(["flower", "flower", "flower", "carrot", "cabbage"] as const);
    return this.gardenTask(m, empty, "plant", kind);
  }

  private gardenTask(m: Meeple, slot: Slot, job: "plant" | "water" | "harvest", plant: PlantKind): Task {
    slot.claimed = m;
    return { kind: "garden", phase: "go", t: 0, slot, job, plant };
  }

  private randomItem(kind: PlantKind): { kind: PlantKind; petal: string } {
    return { kind, petal: pick(PETALS) };
  }

  /** Walk toward `at` along the paths. True once there. */
  private go(m: Meeple, at: Vec, dt: number, ends?: number[], speed = m.speed) {
    if (m.goal !== at) {
      m.goal = at;
      this.routeTo(m, at, ends);
    }
    const f = feet(m);
    while (m.route.length) {
      const t = m.route[0];
      const dx = t.x - f.x;
      const dy = t.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d <= speed * dt + 0.5) {
        m.x = t.x - W / 2;
        m.y = t.y - H;
        f.x = t.x;
        f.y = t.y;
        m.route.shift();
        continue;
      }
      m.wx = (dx / d) * speed;
      m.wy = (dy / d) * speed;
      return false;
    }
    return true;
  }

  private leaveHouse(m: Meeple) {
    m.inside = false;
    m.alpha = 0;
    m.fading = 1;
    m.asleep = false;
    m.x = m.house.doorway.x - W / 2;
    m.y = m.house.doorway.y - H;
    m.goal = null;
    m.route = [];
  }

  private think(m: Meeple, dt: number) {
    m.wx = m.wy = 0;
    if (m.fading < 0) return; // stepping inside
    if (m.pause > 0) {
      m.pause -= dt;
      if (m.pause <= 0) m.face = null;
      return;
    }
    if (Math.hypot(m.vx, m.vy) > TUMBLE_SPEED) return; // still sliding from a throw

    if (m.lasso) {
      this.workLasso(m, dt);
      return;
    }
    if (m.planting >= 0) {
      this.dig(m, dt);
      return;
    }
    if (this.play(m, dt)) return;

    // The Shy One scoots away from a cursor that gets close.
    if (m.cfg.id === "green" && !m.inside && !this.event && m.task?.kind !== "spot" && this.cursorActive()) {
      const c = center(m);
      const d = Math.hypot(c.x - this.cursor.x, c.y - this.cursor.y);
      if (d < 80) m.scared = 0.6;
      if (m.scared > 0) {
        m.scared -= dt;
        m.wx = ((c.x - this.cursor.x) / (d || 1)) * m.speed * 1.8;
        m.wy = ((c.y - this.cursor.y) / (d || 1)) * m.speed * 1.8;
        m.goal = null;
        return;
      }
    }

    if (!m.task) this.setTask(m, this.pickTask(m));
    const t = m.task!;
    if (m.inside && t.kind !== "home") this.leaveHouse(m);

    switch (t.kind) {
      case "home": {
        if (t.phase === "go") {
          if (!m.inside && !this.go(m, m.house.doorway, dt, [m.house.doorNode])) break;
          if (m.house.gift) {
            this.say(m, { icon: "heart" });
            m.house.gift = null;
          }
          m.carry = null; // put the harvest away
          if (!m.inside) m.fading = -1;
          t.phase = "in";
          t.t = 0;
          break;
        }
        if (!m.inside) break;
        t.t += dt;
        if (m.cfg.id === "blue") m.asleep = true;
        if (t.t > t.stay) {
          m.asleep = false;
          this.setTask(m, null);
        }
        break;
      }

      case "stroll": {
        if (t.phase === "go") {
          if (this.go(m, t.to, dt)) {
            t.phase = "rest";
            t.t = 0;
          }
          break;
        }
        t.t += dt;
        // A breather out on the grass is a good time to plant something.
        m.plantIn -= dt;
        if (m.plantIn <= 0 && t.t > 0.5) {
          const spot = this.plantSpot(m);
          if (spot) {
            m.planting = 0;
            m.face = { x: spot.x, y: spot.y - 4 };
            break;
          }
          m.plantIn = rand(1.5, 3);
        }
        if (Math.random() < dt * 0.7) {
          const f = feet(m);
          m.face = { x: f.x + rand(-120, 120), y: f.y + rand(-80, 40) };
        }
        if (t.t > t.rest) this.setTask(m, null);
        break;
      }

      case "garden": {
        const s = t.slot;
        if (t.phase === "go") {
          if (!this.go(m, s.stand, dt, this.gardenNodes)) break;
          const p = s.plant;
          const still = t.job === "plant" ? !p : !!p && p.flat < 0 && (t.job === "water" || p.grow >= 1);
          if (!still) {
            this.setTask(m, null);
            break;
          }
          t.phase = "work";
          t.t = 0;
          m.face = { x: s.x, y: s.y - 12 };
          m.tool = t.job === "water" ? "water" : t.job === "plant" ? "dig" : null;
          break;
        }
        t.t += dt;
        const f = feet(m);
        if (t.job === "water" && Math.random() < dt * 16) {
          this.particles.push({ x: f.x + W / 2 + 12, y: f.y - H + P + 4, vx: rand(4, 14), vy: rand(10, 30), g: 260, t: 0, life: 0.35, size: 2, color: C.accent });
        }
        if (t.job === "plant" && Math.random() < dt * 10) {
          this.particles.push({ x: s.x + rand(-4, 4), y: s.y - 2, vx: rand(-30, 30), vy: rand(-70, -40), g: 300, t: 0, life: 0.35, size: 2, color: C.wet });
        }
        if (t.t < (t.job === "water" ? 2 : t.job === "plant" ? 1.3 : 0.7)) break;
        if (t.job === "plant" && !s.plant) {
          s.plant = { ...this.randomItem(t.plant), grow: 0, wet: 0, flat: -1 };
          if (m.owed > 0) m.owed--;
        } else if (t.job === "water" && s.plant) {
          s.plant.wet = 20;
        } else if (t.job === "harvest" && s.plant) {
          m.carry = { kind: s.plant.kind, petal: s.plant.petal };
          s.plant = null;
          m.hop = 0;
        }
        this.setTask(m, null);
        break;
      }

      case "deliver":
        this.deliver(m, t, dt);
        break;

      case "host": {
        if (t.phase === "go") {
          if (!this.go(m, m.house.hostSpot, dt)) break;
          t.phase = "meet";
          t.t = 0;
          if (!t.guest) this.say(m, { text: pick(HELLOS) });
          break;
        }
        t.t += dt;
        if (t.guest) {
          m.face = feet(t.guest);
          const gt = t.guest.task;
          if (gt?.kind !== "deliver" || gt.to !== m || t.t > 12) this.setTask(m, null);
        } else {
          m.face = { x: this.cursor.x, y: this.cursor.y };
          if (t.t > 2.4) this.setTask(m, null);
        }
        break;
      }

      case "spot": {
        if (!t.arrived) {
          // Hurry: the whole town is waiting.
          // The gold flower and the dance don't last long: everyone runs, even the slow ones.
          const run = t.why === "praise" || t.why === "dance" ? Math.max(m.speed * 2.5, 190) : m.speed * (m.cfg.id === "red" ? 1 : 1.7);
          if (this.go(m, t.at, dt, undefined, run)) t.arrived = true;
          break;
        }
        m.face = t.face;
        // In the dance line, the whole line shuffles together.
        if (this.inLine(m)) m.x = t.at.x - W / 2 + this.danceShift();
        break;
      }

      case "nap": {
        if (t.phase === "go") {
          if (this.go(m, t.at, dt)) {
            t.phase = "sleep";
            t.t = 0;
            m.asleep = true;
          }
          break;
        }
        t.t += dt;
        // The Sleepy One sleepwalks to a fresh napping spot every so often,
        // eyes shut and z's still going, and sometimes plants in its sleep.
        if (m.cfg.id === "blue" && m.asleep) {
          if (t.walk) {
            if (this.go(m, t.walk, dt, undefined, 45)) {
              t.walk = null;
              t.next = rand(6, 11);
              if (Math.random() < 0.6) this.plant(m);
            }
            break;
          }
          t.next -= dt;
          if (t.next <= 0) {
            t.walk = this.sleepwalkTo(m);
            if (!t.walk) t.next = rand(3, 6);
          }
        }
        if (!m.asleep || t.t > t.dur) {
          m.asleep = false;
          this.setTask(m, null);
        }
        break;
      }

      case "post":
        this.mail(m, t, dt);
        break;

      case "zoom": {
        if (!this.go(m, t.to, dt)) break;
        t.legs--;
        if (t.legs <= 0) {
          m.pause = rand(0.6, 1.6);
          this.setTask(m, null);
        } else {
          t.to = this.zoomTarget();
        }
        break;
      }
    }
  }

  /** Knock on a friend's door, for a visit or to drop off some harvest. */
  private deliver(m: Meeple, t: Extract<Task, { kind: "deliver" }>, dt: number) {
    const host = t.to;
    const house = host.house;
    if (t.phase === "go") {
      if (!this.go(m, house.guestSpot, dt, [house.doorNode])) return;
      t.phase = "knock";
      t.t = 0;
      house.knock = 0.8;
      m.face = house.doorway;
      this.say(m, { text: "KNOCK KNOCK", life: 1.2 });
      return;
    }
    t.t += dt;
    m.face = t.phase === "talk" ? feet(host) : house.doorway;

    if (t.phase === "knock") {
      if (t.t < 1) return;
      t.phase = "wait";
      t.t = 0;
      if (host.inside && host.task?.kind === "home" && host.mode === "walk") {
        this.setTask(host, { kind: "host", phase: "go", t: 0, guest: m });
      }
      return;
    }

    const ht = host.task;
    const coming = ht?.kind === "host" && ht.guest === m;
    if (t.phase === "wait") {
      if (!coming) {
        if (t.t < 1.2) return;
        // Nobody home. Leave the present on the step.
        if (m.carry && !house.gift) {
          house.gift = m.carry;
          m.carry = null;
        }
        this.say(m, { text: "..." });
        this.setTask(m, null);
        return;
      }
      if (ht.phase !== "meet") {
        if (t.t > 10) this.setTask(m, null);
        return;
      }
      t.phase = "talk";
      t.t = 0;
      if (m.carry) {
        host.carry = m.carry;
        m.carry = null;
        this.say(host, { icon: "heart" });
        this.say(m, { icon: "heart", delay: 0.4 });
        t.said = -1; // a gift, not a chat
      } else {
        this.say(m, { text: pick(HELLOS) });
        this.say(host, { text: pick(HELLOS), delay: 0.5 });
      }
      return;
    }

    // Talking on the doorstep.
    if (t.said < 0) {
      if (t.t < 1.8) return;
      this.setTask(m, null);
      this.setTask(host, { kind: "home", phase: "go", t: 0, stay: rand(4, 9) });
      return;
    }
    // Four lines of small talk, taking turns, after the hellos.
    if (t.said < 4 && t.t >= 1.5 + t.said * 1.15) {
      this.say(t.said % 2 ? host : m, pick(SMALL_TALK));
      t.said++;
    }
    if (t.t < 6.6) return;
    m.hop = 0;
    host.hop = 0;
    this.setTask(m, null);
    this.setTask(host, Math.random() < 0.5 ? { kind: "home", phase: "go", t: 0, stay: rand(5, 12) } : null);
  }

  private say(m: Meeple, s: Say) {
    m.bubble = { text: s.text ?? "", icon: s.icon ?? null, t: -(s.delay ?? 0), life: s.life ?? 1.6 };
  }

  private sign(x: number, y: number, s: Say) {
    this.signs.push({ x, y, text: s.text ?? "", icon: s.icon ?? null, t: -(s.delay ?? 0), life: s.life ?? 1.6 });
  }

  /** Two meeples passing on the path sometimes stop to say hi. */
  private greetings() {
    if (this.event) return;
    const casual = (m: Meeple) =>
      m.mode === "walk" &&
      !m.inside &&
      m.alpha === 1 &&
      m.greetIn <= 0 &&
      m.pause <= 0 &&
      m.route.length > 0 &&
      !m.asleep &&
      (m.task?.kind === "stroll" || m.task?.kind === "home" || m.task?.kind === "garden" || m.task?.kind === "zoom" || m.task?.kind === "nap");
    for (let i = 0; i < this.meeples.length; i++) {
      const a = this.meeples[i];
      if (!casual(a)) continue;
      for (let j = i + 1; j < this.meeples.length; j++) {
        const b = this.meeples[j];
        if (!casual(b) || dist(feet(a), feet(b)) > 40) continue;
        a.greetIn = b.greetIn = rand(18, 30);
        if (Math.random() < 0.4) continue;
        a.pause = b.pause = 1.6;
        a.face = feet(b);
        b.face = feet(a);
        this.say(a, { text: pick(HELLOS) });
        this.say(b, Math.random() < 0.5 ? { text: pick(HELLOS), delay: 0.4 } : { icon: "heart", delay: 0.4 });
        break;
      }
    }
  }

  // ---------------------------------------------------------- town events

  private gather(m: Meeple, at: Vec, face: Vec) {
    m.rush = false;
    if (m.asleep) {
      m.asleep = false;
      this.say(m, { text: "!" });
    }
    m.pause = 0;
    m.scared = 0;
    this.setTask(m, { kind: "spot", at, face, arrived: false, why: "event" });
  }

  private updateEvent(dt: number) {
    const ev = this.event;
    if (!ev) return;
    ev.t += dt;
    if (ev.phase === "gather") {
      const ready = this.meeples.every((m) => m.task?.kind === "spot" && m.task.arrived);
      if (ready || ev.t > 24) {
        ev.phase = "talk";
        ev.t = 0;
      }
      return;
    }
    const crowd = this.meeples.filter((m) => m !== ev.lead && m !== ev.dock);
    if (ev.kind === "choir" && ev.t > 1.2 && ev.t < 5 && Math.random() < dt / NOTE_EVERY) {
      // The choir's song floats up off the steps.
      const m = pick(crowd);
      this.addNote(m.x + rand(-10, W + 4), m.y - rand(10, 26));
    }
    while (ev.next < ev.beats.length && ev.beats[ev.next].at <= ev.t) {
      const b = ev.beats[ev.next++];
      const say = { text: b.text, icon: b.icon, life: b.life };
      if (b.who === "lead") this.say(ev.lead, say);
      if (b.who === "dock" && ev.dock) this.say(ev.dock, say);
      if (b.who === "crowd") {
        crowd.forEach((m, i) => {
          // The Chaotic One votes against things, on principle.
          const nay = m.cfg.id === "red" && Math.random() < 0.5;
          this.say(m, { ...say, text: nay ? "NAY" : say.text, delay: i * 0.18 });
        });
      }
      if (b.hop) ev.lead.hop = 0;
      if (b.hop && ev.kind === "court") {
        this.sign(this.court.doorway.x + 28, this.court.doorway.y - H - 6, { text: "BONK", life: 0.8 });
      }
    }
    const end = ev.beats[ev.beats.length - 1];
    if (ev.next >= ev.beats.length && ev.t > end.at + end.life + 0.3) this.endEvent(ev);
  }

  private endEvent(ev: TownEvent) {
    this.event = null;
    this.meetingIn = rand(80, 130);
    for (const m of this.meeples) if (m.task?.kind === "spot") this.setTask(m, null);
    if (ev.kind === "choir") {
      for (const m of this.meeples) m.hop = rand(-0.3, 0);
      return;
    }
    if (ev.kind === "court") {
      this.courtCooldown = 45;
      if (ev.dock) ev.dock.owed = 3;
      return;
    }
    switch (ev.motion?.effect) {
      case "plant":
        for (const m of this.meeples) m.owed = 1;
        break;
      case "share":
        for (const m of this.meeples) m.wantHarvest = Math.random() < 0.6;
        break;
      case "nap":
        for (const m of this.meeples) this.setTask(m, { kind: "home", phase: "go", t: 0, stay: rand(8, 16) });
        break;
      case "hug":
        for (const m of this.meeples) {
          m.hop = rand(-0.3, 0);
          this.say(m, { icon: "heart", delay: rand(0, 0.3) });
        }
        break;
      case "party": {
        const b = this.hall.box;
        for (let i = 0; i < 60; i++) {
          this.particles.push({
            x: b.x + b.w / 2 + rand(-20, 20),
            y: b.y + 8 * U,
            vx: rand(-160, 160),
            vy: rand(-260, -80),
            g: 320,
            t: 0,
            life: rand(1.2, 2),
            size: 3,
            color: pick(MEEPLE_HEXES),
          });
        }
        for (const m of this.meeples) {
          m.hop = rand(-0.4, 0);
          this.say(m, { icon: "star", delay: rand(0, 0.4) });
        }
        break;
      }
      case "dance":
        this.whistle();
        break;
    }
  }

  private trample(m: Meeple) {
    this.trampleWild(m);
    const f = feet(m);
    for (const s of this.slots) {
      const p = s.plant;
      if (!p || p.flat >= 0 || p.grow < 0.25) continue;
      if (Math.abs(f.x - s.x) > 10 || f.y < s.y - 10 || f.y > s.y + 8) continue;
      p.flat = 0;
      if (s.claimed?.task?.kind === "garden") this.setTask(s.claimed, null);
      if (m.cfg.id === "red" && m.task?.kind === "zoom" && !this.event && this.courtCooldown <= 0 && this.pendingCourt <= 0) {
        // Somebody saw that.
        this.pendingCourt = 1.4;
        for (const o of this.meeples) if (o !== m && !o.inside && o.mode === "walk") this.say(o, { text: "!", delay: rand(0, 0.4) });
      }
    }
  }

  /** The neighbors run over to a meeple that's gone to pieces. */
  private callHelp(m: Meeple) {
    if (this.event) return;
    const f = feet(m);
    const helpers = this.meeples.filter(
      (o) => o !== m && o.mode === "walk" && !o.inside && o.fading >= 0 && o.task?.kind !== "spot" && Math.hypot(o.vx, o.vy) < TUMBLE_SPEED,
    );
    m.helpers = helpers;
    helpers.forEach((o, i) => {
      const a = Math.PI * (0.15 + (0.7 * (i + 0.5)) / helpers.length) + (Math.random() < 0.5 ? 0 : Math.PI);
      const at = {
        x: clamp(f.x + Math.cos(a) * 56, W, this.vw - W),
        y: clamp(f.y + Math.sin(a) * 26 + 6, H + 4, this.worldH - 4),
      };
      if (o.asleep) o.asleep = false;
      this.say(o, { text: "!", delay: rand(0, 0.3) });
      this.setTask(o, { kind: "spot", at, face: f, arrived: false, why: "help" });
    });
  }

  // -------------------------------------------------------------- physics

  private integrate(m: Meeple, dt: number) {
    m.x += (m.wx + m.vx) * dt;
    m.y += (m.wy + m.vy) * dt;
    const fr = Math.exp(-FRICTION * dt);
    m.vx *= fr;
    m.vy *= fr;
    if (Math.abs(m.vx) < 1) m.vx = 0;
    if (Math.abs(m.vy) < 1) m.vy = 0;

    if (m.x < 0 || m.x > this.vw - W) {
      m.x = clamp(m.x, 0, this.vw - W);
      m.vx = -m.vx * BOUNCE;
    }
    if (m.y < 0 || m.y > this.worldH - H) {
      m.y = clamp(m.y, 0, this.worldH - H);
      m.vy = -m.vy * BOUNCE;
    }

    // Bounce off buildings, and slide out of one if dropped on it.
    if (!m.inside && m.fading >= 0) {
      const f = feet(m);
      for (const b of this.buildings) {
        const fp = this.footprint(b);
        if (!inBox(f, fp)) continue;
        const outs = [f.x - fp.x, fp.x + fp.w - f.x, f.y - fp.y, fp.y + fp.h - f.y];
        const k = outs.indexOf(Math.min(...outs));
        if (k === 0) {
          m.x -= outs[0] + 0.5;
          if (m.vx > 0) m.vx = -m.vx * BOUNCE;
        } else if (k === 1) {
          m.x += outs[1] + 0.5;
          if (m.vx < 0) m.vx = -m.vx * BOUNCE;
        } else if (k === 2) {
          m.y -= outs[2] + 0.5;
          if (m.vy > 0) m.vy = -m.vy * BOUNCE;
        } else {
          m.y += outs[3] + 0.5;
          if (m.vy < 0) m.vy = -m.vy * BOUNCE;
        }
        if (Math.hypot(m.vx, m.vy) > 200) b.knock = 0.3;
      }
    }

    if (Math.hypot(m.wx, m.wy) > 1 && Math.hypot(m.vx, m.vy) < TUMBLE_SPEED) {
      m.stepT += dt;
      if (m.stepT > m.stepEvery) {
        m.stepT = 0;
        m.stepFrame = m.stepFrame ? 0 : 1;
      }
    } else {
      m.stepT = 0;
    }
  }

  /** Meeples only bump when one of them is flying; otherwise they share the path. */
  private collide() {
    const solid = this.meeples.filter((m) => !m.inside && m.alpha > 0.5 && (m.mode === "walk" || m.mode === "drag"));
    for (let i = 0; i < solid.length; i++) {
      for (let j = i + 1; j < solid.length; j++) {
        const a = solid[i];
        const b = solid[j];
        if (Math.max(Math.hypot(a.vx, a.vy), Math.hypot(b.vx, b.vy)) < 120 && a.mode !== "drag" && b.mode !== "drag") continue;
        const ox = Math.min(a.x, b.x) + W - Math.max(a.x, b.x) - 2;
        const oy = Math.min(a.y, b.y) + H - Math.max(a.y, b.y) - 2;
        if (ox <= 0 || oy <= 0) continue;
        const ia = a.mode === "drag" ? 0 : 1;
        const ib = b.mode === "drag" ? 0 : 1;
        if (ia + ib === 0) continue;
        const n: Vec = ox < oy ? { x: Math.sign(b.x - a.x) || 1, y: 0 } : { x: 0, y: Math.sign(b.y - a.y) || 1 };
        const o = ox < oy ? ox : oy;
        a.x -= n.x * o * (ia / (ia + ib));
        a.y -= n.y * o * (ia / (ia + ib));
        b.x += n.x * o * (ib / (ia + ib));
        b.y += n.y * o * (ib / (ia + ib));
        const rel = (b.vx + b.wx - a.vx - a.wx) * n.x + (b.vy + b.wy - a.vy - a.wy) * n.y;
        if (rel >= 0) continue;
        const jmp = (-(1 + COLLIDE) * rel) / (ia + ib);
        a.vx -= jmp * ia * n.x;
        a.vy -= jmp * ia * n.y;
        b.vx += jmp * ib * n.x;
        b.vy += jmp * ib * n.y;
        if (-rel > 110) {
          for (const m of [a, b]) {
            if (m.asleep) this.wake(m);
            if (m.mode === "walk" && m.task?.kind !== "spot") this.setTask(m, null);
          }
        }
      }
    }
  }

  private wake(m: Meeple) {
    if (!m.asleep) return;
    m.asleep = false;
    this.say(m, { text: "?" });
  }

  private updateFace(m: Meeple, dt: number) {
    const c = center(m);
    let goal: Vec | null = m.face;
    if (!goal && this.cursorActive() && (m.cfg.id === "purple" || m.cfg.id === "yellow")) {
      if (Math.hypot(this.cursor.x - c.x, this.cursor.y - c.y) < 320) goal = this.cursor;
    }
    let want: Vec = { x: 0, y: 0.3 };
    if (goal) {
      const dx = goal.x - c.x;
      const dy = goal.y - (m.y + P / 2);
      const d = Math.hypot(dx, dy) || 1;
      want = { x: dx / d, y: dy / d };
    } else {
      const vx = m.wx + m.vx;
      const vy = m.wy + m.vy;
      const s = Math.hypot(vx, vy);
      if (s > 5) want = { x: vx / s, y: vy / s };
    }
    const k = 1 - Math.exp(-10 * dt);
    m.look.x += (want.x - m.look.x) * k;
    m.look.y += (want.y - m.look.y) * k;

    if (m.blinkFor > 0) m.blinkFor -= dt;
    else {
      m.blinkIn -= dt;
      if (m.blinkIn <= 0) {
        m.blinkFor = 0.12;
        m.blinkIn = rand(2.5, 6);
      }
    }
  }

  // ------------------------------------------------------------- exploding

  private explode(m: Meeple) {
    m.mode = "exploded";
    m.modeT = 0;
    m.tool = null;
    this.cancelLasso(m);
    m.planting = -1;
    m.rush = false;
    const c = center(m);
    m.blocks = MEEPLE_BLOCKS.map((b) => {
      const x = m.x + b.x * P;
      const y = m.y + b.y * P;
      const dx = x + P / 2 - c.x;
      const dy = y + P / 2 - c.y;
      const a = (Math.hypot(dx, dy) < 2 ? rand(0, Math.PI * 2) : Math.atan2(dy, dx)) + rand(-0.5, 0.5);
      const s = rand(260, 560);
      return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, delay: 0 };
    });
    this.callHelp(m);
  }

  private moveBlocks(blocks: Block[], dt: number) {
    const f = Math.exp(-2.4 * dt);
    for (const b of blocks) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= f;
      b.vy *= f;
      if (b.x < 0 || b.x > this.vw - P) {
        b.x = clamp(b.x, 0, this.vw - P);
        b.vx = -b.vx * 0.6;
      }
      if (b.y < 0 || b.y > this.worldH - P) {
        b.y = clamp(b.y, 0, this.worldH - P);
        b.vy = -b.vy * 0.6;
      }
    }
  }

  private startReassembly(m: Meeple) {
    m.mode = "reassemble";
    m.modeT = 0;
    const order = m.blocks.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((blockIndex, n) => (m.blocks[blockIndex].delay = n * 0.09));
  }

  private reassemble(m: Meeple, dt: number) {
    this.moveBlocks(m.blocks, dt);
    let done = true;
    const pull = 1 - Math.exp(-2.6 * dt);
    const damp = Math.exp(-8 * dt);
    m.blocks.forEach((b, i) => {
      const tx = m.x + MEEPLE_BLOCKS[i].x * P;
      const ty = m.y + MEEPLE_BLOCKS[i].y * P;
      if (m.modeT >= b.delay) {
        b.vx *= damp;
        b.vy *= damp;
        b.x += (tx - b.x) * pull;
        b.y += (ty - b.y) * pull;
      }
      if (Math.abs(tx - b.x) > 0.5 || Math.abs(ty - b.y) > 0.5) done = false;
    });
    if (!done) return;
    m.blocks = [];
    m.mode = "walk";
    m.modeT = 0;
    m.vx = m.vy = 0;
    m.asleep = false;
    m.goal = null;
    m.route = [];
    if (m.task?.kind !== "spot") this.setTask(m, null);
    // Everyone who came running is glad.
    const came = m.helpers.filter((o) => o.task?.kind === "spot" && o.task.why === "help");
    for (const o of came) {
      o.hop = rand(-0.3, 0);
      this.say(o, { icon: "heart", delay: rand(0, 0.3) });
      this.setTask(o, null);
      o.pause = 0.8;
    }
    if (came.length) this.say(m, { text: "THANKS", delay: 0.2 });
    m.helpers = [];
  }

  // ----------------------------------------------------------------- input

  private toLocal(e: { clientX: number; clientY: number }): Vec {
    const c = this.canvas.getBoundingClientRect();
    return { x: e.clientX - c.left, y: e.clientY - c.top };
  }

  private cursorActive() {
    return this.cursor.inside && this.time - this.cursor.lastMove < 4;
  }

  private hit(p: Vec, padding: number): Meeple | null {
    for (let i = this.meeples.length - 1; i >= 0; i--) {
      const m = this.meeples[i];
      if (m.mode !== "walk" || m.inside || m.alpha < 0.5) continue;
      const y = m.y - hopHeight(m);
      if (p.x >= m.x - padding && p.x <= m.x + W + padding && p.y >= y - padding && p.y <= y + H + padding) return m;
    }
    return null;
  }

  private isInteractive(target: EventTarget | null) {
    return target instanceof Element && target.closest(INTERACTIVE) !== null;
  }

  private moveCursor(e: PointerEvent) {
    const p = this.toLocal(e);
    this.cursor.x = p.x;
    this.cursor.y = p.y;
    this.cursor.inside = true;
    this.cursor.lastMove = this.time;
  }

  private onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t || e.touches.length > 1 || this.isInteractive(e.target)) return;
    const p = this.toLocal(t);
    if (this.hit(p, 10) || this.hitSquare(p, 8)) e.preventDefault();
  };

  private onPointerDown = (e: PointerEvent) => {
    this.moveCursor(e);
    if (this.drag || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (this.isInteractive(e.target)) return;
    const p = this.toLocal(e);
    const m = this.hit(p, e.pointerType === "mouse" ? 3 : 10);
    const sq = m ? null : this.hitSquare(p, e.pointerType === "mouse" ? 2 : 8);
    if (sq) {
      e.preventDefault();
      this.grabSquare(sq, e, p);
      return;
    }
    if (!m) {
      // A tap on a building, a tree or the garden. Left alone so touch can still scroll.
      this.press = { pointerId: e.pointerId, start: p, t0: e.timeStamp, moved: 0 };
      return;
    }
    e.preventDefault();
    this.wake(m);
    if (m.task?.kind !== "spot") this.setTask(m, null);
    m.mode = "drag";
    m.modeT = 0;
    m.vx = m.vy = m.wx = m.wy = 0;
    m.pause = 0;
    m.scared = 0;
    m.tool = null;
    m.hop = null;
    this.cancelLasso(m);
    m.planting = -1;
    m.rush = false;
    this.drag = { m, pointerId: e.pointerId, offX: p.x - m.x, offY: p.y - m.y, t0: e.timeStamp, start: p, moved: 0, samples: [{ t: e.timeStamp, ...p }] };
    this.root.style.cursor = "grabbing";
  };

  private onPointerMove = (e: PointerEvent) => {
    this.moveCursor(e);
    const p = this.toLocal(e);
    if (this.press && e.pointerId === this.press.pointerId) {
      this.press.moved = Math.max(this.press.moved, dist(p, this.press.start));
    }
    const sd = this.squareDrag;
    if (sd && e.pointerId === sd.pointerId) {
      sd.sq.x = clamp(p.x - sd.offX, 0, this.vw - SQ);
      sd.sq.y = clamp(p.y - sd.offY, 0, this.worldH - SQ);
      sd.moved = Math.max(sd.moved, dist(p, sd.start));
      sd.samples.push({ t: e.timeStamp, ...p });
      while (sd.samples.length > 2 && e.timeStamp - sd.samples[0].t > 100) sd.samples.shift();
      return;
    }
    const drag = this.drag;
    if (drag && e.pointerId === drag.pointerId) {
      drag.m.x = clamp(p.x - drag.offX, 0, this.vw - W);
      drag.m.y = clamp(p.y - drag.offY, 0, this.worldH - H);
      drag.moved = Math.max(drag.moved, dist(p, drag.start));
      drag.samples.push({ t: e.timeStamp, ...p });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
      return;
    }
    if (e.pointerType === "mouse") {
      const free = !this.isInteractive(e.target);
      this.root.style.cursor = !free ? "" : this.hit(p, 3) || this.hitSquare(p, 2) ? "grab" : this.tappable(p) ? "pointer" : "";
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const press = this.press;
    if (press && e.pointerId === press.pointerId) {
      this.press = null;
      if (e.type === "pointerup" && press.moved < 8 && e.timeStamp - press.t0 < 500) {
        this.tap(press.start, e.pointerType === "mouse" ? 2 : 8);
      }
    }
    const sd = this.squareDrag;
    if (sd && e.pointerId === sd.pointerId) this.releaseSquare(sd, e.timeStamp, e.type === "pointerup");
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.release(drag, e.timeStamp, e.type === "pointerup");
  };

  private onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.cursor.inside = false;
  };

  private release(drag: Drag, now: number, allowClick: boolean) {
    const { m } = drag;
    this.drag = null;
    this.root.style.cursor = "";
    m.modeT = 0;
    m.goal = null;
    m.route = [];
    if (allowClick && drag.moved < 6 && now - drag.t0 < 400) {
      m.mode = "shake";
      return;
    }
    const first = drag.samples[0];
    const lastS = drag.samples[drag.samples.length - 1];
    const span = (lastS.t - first.t) / 1000;
    let vx = 0;
    let vy = 0;
    if (span > 0.008 && now - lastS.t < 80) {
      vx = (lastS.x - first.x) / span;
      vy = (lastS.y - first.y) / span;
      const s = Math.hypot(vx, vy);
      if (s > MAX_THROW) {
        vx = (vx / s) * MAX_THROW;
        vy = (vy / s) * MAX_THROW;
      }
    }
    m.vx = vx;
    m.vy = vy;
    m.mode = "walk";
    m.pause = rand(0.4, 1);
  }

  private tappable(p: Vec) {
    return (
      this.buildings.some((b) => inBox(p, b.box)) ||
      this.hitAnimal(p, 2) !== null ||
      this.trees.some((t) => inBox(p, this.treeBox(t))) ||
      this.slots.some((s) => !s.plant && Math.abs(p.x - s.x) < 10 && p.y > s.y - 3 * P && p.y < s.y + 4)
    );
  }

  private treeBox(t: Tree): Box {
    const w = t.rows[0].length * U;
    const h = t.rows.length * U;
    return { x: t.x, y: t.y - h, w, h };
  }

  private tap(p: Vec, padding = 2) {
    const animal = this.hitAnimal(p, padding);
    if (animal) return this.tapAnimal(animal);

    const b = this.buildings.find((b) => inBox(p, b.box));
    if (b?.kind === "hall") return this.ringBell();
    if (b?.kind === "court") return this.holdCourt();
    if (b?.kind === "post") return this.deliverMail();
    if (b?.kind === "church") return this.choir();
    if (b) return this.knock(b);

    const tree = this.trees.find((t) => inBox(p, this.treeBox(t)));
    if (tree) {
      tree.shake = 0.5;
      const tb = this.treeBox(tree);
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: tb.x + rand(4, tb.w - 4),
          y: tb.y + rand(4, tb.h * 0.5),
          vx: rand(-20, 20),
          vy: rand(-10, 10),
          g: 60,
          t: 0,
          life: rand(1, 1.6),
          size: 3,
          color: pick([C.leaf, C.leafDark, C.leafLight]),
        });
      }
      return;
    }

    // Plant something in an empty spot.
    const slot = this.slots.find((s) => !s.plant && Math.abs(p.x - s.x) < 10 && p.y > s.y - 3 * P && p.y < s.y + 4);
    if (slot) {
      slot.plant = { ...this.randomItem("flower"), grow: 0, wet: 6, flat: -1 };
      for (let i = 0; i < 6; i++) {
        this.particles.push({ x: slot.x, y: slot.y - 4, vx: rand(-40, 40), vy: rand(-90, -40), g: 280, t: 0, life: 0.5, size: 2, color: C.wet });
      }
      const near = this.meeples
        .filter((m) => m.mode === "walk" && !m.inside && !m.asleep)
        .sort((a, b) => dist(feet(a), slot) - dist(feet(b), slot))[0];
      if (near && dist(feet(near), slot) < 260) this.say(near, { icon: "heart" });
    }
  }

  /** Knock on a house: the owner pops out to wave, or hurries home. */
  private knock(b: Building) {
    b.knock = 0.8;
    this.sign(b.doorway.x, b.box.y + 9 * U, { text: "KNOCK KNOCK", life: 1.2 });
    const m = b.owner;
    if (!m || this.event || m.mode !== "walk") return;
    if (m.inside) {
      if (m.task?.kind === "home") this.setTask(m, { kind: "host", phase: "go", t: 0, guest: null });
    } else if (m.task?.kind !== "host" && m.task?.kind !== "deliver") {
      m.asleep = false;
      this.say(m, { text: "COMING" });
      this.setTask(m, { kind: "home", phase: "go", t: 0, stay: rand(2, 4) });
    }
  }

  // ------------------------------------------------- from the landing page

  /** Can a meeple drop what it's doing for a bit of fun? */
  private interruptible(m: Meeple, allowInside = false) {
    if (this.busy() || m.mode !== "walk" || m.fading < 0 || m.asleep) return false;
    if (m.inside && !allowInside) return false;
    const t = m.task;
    if (!t) return true;
    switch (t.kind) {
      case "spot":
      case "host":
        return false;
      case "deliver":
      case "garden":
      case "post":
        return t.phase === "go";
      case "home":
        return t.phase === "go" || allowInside;
      default:
        return true;
    }
  }

  /** Sets the walking velocity toward a top-left corner at (x, y), straight across the grass. True on arrival. */
  private walkTo(m: Meeple, x: number, y: number, speed: number, dt: number) {
    const dx = x - m.x;
    const dy = y - m.y;
    const d = Math.hypot(dx, dy);
    m.goal = null; // whatever it was doing re-routes from here
    if (d < 4) return true;
    const s = Math.min(speed, d / dt);
    m.wx = (dx / d) * s;
    m.wy = (dy / d) * s;
    return false;
  }

  /**
   * The cursor games from the homepage. The Curious One follows the cursor at
   * a polite distance, lassos it, and ropes any square knocked off the
   * monument; the Chaotic One rushes the cursor and swerves off at the last
   * moment. (The Shy One's scoot and the Watcher's eyes are in think() and
   * updateFace().) True while it's playing instead of getting on with its day.
   */
  private play(m: Meeple, dt: number) {
    if (!this.interruptible(m)) {
      m.rush = false;
      return false;
    }
    const c = center(m);
    const active = this.cursorActive();
    const dx = this.cursor.x - c.x;
    const dy = this.cursor.y - c.y;
    const d = Math.hypot(dx, dy) || 1;

    if (m.cfg.id === "yellow") {
      const strays = this.squares.filter((s) => s.state === "loose" && s.restFor > SQUARE_REST);
      const stray = strays.sort((a, b) => dist(sqCenter(a), c) - dist(sqCenter(b), c))[0];
      if (stray) {
        const sc = sqCenter(stray);
        const ds = dist(sc, c) || 1;
        if (ds > 180) this.walkTo(m, sc.x - ((sc.x - c.x) / ds) * 120 - W / 2, sc.y - ((sc.y - c.y) / ds) * 120 - H / 2, 90, dt);
        else this.startLasso(m, stray);
        return true;
      }
      if (!active || d > 280) return false;
      if (d <= 150 && m.lassoCooldown <= 0 && Math.random() < dt * 0.8) {
        this.startLasso(m, null);
        return true;
      }
      if (d > 130) {
        const stop = { x: this.cursor.x - (dx / d) * 100, y: this.cursor.y - (dy / d) * 100 };
        this.walkTo(m, stop.x - W / 2, stop.y - H / 2, Math.min(95, 40 + d * 0.25), dt);
      }
      return true;
    }

    if (m.cfg.id === "red") {
      if (m.rush && active) {
        this.walkTo(m, this.cursor.x - W / 2, this.cursor.y - H / 2, 300, dt);
        if (d < 55) {
          const side = Math.random() < 0.5 ? 1 : -1;
          m.vx += (-dy / d) * 320 * side;
          m.vy += (dx / d) * 320 * side;
          m.rush = false;
          m.rushCooldown = rand(4, 7);
        }
        return true;
      }
      m.rush = false;
      if (active && d < 260 && m.rushCooldown <= 0 && Math.random() < dt * 0.5) {
        m.rush = true;
        this.say(m, { text: "!", life: 0.8 });
        return true;
      }
    }
    return false;
  }

  // ----------------------------------------------------------------- lasso

  /** The tip of the right arm, where the rope is held. */
  private hand(m: Meeple): Vec {
    return { x: Math.round(m.x) + 2.5 * P, y: Math.round(m.y) - hopHeight(m) + 1.5 * P };
  }

  private startLasso(m: Meeple, square: Square | null) {
    const loop = this.hand(m);
    m.lasso = { phase: "twirl", t: 0, square, loop, rope: ROPE, pull: 0, tugging: false, last: loop };
    m.face = null;
  }

  private cancelLasso(m: Meeple) {
    const sq = m.lasso?.square;
    if (sq && sq.state === "towed") {
      sq.state = "loose";
      sq.restFor = 0;
    }
    if (m.lasso) m.lassoCooldown = rand(4, 8);
    m.lasso = null;
  }

  private workLasso(m: Meeple, dt: number) {
    const l = m.lasso!;
    l.t += dt;
    const hand = this.hand(m);
    const sq = l.square;
    const goal = sq ? sqCenter(sq) : { x: this.cursor.x, y: this.cursor.y };
    const next = (phase: Lasso["phase"]) => {
      l.phase = phase;
      l.t = 0;
    };
    m.goal = null;

    switch (l.phase) {
      case "twirl":
        l.loop = hand;
        // Someone else got there first.
        if (sq && sq.state !== "loose") next("reel");
        else if (l.t > LASSO_TWIRL) next("throw");
        break;
      case "throw": {
        const k = Math.min(1, l.t / LASSO_THROW);
        l.loop = { x: hand.x + (goal.x - hand.x) * k, y: hand.y + (goal.y - hand.y) * k };
        if (k < 1) break;
        if (!sq) {
          // The rope is as long as the throw, so the cursor only drags it once it pulls away.
          l.rope = Math.max(ROPE, dist(goal, hand));
          l.last = goal;
          next("hold");
        } else if (sq.state === "loose") {
          sq.state = "towed";
          l.rope = Math.max(ROPE, dist(goal, hand));
          next("tow");
        } else next("reel");
        break;
      }
      case "hold": {
        // Caught the cursor. Pull away and it drags the meeple along, skidding
        // on its heels, until the loop slips off (or the cursor jumps away).
        l.loop = goal;
        const dx = goal.x - hand.x;
        const dy = goal.y - hand.y;
        const d = Math.hypot(dx, dy);
        const excess = d - l.rope;
        l.tugging = false;
        let slip = !this.cursorActive() || l.t > (l.pull > 0 ? LASSO_PULL : LASSO_HOLD);
        if (excess > ROPE_SNAP) slip = true;
        else if (excess > 0) {
          m.x = clamp(m.x + (dx / d) * excess, 0, this.vw - W);
          m.y = clamp(m.y + (dy / d) * excess, 0, this.worldH - H);
          l.pull += dt;
          l.tugging = excess > 0.5;
        }
        if (slip) {
          // Let go mid-drag and it keeps sliding a little.
          if (l.tugging && dt > 0) {
            m.vx = clamp(((goal.x - l.last.x) / dt) * 0.6, -600, 600);
            m.vy = clamp(((goal.y - l.last.y) / dt) * 0.6, -600, 600);
          }
          next("reel");
        }
        l.last = goal;
        break;
      }
      case "tow": {
        if (!sq || sq.state !== "towed") {
          next("reel");
          break;
        }
        // Walk past the socket so the square, trailing on the rope, lands in it.
        const home = { x: sq.home.x + SQ / 2, y: sq.home.y + SQ / 2 };
        const dx = home.x - goal.x;
        const dy = home.y - goal.y;
        const d = Math.hypot(dx, dy);
        l.loop = goal;
        l.rope = Math.max(ROPE, l.rope - 160 * dt);
        if (d < 30 || l.t > 9) {
          sq.state = "gliding";
          this.say(m, { text: "YEEHAW", life: 1.2 });
          next("reel");
          break;
        }
        this.walkTo(m, home.x + (dx / d) * (ROPE + 24) - W / 2, home.y + (dy / d) * (ROPE + 24) - H / 2, 80, dt);
        break;
      }
      case "reel": {
        const k = 1 - Math.exp(-18 * dt);
        l.loop = { x: l.loop.x + (hand.x - l.loop.x) * k, y: l.loop.y + (hand.y - l.loop.y) * k };
        if (l.t > LASSO_REEL) {
          m.lasso = null;
          m.lassoCooldown = rand(8, 14);
          m.pause = rand(0.3, 0.8);
        }
        break;
      }
    }
  }

  // --------------------------------------------------------- the monument

  /** The founders' monument goes as close to the Town Hall's street as there's room. */
  private placeMonument(fits: (b: Box) => boolean, taken: Box[]) {
    this.plinth = null;
    this.squares = [];
    const h = PLINTH.h + SQ + P;
    const near = { x: this.hall.box.x + this.hall.box.w / 2, y: this.hall.box.y + this.hall.box.h + 4 * P };
    let best: Box | null = null;
    // A narrower plinth, then a tighter squeeze, where there isn't room (phones).
    for (const [w, gap] of [[PLINTH.w, U], [6 * P, U], [6 * P, 0]]) {
      for (let i = 0; i < 500; i++) {
        const b = { x: snap(rand(0, this.vw - w)), y: snap(rand(0, this.worldH - h)), w, h };
        if (!fits(pad(b, gap))) continue;
        if (!best || dist({ x: b.x + w / 2, y: b.y + h }, near) < dist({ x: best.x + w / 2, y: best.y + h }, near)) best = b;
      }
      if (best) break;
    }
    if (!best) return;
    taken.push(pad(best, U));
    const plinth = { x: best.x, y: best.y + h - PLINTH.h, w: best.w, h: PLINTH.h };
    this.plinth = plinth;
    const square = (click: Square["click"], x: number): Square => ({
      click,
      home: { x, y: plinth.y - SQ },
      x,
      y: plinth.y - SQ,
      vx: 0,
      vy: 0,
      state: "home",
      looseFor: 0,
      restFor: 0,
      clickT: -1,
      blocks: [],
      bloomT: -1,
    });
    const inset = plinth.w > 6 * P ? P : U;
    this.squares = [square("burst", plinth.x + inset), square("squash", plinth.x + plinth.w - inset - SQ)];
  }

  private updateSquares(dt: number) {
    for (const s of this.squares) {
      switch (s.state) {
        case "loose": {
          s.looseFor += dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          const f = Math.exp(-SQUARE_FRICTION * dt);
          s.vx *= f;
          s.vy *= f;
          if (s.x < 0 || s.x > this.vw - SQ) {
            s.x = clamp(s.x, 0, this.vw - SQ);
            s.vx = -s.vx * BOUNCE;
          }
          if (s.y < 0 || s.y > this.worldH - SQ) {
            s.y = clamp(s.y, 0, this.worldH - SQ);
            s.vy = -s.vy * BOUNCE;
          }
          this.bounceOffBuildings(s);
          s.restFor = Math.hypot(s.vx, s.vy) < 4 ? s.restFor + dt : 0;
          if (s.looseFor > SQUARE_GIVE_UP) s.state = "gliding";
          break;
        }
        case "towed": {
          // On the end of the rope: never further than the rope from the hand.
          const tower = this.meeples.find((m) => m.lasso?.square === s);
          if (!tower) {
            s.state = "loose";
            break;
          }
          const hand = this.hand(tower);
          const rope = tower.lasso!.rope;
          const c = sqCenter(s);
          const d = dist(c, hand);
          if (d > rope) {
            s.x -= ((c.x - hand.x) / d) * (d - rope);
            s.y -= ((c.y - hand.y) / d) * (d - rope);
          }
          s.vx = s.vy = 0;
          break;
        }
        case "burst":
          this.updateBurst(s, dt);
          break;
        case "gliding": {
          const k = 1 - Math.exp(-5 * dt);
          s.x += (s.home.x - s.x) * k;
          s.y += (s.home.y - s.y) * k;
          if (dist(s, s.home) < 0.5) {
            s.state = "home";
            s.x = s.home.x;
            s.y = s.home.y;
          }
          break;
        }
      }
      if (s.bloomT >= 0) {
        s.bloomT += dt;
        if (s.bloomT > GOLD_LIFE + GOLD_FADE + SPRING_BACK) {
          s.bloomT = -1;
          s.state = dist(s, s.home) < 0.5 ? "home" : "loose";
          s.looseFor = s.restFor = 0;
        }
      }
      if (s.state === "loose" && Math.hypot(s.vx, s.vy) > 200) this.squareHits(s);
    }
  }

  /** A sliding square skids off the buildings, like a thrown meeple. */
  private bounceOffBuildings(s: Square) {
    const f = { x: s.x + SQ / 2, y: s.y + SQ };
    for (const b of this.buildings) {
      const fp = this.footprint(b);
      if (!inBox(f, fp)) continue;
      const outs = [f.x - fp.x, fp.x + fp.w - f.x, f.y - fp.y, fp.y + fp.h - f.y];
      const k = outs.indexOf(Math.min(...outs));
      if (k === 0) {
        s.x -= outs[0] + 0.5;
        if (s.vx > 0) s.vx = -s.vx * BOUNCE;
      } else if (k === 1) {
        s.x += outs[1] + 0.5;
        if (s.vx < 0) s.vx = -s.vx * BOUNCE;
      } else if (k === 2) {
        s.y -= outs[2] + 0.5;
        if (s.vy > 0) s.vy = -s.vy * BOUNCE;
      } else {
        s.y += outs[3] + 0.5;
        if (s.vy < 0) s.vy = -s.vy * BOUNCE;
      }
    }
  }

  /** How tall the period stands while it squashes, is gone, and springs back (1 when untouched). */
  private squashY(s: Square) {
    if (s.bloomT < 0) return 1;
    if (s.bloomT < FLATTEN_TIME) return 1 - s.bloomT / FLATTEN_TIME;
    const back = s.bloomT - GOLD_LIFE - GOLD_FADE;
    return back < 0 ? 0 : springBack(back);
  }

  private hitSquare(p: Vec, padding: number): Square | null {
    for (const s of this.squares) {
      if (s.state === "burst" || s.state === "held" || s.state === "gone") continue;
      if (p.x >= s.x - padding && p.x <= s.x + SQ + padding && p.y >= s.y - padding && p.y <= s.y + SQ + padding) return s;
    }
    return null;
  }

  /** Pick up a square, like a meeple. A press without a drag is a click. */
  private grabSquare(sq: Square, e: PointerEvent, p: Vec) {
    for (const m of this.meeples) if (m.lasso?.square === sq) this.cancelLasso(m);
    sq.state = "held";
    sq.vx = sq.vy = 0;
    this.squareDrag = {
      sq,
      pointerId: e.pointerId,
      offX: p.x - sq.x,
      offY: p.y - sq.y,
      t0: e.timeStamp,
      start: p,
      moved: 0,
      samples: [{ t: e.timeStamp, ...p }],
    };
    this.root.style.cursor = "grabbing";
  }

  private releaseSquare(sd: SquareDrag, now: number, allowClick: boolean) {
    const { sq } = sd;
    this.squareDrag = null;
    this.root.style.cursor = "";
    sq.state = "loose";
    sq.looseFor = 0;
    sq.restFor = 0;
    if (allowClick && sd.moved < 6 && now - sd.t0 < 400) {
      if (dist(sq, sq.home) < 0.5) sq.state = "home";
      this.clickSquare(sq);
      return;
    }
    const first = sd.samples[0];
    const last = sd.samples[sd.samples.length - 1];
    const span = (last.t - first.t) / 1000;
    sq.vx = sq.vy = 0;
    if (span > 0.008 && now - last.t < 80) {
      sq.vx = (last.x - first.x) / span;
      sq.vy = (last.y - first.y) / span;
      const sp = Math.hypot(sq.vx, sq.vy);
      if (sp > MAX_THROW) {
        sq.vx = (sq.vx / sp) * MAX_THROW;
        sq.vy = (sq.vy / sp) * MAX_THROW;
      }
    }
  }

  /** HEY's square bursts and reassembles; the period squashes and the gold flower pops up. */
  private clickSquare(sq: Square) {
    if (sq.click === "burst") {
      for (const m of this.meeples) if (m.lasso?.square === sq) this.cancelLasso(m);
      sq.state = "burst";
      sq.clickT = 0;
      sq.vx = sq.vy = 0;
      return;
    }
    if (sq.bloomT >= 0) return;
    sq.bloomT = 0;
    sq.state = "gone";
    sq.vx = sq.vy = 0;
    this.scatterWild(sq);
    // The thud travels outward, so nearby meeples hop first.
    const c = sqCenter(sq);
    for (const m of this.meeples) {
      if (m.mode !== "walk" || m.inside) continue;
      m.hop = -dist(center(m), c) / SHOCKWAVE_SPEED;
      this.wake(m);
    }
  }

  /** A thrown square that flies into a meeple knocks it along, and wakes it. */
  private squareHits(sq: Square) {
    for (const m of this.meeples) {
      if (m.mode !== "walk" || m.inside) continue;
      if (sq.x > m.x + W || sq.x + SQ < m.x || sq.y > m.y + H || sq.y + SQ < m.y) continue;
      m.vx += sq.vx * 0.7;
      m.vy += sq.vy * 0.7;
      sq.vx *= -0.3;
      sq.vy *= -0.3;
      this.wake(m);
      return;
    }
  }

  /**
   * A fast meeple (a charge, a throw, a drag) knocks a square off the plinth.
   * Once a square is loose, anyone walking into it kicks it along.
   */
  private shoveSquares() {
    for (const sq of this.squares) {
      if (sq.state !== "home" && sq.state !== "loose") continue;
      for (const m of this.meeples) {
        if ((m.mode !== "walk" && m.mode !== "drag") || m.inside || m.alpha < 0.5) continue;
        const vx = m.wx + m.vx;
        const vy = m.wy + m.vy;
        if (m.mode !== "drag" && Math.hypot(vx, vy) < (sq.state === "home" ? PUSH_SPEED : 20)) continue;
        const ox = Math.min(m.x + W - 3, sq.x + SQ) - Math.max(m.x + 3, sq.x);
        const oy = Math.min(m.y + H - 3, sq.y + SQ) - Math.max(m.y + 3, sq.y);
        if (ox <= 0 || oy <= 0) continue;
        const sc = sqCenter(sq);
        const mc = center(m);
        if (ox < oy) {
          const n = Math.sign(sc.x - mc.x) || 1;
          sq.x += n * ox;
          sq.vx = n * Math.max(vx * n * 1.4, 160);
          sq.vy = vy * 0.6;
        } else {
          const n = Math.sign(sc.y - mc.y) || 1;
          sq.y += n * oy;
          sq.vy = n * Math.max(vy * n * 1.4, 160);
          sq.vx = vx * 0.6;
        }
        if (sq.state === "home") sq.looseFor = 0;
        sq.state = "loose";
        sq.restFor = 0;
      }
    }
  }

  /** HEY's square: shake, burst into pieces, then drift home and reassemble on the plinth. */
  private updateBurst(sq: Square, dt: number) {
    const size = SQ / SQUARE_SPLIT;
    sq.clickT += dt;
    if (sq.clickT < SQUARE_SHAKE) return;
    if (!sq.blocks.length) {
      const c = sqCenter(sq);
      for (let i = 0; i < SQUARE_SPLIT * SQUARE_SPLIT; i++) {
        const x = sq.x + (i % SQUARE_SPLIT) * size;
        const y = sq.y + Math.floor(i / SQUARE_SPLIT) * size;
        const a = Math.atan2(y + size / 2 - c.y, x + size / 2 - c.x) + rand(-0.6, 0.6);
        const sp = rand(220, 520);
        sq.blocks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, delay: 0 });
      }
      sq.x = sq.home.x;
      sq.y = sq.home.y;
      return;
    }
    this.moveBlocks(sq.blocks, dt);
    const since = sq.clickT - SQUARE_SHAKE - SCATTER_TIME;
    if (since < 0) return;
    if (sq.blocks[0].delay === 0) {
      const order = sq.blocks.map((_, i) => i).sort(() => Math.random() - 0.5);
      order.forEach((bi, n) => (sq.blocks[bi].delay = 0.001 + n * 0.05));
    }
    const pull = 1 - Math.exp(-2.6 * dt);
    const damp = Math.exp(-8 * dt);
    let done = true;
    sq.blocks.forEach((b, i) => {
      const tx = sq.home.x + (i % SQUARE_SPLIT) * size;
      const ty = sq.home.y + Math.floor(i / SQUARE_SPLIT) * size;
      if (since >= b.delay) {
        b.vx *= damp;
        b.vy *= damp;
        b.x += (tx - b.x) * pull;
        b.y += (ty - b.y) * pull;
      }
      if (Math.abs(tx - b.x) > 0.5 || Math.abs(ty - b.y) > 0.5) done = false;
    });
    if (done) {
      sq.blocks = [];
      sq.state = "home";
      sq.clickT = -1;
    }
  }

  /** Where the gold flower's head is, for the fan club to face. */
  private goldHead(sq: Square): Vec {
    return { x: sq.x + SQ / 2, y: sq.y + SQ - 5.5 * (SQ / 2) };
  }

  /** Everyone gathers round the gold flower and hops in praise until it fades. */
  private updatePraise() {
    const gold = this.squares.find((s) => s.bloomT >= FLATTEN_TIME + 0.35 && s.bloomT < GOLD_LIFE);
    if (!gold) {
      if (!this.praise) return;
      this.praise = null;
      for (const m of this.meeples) {
        if (m.task?.kind !== "spot" || m.task.why !== "praise") continue;
        this.setTask(m, null);
        m.pause = rand(0.2, 0.8);
      }
      return;
    }
    if (this.praise || this.event || this.dance) return;
    const base = { x: gold.x + SQ / 2, y: gold.y + SQ };
    const ring = this.praiseRing(base);
    const angle = (p: Vec) => Math.atan2(p.y - base.y, p.x - base.x);
    const order = [...this.meeples].sort((a, b) => angle(feet(a)) - angle(feet(b)));
    const spots = [...ring].sort((a, b) => angle(a) - angle(b));
    this.praise = { sq: gold, head: this.goldHead(gold) };
    order.forEach((m, i) => {
      this.gather(m, spots[i], this.praise!.head);
      if (m.task?.kind === "spot") m.task.why = "praise";
    });
  }

  /** Five spots (feet) in a ring round the flower, as close in as fits clear of buildings. */
  private praiseRing(base: Vec): Vec[] {
    const n = this.meeples.length;
    const ring = (r: number, turn: number) =>
      Array.from({ length: n }, (_, i) => {
        const a = turn + (i * Math.PI * 2) / n;
        return { x: Math.round(base.x + Math.cos(a) * r), y: Math.round(base.y + 8 + Math.sin(a) * r * 0.6) };
      });
    const ok = (p: Vec) =>
      p.x > W && p.x < this.vw - W && p.y > H + 24 && p.y < this.worldH - this.bar && !this.blocked(p) && !this.buildings.some((b) => inBox(p, pad(b.box, 4)));
    const apart = (ps: Vec[]) => ps.every((p, i) => ps.every((q, j) => j <= i || Math.abs(p.x - q.x) > W + 6 || Math.abs(p.y - q.y) > H * 0.6));
    for (const r of [72, 86, 100, 118, 136]) {
      for (let k = 0; k < 24; k++) {
        const spots = ring(r, (k * Math.PI * 2) / 24);
        if (spots.every(ok) && apart(spots)) return spots;
      }
    }
    return ring(86, -Math.PI / 2).map((p) => ({ x: clamp(p.x, W, this.vw - W), y: clamp(p.y, H + 24, this.worldH - this.bar) }));
  }

  /** The part of the village on screen right now. */
  private view() {
    const c = this.canvas.getBoundingClientRect();
    const top = clamp(-c.top, 0, this.worldH);
    return { top, bottom: clamp(top + window.innerHeight, 0, this.worldH) };
  }

  // ------------------------------------------------------------ wild plants

  /** Room on open grass for a plant this size: off the paths, buildings, garden and trees. */
  private plantable(b: Box) {
    if (b.x < U || b.x + b.w > this.vw - U || b.y < 90 || b.y + b.h > this.worldH - this.bar) return false;
    if (this.edges.some((e) => overlap(pad(this.edgeBox(e), 2), b))) return false;
    if (this.buildings.some((bd) => overlap(pad({ ...bd.box, y: bd.box.y - 1.5 * P, h: bd.box.h + 1.5 * P }, U), b))) return false;
    if (overlap(pad(this.garden, P), b)) return false;
    if (this.pond && overlap(pad(this.pond, U), b)) return false;
    if (this.plinth && overlap(pad({ ...this.plinth, y: this.plinth.y - SQ, h: this.plinth.h + SQ }, U), b)) return false;
    if (this.trees.some((t) => overlap(this.treeBox(t), b))) return false;
    const x = b.x + b.w / 2;
    const y = b.y + b.h;
    return !this.wild.some((w) => w.fade < 0 && Math.abs(w.x - x) < 4 * U && Math.abs(w.y - y) < 7 * U);
  }

  /** Beside the foot it's facing, if there's room. */
  private plantSpot(m: Meeple): Vec | null {
    const f = feet(m);
    const side = m.look.x < 0 ? -1 : 1;
    const x = snap(f.x + side * (W / 2 + 2 * U));
    const y = snap(f.y);
    return this.plantable({ x: x - 1.5 * U, y: y - BLOOM.length * U, w: 3 * U, h: BLOOM.length * U }) ? { x, y } : null;
  }

  private dig(m: Meeple, dt: number) {
    m.planting += dt;
    m.tool = "dig";
    if (m.planting < PLANT_TIME) return;
    this.plant(m);
    m.planting = -1;
    m.tool = null;
    m.plantIn = rand(3, 7);
  }

  /** Flowers come first, then grass; only the Shy One grows carrots. */
  private plant(m: Meeple) {
    const spot = this.plantSpot(m);
    if (!spot) return;
    const cycle = m.cfg.id === "green" ? SHY_PLANTS : PLANTS;
    const kind = cycle[m.planted % cycle.length];
    m.planted++;
    const healthy = this.wild.filter((w) => w.fade < 0 && w.life === WILD_LIFE);
    if (healthy.length >= MAX_WILD) healthy[0].fade = 0;
    this.wild.push({ ...spot, kind, petal: pick(PETALS), age: 0, life: WILD_LIFE, fade: -1, trampled: false });
  }

  /** The gold flower sets off little wild flowers across the screen, popping up in a wave. */
  private scatterWild(sq: Square) {
    const c = sqCenter(sq);
    const v = this.view();
    const n = clamp(Math.round((this.vw * (v.bottom - v.top)) / 45000), 6, 20);
    let made = 0;
    for (let tries = 0; made < n && tries < n * 40; tries++) {
      const x = snap(rand(U * 3, this.vw - U * 3));
      const y = snap(rand(v.top + 90, v.bottom - 20));
      if (!this.plantable({ x: x - 1.5 * U, y: y - BLOOM.length * U, w: 3 * U, h: BLOOM.length * U })) continue;
      made++;
      this.wild.push({
        x,
        y,
        kind: "flower",
        petal: pick(PETALS),
        age: -(FLATTEN_TIME + 0.3 + Math.hypot(x - c.x, y - c.y) / SHOCKWAVE_SPEED + rand(0, 0.3)),
        life: rand(14, 20),
        fade: -1,
        trampled: false,
      });
    }
  }

  private updateWild(dt: number) {
    for (const w of this.wild) {
      w.age += dt;
      if (w.fade >= 0) w.fade += dt;
      else if (w.age > w.life) w.fade = 0;
    }
    this.wild = this.wild.filter((w) => w.fade < (w.trampled ? TRAMPLED_TIME : WILT_TIME));
  }

  /** The Chaotic One tramples wild plants; so does anything sliding through. */
  private trampleWild(m: Meeple) {
    const feetBox = { x: m.x, y: m.y + 2 * P, w: W, h: 2 * P };
    for (const w of this.wild) {
      if (w.fade >= 0 || w.age < 1.8) continue;
      if (overlap(feetBox, { x: w.x - 1.5 * U, y: w.y - BLOOM.length * U, w: 3 * U, h: 3 * U })) {
        w.trampled = true;
        w.fade = 0;
      }
    }
  }

  /** Somewhere nearby for the Sleepy One to sleepwalk to. */
  private sleepwalkTo(m: Meeple): Vec | null {
    const f = feet(m);
    for (let i = 0; i < 20; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(120, 260);
      const p = { x: f.x + Math.cos(a) * r, y: f.y + Math.sin(a) * r * 0.7 };
      if (p.x < W || p.x > this.vw - W || p.y < 110 || p.y > this.worldH - this.bar) continue;
      if (this.blocked(p) || this.buildings.some((b) => inBox(p, pad(b.box, 6)))) continue;
      return p;
    }
    return null;
  }

  // ------------------------------------------------------------ the dance

  /** The dance line: five spots across the middle of the screen, clear of buildings. */
  private danceLine(): Vec[] {
    const v = this.view();
    const n = this.meeples.length;
    const spacing = Math.min(DANCE_SPACING, (this.vw - 32 - W) / (n - 1));
    const left = this.vw / 2 - ((n - 1) * spacing) / 2;
    const line = (y: number) =>
      Array.from({ length: n }, (_, i) => ({ x: Math.round(left + i * spacing), y: Math.round(y - (i % 2 ? P : 0)) }));
    const ok = (p: Vec) =>
      !this.blocked(p) &&
      !this.buildings.some((b) => inBox(p, pad({ ...b.box, h: b.box.h + H }, 8))) &&
      !(this.plinth && inBox(p, pad(this.plinth, 2 * P)));
    const mid = (v.top + v.bottom) / 2 + 20;
    for (let k = 0; k < 120; k++) {
      const y = mid + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * U;
      if (y < v.top + 120 || y > v.bottom - 60) continue;
      const spots = line(y);
      if (spots.every(ok)) return spots;
    }
    return line(this.meetSpots.crowd[0].y);
  }

  private inLine(m: Meeple) {
    const t = m.task;
    return this.dance?.phase === "dance" && m.mode === "walk" && t?.kind === "spot" && t.why === "dance" && t.arrived;
  }

  private updateDance(dt: number) {
    for (const n of this.notes) {
      n.age += dt;
      n.y -= 42 * dt;
    }
    this.notes = this.notes.filter((n) => n.age < NOTE_LIFE);

    const d = this.dance;
    if (!d) return;
    d.t += dt;
    if (d.phase === "gather") {
      const ready = this.meeples.every((m) => m.task?.kind === "spot" && m.task.arrived);
      if (ready || d.t > 8) {
        d.phase = "dance";
        d.t = 0;
        d.nextNote = 0;
      }
      return;
    }
    if (d.t >= DANCE_TIME) {
      // Curtain. A bow-hop, and back to their day.
      this.dance = null;
      for (const m of this.meeples) {
        if (m.task?.kind !== "spot" || m.task.why !== "dance") continue;
        this.setTask(m, null);
        m.pause = rand(0.4, 1.2);
      }
      return;
    }
    while (d.t >= d.nextNote && d.t < DANCE_TIME - 0.6) {
      d.nextNote += NOTE_EVERY * rand(0.6, 1.4);
      const dancers = this.meeples.filter((m) => this.inLine(m));
      if (!dancers.length) break;
      const m = pick(dancers);
      this.addNote(m.x + rand(-14, W + 4), m.y - rand(14, 30));
    }
  }

  private addNote(x: number, y: number) {
    this.notes.push({ x, y, age: 0, color: pick(NOTE_COLORS), glyph: NOTE_GLYPHS[Math.random() < 0.6 ? 0 : 1], sway: rand(0, Math.PI * 2) });
  }

  /** Beats into the dance proper (negative while they're still gathering). */
  private danceBeat() {
    return this.dance?.phase === "dance" ? this.dance.t / DANCE_BEAT : -1;
  }

  /** The line's sideways travel: kicks in place, a shuffle right and back, then in place again. */
  private danceShift() {
    const b = this.danceBeat();
    if (b < 8 || b >= 16) return 0;
    const k = b - 8;
    return Math.round((k < 4 ? k : 8 - k) * (P / 2));
  }

  /** How far a dancer is off the ground: unison leaps, then the big finish. */
  private danceLift(m: Meeple) {
    if (!this.inLine(m)) return 0;
    const b = this.danceBeat();
    const leap = (u: number, h: number) => Math.round(Math.sin(Math.PI * u) * h);
    if (b >= 16 && b < 20) return leap(b % 1, 9);
    if (b >= 23.5 && b < 25) return leap((b - 23.5) / 1.5, 16);
    return 0;
  }

  /** Which foot is kicking (0 left, 1 right) and how far through the kick, or null. */
  private danceKick(m: Meeple): { foot: 0 | 1; u: number } | null {
    if (!this.inLine(m)) return null;
    const b = this.danceBeat();
    if (b < 0 || (b >= 16 && b < 20) || b >= 23.5) return null;
    const beat = b >= 20 ? b * 2 : b;
    return { foot: (Math.floor(beat) % 2) as 0 | 1, u: beat % 1 };
  }

  // --------------------------------------------------- post office, church

  /** Posting a letter for a friend, or picking up one's own mail and reading it. */
  private mail(m: Meeple, t: Extract<Task, { kind: "post" }>, dt: number) {
    const po = this.post;
    if (!po) return this.setTask(m, null);
    if (t.phase === "go") {
      if (t.to && !m.carry) m.carry = { kind: "letter", petal: C.white };
      if (!this.go(m, po.guestSpot, dt, [po.doorNode])) return;
      t.phase = t.to ? "drop" : "wait";
      t.t = 0;
      m.face = po.doorway;
      po.knock = 0.6;
      return;
    }
    t.t += dt;
    if (t.phase === "drop") {
      if (t.t > 0.6 && m.carry?.kind === "letter") {
        m.carry = null;
        po.mail.push(t.to!.cfg.id);
        this.say(m, { icon: "letter" });
      }
      if (t.t > 1.6) this.setTask(m, null);
      return;
    }
    if (t.phase === "wait") {
      if (t.t < 1.2) return;
      const i = po.mail.indexOf(m.cfg.id);
      if (i < 0) {
        this.say(m, { text: "..." });
        this.setTask(m, null);
        return;
      }
      po.mail.splice(i, 1);
      m.carry = { kind: "letter", petal: C.white };
      m.hop = 0;
      t.phase = "read";
      t.t = 0;
      return;
    }
    // Reading it right there on the step.
    const f = feet(m);
    m.face = { x: f.x, y: f.y + 40 };
    if (t.t > 0.9 && !m.bubble) this.say(m, pick<Say>([{ icon: "heart" }, { icon: "star" }, { text: "HA" }, { text: "AWW" }, { text: "!" }]));
    if (t.t < 2.6) return;
    m.carry = null;
    this.setTask(m, null);
  }

  /** Where the choir stands, in a row on the church steps. */
  private choirRow(): Vec[] {
    const d = this.church!.doorway;
    // Centered on the door, or slid along to stay on screen near the edges.
    const cx = clamp(d.x, W + 66, this.vw - W - 66);
    return [-66, -22, 22, 66].map((dx) => {
      for (const dy of [40, 50, 30, 60]) {
        const p = { x: cx + dx, y: d.y + dy };
        if (!this.blocked(p) && !this.buildings.some((b) => inBox(p, pad(b.box, 4)))) return p;
      }
      return { x: cx + dx, y: d.y + 40 };
    });
  }

  // ---------------------------------------------------------------- drawing

  /**
   * Fill a rect with its edges snapped to whole device pixels, so everything
   * stays crisp at any zoom or pixel ratio.
   */
  private rect(x: number, y: number, w: number, h: number, color: string, ctx = this.ctx) {
    const d = this.dpr;
    const x0 = Math.round(x * d);
    const y0 = Math.round(y * d);
    ctx.fillStyle = color;
    ctx.fillRect(x0, y0, Math.round((x + w) * d) - x0, Math.round((y + h) * d) - y0);
  }

  private pattern(rows: string[], x: number, y: number, unit: number, colors: (ch: string) => string | null, ctx = this.ctx) {
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        const c = ch === "." ? null : colors(ch);
        if (c) this.rect(x + rx * unit, y + ry * unit, unit, unit, c, ctx);
      }),
    );
  }

  private text(s: string, x: number, y: number, color: string, align: CanvasTextAlign = "center") {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = this.font;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = color;
    ctx.fillText(s, Math.round(x), Math.round(y));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** The parts that never move: grass, paths, garden beds and fence, rocks. */
  private paintGround() {
    const g = this.ground.getContext("2d");
    if (!g) return;
    const r = (x: number, y: number, w: number, h: number, c: string) => this.rect(x, y, w, h, c, g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    r(0, 0, this.vw, this.worldH, C.grass);

    // Tufts of grass everywhere; the paths and beds cover the ones underneath.
    const tufts = Math.round((this.vw * this.worldH) / 1400);
    for (let i = 0; i < tufts; i++) {
      const x = snap(rand(0, this.vw), 2);
      const y = snap(rand(0, this.worldH), 2);
      const c = Math.random() < 0.35 ? C.tuftDark : C.tuft;
      r(x, y - 4, 2, 4, c);
      r(x + 3, y - 6, 2, 6, c);
      r(x + 6, y - 4, 2, 4, c);
    }

    if (this.pond) {
      const p = this.pond;
      const rows = p.h / U;
      for (let i = 0; i < rows; i++) {
        const k = Math.sqrt(1 - ((i + 0.5 - rows / 2) / (rows / 2)) ** 2);
        const w = snap(p.w * k, U);
        r(p.x + (p.w - w) / 2, p.y + i * U, w, U, C.water);
      }
      r(p.x + p.w * 0.25, p.y + 2 * U, 3 * U, 2, C.waterLight);
      r(p.x + p.w * 0.55, p.y + 6 * U, 2 * U, 2, C.waterLight);
      // A lily pad.
      r(p.x + p.w * 0.62, p.y + 3 * U, 2 * U, U, C.leaf);
      r(p.x + p.w * 0.62 + U, p.y + 3 * U, U / 2, U / 2, C.water);
    }

    const gd = this.garden;
    r(gd.x, gd.y, gd.w, gd.h, C.soil);
    for (const s of this.slots) r(s.x - P, s.y - 2, 2 * P, 4, C.furrow);

    for (const e of this.edges) {
      const b = this.edgeBox(e);
      r(b.x, b.y, b.w, b.h, C.path);
    }
    for (const e of this.edges) {
      const b = this.edgeBox(e);
      const n = Math.round((b.w * b.h) / 700);
      for (let i = 0; i < n; i++) r(snap(rand(b.x + 2, b.x + b.w - 4), 2), snap(rand(b.y + 2, b.y + b.h - 4), 2), 2, 2, C.pebble);
    }

    this.paintFence(g);

    for (const b of this.rocks) this.pattern(ROCK, b.x, b.y, U, (ch) => (ch === "H" ? C.rockLight : C.rock), g);
    for (const b of this.bushes) this.pattern(b.rows, b.x, b.y - b.rows.length * U, U, (ch) => TREE_COLORS[ch], g);
    for (const f of this.wildflowers) {
      const mid = f.petal === C.yellow ? C.red : C.yellow;
      this.pattern(BLOOM, f.x, f.y - BLOOM.length * U, U, (ch) => (ch === "P" ? f.petal : ch === "C" ? mid : C.leaf), g);
    }
  }

  /** A low wooden fence round the garden, open where the paths come in. */
  private paintFence(g: CanvasRenderingContext2D) {
    const gd = this.garden;
    const cx = gd.x + gd.w / 2;
    const gy = this.nodes[this.gardenNodes[1]]?.y ?? gd.y + gd.h / 2;
    const gap = P + U; // half the gate opening
    const x0 = gd.x - U;
    const x1 = gd.x + gd.w + U;
    const y0 = gd.y - U;
    const y1 = gd.y + gd.h + U;
    const r = (x: number, y: number, w: number, h: number) => this.rect(x, y, w, h, C.fence, g);
    const hRun = (y: number, from: number, to: number) => {
      if (to <= from) return;
      r(from, y - 5, to - from, 2);
      r(from, y - 1, to - from, 2);
      for (let x = from; x <= to - 3; x += 2 * P) r(x, y - 8, 3, 9);
      r(to - 3, y - 8, 3, 9);
    };
    const vRun = (x: number, from: number, to: number) => {
      if (to <= from) return;
      r(x - 1, from, 2, to - from);
      for (let y = from; y <= to; y += 2 * P) r(x - 1.5, y - 7, 3, 9);
    };
    hRun(y0, x0, cx - gap);
    hRun(y0, cx + gap, x1);
    hRun(y1, x0, cx - gap);
    hRun(y1, cx + gap, x1);
    vRun(x0, y0, gy - gap);
    vRun(x0, gy + gap, y1);
    vRun(x1, y0, gy - gap);
    vRun(x1, gy + gap, y1);
  }

  private render() {
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.ground, 0, 0);
    this.drawPlants();
    this.drawWild();

    // Further down the page is closer, so draw from the top down.
    const items: { y: number; draw: () => void }[] = [];
    for (const b of this.buildings) items.push({ y: b.box.y + b.box.h, draw: () => this.drawBuilding(b) });
    for (const t of this.trees) items.push({ y: t.y, draw: () => this.drawTree(t) });
    for (const a of this.animals) items.push({ y: a.y, draw: () => this.drawAnimal(a) });
    const plinth = this.plinth;
    if (plinth) items.push({ y: plinth.y + plinth.h, draw: () => this.drawPlinth(plinth) });
    for (const s of this.squares) {
      items.push({ y: s.y + SQ + (s.state === "held" ? 1000 : 0.5), draw: () => this.drawSquare(s) });
    }
    for (const m of this.meeples) {
      if (m.inside || m.mode === "exploded" || m.mode === "reassemble") continue;
      items.push({ y: m.y + H + (m.mode === "drag" ? 1000 : 0), draw: () => this.drawMeeple(m) });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    for (const m of this.meeples) if (m.mode === "exploded" || m.mode === "reassemble") this.drawBlocks(m);
    for (const s of this.squares) for (const b of s.blocks) this.rect(Math.round(b.x), Math.round(b.y), SQ / SQUARE_SPLIT, SQ / SQUARE_SPLIT, C.accent);
    this.drawParticles();
    this.drawNotes();
    this.drawLabels();
    for (const m of this.meeples) {
      if (m.inside || m.mode === "exploded" || m.mode === "reassemble") continue;
      const top = m.y - hopHeight(m) - (hatHeight(m.cfg.id) + 2) - (m.carry ? 18 : 0);
      if (m.bubble && m.bubble.t >= 0) this.drawBubble(m.x + W / 2, top, m.bubble);
      else if (this.showTag(m)) this.text(m.cfg.tag, m.x + W / 2, top - 2, C.muted);
    }
    for (const s of this.signs) if (s.t >= 0) this.drawBubble(s.x, s.y, s);
  }

  private showTag(m: Meeple) {
    if (m.mode === "drag") return true;
    // They stand close together for these, and the tags would run into each other.
    if (this.dance || this.praise || m.lasso?.phase === "twirl") return false;
    if (!this.cursorActive()) return false;
    return Math.hypot(this.cursor.x - (m.x + W / 2), this.cursor.y - (m.y + H / 2)) < 60;
  }

  private drawPlants() {
    for (const s of this.slots) {
      const p = s.plant;
      if (!p) continue;
      if (p.wet > 0) this.rect(s.x - 8, s.y - 2, 16, 4, C.wet);
      const flat = p.flat >= 0;
      this.ctx.globalAlpha = flat ? Math.max(0, 1 - p.flat / 3) : 1;
      const rows = flat
        ? p.kind === "carrot"
          ? CARROT_FLAT
          : p.kind === "cabbage"
            ? CABBAGE_FLAT
            : BLOOM_FLAT
        : p.grow < 0.25
          ? SEED
          : p.grow < 1
            ? SPROUT
            : p.kind === "carrot"
              ? CARROT
              : p.kind === "cabbage"
                ? CABBAGE
                : BLOOM;
      this.drawItemRows(rows, p, s.x, s.y, U);
      this.ctx.globalAlpha = 1;
    }
  }

  /** A plant pattern centered on x with its base on y. */
  private drawItemRows(rows: string[], item: Item, x: number, y: number, unit: number) {
    const mid = item.petal === C.yellow ? C.red : C.yellow;
    const left = x - (rows[0].length * unit) / 2;
    const top = y - rows.length * unit;
    this.pattern(rows, left, top, unit, (ch) =>
      ch === "S" || ch === "L"
        ? C.leaf
        : ch === "P"
          ? item.petal
          : ch === "C"
            ? mid
            : ch === "O"
              ? C.red
              : ch === "G"
                ? C.leafLight
                : ch === "D"
                  ? C.wet
                  : null,
    );
  }

  private drawItem(item: Item, x: number, y: number, unit: number) {
    if (item.kind === "letter") {
      this.pattern(ENVELOPE, x - ENVELOPE[0].length, y - ENVELOPE.length * 2, 2, (ch) => (ch === "K" ? C.ink : C.white));
      return;
    }
    const rows = item.kind === "carrot" ? CARROT : item.kind === "cabbage" ? CABBAGE : BLOOM;
    this.drawItemRows(rows, item, x, y, unit);
  }

  private drawTree(t: Tree) {
    const b = this.treeBox(t);
    const dx = t.shake > 0 ? Math.round(Math.sin(t.shake * 50) * 1.5) : 0;
    this.pattern(t.rows, b.x + dx, b.y, U, (ch) => TREE_COLORS[ch]);
  }

  private drawBuilding(b: Building) {
    if (b.kind === "house") this.drawHouse(b);
    else if (b.kind === "hall") this.drawHall(b);
    else if (b.kind === "post") this.drawPost(b);
    else if (b.kind === "church") this.drawChurch(b);
    else this.drawCourt(b);
  }

  /** Fill in half-pixel cells from a building's top-left. */
  private cell(b: Building, c: number, r: number, w: number, h: number, color: string) {
    this.rect(b.box.x + c * U, b.box.y + r * U, w * U, h * U, color);
  }

  private drawHouse(b: Building) {
    const f = (c: number, r: number, w: number, h: number, color: string) => this.cell(b, c, r, w, h, color);
    const owner = b.owner;
    const roof = owner?.cfg.hex ?? C.accent;
    const roofDark = shade(roof, 0.18);
    const door = shade(roof, 0.42);
    if (b.chimney) {
      const cc = b.chimney < 0 ? 3 : 11;
      f(cc, 0, 2, 5, C.muted);
      f(cc - 0.5, 0, 3, 1, shade(C.muted, 0.2));
    }
    for (let r = 0; r < 8; r++) f(7 - r, 1 + r, 2 + 2 * r, 1, r === 7 ? roofDark : roof);
    f(1, 9, 14, 8, C.wall);
    f(1, 16, 14, 1, C.wallShade);
    const glass = owner?.inside ? C.glow : C.glass;
    f(2, 10, 3, 3, glass);
    f(11, 10, 3, 3, glass);
    if (b.flowerBox) {
      b.flowerBox.forEach((c, i) => {
        f(2 + i, 13, 1, 1, c);
        f(11 + i, 13, 1, 1, c);
      });
      f(2, 14, 3, 1, C.fence);
      f(11, 14, 3, 1, C.fence);
    }
    const kx = b.knock > 0 ? Math.round(Math.sin(b.knock * 60)) * 0.2 : 0;
    f(6 + kx, 11, 4, 6, door);
    f(6 + kx, 11, 1, 1, C.wall);
    f(9 + kx, 11, 1, 1, C.wall);
    this.rect(b.box.x + (8.6 + kx) * U, b.box.y + 14 * U, 2, 2, C.glow);
    if (b.gift) this.drawItem(b.gift, b.doorway.x - 4.5 * U, b.doorway.y - 1, 3);
  }

  private drawHall(b: Building) {
    const f = (c: number, r: number, w: number, h: number, color: string) => this.cell(b, c, r, w, h, color);
    const roof = C.accent;
    const roofDark = shade(roof, 0.18);
    // Flag on the tower, flapping.
    this.rect(b.box.x + 15.5 * U, b.box.y, 2, 6 * U, C.ink);
    const wave = Math.floor(this.time * 3) % 2;
    f(16, 0, 4, 1, C.accent);
    f(16, 1, 4 + wave, 1, C.accent);
    f(16, 2, 3 + wave, 1, C.accent);
    // Spire.
    f(15, 4, 2, 1, roof);
    f(14, 5, 4, 1, roof);
    f(13, 6, 6, 1, roof);
    f(12, 7, 8, 1, roofDark);
    // Main roof.
    f(3, 12, 26, 1, roof);
    f(2, 13, 28, 1, roof);
    f(1, 14, 30, 1, roof);
    f(0, 15, 32, 1, roofDark);
    // Bell tower, with the bell swinging when it rings.
    f(13, 8, 6, 6, C.wall);
    f(14, 9, 4, 4, C.ink);
    const swing = b.ring > 0 ? Math.round(Math.sin(this.time * 18)) * 0.5 : 0;
    f(15 + swing, 10, 2, 2, C.gold);
    f(14.5 + swing, 12, 3, 1, C.gold);
    // Walls and bunting in the five meeple colors.
    f(1, 16, 30, 12, C.wall);
    f(1, 16, 1, 12, C.wallShade);
    f(30, 16, 1, 12, C.wallShade);
    f(1, 27, 30, 1, C.wallShade);
    for (let i = 0, x = 2.5; x <= 27.5; i++, x += 3) {
      const c = MEEPLE_HEXES[i % MEEPLE_HEXES.length];
      f(x, 16, 2, 1, c);
      f(x + 0.5, 17, 1, 1, c);
    }
    // Arched windows, lit during a meeting.
    const glass = this.event?.kind === "meeting" ? C.glow : C.glass;
    for (const wx of [3, 7, 22, 26]) {
      f(wx + 1, 20, 1, 1, glass);
      f(wx, 21, 3, 4, glass);
    }
    // Doors.
    const door = shade(roof, 0.45);
    f(14, 21, 4, 1, door);
    f(13, 22, 6, 6, door);
    this.rect(b.box.x + 16 * U - 0.5, b.box.y + 22 * U, 1, 6 * U, shade(roof, 0.6));
    f(11, 28, 10, 1, C.stoneShade);
    f(10, 29, 12, 1, C.stoneDark);
    this.text("TOWN HALL", b.box.x + 16 * U, b.box.y + 19.6 * U, C.ink);
  }

  private drawCourt(b: Building) {
    const f = (c: number, r: number, w: number, h: number, color: string) => this.cell(b, c, r, w, h, color);
    // Pediment with the scales of justice.
    f(13, 0, 4, 1, C.stone);
    f(10, 1, 10, 1, C.stone);
    f(7, 2, 16, 1, C.stone);
    f(4, 3, 22, 1, C.stone);
    f(1, 4, 28, 1, C.stone);
    f(14.5, 1, 1, 3, C.gold);
    this.rect(b.box.x + 11 * U, b.box.y + 2 * U, 8 * U, 2, C.gold);
    f(10.5, 3, 2, 0.5, C.gold);
    f(17.5, 3, 2, 0.5, C.gold);
    f(13.5, 3.5, 3, 0.5, C.gold);
    f(0, 5, 30, 1, C.stoneDark);
    f(1, 6, 28, 2, C.stone);
    // Columns in front of a shaded wall.
    f(1, 8, 28, 11, C.stoneShade);
    for (const c of [3, 7, 20, 24]) {
      f(c - 0.5, 8, 4, 1, C.stone);
      f(c, 9, 3, 9, C.white);
      this.rect(b.box.x + (c + 1.5) * U - 0.5, b.box.y + 9 * U, 1, 9 * U, C.stoneShade);
      f(c - 0.5, 18, 4, 1, C.stone);
    }
    const door = "#6B6668";
    f(13, 11, 4, 1, door);
    f(12, 12, 6, 7, door);
    f(2, 19, 26, 1, C.stone);
    f(1, 20, 28, 1, C.stoneShade);
    f(0, 21, 30, 1, C.stoneDark);
    this.text("JUSTICE", b.box.x + 15 * U, b.box.y + 7.6 * U, C.ink);
  }

  /** The founders' plinth, engraved with the homepage headline. */
  private drawPlinth(b: Box) {
    this.rect(b.x, b.y, b.w, b.h, C.stoneShade);
    this.rect(b.x, b.y, b.w, 3, C.stone);
    this.rect(b.x, b.y + b.h - 2, b.w, 2, C.stoneDark);
    this.text("HEY RYKER", b.x + b.w / 2, b.y + b.h - 4, C.muted);
  }

  private drawSquare(s: Square) {
    this.drawGold(s);
    if (s.state === "burst" && s.blocks.length) return;
    const sy = this.squashY(s);
    if (sy <= 0) return;
    let x = s.x;
    let y = s.y;
    if (s.state === "burst" && s.clickT < SQUARE_SHAKE) {
      x += Math.round(rand(-2, 2));
      y += Math.round(rand(-2, 2));
    }
    // Spreads out as it flattens, planted on its bottom edge.
    const w = SQ * (1 + (1 - Math.min(sy, 1)) * 0.6);
    const h = SQ * sy;
    this.rect(Math.round(x + SQ / 2 - w / 2), Math.round(y + SQ - h), Math.round(w), Math.round(h), C.accent);
  }

  /**
   * The gold flower that pops up where the period was, grown through the
   * garden's seed and sprout stages at twice their pixel size, with pixel
   * sparkles twinkling round its head.
   */
  private drawGold(s: Square) {
    if (s.bloomT < 0) return;
    const age = s.bloomT - FLATTEN_TIME;
    if (age < 0 || age > GOLD_LIFE - FLATTEN_TIME + GOLD_FADE) return;
    const { ctx } = this;
    const fading = age - (GOLD_LIFE - FLATTEN_TIME);
    ctx.globalAlpha = fading > 0 ? Math.max(0, 1 - fading / GOLD_FADE) : 1;
    const g = SQ / 2;
    const cx = s.x + SQ / 2;
    const base = s.y + SQ;
    const rows = age < 0.35 ? SEED : age < 1 ? SPROUT : GOLD_BLOOM;
    const left = cx - (rows[0].length * g) / 2;
    const top = base - rows.length * g;
    this.pattern(rows, left, top, g, (ch) => GOLD_COLORS[ch] ?? (ch === "D" ? C.wet : null));
    if (rows === GOLD_BLOOM) {
      GOLD_SPARKLES.forEach(([sx, sy, phase], i) => {
        const k = Math.sin((age * 2.2 + phase) * Math.PI * 2);
        if (k <= 0) return;
        const arm = Math.round(k * g * 0.5);
        const x = Math.round(cx + sx * g);
        const y = Math.round(top + sy * g);
        const c = i % 2 ? GOLD_COLORS.H : GOLD_COLORS.P;
        this.rect(x - 1, y - 1, 2, 2, c);
        if (arm > 1) {
          this.rect(x - 1, y - 1 - arm, 2, arm, c);
          this.rect(x - 1, y + 1, 2, arm, c);
          this.rect(x - 1 - arm, y - 1, arm, 2, c);
          this.rect(x + 1, y - 1, arm, 2, c);
        }
      });
    }
    ctx.globalAlpha = 1;
  }

  private drawWild() {
    const { ctx } = this;
    for (const w of this.wild) {
      if (w.age < 0) continue;
      ctx.globalAlpha = w.fade < 0 ? 1 : Math.max(0, 1 - w.fade / (w.trampled ? TRAMPLED_TIME : WILT_TIME));
      const grown = w.kind === "grass" ? GRASS : w.kind === "carrot" ? CARROT : BLOOM;
      const flat = w.kind === "grass" ? GRASS_FLAT : w.kind === "carrot" ? CARROT_FLAT : BLOOM_FLAT;
      const rows = w.trampled ? flat : w.age < 0.5 ? SEED : w.age < 1.8 ? SPROUT : grown;
      this.drawItemRows(rows, { kind: "flower", petal: w.petal }, w.x, w.y, U);
    }
    ctx.globalAlpha = 1;
  }

  /** Music notes drifting up from the dance line or the choir, swaying as they go. */
  private drawNotes() {
    const { ctx } = this;
    for (const n of this.notes) {
      const u = n.age / NOTE_LIFE;
      ctx.globalAlpha = u < 0.1 ? u / 0.1 : u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
      this.pattern(n.glyph, Math.round(n.x + Math.sin(n.age * 4 + n.sway) * 6), Math.round(n.y), 2, () => n.color);
    }
    ctx.globalAlpha = 1;
  }

  private drawLasso(m: Meeple, ox: number, oy: number) {
    const l = m.lasso!;
    const hand = { x: ox + 2.5 * P, y: oy + 1.5 * P };
    if (l.phase === "twirl") {
      // Spinning overhead, above the hat.
      const c = { x: ox + W / 2 + 6, y: oy - 8 - hatHeight(m.cfg.id) };
      const a = this.time * 14;
      this.ring(c.x, c.y, 15, 5);
      this.line(hand.x, hand.y, c.x + Math.cos(a) * 15, c.y + Math.sin(a) * 5);
      return;
    }
    const r = l.square && l.phase !== "throw" ? SQ / 2 + 3 : 7;
    this.line(hand.x, hand.y, l.loop.x, l.loop.y);
    this.ring(l.loop.x, l.loop.y, r, r);
  }

  /** A 2px pixel line, in ink. */
  private line(x0: number, y0: number, x1: number, y1: number) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= n; i++) this.rect(Math.round(x0 + ((x1 - x0) * i) / n) - 1, Math.round(y0 + ((y1 - y0) * i) / n) - 1, 2, 2, C.ink);
  }

  /** A 2px pixel ellipse, in ink. */
  private ring(cx: number, cy: number, rx: number, ry: number) {
    const n = Math.max(16, Math.round(Math.PI * (rx + ry)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.rect(Math.round(cx + Math.cos(a) * rx) - 1, Math.round(cy + Math.sin(a) * ry) - 1, 2, 2, C.ink);
    }
  }

  /** The post office: a red hip roof with POST on it, and a mailbox whose flag goes up when there's mail. */
  private drawPost(b: Building) {
    const f = (c: number, r: number, w: number, h: number, color: string) => this.cell(b, c, r, w, h, color);
    const roof = C.red;
    const roofDark = shade(roof, 0.18);
    for (let r = 0; r < 6; r++) f(5 - r, 3 + r, 6 + 2 * r, 1, r === 5 ? roofDark : roof);
    this.text("POST", b.box.x + 8 * U, b.box.y + 7.4 * U, C.white);
    f(1, 9, 14, 8, C.wall);
    f(1, 16, 14, 1, C.wallShade);
    // A window with an envelope in it, and the door.
    f(2, 10, 4, 3, C.glass);
    this.pattern(ENVELOPE, b.box.x + 2.5 * U, b.box.y + 10.6 * U, 1.5, (ch) => (ch === "K" ? C.accent : C.white));
    const kx = b.knock > 0 ? Math.round(Math.sin(b.knock * 60)) * 0.2 : 0;
    const door = shade(C.accent, 0.42);
    f(7 + kx, 11, 4, 6, door);
    f(7 + kx, 11, 1, 1, C.wall);
    f(10 + kx, 11, 1, 1, C.wall);
    this.rect(b.box.x + (9.6 + kx) * U, b.box.y + 14 * U, 2, 2, C.glow);
    // The mailbox on its post.
    f(13, 13, 0.5, 4, C.ink);
    f(12, 10.5, 2.5, 2.5, C.accent);
    f(12, 10.5, 2.5, 0.5, shade(C.accent, 0.2));
    if (b.mail.length) {
      f(14.5, 9.5, 0.5, 2, C.ink);
      f(14.5, 9.5, 1.2, 0.8, C.red);
    } else {
      f(14.5, 11.5, 1.5, 0.5, C.red);
    }
  }

  /** The church: a white chapel with a steeple, a bell and stained glass in the five meeple colors. */
  private drawChurch(b: Building) {
    const f = (c: number, r: number, w: number, h: number, color: string) => this.cell(b, c, r, w, h, color);
    const roof = C.muted;
    const roofDark = shade(roof, 0.2);
    // Cross and spire.
    f(7.5, 0, 1, 2.5, C.gold);
    f(6.75, 0.6, 2.5, 0.7, C.gold);
    f(7, 2.5, 2, 1, roof);
    f(6.5, 3.5, 3, 1, roof);
    f(6, 4.5, 4, 1, roofDark);
    // Main roof either side of the tower.
    f(2, 8, 12, 1, roof);
    f(1, 9, 14, 1, roof);
    f(0, 10, 16, 1, roofDark);
    // Bell tower, with the bell swinging when it rings.
    f(6, 5.5, 4, 4, C.wall);
    f(6.75, 6.2, 2.5, 2.4, C.ink);
    const swing = b.ring > 0 ? Math.round(Math.sin(this.time * 18)) * 0.4 : 0;
    f(7.25 + swing, 6.7, 1.5, 1.2, C.gold);
    f(7 + swing, 7.9, 2, 0.5, C.gold);
    // Walls.
    f(1, 11, 14, 6, C.wall);
    f(1, 16, 14, 1, C.wallShade);
    // Arched stained-glass windows.
    const panes = [C.yellow, C.purple, C.red, C.accent];
    for (const wx of [2.5, 11.5]) {
      f(wx + 0.5, 11.6, 1, 0.5, C.green);
      panes.forEach((c, i) => f(wx + (i % 2) * 1, 12.1 + Math.floor(i / 2) * 1.5, 1, 1.5, c));
    }
    // Arched door.
    const door = C.trunk;
    f(7, 12.5, 2, 0.5, door);
    f(6.5, 13, 3, 4, door);
    this.rect(b.box.x + 8 * U - 0.5, b.box.y + 13 * U, 1, 4 * U, shade(door, 0.25));
  }

  private drawLabels() {
    for (const b of this.houses) {
      if (b.owner) this.text(b.owner.cfg.tag, b.box.x + b.box.w / 2, b.box.y - 3, C.muted);
    }
    if (this.post) this.text("POST OFFICE", this.post.box.x + this.post.box.w / 2, this.post.box.y - 3, C.muted);
    if (this.church) this.text("CHURCH", this.church.box.x + this.church.box.w / 2, this.church.box.y - 3, C.muted);
  }

  private drawParticles() {
    for (const p of this.particles) {
      const fade = p.life - p.t < 0.4 ? (p.life - p.t) / 0.4 : 1;
      this.ctx.globalAlpha = Math.max(0, fade);
      if (p.z) {
        this.pattern(Z_GLYPH, Math.round(p.x), Math.round(p.y), 2, () => C.muted);
      } else {
        this.rect(Math.round(p.x), Math.round(p.y), p.size, p.size, p.color);
      }
    }
    this.ctx.globalAlpha = 1;
  }

  private drawMeeple(m: Meeple) {
    const { ctx } = this;
    ctx.globalAlpha = m.alpha;
    let ox = Math.round(m.x);
    let oy = Math.round(m.y) - hopHeight(m) - this.danceLift(m);
    if (m.mode === "shake") {
      ox += Math.round(rand(-2, 2));
      oy += Math.round(rand(-2, 2));
    }
    if (m.tool === "dig") oy -= Math.round(Math.abs(Math.sin(this.time * 12)) * 3);
    if (m.planting >= 0) {
      // Digging out on the grass: dirt flicks up from its feet.
      const side = m.look.x < 0 ? -1 : 1;
      const k = (m.planting * 3) % 1;
      this.rect(ox + W / 2 + side * (W / 2 + 2 + k * 8), oy + H - 4 - k * 10, 2, 2, C.wet);
      this.rect(ox + W / 2 + side * (W / 2 + 6 + k * 4), oy + H - 2 - k * 6, 2, 2, C.wet);
    }
    const walking = Math.hypot(m.wx, m.wy) > 1 && m.mode === "walk";
    const kick = this.danceKick(m);
    MEEPLE_BLOCKS.forEach((b, i) => {
      let lift = walking && ((i === 5 && m.stepFrame === 0) || (i === 6 && m.stepFrame === 1)) ? -2 : 0;
      let out = 0;
      if (kick && i === 5 + kick.foot) {
        // Step dancing: the kicking foot flies up and out, then snaps back.
        const k = Math.sin(Math.PI * Math.min(1, kick.u * 1.6));
        lift = -Math.round(k * KICK_UP);
        out = Math.round(k * KICK_OUT) * (kick.foot ? 1 : -1);
      }
      this.rect(ox + b.x * P + out, oy + b.y * P + lift, P, P, m.cfg.hex);
    });
    const hx = ox + P;
    for (const c of HATS[m.cfg.id]) this.rect(hx + c.x, oy + c.y, c.w, c.h, c.c);
    this.drawEyes(m, hx, oy);
    if (m.tool === "water") {
      // A watering can, tipped at the plant.
      const side = m.look.x < 0 ? -1 : 1;
      const cx = side > 0 ? ox + W + 1 : ox - 9;
      this.rect(cx, oy + P + 2, 8, 6, C.accent);
      this.rect(side > 0 ? cx + 8 : cx - 4, oy + P + 1, 4, 2, C.accent);
    }
    if (m.carry) {
      const lift = hatHeight(m.cfg.id) + 1;
      this.drawItem(m.carry, ox + W / 2, oy - lift, 3);
    }
    if (m.asleep) this.drawZzz(ox, oy);
    if (m.lasso) this.drawLasso(m, ox, oy);
    if (m.lasso?.tugging) {
      // Heels dug in: dust kicks up behind its feet, away from the pull.
      const back = Math.sign(ox + 2.5 * P - m.lasso.loop.x) || 1;
      const k = (this.time * 4) % 1;
      this.rect(ox + W / 2 + back * (W / 2 + 2 + k * 9), oy + H - 3 - k * 9, 2, 2, C.wet);
      this.rect(ox + W / 2 + back * (W / 2 + 5 + ((k + 0.5) % 1) * 6), oy + H - 2 - ((k + 0.5) % 1) * 6, 2, 2, C.wet);
    }
    ctx.globalAlpha = 1;
  }

  private drawBlocks(m: Meeple) {
    m.blocks.forEach((b, i) => {
      const x = Math.round(b.x);
      const y = Math.round(b.y);
      this.rect(x, y, P, P, m.cfg.hex);
      if (i === 0) this.drawEyes(m, x, y);
    });
  }

  private drawEyes(m: Meeple, hx: number, hy: number) {
    if (m.asleep || m.blinkFor > 0) {
      this.rect(hx + 3, hy + 5, 2, 1, C.white);
      this.rect(hx + 6, hy + 5, 2, 1, C.white);
      return;
    }
    const ex = clamp(Math.round(m.look.x * 2), -2, 2);
    const ey = clamp(Math.round(m.look.y * 2), -1, 2);
    this.rect(hx + 3 + ex, hy + 2 + ey, 2, 4, C.white);
    this.rect(hx + 6 + ex, hy + 2 + ey, 2, 4, C.white);
  }

  private drawZzz(ox: number, oy: number) {
    const { ctx } = this;
    const a = ctx.globalAlpha;
    for (let k = 0; k < 2; k++) {
      const p = this.still ? 0.3 + k * 0.4 : (this.time / 2.4 + k / 2) % 1;
      ctx.globalAlpha = a * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85);
      const zx = Math.round(ox + W + 2 + p * 10);
      const zy = Math.round(oy - 8 - p * 22);
      this.pattern(Z_GLYPH, zx, zy, 2, () => C.muted);
    }
    ctx.globalAlpha = a;
  }

  /** A little white speech bubble with an ink outline, pointing down at (cx, bottom). */
  private drawBubble(cx: number, bottom: number, b: Bubble) {
    const { ctx } = this;
    ctx.font = this.font;
    const tw = b.text ? Math.ceil(ctx.measureText(b.text).width) : 0;
    const icon = b.icon ? ICONS[b.icon] : null;
    const iw = icon ? icon.rows[0].length * 2 : 0;
    const gap = tw && iw ? 3 : 0;
    const w = tw + iw + gap + 9;
    const h = 15;
    cx = Math.round(clamp(cx, w / 2 + 2, this.vw - w / 2 - 2));
    const x = Math.round(cx - w / 2);
    const y = Math.round(bottom - h - 4);
    // Fade out at the end.
    ctx.globalAlpha = b.life - b.t < 0.25 ? Math.max(0, (b.life - b.t) / 0.25) : 1;
    this.rect(x, y, w, h, C.ink);
    this.rect(x + 1, y + 1, w - 2, h - 2, C.white);
    this.rect(cx - 2, y + h - 1, 4, 1, C.white);
    this.rect(cx - 3, y + h - 1, 1, 1, C.ink);
    this.rect(cx + 2, y + h - 1, 1, 1, C.ink);
    this.rect(cx - 2, y + h, 1, 1, C.ink);
    this.rect(cx + 1, y + h, 1, 1, C.ink);
    this.rect(cx - 1, y + h, 2, 1, C.white);
    this.rect(cx - 1, y + h + 1, 2, 1, C.ink);
    if (icon) {
      const ih = icon.rows.length * 2;
      this.pattern(icon.rows, x + 5, y + Math.round((h - ih) / 2), 2, (ch) => icon.colors[ch] ?? null);
    }
    if (b.text) this.text(b.text, x + 5 + iw + gap, y + 11, C.ink, "left");
    ctx.globalAlpha = 1;
  }
}

function feet(m: Meeple): Vec {
  return { x: m.x + W / 2, y: m.y + H };
}

function center(m: Meeple): Vec {
  return { x: m.x + W / 2, y: m.y + H / 2 };
}

function sqCenter(s: Square): Vec {
  return { x: s.x + SQ / 2, y: s.y + SQ / 2 };
}

/** The period's height as it springs back up from flat, overshooting a little. */
function springBack(u: number) {
  return 1 - Math.exp(-7 * u) * Math.cos(14 * u);
}

function hopHeight(m: Meeple) {
  if (m.hop === null || m.hop < 0) return 0;
  const k = m.hop < HOP_TIME ? 1 : 0.55;
  return Math.round(Math.sin((Math.PI * (m.hop % HOP_TIME)) / HOP_TIME) * HOP_HEIGHT * k);
}

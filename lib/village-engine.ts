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

// Building sizes, in half pixels.
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

// The pixel z drifting up from a napping meeple (and the Sleepy One's chimney).
const Z_GLYPH = ["XXX", "..X", ".X.", "X..", "XXX"];

// The Sleepy One's nightcap, from the landing page.
const NIGHTCAP = [
  { x: -1, y: -3, w: 13, h: 4, c: C.red },
  { x: 1, y: -6, w: 8, h: 3, c: C.red },
  { x: -2, y: -8, w: 5, h: 2, c: C.red },
  { x: -5, y: -9, w: 3, h: 3, c: C.yellow },
];

// Little pictures for speech bubbles, in 2px pixels.
type IconKind = "heart" | "flower" | "carrot" | "star";
const ICONS: Record<IconKind, { rows: string[]; colors: Record<string, string> }> = {
  heart: { rows: [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."], colors: { X: C.red } },
  flower: { rows: [".P.", "PCP", ".P.", ".S.", ".S."], colors: { P: C.purple, C: C.yellow, S: C.green } },
  carrot: { rows: ["L.L", ".L.", "OOO", ".O.", ".O."], colors: { L: C.green, O: C.red } },
  star: { rows: ["..X..", ".XXX.", "XXXXX", ".XXX.", ".X.X."], colors: { X: C.gold } },
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
type Motion = { text: string; icon?: IconKind; effect: "plant" | "share" | "nap" | "hug" | "party" };
const MOTIONS: Motion[] = [
  { text: "MORE FLOWERS?", icon: "flower", effect: "plant" },
  { text: "SHARE CARROTS?", icon: "carrot", effect: "share" },
  { text: "NAP TIME?", effect: "nap" },
  { text: "GROUP HUG?", icon: "heart", effect: "hug" },
  { text: "PARTY?", icon: "star", effect: "party" },
];

/** How each meeple likes to spend its time, as relative weights. */
type Plan = "home" | "stroll" | "garden" | "visit" | "nap" | "zoom";
const PLANS: Record<MeepleId, Partial<Record<Plan, number>>> = {
  yellow: { visit: 3, garden: 2, stroll: 2, home: 1 },
  green: { garden: 5, home: 1.5, stroll: 1, visit: 0.8 },
  purple: { stroll: 2.5, visit: 1.5, home: 1.5, garden: 1 },
  red: { zoom: 4, visit: 1, garden: 0.6, home: 0.5 },
  blue: { home: 3, nap: 3, garden: 1, visit: 0.4 },
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
type Item = { kind: PlantKind; petal: string };

type Plant = Item & {
  /** 0 is a seed, 1 is grown. */
  grow: number;
  /** Seconds of water left; growing is faster while wet. */
  wet: number;
  /** Seconds since it was flattened, or -1. */
  flat: number;
};

type Slot = { x: number; y: number; plant: Plant | null; claimed: Meeple | null; stand: Vec };

type Building = {
  kind: "house" | "hall" | "court";
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
};

type Tree = { x: number; y: number; rows: string[]; shake: number };

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

type Task =
  | { kind: "home"; phase: "go" | "in"; t: number; stay: number }
  | { kind: "stroll"; phase: "go" | "rest"; t: number; rest: number; to: Vec }
  | { kind: "garden"; phase: "go" | "work"; t: number; slot: Slot; job: "plant" | "water" | "harvest"; plant: PlantKind }
  | { kind: "deliver"; phase: "go" | "knock" | "wait" | "talk"; t: number; to: Meeple; said: number }
  | { kind: "host"; phase: "go" | "meet"; t: number; guest: Meeple | null }
  | { kind: "spot"; at: Vec; face: Vec | null; arrived: boolean; why: "event" | "help" }
  | { kind: "nap"; phase: "go" | "sleep"; t: number; dur: number; at: Vec }
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
};

type Beat = { at: number; who: "lead" | "dock" | "crowd"; text?: string; icon?: IconKind; life: number; hop?: boolean };

type TownEvent = {
  kind: "meeting" | "court";
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
    if (this.still || this.event) return;
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
    if (this.still || this.event) return;
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
    while (sides.length && spots.length + sides.length * rows < 5) rows++;
    for (let k = 0; k < rows; k++) {
      for (const side of sides) {
        const [a, b] = sideX(side);
        spots.push({ box: { x: snap(rand(a, b)), y: firstY + k * band, w: sw, h: sh }, side, spurY: spurOf(k), row: k });
      }
    }

    const chosen = shuffle(spots).slice(0, 5);
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

    this.houses = chosen.map((s) => {
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
      return this.makeBuilding("house", s.box, door);
    });

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
    this.buildings = [this.hall, this.court, ...this.houses];

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

    const area = vw * this.worldH;
    this.trees = [];
    this.restSpots = [];
    const treeCount = clamp(Math.round(area / (phone ? 24000 : 30000)), 6, 44);
    for (let i = 0; i < treeCount; i++) {
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
    this.courtCooldown -= dt;
    if (this.pendingCourt > 0) {
      this.pendingCourt -= dt;
      if (this.pendingCourt <= 0) this.holdCourt();
    }
    if (!this.event) {
      this.meetingIn -= dt;
      if (this.meetingIn <= 0) this.ringBell();
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
      if (!m.inside && (m.task?.kind === "zoom" || Math.hypot(m.vx, m.vy) > TUMBLE_SPEED)) this.trample(m);
      this.updateFace(m, dt);
      m.prev = { x: m.x, y: m.y };
    }
    this.collide();
    this.greetings();

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
    m.task = task;
    m.goal = null;
    m.route = [];
    m.tool = null;
    m.face = null;
  }

  private pickTask(m: Meeple): Task {
    const others = this.meeples.filter((o) => o !== m);
    if (m.carry) return { kind: "deliver", phase: "go", t: 0, to: pick(others), said: 0 };
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
      case "nap":
        return { kind: "nap", phase: "go", t: 0, dur: rand(14, 26), at: pick(this.restSpots.length ? this.restSpots : [m.house.hostSpot]) };
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

  /** The Chaotic One's next dash: somewhere on the paths, or straight through the garden. */
  private zoomTarget(): Vec {
    const g = this.garden;
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

  private randomItem(kind: PlantKind): Item {
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
          if (this.go(m, t.at, dt, undefined, m.speed * (m.cfg.id === "red" ? 1 : 1.7))) t.arrived = true;
          break;
        }
        m.face = t.face;
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
        if (!m.asleep || t.t > t.dur) {
          m.asleep = false;
          this.setTask(m, null);
        }
        break;
      }

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
    }
  }

  private trample(m: Meeple) {
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
    if (this.hit(this.toLocal(t), 10)) e.preventDefault();
  };

  private onPointerDown = (e: PointerEvent) => {
    this.moveCursor(e);
    if (this.drag || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (this.isInteractive(e.target)) return;
    const p = this.toLocal(e);
    const m = this.hit(p, e.pointerType === "mouse" ? 3 : 10);
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
    this.drag = { m, pointerId: e.pointerId, offX: p.x - m.x, offY: p.y - m.y, t0: e.timeStamp, start: p, moved: 0, samples: [{ t: e.timeStamp, ...p }] };
    this.root.style.cursor = "grabbing";
  };

  private onPointerMove = (e: PointerEvent) => {
    this.moveCursor(e);
    const p = this.toLocal(e);
    if (this.press && e.pointerId === this.press.pointerId) {
      this.press.moved = Math.max(this.press.moved, dist(p, this.press.start));
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
      this.root.style.cursor = !free ? "" : this.hit(p, 3) ? "grab" : this.tappable(p) ? "pointer" : "";
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const press = this.press;
    if (press && e.pointerId === press.pointerId) {
      this.press = null;
      if (e.type === "pointerup" && press.moved < 8 && e.timeStamp - press.t0 < 500) this.tap(press.start);
    }
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
      this.trees.some((t) => inBox(p, this.treeBox(t))) ||
      this.slots.some((s) => !s.plant && Math.abs(p.x - s.x) < 10 && p.y > s.y - 3 * P && p.y < s.y + 4)
    );
  }

  private treeBox(t: Tree): Box {
    const w = t.rows[0].length * U;
    const h = t.rows.length * U;
    return { x: t.x, y: t.y - h, w, h };
  }

  private tap(p: Vec) {
    const b = this.buildings.find((b) => inBox(p, b.box));
    if (b?.kind === "hall") return this.ringBell();
    if (b?.kind === "court") return this.holdCourt();
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

    // Further down the page is closer, so draw from the top down.
    const items: { y: number; draw: () => void }[] = [];
    for (const b of this.buildings) items.push({ y: b.box.y + b.box.h, draw: () => this.drawBuilding(b) });
    for (const t of this.trees) items.push({ y: t.y, draw: () => this.drawTree(t) });
    for (const m of this.meeples) {
      if (m.inside || m.mode === "exploded" || m.mode === "reassemble") continue;
      items.push({ y: m.y + H + (m.mode === "drag" ? 1000 : 0), draw: () => this.drawMeeple(m) });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    for (const m of this.meeples) if (m.mode === "exploded" || m.mode === "reassemble") this.drawBlocks(m);
    this.drawParticles();
    this.drawLabels();
    for (const m of this.meeples) {
      if (m.inside || m.mode === "exploded" || m.mode === "reassemble") continue;
      const top = m.y - hopHeight(m) - (m.cfg.id === "blue" || m.cfg.id === "purple" ? 12 : 4) - (m.carry ? 18 : 0);
      if (m.bubble && m.bubble.t >= 0) this.drawBubble(m.x + W / 2, top, m.bubble);
      else if (this.showTag(m)) this.text(m.cfg.tag, m.x + W / 2, top - 2, C.muted);
    }
    for (const s of this.signs) if (s.t >= 0) this.drawBubble(s.x, s.y, s);
  }

  private showTag(m: Meeple) {
    if (m.mode === "drag") return true;
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

  private drawLabels() {
    for (const b of this.houses) {
      if (b.owner) this.text(b.owner.cfg.tag, b.box.x + b.box.w / 2, b.box.y - 3, C.muted);
    }
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
    let oy = Math.round(m.y) - hopHeight(m);
    if (m.mode === "shake") {
      ox += Math.round(rand(-2, 2));
      oy += Math.round(rand(-2, 2));
    }
    if (m.tool === "dig") oy -= Math.round(Math.abs(Math.sin(this.time * 12)) * 3);
    const walking = Math.hypot(m.wx, m.wy) > 1 && m.mode === "walk";
    MEEPLE_BLOCKS.forEach((b, i) => {
      const lift = walking && ((i === 5 && m.stepFrame === 0) || (i === 6 && m.stepFrame === 1)) ? -2 : 0;
      this.rect(ox + b.x * P, oy + b.y * P + lift, P, P, m.cfg.hex);
    });
    const hx = ox + P;
    if (m.cfg.id === "blue") for (const c of NIGHTCAP) this.rect(hx + c.x, oy + c.y, c.w, c.h, c.c);
    if (m.cfg.id === "purple") {
      // The mayor's top hat.
      this.rect(hx - 2, oy - 2, 15, 2, C.ink);
      this.rect(hx + 1, oy - 10, 9, 8, C.ink);
      this.rect(hx + 1, oy - 5, 9, 2, C.gold);
    }
    this.drawEyes(m, hx, oy);
    if (m.tool === "water") {
      // A watering can, tipped at the plant.
      const side = m.look.x < 0 ? -1 : 1;
      const cx = side > 0 ? ox + W + 1 : ox - 9;
      this.rect(cx, oy + P + 2, 8, 6, C.accent);
      this.rect(side > 0 ? cx + 8 : cx - 4, oy + P + 1, 4, 2, C.accent);
    }
    if (m.carry) {
      const lift = m.cfg.id === "blue" || m.cfg.id === "purple" ? 10 : 2;
      this.drawItem(m.carry, ox + W / 2, oy - lift, 3);
    }
    if (m.asleep) this.drawZzz(ox, oy);
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

function hopHeight(m: Meeple) {
  if (m.hop === null || m.hop < 0) return 0;
  const k = m.hop < HOP_TIME ? 1 : 0.55;
  return Math.round(Math.sin((Math.PI * (m.hop % HOP_TIME)) / HOP_TIME) * HOP_HEIGHT * k);
}

/**
 * The meeple engine (CLAUDE.md §5): five pixel meeples that wander, react to
 * the cursor, can be dragged and thrown, and explode into pixels when clicked.
 *
 * It's a small custom requestAnimationFrame loop drawing onto one canvas,
 * rather than matter-js or a DOM node per pixel, to keep the landing page
 * light. The world is top-down (graph paper seen from above), so there is no
 * gravity: throws glide to a stop with friction.
 *
 * They also make a little trouble: the Chaotic One charges the headline's
 * pixel squares out of their sockets, the Curious One lassos them (and the
 * cursor) and tows them home, they all plant a pixel garden (the Shy One
 * grows carrots among the flowers in its corner, the Sleepy One plants in its sleep) that the
 * Chaotic One tramples, and the Sleepy One wears a nightcap. At rest the
 * headline always settles back to its grid-locked look.
 *
 * The two headline squares can be grabbed and thrown like meeples, and answer
 * clicks: HEY's square explodes and reassembles like a meeple, and RYKER's
 * period squashes flat until it's gone (every meeple jumps at the thud), and
 * a shiny gold flower pops up in its place while little ones pop up all over
 * the page. All five meeples gather round the gold flower and hop in praise
 * until it fades, then the period springs back.
 *
 * The canvas ignores pointer events. The engine listens on the page instead
 * and only claims a press that lands on a meeple and not on a link or button,
 * so meeples never block the case-study labels or the menu.
 */
import { MEEPLE_BLOCKS, MEEPLES, type MeepleConfig, type MeepleId } from "./meeples";

/** One meeple pixel, in CSS px. A grid cell is four of these. */
const P = 11;
const W = 3 * P;
const H = 4 * P;

/** Keep wander targets this far from the edges. */
const MARGIN = 16;

const FRICTION = 1.8; // per second, for thrown and knocked meeples
const BOUNCE = 0.7; // restitution off the viewport edges
const COLLIDE = 0.75; // restitution between meeples
const TUMBLE_SPEED = 70; // above this a meeple is sliding, not walking
const MAX_THROW = 2200;

const SHAKE_TIME = 0.45;
const SCATTER_TIME = 2.4;
const AWAKE_TIME = 12; // how long the Sleepy One stays up once woken

const ZZZ_COLOR = "#A1A3A6"; // `muted`
const ROPE_COLOR = "#221F20"; // `ink-soft`

// 3x5 pixel "z", drawn at 2px per pixel.
const Z_GLYPH = ["XXX", "..X", ".X.", "X..", "XXX"];

// Mischief. The headline's pixel squares can be shoved out of their sockets
// by a fast meeple; slow walkers only tint them. Loose squares slide, come to
// rest, and get roped back by the Curious One (or glide home on their own).
const PUSH_SPEED = 110;
const SQUARE_FRICTION = 2.6;
const SQUARE_REST = 1.2; // seconds at rest before the lasso goes after it
const SQUARE_GIVE_UP = 8; // seconds loose before it glides home by itself

// Clicking the headline squares. HEY's square bursts into a 4x4 of half
// meeple pixels; RYKER's period flattens away and a gold flower pops up.
const SQUARE_SHAKE = 0.35;
const SQUARE_SPLIT = 4;
const FLATTEN_TIME = 0.14;
const GOLD_LIFE = 9; // seconds from the click until the gold flower goes
const GOLD_FADE = 0.6;
const SPRING_BACK = 0.6; // then the period springs back up
const PRAISE_RADIUS = 92; // how far from the gold flower the meeples gather
// Where each meeple stands around it, in degrees either side of the most open
// direction (down and toward the middle of the page).
const PRAISE_ANGLES = [-80, -40, 0, 40, 80];
const WILD_LIFE: [number, number] = [14, 20]; // the little flowers it sets off
const HOP_TIME = 0.42; // one hop
const HOP_HEIGHT = 16;
const SHOCKWAVE_SPEED = 900; // px/s, so far meeples hop a beat later

const ROPE = 64; // towing rope length
const LASSO_TWIRL = 0.7;
const LASSO_THROW = 0.3;
const LASSO_HOLD = 1.2;
const LASSO_PULL = 2.4; // how long a roped cursor can drag the Curious One around
const ROPE_SNAP = 160; // a cursor that jumps further than this in a frame slips the loop
const LASSO_REEL = 0.3;

// The garden, planted by all five: flowers most, then grass, then the Shy One's
// carrots. Plants are drawn in half meeple pixels and planted on the
// meeple-pixel grid.
const F = P / 2;
const PLANT_TIME = 0.9;
const PLANT_EVERY: [number, number] = [3, 6];
const MAX_FLOWERS = 24;
const FLOWER_LIFE = 120;
const WILT_TIME = 2;
const TRAMPLED_TIME = 3;
const PETALS = ["#985DF6", "#E05A32", "#58B9F8", "#FBEC5A"];
const STEM = "#5FCC8A";
const DIRT = "#A1A3A6";

// The gold flower from RYKER's period: H highlight, P gold petal, C amber center.
const GOLD_BLOOM = [".HPP.", "HPCPP", ".PPP.", "..S..", ".LS..", "..SL.", "..S.."];
const GOLD_COLORS: Record<string, string> = {
  H: "#FFF1A8",
  P: "#F5C518",
  C: "#E0860B",
  S: "#5FCC8A",
  L: "#5FCC8A",
  D: "#A1A3A6",
};
// Sparkles around its head: x from the flower's middle and y from its top, in its pixels, and a phase.
const GOLD_SPARKLES: [number, number, number][] = [
  [-3.6, -0.6, 0],
  [3.4, 0.4, 0.35],
  [-2.8, 3.2, 0.6],
  [3.1, 2.6, 0.15],
  [0.4, -1.8, 0.8],
];

// Rows top to bottom. S stem, L leaf, P petal, C center, D dirt.
const FLOWER_SEED = ["DDD"];
const FLOWER_SPROUT = ["L.L", ".S.", ".S."];
const FLOWER_BLOOM = [".P.", "PCP", ".P.", ".S.", "LS.", ".S."];
const FLOWER_FLAT = ["LSSPCP"];
// The Shy One's carrots: leafy tops with the orange shoulders poking out. O is carrot.
const CARROT_GROWN = ["L.L", ".L.", "OOO", "OOO", ".O."];
const CARROT_FLAT = ["LLOOO."];
const CARROT = "#E05A32"; // meeple-red, which reads as carrot orange
// Tufts of grass, planted between the flowers.
const GRASS_GROWN = ["..L..", "L.L.L", "LLLLL"];
const GRASS_FLAT = ["LLLLL"];
const SHAPES: Record<Plant, { grown: string[]; flat: string[] }> = {
  flower: { grown: FLOWER_BLOOM, flat: FLOWER_FLAT },
  grass: { grown: GRASS_GROWN, flat: GRASS_FLAT },
  carrot: { grown: CARROT_GROWN, flat: CARROT_FLAT },
};
// What each gardener plants, in turn: mostly flowers, then grass, then (the
// Shy One only) carrots.
const PLANTS: Plant[] = ["flower", "grass", "flower"];
const SHY_PLANTS: Plant[] = ["flower", "grass", "flower", "grass", "flower", "carrot"];

// The Sleepy One's nightcap, in px from its head block's top-left. It droops
// to the left so it stays clear of the z's.
const NIGHTCAP = [
  { x: -1, y: -3, w: 13, h: 4, c: "#E05A32" },
  { x: 1, y: -6, w: 8, h: 3, c: "#E05A32" },
  { x: -2, y: -8, w: 5, h: 2, c: "#E05A32" },
  { x: -5, y: -9, w: 3, h: 3, c: "#FBEC5A" },
];

type Mode = "idle" | "walk" | "drag" | "shake" | "exploded" | "reassemble";

type Traits = {
  /** Walking speed in px/s. */
  speed: number;
  /** Pause length range in seconds. */
  pause: [number, number];
  /** Seconds per walking step. */
  step: number;
};

const TRAITS: Record<MeepleId, Traits> = {
  yellow: { speed: 55, pause: [0.6, 2.2], step: 0.14 },
  green: { speed: 50, pause: [0.8, 2.6], step: 0.14 },
  purple: { speed: 30, pause: [1.2, 3.5], step: 0.18 },
  red: { speed: 125, pause: [0.15, 0.7], step: 0.08 },
  blue: { speed: 40, pause: [1, 3], step: 0.2 },
};

type Vec = { x: number; y: number };

type Block = Vec & { vx: number; vy: number; delay: number };

type Meeple = {
  cfg: MeepleConfig;
  traits: Traits;
  /** Top-left corner. */
  x: number;
  y: number;
  /** Physics velocity, from throws and bumps. Decays with friction. */
  vx: number;
  vy: number;
  /** Walking velocity, set each frame by the meeple's personality. */
  wx: number;
  wy: number;
  mode: Mode;
  modeT: number;
  target: Vec | null;
  idleFor: number;
  stepT: number;
  stepFrame: 0 | 1;
  look: Vec;
  blinkIn: number;
  blinkFor: number;
  asleep: boolean;
  /** Seconds until the Sleepy One sleepwalks to a new napping spot. */
  napFor: number;
  /** Width of its name tag, once the pixel font has loaded. */
  tagWidth: number;
  awakeFor: number;
  scaredFor: number;
  fleeTo: Vec | null;
  rushing: boolean;
  rushCooldown: number;
  /** Position last frame, to estimate drag velocity. */
  prev: Vec;
  blocks: Block[];
  /** The Curious One's lasso, while it's out. */
  lasso: Lasso | null;
  lassoCooldown: number;
  /** Gardeners only: seconds until it next plants, and digging progress (-1 when not). */
  plantIn: number;
  planting: number;
  /** How many it has planted, to take turns between flowers, grass and carrots. */
  planted: number;
  /** Seconds into a jump from the squash shockwave (negative while it travels; null when not). */
  hop: number | null;
};

type TintTarget = {
  el: HTMLElement;
  prop: "color" | "backgroundColor";
  /** Where the element sits at rest, ignoring any shove. */
  rect: DOMRect | null;
  color: string | null;
  holdUntil: number;
  /** Pixel squares can be knocked loose. Text stays put. */
  pushable: boolean;
  state: "home" | "loose" | "towed" | "gliding" | "burst" | "held" | "gone";
  /** What a click does: HEY's square bursts, RYKER's period squashes. */
  click: "burst" | "squash" | null;
  /** Seconds into a burst (-1 when not). */
  clickT: number;
  /** A burst square's pieces, and their color. */
  blocks: Block[];
  blockColor: string;
  /** RYKER's period: seconds since it was clicked (-1 when not), through flattening, the gold flower and springing back. */
  bloomT: number;
  off: Vec;
  v: Vec;
  /** Seconds loose, and seconds at rest while loose. */
  looseFor: number;
  restFor: number;
};

type Lasso = {
  phase: "twirl" | "throw" | "hold" | "tow" | "reel";
  t: number;
  /** A loose headline square to rope back, or null to rope the cursor. */
  square: TintTarget | null;
  /** Where the loop is, while it's off the meeple's hand. */
  loop: Vec;
  /** Rope paid out while towing; reeled in to ROPE. */
  rope: number;
  /** A roped cursor: seconds spent dragging the meeple, whether it's dragging this frame, and where it was. */
  pull: number;
  tugging: boolean;
  last: Vec;
};

type Plant = "flower" | "grass" | "carrot";

type Flower = {
  /** Left edge and baseline. */
  x: number;
  y: number;
  age: number;
  petal: string;
  /** Seconds since it started wilting or was trampled; -1 while healthy. */
  fade: number;
  trampled: boolean;
  /** Seconds before it wilts. The period's wild flowers don't last as long. */
  life: number;
  kind: Plant;
};

type SquareDrag = {
  t: TintTarget;
  pointerId: number;
  offX: number;
  offY: number;
  t0: number;
  start: Vec;
  moved: number;
  samples: { t: number; x: number; y: number }[];
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

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], [data-meeple-ignore]";

export class MeepleEngine {
  private ctx: CanvasRenderingContext2D;
  private meeples: Meeple[];
  private vw = 0;
  private vh = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private cursor = { x: 0, y: 0, inside: false, lastMove: -Infinity };
  private glance: { at: Vec; until: number } | null = null;
  private drag: Drag | null = null;
  private squareDrag: SquareDrag | null = null;
  /** While the gold flower is up: the flower's head and each meeple's spot around it. */
  private praise: { square: TintTarget; head: Vec; spots: Map<Meeple, Vec> } | null = null;
  private tints: TintTarget[] = [];
  private squares: TintTarget[] = [];
  private flowers: Flower[] = [];
  /** Areas the garden keeps off: the headline's two lines (not the whole box, so the gaps beside them can bloom), the links and the menu. */
  private noPlant: DOMRect[] = [];
  /** When the Chaotic One may next shove a square on purpose. */
  private nextShove = 6;
  private tagFont = "700 8px monospace";
  private resizeObserver: ResizeObserver;
  private cleanups: (() => void)[] = [];

  constructor(
    private root: HTMLElement,
    private canvas: HTMLCanvasElement,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;

    this.measure();
    this.meeples = MEEPLES.map((cfg) => this.createMeeple(cfg));

    this.tints = Array.from(root.querySelectorAll<HTMLElement>("[data-meeple-tint]")).map((el) => ({
      el,
      prop: el.dataset.meepleTint === "text" ? "color" : "backgroundColor",
      rect: null,
      color: null,
      holdUntil: 0,
      pushable: el.dataset.meepleTint !== "text",
      state: "home",
      click: el.dataset.meepleClick === "burst" || el.dataset.meepleClick === "squash" ? el.dataset.meepleClick : null,
      clickT: -1,
      blocks: [],
      blockColor: "",
      bloomT: -1,
      off: { x: 0, y: 0 },
      v: { x: 0, y: 0 },
      looseFor: 0,
      restFor: 0,
    }));
    this.squares = this.tints.filter((t) => t.pushable);
    this.measureTints();

    // Name tags use the pixel accent font. Nothing else on the page uses it
    // yet, so ask for it explicitly, then re-measure the tags once it's in.
    const pixel = getComputedStyle(document.documentElement).getPropertyValue("--font-silkscreen").trim();
    if (pixel) {
      // Bold at its native 8px size, so the letters stay crisp and chunky.
      this.tagFont = `700 8px ${pixel}`;
      document.fonts
        ?.load(this.tagFont)
        .then(() => {
          for (const m of this.meeples) m.tagWidth = 0;
        })
        .catch(() => {});
    }

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(root);
    // Inter loading in changes the headline's size, so re-measure after fonts.
    document.fonts?.ready.then(() => this.measureTints());

    this.listen(root, "pointerdown", this.onPointerDown);
    // Non-passive so a touch that starts on a meeple can stop the page from
    // scrolling or zooming. Touches anywhere else are left alone.
    this.listen(root, "touchstart", this.onTouchStart, { passive: false });
    this.listen(window, "pointermove", this.onPointerMove);
    this.listen(window, "pointerup", this.onPointerUp);
    this.listen(window, "pointercancel", this.onPointerUp);
    this.listen(document.documentElement, "pointerleave", this.onPointerLeave);
    this.listen(document, "visibilitychange", this.onVisibility);

    // A meeple may glance at a case-study label (or the headline's [I'M] link)
    // when it's hovered or focused.
    for (const link of root.querySelectorAll<HTMLElement>("nav a, [data-meeple-glance]")) {
      const look = () => {
        const r = link.getBoundingClientRect();
        const c = this.canvas.getBoundingClientRect();
        this.glance = { at: { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top }, until: this.time + 1.4 };
      };
      this.listen(link, "pointerenter", look);
      this.listen(link, "focus", look);
    }
  }

  start() {
    this.render();
    if (document.visibilityState === "visible") this.resume();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    for (const off of this.cleanups) off();
    for (const t of this.tints) {
      t.el.style[t.prop] = "";
      t.el.style.transitionDuration = "";
      t.el.style.transform = "";
      t.el.style.visibility = "";
    }
    this.root.style.cursor = "";
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

  private createMeeple(cfg: MeepleConfig): Meeple {
    // Start exactly where the static (server-rendered) meeples stand, so the
    // swap to the canvas is seamless.
    const x = Math.min(cfg.home.x * this.vw, this.vw - W - 8);
    const y = Math.min(cfg.home.y * this.vh, this.vh - H - 8);
    const traits = TRAITS[cfg.id];
    return {
      cfg,
      traits,
      x,
      y,
      vx: 0,
      vy: 0,
      wx: 0,
      wy: 0,
      mode: "idle",
      modeT: 0,
      target: null,
      idleFor: rand(0.4, 2),
      stepT: 0,
      stepFrame: 0,
      look: { x: 0, y: 0 },
      blinkIn: rand(2, 6),
      blinkFor: 0,
      asleep: cfg.id === "blue",
      napFor: rand(4, 7),
      tagWidth: 0,
      awakeFor: 0,
      scaredFor: 0,
      fleeTo: null,
      rushing: false,
      rushCooldown: rand(2, 4),
      prev: { x, y },
      blocks: [],
      lasso: null,
      lassoCooldown: rand(3, 6),
      plantIn: rand(3, 6),
      planting: -1,
      planted: 0,
      hop: null,
    };
  }

  private measure() {
    this.vw = this.canvas.clientWidth;
    this.vh = this.canvas.clientHeight;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
  }

  private measureTints() {
    const c = this.canvas.getBoundingClientRect();
    for (const t of this.tints) {
      // The box includes any shove; take it off to get the resting spot.
      const b = t.el.getBoundingClientRect();
      const r = new DOMRect(b.left - t.off.x, b.top - t.off.y, b.width, b.height);
      // A text box includes the line's empty space above and below the
      // glyphs. Trim it to roughly the bracket height, so a meeple only
      // tints [I'M] when it actually touches the letters.
      const fs = t.prop === "color" ? parseFloat(getComputedStyle(t.el).fontSize) : 0;
      const top = r.top + fs * 0.17;
      const bottom = r.bottom - fs * 0.12;
      t.rect = new DOMRect(r.left - c.left, top - c.top, r.width, bottom - top);
    }
    this.noPlant = Array.from(this.root.querySelectorAll<HTMLElement>(".headline-line, nav a, header a, header button")).map((el) => {
      const r = el.getBoundingClientRect();
      return new DOMRect(r.left - c.left - 12, r.top - c.top - 12, r.width + 24, r.height + 24);
    });
  }

  private onResize() {
    this.measure();
    for (const m of this.meeples) {
      m.x = clamp(m.x, 0, this.vw - W);
      m.y = clamp(m.y, 0, this.vh - H);
    }
    this.measureTints();
    this.render();
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
    // Cap the step so a slow frame can't tunnel meeples through each other.
    const dt = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.render();
    this.updateTints();
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number) {
    this.updatePraise();
    for (const m of this.meeples) {
      m.modeT += dt;
      switch (m.mode) {
        case "drag":
          m.vx = (m.x - m.prev.x) / dt;
          m.vy = (m.y - m.prev.y) / dt;
          break;
        case "shake":
          if (m.modeT > SHAKE_TIME) this.explode(m);
          break;
        case "exploded":
          this.updateBlocks(m, dt);
          if (m.modeT > SCATTER_TIME) this.startReassembly(m);
          break;
        case "reassemble":
          this.reassemble(m, dt);
          break;
        default:
          this.think(m, dt);
          this.integrate(m, dt);
      }
      m.prev.x = m.x;
      m.prev.y = m.y;
      if (m.hop !== null) {
        m.hop += dt;
        if (m.hop > HOP_TIME * 2) m.hop = null;
      }
      this.updateFace(m, dt);
    }
    this.collide();
    this.updateSquares(dt);
    this.shoveSquares();
    this.updateFlowers(dt);
  }

  // ---------------------------------------------------------- personality

  private get cursorActive() {
    // A cursor that has sat still for a while stops being interesting.
    return this.cursor.inside && this.time - this.cursor.lastMove < 10;
  }

  private think(m: Meeple, dt: number) {
    m.wx = 0;
    m.wy = 0;

    if (this.praise) {
      this.worship(m, dt);
      return;
    }

    if (m.asleep) {
      // Every so often the Sleepy One sleepwalks to a fresh napping spot,
      // eyes shut and z's still going.
      m.napFor -= dt;
      if (m.napFor <= 0 && Math.hypot(m.vx, m.vy) < TUMBLE_SPEED) {
        if (!m.target) {
          const a = rand(0, Math.PI * 2);
          const r = rand(140, 320);
          m.target = this.clampTarget(m.x + Math.cos(a) * r, m.y + Math.sin(a) * r);
        }
        m.mode = "walk";
        if (this.walkTo(m, m.target.x, m.target.y, 55, dt)) {
          m.mode = "idle";
          m.target = null;
          m.napFor = rand(6, 11);
          // Plants a flower in its sleep, now and then, wherever it ends up.
          if (Math.random() < 0.6) this.plant(m);
        }
      }
      return;
    }
    if (m.cfg.id === "blue") {
      m.awakeFor -= dt;
      if (m.awakeFor <= 0 && m.mode === "idle") {
        m.asleep = true;
        return;
      }
    }

    // Sliding after a throw or a bump: no walking until it slows down.
    if (Math.hypot(m.vx, m.vy) > TUMBLE_SPEED) return;

    if (m.lasso) {
      this.workLasso(m, dt);
      return;
    }

    const c = center(m);
    const toCursor = { x: this.cursor.x - c.x, y: this.cursor.y - c.y };
    const d = Math.hypot(toCursor.x, toCursor.y) || 1;
    const active = this.cursorActive;

    switch (m.cfg.id) {
      case "yellow": {
        // The Curious One carries a lasso. It ropes any headline square that's
        // been knocked loose and tows it home, and now and then lassos the
        // cursor when it gets close enough.
        m.lassoCooldown -= dt;
        const strays = this.squares.filter((s) => s.state === "loose" && s.restFor > SQUARE_REST);
        const dist = (s: TintTarget) => Math.hypot(squareCenter(s).x - c.x, squareCenter(s).y - c.y);
        const stray = strays.sort((a, b) => dist(a) - dist(b))[0];
        if (stray) {
          // Walk over until it's within throwing range.
          const sc = squareCenter(stray);
          const ds = Math.hypot(sc.x - c.x, sc.y - c.y) || 1;
          if (ds > 180) {
            m.mode = "walk";
            this.walkTo(m, sc.x - ((sc.x - c.x) / ds) * 120 - W / 2, sc.y - ((sc.y - c.y) / ds) * 120 - H / 2, 90, dt);
          } else this.startLasso(m, stray);
          return;
        }
        if (active && d <= 150 && m.lassoCooldown <= 0 && Math.random() < dt * 0.8) {
          this.startLasso(m, null);
          return;
        }
        if (active) m.planting = -1;
        // Follows the cursor at a polite distance.
        if (active && d > 130) {
          const stop = { x: this.cursor.x - (toCursor.x / d) * 100, y: this.cursor.y - (toCursor.y / d) * 100 };
          m.mode = "walk";
          this.walkTo(m, stop.x - W / 2, stop.y - H / 2, Math.min(95, 40 + d * 0.25), dt);
          return;
        }
        if (active) {
          m.mode = "idle";
          m.idleFor = Math.max(m.idleFor, 0.5);
          return;
        }
        // With nothing to chase, it gardens too.
        if (this.garden(m, dt)) return;
        break;
      }
      case "green": {
        // The Shy One: scoots away when the cursor gets close, then peeks back.
        if (active && d < 160 && m.scaredFor <= 0) {
          m.scaredFor = rand(1, 1.5);
          m.planting = -1;
          const away = { x: -toCursor.x / d, y: -toCursor.y / d };
          const side = rand(-80, 80);
          let to = this.clampTarget(c.x + away.x * 240 - away.y * side - W / 2, c.y + away.y * 240 + away.x * side - H / 2);
          // Cornered: escape sideways instead.
          if (Math.hypot(to.x - m.x, to.y - m.y) < 60) {
            const s = Math.random() < 0.5 ? 1 : -1;
            to = this.clampTarget(m.x - away.y * 240 * s, m.y + away.x * 240 * s);
          }
          m.fleeTo = to;
        }
        if (m.scaredFor > 0) {
          m.scaredFor -= dt;
          m.mode = "walk";
          if (m.fleeTo) this.walkTo(m, m.fleeTo.x, m.fleeTo.y, 230, dt);
          return;
        }
        if (active && d < 380) {
          // Peeking: hold still, and creep back in if the cursor stays away.
          m.mode = d > 260 ? "walk" : "idle";
          m.idleFor = Math.max(m.idleFor, 0.5);
          if (d > 260) {
            m.wx = (toCursor.x / d) * 18;
            m.wy = (toCursor.y / d) * 18;
          }
          m.planting = -1;
          return;
        }
        if (this.garden(m, dt)) return;
        break;
      }
      case "purple": {
        // The Watcher tends a little garden around its perch.
        if (this.garden(m, dt)) return;
        break;
      }
      case "red": {
        // The Chaotic One: rushes the cursor, then swerves off at the last moment.
        m.rushCooldown -= dt;
        if (m.rushing && active) {
          m.mode = "walk";
          this.walkTo(m, this.cursor.x - W / 2, this.cursor.y - H / 2, 300, dt);
          if (d < 55) {
            const s = Math.random() < 0.5 ? 1 : -1;
            m.vx += (-toCursor.y / d) * 320 * s;
            m.vy += (toCursor.x / d) * 320 * s;
            m.rushing = false;
            m.rushCooldown = rand(2.5, 5);
            m.mode = "idle";
            m.idleFor = 0.2;
          }
          return;
        }
        m.rushing = false;
        if (active && m.rushCooldown <= 0 && Math.random() < dt * 0.6) {
          m.rushing = true;
          return;
        }
        // Even the Chaotic One plants a few (and tramples them later).
        if (this.garden(m, dt)) return;
        break;
      }
      case "blue": {
        // Awake for once: it gardens like the rest.
        if (this.garden(m, dt)) return;
        break;
      }
    }

    this.wander(m, dt);
  }

  private wander(m: Meeple, dt: number) {
    if (m.mode === "idle") {
      m.idleFor -= dt;
      if (m.idleFor <= 0) {
        m.target = this.pickTarget(m);
        m.mode = "walk";
      }
      return;
    }
    if (!m.target) m.target = this.pickTarget(m);
    if (this.walkTo(m, m.target.x, m.target.y, m.traits.speed, dt)) {
      m.mode = "idle";
      m.target = null;
      m.idleFor = rand(...m.traits.pause);
    }
  }

  private pickTarget(m: Meeple): Vec {
    if (m.cfg.id === "purple") {
      // The Watcher stays perched near its spot by the headline.
      const hx = Math.min(m.cfg.home.x * this.vw, this.vw - W - 8);
      const hy = Math.min(m.cfg.home.y * this.vh, this.vh - H - 8);
      return this.clampTarget(hx + rand(-120, 120), hy + rand(-40, 60));
    }
    if (m.cfg.id === "red" && this.time > this.nextShove && Math.random() < 0.5) {
      // Charge straight through one of the headline's pixel squares.
      const atHome = this.squares.filter((s) => s.state === "home" && s.rect);
      const s = atHome[Math.floor(Math.random() * atHome.length)];
      if (s?.rect) {
        const sc = { x: s.rect.x + s.rect.width / 2, y: s.rect.y + s.rect.height / 2 };
        const c = center(m);
        const d = Math.hypot(sc.x - c.x, sc.y - c.y);
        if (d > 80) {
          this.nextShove = this.time + rand(14, 24);
          return this.clampTarget(sc.x + ((sc.x - c.x) / d) * 150 - W / 2, sc.y + ((sc.y - c.y) / d) * 150 - H / 2);
        }
      }
    }
    if (m.cfg.id === "red" && Math.random() < 0.35) {
      // Head straight for another meeple. Bumps are the point.
      const others = this.meeples.filter((o) => o !== m && o.mode !== "exploded" && o.mode !== "reassemble");
      const o = others[Math.floor(Math.random() * others.length)];
      if (o) return this.clampTarget(o.x, o.y);
    }
    if (m.cfg.id === "green" && Math.random() < 0.85) {
      // The Shy One's hideout is the bottom-left quarter of the page. It
      // mostly potters about (and gardens) there, and heads back after a
      // scare or the odd outing.
      return this.clampTarget(rand(0, this.vw / 2 - W), rand(this.vh / 2, this.vh - H));
    }
    // Meander: a short leg in a random direction.
    const a = rand(0, Math.PI * 2);
    const r = rand(80, 320);
    return this.clampTarget(m.x + Math.cos(a) * r, m.y + Math.sin(a) * r);
  }

  private clampTarget(x: number, y: number): Vec {
    return {
      x: clamp(x, MARGIN, Math.max(MARGIN, this.vw - W - MARGIN)),
      y: clamp(y, MARGIN, Math.max(MARGIN, this.vh - H - MARGIN)),
    };
  }

  /**
   * The gold flower's fan club. From the moment it sprouts until it fades,
   * every meeple drops what it's doing (the Sleepy One wakes up), walks to its
   * own spot around it, and hops in praise while gazing at it.
   */
  private updatePraise() {
    const gold = this.squares.find((t) => t.bloomT >= FLATTEN_TIME + 0.35 && t.bloomT < GOLD_LIFE && t.rect);
    if (!gold) {
      this.praise = null;
      return;
    }
    if (this.praise?.square !== gold) {
      const r = gold.rect!;
      const g = r.width / 2;
      // The flower's head, matching drawGold: centered 2.5 of its pixels in, 5.5 up.
      const head = { x: r.x + gold.off.x + 2.5 * g, y: r.y + gold.off.y + r.height - 5.5 * g };
      // Face the fan club down and toward the middle of the page, where there's room.
      const toMiddle = clamp((this.vw / 2 - head.x) / (this.vw / 2), -1, 1);
      const open = Math.atan2(1, toMiddle);
      // Hand out the spots in the order the meeples already sit around the
      // flower, so their paths don't cross and they don't jostle on the way.
      const bearing = (v: Vec) => {
        const b = Math.atan2(v.y - head.y, v.x - head.x) - open;
        return Math.atan2(Math.sin(b), Math.cos(b));
      };
      const ordered = [...this.meeples].sort((a, b) => bearing(center(a)) - bearing(center(b)));
      const spots = new Map<Meeple, Vec>();
      ordered.forEach((m, i) => {
        const a = open + (PRAISE_ANGLES[i] * Math.PI) / 180;
        spots.set(m, this.clampTarget(head.x + Math.cos(a) * PRAISE_RADIUS - W / 2, head.y + Math.sin(a) * PRAISE_RADIUS - H / 2));
      });
      this.praise = { square: gold, head, spots };
      for (const m of this.meeples) {
        this.wake(m);
        this.cancelLasso(m);
        m.planting = -1;
        m.target = null;
        m.rushing = false;
        m.scaredFor = 0;
        m.fleeTo = null;
      }
    }
    this.glance = { at: this.praise.head, until: this.time + 0.3 };
  }

  private worship(m: Meeple, dt: number) {
    const p = this.praise!;
    this.wake(m);
    // Sliding after a throw or a bump: let it slow down first.
    if (Math.hypot(m.vx, m.vy) > TUMBLE_SPEED) return;
    const spot = p.spots.get(m)!;
    // Everyone hurries, even the slow ones.
    const speed = Math.max(m.traits.speed * 2, 190);
    if (!this.walkTo(m, spot.x, spot.y, speed, dt)) {
      m.mode = "walk";
      return;
    }
    m.mode = "idle";
    m.idleFor = 0.5;
    // Hop, hop, a short breath, again. Each on its own beat.
    if (m.hop === null) m.hop = -rand(0.05, 0.35);
  }

  /** Sets the walking velocity toward (x, y). Returns true on arrival. */
  private walkTo(m: Meeple, x: number, y: number, speed: number, dt: number) {
    const dx = x - m.x;
    const dy = y - m.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) return true;
    const s = Math.min(speed, d / dt);
    m.wx = (dx / d) * s;
    m.wy = (dy / d) * s;
    return false;
  }

  private integrate(m: Meeple, dt: number) {
    m.x += (m.wx + m.vx) * dt;
    m.y += (m.wy + m.vy) * dt;
    const f = Math.exp(-FRICTION * dt);
    m.vx *= f;
    m.vy *= f;
    if (Math.abs(m.vx) < 1) m.vx = 0;
    if (Math.abs(m.vy) < 1) m.vy = 0;

    if (m.x < 0) {
      m.x = 0;
      if (m.vx < 0) m.vx = -m.vx * BOUNCE;
    } else if (m.x > this.vw - W) {
      m.x = this.vw - W;
      if (m.vx > 0) m.vx = -m.vx * BOUNCE;
    }
    if (m.y < 0) {
      m.y = 0;
      if (m.vy < 0) m.vy = -m.vy * BOUNCE;
    } else if (m.y > this.vh - H) {
      m.y = this.vh - H;
      if (m.vy > 0) m.vy = -m.vy * BOUNCE;
    }

    // Walking animation: alternate which leg is lifted.
    if (Math.hypot(m.wx, m.wy) > 1 && Math.hypot(m.vx, m.vy) < TUMBLE_SPEED) {
      m.stepT += dt;
      if (m.stepT > m.traits.step) {
        m.stepT = 0;
        m.stepFrame = m.stepFrame ? 0 : 1;
      }
    } else {
      m.stepT = 0;
    }
  }

  private wake(m: Meeple) {
    if (m.cfg.id !== "blue") return;
    m.asleep = false;
    m.awakeFor = AWAKE_TIME;
  }

  /** Where the eyes point, and blinking. */
  private updateFace(m: Meeple, dt: number) {
    const c = center(m);
    let goal: Vec | null = null;
    if (this.glance && this.time < this.glance.until && !m.asleep) {
      goal = this.glance.at;
    } else if (
      this.cursorActive &&
      (m.cfg.id === "purple" ||
        m.cfg.id === "yellow" ||
        (m.cfg.id === "green" && Math.hypot(this.cursor.x - c.x, this.cursor.y - c.y) < 400))
    ) {
      goal = this.cursor;
    }

    let want: Vec = { x: 0, y: 0 };
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

  // ------------------------------------------------------------ collisions

  private collide() {
    const solid = this.meeples.filter((m) => m.mode === "idle" || m.mode === "walk" || m.mode === "drag");
    for (let i = 0; i < solid.length; i++) {
      for (let j = i + 1; j < solid.length; j++) {
        const a = solid[i];
        const b = solid[j];
        // Slightly smaller than the sprite, so corners can graze.
        const ox = Math.min(a.x, b.x) + W - Math.max(a.x, b.x) - 2;
        const oy = Math.min(a.y, b.y) + H - Math.max(a.y, b.y) - 2;
        if (ox <= 0 || oy <= 0) continue;

        const ia = invMass(a);
        const ib = invMass(b);
        if (ia + ib === 0) continue;

        // Separate along the axis of least overlap.
        const n: Vec = ox < oy ? { x: Math.sign(b.x - a.x) || 1, y: 0 } : { x: 0, y: Math.sign(b.y - a.y) || 1 };
        const overlap = ox < oy ? ox : oy;
        a.x -= n.x * overlap * (ia / (ia + ib));
        a.y -= n.y * overlap * (ia / (ia + ib));
        b.x += n.x * overlap * (ib / (ia + ib));
        b.y += n.y * overlap * (ib / (ia + ib));

        const rel = (b.vx + b.wx - a.vx - a.wx) * n.x + (b.vy + b.wy - a.vy - a.wy) * n.y;
        if (rel >= 0) continue;
        const jmp = (-(1 + COLLIDE) * rel) / (ia + ib);
        if (a.mode !== "drag") {
          a.vx -= jmp * ia * n.x;
          a.vy -= jmp * ia * n.y;
        }
        if (b.mode !== "drag") {
          b.vx += jmp * ib * n.x;
          b.vy += jmp * ib * n.y;
        }
        // A real hit wakes the Sleepy One.
        if (-rel > 110) {
          this.wake(a);
          this.wake(b);
        }
      }
    }
  }

  // ------------------------------------------------------------- exploding

  private explode(m: Meeple) {
    this.cancelLasso(m);
    m.planting = -1;
    m.mode = "exploded";
    m.modeT = 0;
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
  }

  private updateBlocks(m: Meeple, dt: number) {
    this.moveBlocks(m.blocks, P, dt);
  }

  /** Scattered pixels glide to a stop and bounce off the viewport edges. */
  private moveBlocks(blocks: Block[], size: number, dt: number) {
    const f = Math.exp(-2.4 * dt);
    for (const b of blocks) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= f;
      b.vy *= f;
      if (b.x < 0 || b.x > this.vw - size) {
        b.x = clamp(b.x, 0, this.vw - size);
        b.vx = -b.vx * 0.6;
      }
      if (b.y < 0 || b.y > this.vh - size) {
        b.y = clamp(b.y, 0, this.vh - size);
        b.vy = -b.vy * 0.6;
      }
    }
  }

  private startReassembly(m: Meeple) {
    m.mode = "reassemble";
    m.modeT = 0;
    // Pixels come home one after another, in a random order.
    const order = m.blocks.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((blockIndex, n) => (m.blocks[blockIndex].delay = n * 0.09));
  }

  private reassemble(m: Meeple, dt: number) {
    this.updateBlocks(m, dt);
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
    if (done) {
      m.blocks = [];
      m.mode = "idle";
      m.modeT = 0;
      m.idleFor = rand(0.4, 1);
      m.vx = m.vy = 0;
      this.wake(m);
    }
  }

  // ----------------------------------------------------------------- input

  private toLocal(e: { clientX: number; clientY: number }): Vec {
    const c = this.canvas.getBoundingClientRect();
    return { x: e.clientX - c.left, y: e.clientY - c.top };
  }

  private hit(p: Vec, pad: number): Meeple | null {
    // Last drawn is on top.
    for (let i = this.meeples.length - 1; i >= 0; i--) {
      const m = this.meeples[i];
      if (m.mode !== "idle" && m.mode !== "walk") continue;
      if (p.x >= m.x - pad && p.x <= m.x + W + pad && p.y >= m.y - pad && p.y <= m.y + H + pad) return m;
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
    if (this.hit(p, 10) || this.hitSquare(p, 10)) e.preventDefault();
  };

  private onPointerDown = (e: PointerEvent) => {
    this.moveCursor(e);
    if (this.drag || this.squareDrag || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (this.isInteractive(e.target)) return;
    const p = this.toLocal(e);
    const m = this.hit(p, e.pointerType === "mouse" ? 3 : 10);
    if (!m) {
      const sq = this.hitSquare(p, e.pointerType === "mouse" ? 3 : 10);
      if (sq) {
        e.preventDefault();
        this.grabSquare(sq, e, p);
      }
      return;
    }
    e.preventDefault();

    this.wake(m);
    this.cancelLasso(m);
    m.planting = -1;
    m.mode = "drag";
    m.modeT = 0;
    m.vx = m.vy = m.wx = m.wy = 0;
    m.target = null;
    m.rushing = false;
    m.scaredFor = 0;
    this.drag = {
      m,
      pointerId: e.pointerId,
      offX: p.x - m.x,
      offY: p.y - m.y,
      t0: e.timeStamp,
      start: p,
      moved: 0,
      samples: [{ t: e.timeStamp, ...p }],
    };
    this.root.style.cursor = "grabbing";
  };

  private onPointerMove = (e: PointerEvent) => {
    this.moveCursor(e);
    const sd = this.squareDrag;
    if (sd && e.pointerId === sd.pointerId) {
      const p = this.toLocal(e);
      const r = sd.t.rect!;
      sd.t.off.x = clamp(p.x - sd.offX, 0, this.vw - r.width) - r.x;
      sd.t.off.y = clamp(p.y - sd.offY, 0, this.vh - r.height) - r.y;
      sd.moved = Math.max(sd.moved, Math.hypot(p.x - sd.start.x, p.y - sd.start.y));
      sd.samples.push({ t: e.timeStamp, ...p });
      while (sd.samples.length > 2 && e.timeStamp - sd.samples[0].t > 100) sd.samples.shift();
      return;
    }
    const drag = this.drag;
    if (drag && e.pointerId === drag.pointerId) {
      const p = this.toLocal(e);
      drag.m.x = clamp(p.x - drag.offX, 0, this.vw - W);
      drag.m.y = clamp(p.y - drag.offY, 0, this.vh - H);
      drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.start.x, p.y - drag.start.y));
      drag.samples.push({ t: e.timeStamp, ...p });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
      return;
    }
    if (e.pointerType === "mouse" && !drag) {
      const p = this.toLocal(e);
      const free = !this.isInteractive(e.target);
      this.root.style.cursor = free && (this.hit(p, 3) || this.hitSquare(p, 3)) ? "grab" : "";
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const sd = this.squareDrag;
    if (sd && e.pointerId === sd.pointerId) this.releaseSquare(sd, e.timeStamp, e.type === "pointerup");
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.release(drag, e.timeStamp, e.type === "pointerup");
  };

  private release(drag: Drag, now: number, allowClick: boolean) {
    const { m } = drag;
    this.drag = null;
    this.root.style.cursor = "";
    m.modeT = 0;

    // A short press without movement is a click: shake, then explode.
    if (allowClick && drag.moved < 6 && now - drag.t0 < 400) {
      m.mode = "shake";
      m.vx = m.vy = 0;
      return;
    }

    // Otherwise it's a throw, using the pointer's speed over the last ~100ms.
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
    m.mode = "idle";
    m.idleFor = rand(0.5, 1.2);
  }

  private onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.cursor.inside = false;
  };

  // ------------------------------------------------------- headline squares

  /** Moves loose squares, and writes every square's offset to the page. */
  private updateSquares(dt: number) {
    for (const t of this.squares) {
      const r = t.rect;
      if (!r) continue;
      switch (t.state) {
        case "loose": {
          t.looseFor += dt;
          t.off.x += t.v.x * dt;
          t.off.y += t.v.y * dt;
          const f = Math.exp(-SQUARE_FRICTION * dt);
          t.v.x *= f;
          t.v.y *= f;
          // Bounce off the viewport edges.
          const x = r.x + t.off.x;
          const y = r.y + t.off.y;
          if (x < 0 || x > this.vw - r.width) {
            t.off.x = clamp(x, 0, this.vw - r.width) - r.x;
            t.v.x = -t.v.x * BOUNCE;
          }
          if (y < 0 || y > this.vh - r.height) {
            t.off.y = clamp(y, 0, this.vh - r.height) - r.y;
            t.v.y = -t.v.y * BOUNCE;
          }
          t.restFor = Math.hypot(t.v.x, t.v.y) < 4 ? t.restFor + dt : 0;
          if (t.looseFor > SQUARE_GIVE_UP) t.state = "gliding";
          break;
        }
        case "towed": {
          // On the end of the rope: never further than ROPE from the hand.
          const tower = this.meeples.find((m) => m.lasso?.square === t);
          if (!tower) {
            t.state = "loose";
            break;
          }
          const hand = this.hand(tower);
          const rope = tower.lasso!.rope;
          const c = squareCenter(t);
          const d = Math.hypot(c.x - hand.x, c.y - hand.y);
          if (d > rope) {
            t.off.x -= ((c.x - hand.x) / d) * (d - rope);
            t.off.y -= ((c.y - hand.y) / d) * (d - rope);
          }
          t.v.x = t.v.y = 0;
          break;
        }
        case "burst":
          this.updateBurst(t, dt);
          break;
        case "gliding": {
          const k = 1 - Math.exp(-5 * dt);
          t.off.x -= t.off.x * k;
          t.off.y -= t.off.y * k;
          if (Math.hypot(t.off.x, t.off.y) < 0.5) {
            t.state = "home";
            t.off.x = t.off.y = 0;
          }
          break;
        }
      }
      let sy = 1;
      if (t.bloomT >= 0) {
        t.bloomT += dt;
        const back = t.bloomT - GOLD_LIFE - GOLD_FADE;
        if (t.bloomT < FLATTEN_TIME) sy = 1 - t.bloomT / FLATTEN_TIME;
        else if (back < 0) sy = 0;
        else if (back < SPRING_BACK) sy = springBack(back);
        else {
          t.bloomT = -1;
          t.state = Math.hypot(t.off.x, t.off.y) < 0.5 ? "home" : "loose";
          t.looseFor = t.restFor = 0;
        }
        const hide = sy <= 0 ? "hidden" : "";
        if (t.el.style.visibility !== hide) t.el.style.visibility = hide;
      }
      if (t.state === "loose" && Math.hypot(t.v.x, t.v.y) > 200) this.squareHits(t);
      let jx = 0;
      let jy = 0;
      if (t.state === "burst" && t.clickT < SQUARE_SHAKE) {
        jx = Math.round(rand(-2, 2));
        jy = Math.round(rand(-2, 2));
      }
      // Whole device pixels, so the square stays crisp in flight.
      const tx = Math.round(t.off.x * this.dpr) / this.dpr + jx;
      const ty = Math.round(t.off.y * this.dpr) / this.dpr + jy;
      let transform = tx || ty ? `translate(${tx}px, ${ty}px)` : "";
      if (sy !== 1) {
        // Spreads out as it flattens, and stays planted on its bottom edge
        // (transform-origin in globals.css).
        transform += ` scale(${(1 + (1 - Math.min(sy, 1)) * 0.6).toFixed(3)}, ${Math.max(sy, 0.001).toFixed(3)})`;
      }
      if (t.el.style.transform !== transform) t.el.style.transform = transform;
    }
  }

  private hitSquare(p: Vec, pad: number): TintTarget | null {
    for (const t of this.squares) {
      const r = t.rect;
      if (!r || !t.click || t.state === "burst" || t.state === "held" || t.state === "gone") continue;
      const x = r.x + t.off.x;
      const y = r.y + t.off.y;
      if (p.x >= x - pad && p.x <= x + r.width + pad && p.y >= y - pad && p.y <= y + r.height + pad) return t;
    }
    return null;
  }

  /** Pick up a headline square, like a meeple. A press without a drag is a click. */
  private grabSquare(t: TintTarget, e: PointerEvent, p: Vec) {
    for (const m of this.meeples) if (m.lasso?.square === t) this.cancelLasso(m);
    t.state = "held";
    t.v.x = t.v.y = 0;
    const r = t.rect!;
    this.squareDrag = {
      t,
      pointerId: e.pointerId,
      offX: p.x - (r.x + t.off.x),
      offY: p.y - (r.y + t.off.y),
      t0: e.timeStamp,
      start: p,
      moved: 0,
      samples: [{ t: e.timeStamp, ...p }],
    };
    this.root.style.cursor = "grabbing";
  }

  private releaseSquare(sd: SquareDrag, now: number, allowClick: boolean) {
    const { t } = sd;
    this.squareDrag = null;
    this.root.style.cursor = "";
    t.state = "loose";
    t.looseFor = 0;
    t.restFor = 0;
    if (allowClick && sd.moved < 6 && now - sd.t0 < 400) {
      // Back in place if it was home, then do its trick.
      if (Math.hypot(t.off.x, t.off.y) < 0.5) t.state = "home";
      this.clickSquare(t);
      return;
    }
    // Thrown, with the pointer's speed over the last ~100ms.
    const first = sd.samples[0];
    const last = sd.samples[sd.samples.length - 1];
    const span = (last.t - first.t) / 1000;
    t.v.x = t.v.y = 0;
    if (span > 0.008 && now - last.t < 80) {
      t.v.x = (last.x - first.x) / span;
      t.v.y = (last.y - first.y) / span;
      const sp = Math.hypot(t.v.x, t.v.y);
      if (sp > MAX_THROW) {
        t.v.x = (t.v.x / sp) * MAX_THROW;
        t.v.y = (t.v.y / sp) * MAX_THROW;
      }
    }
  }

  private clickSquare(t: TintTarget) {
    if (t.click === "burst") {
      // Let go of it first if it's on the Curious One's rope.
      for (const m of this.meeples) if (m.lasso?.square === t) this.cancelLasso(m);
      t.state = "burst";
      t.clickT = 0;
      t.v.x = t.v.y = 0;
      return;
    }
    if (t.bloomT >= 0) return;
    t.bloomT = 0;
    t.state = "gone";
    t.v.x = t.v.y = 0;
    this.scatterFlowers(t);
    // The thud travels outward, so nearby meeples hop first.
    const c = squareCenter(t);
    for (const m of this.meeples) {
      if (m.mode !== "idle" && m.mode !== "walk") continue;
      const mc = center(m);
      m.hop = -Math.hypot(mc.x - c.x, mc.y - c.y) / SHOCKWAVE_SPEED;
      this.wake(m);
    }
  }

  /** A thrown square that flies into a meeple knocks it along, and wakes it. */
  private squareHits(t: TintTarget) {
    const r = t.rect!;
    const sx = r.x + t.off.x;
    const sy = r.y + t.off.y;
    for (const m of this.meeples) {
      if (m.mode !== "idle" && m.mode !== "walk") continue;
      if (sx > m.x + W || sx + r.width < m.x || sy > m.y + H || sy + r.height < m.y) continue;
      m.vx += t.v.x * 0.7;
      m.vy += t.v.y * 0.7;
      t.v.x *= -0.3;
      t.v.y *= -0.3;
      this.wake(m);
      return;
    }
  }

  /**
   * The period's bloom sets off little flowers all over the page, popping up
   * in a wave outward from it. They're on the same half-pixel grid as the
   * garden, keep off the headline and links, and wilt sooner.
   */
  private scatterFlowers(t: TintTarget) {
    const c = squareCenter(t);
    const n = clamp(Math.round((this.vw * this.vh) / 45000), 6, 20);
    const made: Vec[] = [];
    for (let tries = 0; made.length < n && tries < n * 30; tries++) {
      const x = Math.round(rand(MARGIN, this.vw - MARGIN - 3 * F) / F) * F;
      const y = Math.round(rand(64 + FLOWER_BLOOM.length * F, this.vh - MARGIN) / F) * F;
      const r = new DOMRect(x, y - FLOWER_BLOOM.length * F, 3 * F, FLOWER_BLOOM.length * F);
      if (this.noPlant.some((z) => overlaps(z, r))) continue;
      const near = (f: Vec) => Math.abs(f.x - x) < 6 * F && Math.abs(f.y - y) < 9 * F;
      if (made.some(near) || this.flowers.some((f) => f.fade < 0 && near(f))) continue;
      made.push({ x, y });
      this.flowers.push({
        x,
        y,
        age: -(FLATTEN_TIME + 0.3 + Math.hypot(x - c.x, y - c.y) / SHOCKWAVE_SPEED + rand(0, 0.3)),
        petal: PETALS[Math.floor(Math.random() * PETALS.length)],
        fade: -1,
        trampled: false,
        life: rand(...WILD_LIFE),
        kind: "flower",
      });
    }
  }

  /**
   * The gold flower that pops up where RYKER's period was. It grows through
   * the same seed, sprout and bloom stages as the garden's flowers, at twice
   * their pixel size (half the period), with a highlight on the petals and
   * pixel sparkles twinkling around it.
   */
  private drawGold(t: TintTarget) {
    const r = t.rect;
    if (!r || t.bloomT < 0) return;
    const age = t.bloomT - FLATTEN_TIME;
    if (age < 0 || age > GOLD_LIFE - FLATTEN_TIME + GOLD_FADE) return;
    const { ctx } = this;
    const fading = age - (GOLD_LIFE - FLATTEN_TIME);
    ctx.globalAlpha = fading > 0 ? Math.max(0, 1 - fading / GOLD_FADE) : 1;
    const g = r.width / 2;
    // Its left edge lines up with the period's, so it stays clear of R's leg.
    const cx = r.x + t.off.x + 2.5 * g;
    const base = r.y + t.off.y + r.height;
    const rows = age < 0.35 ? FLOWER_SEED : age < 1 ? FLOWER_SPROUT : GOLD_BLOOM;
    const left = cx - (rows[0].length * g) / 2;
    const top = base - rows.length * g;
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        const color = GOLD_COLORS[ch];
        if (color) this.rect(left + rx * g, top + ry * g, g, g, color);
      }),
    );
    if (rows === GOLD_BLOOM) {
      // Sparkles around the head, each twinkling on its own beat.
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

  /** HEY's square: shake, burst into pieces, then drift home and reassemble. */
  private updateBurst(t: TintTarget, dt: number) {
    const r = t.rect!;
    const size = r.width / SQUARE_SPLIT;
    t.clickT += dt;
    if (t.clickT < SQUARE_SHAKE) return;

    if (!t.blocks.length) {
      t.blockColor = getComputedStyle(t.el).backgroundColor;
      t.el.style.visibility = "hidden";
      const c = squareCenter(t);
      for (let i = 0; i < SQUARE_SPLIT * SQUARE_SPLIT; i++) {
        const x = r.x + t.off.x + (i % SQUARE_SPLIT) * size;
        const y = r.y + t.off.y + Math.floor(i / SQUARE_SPLIT) * size;
        const a = Math.atan2(y + size / 2 - c.y, x + size / 2 - c.x) + rand(-0.6, 0.6);
        const s = rand(220, 520);
        t.blocks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, delay: 0 });
      }
      // It reassembles in its socket, wherever it was knocked to.
      t.off.x = t.off.y = 0;
      return;
    }

    this.moveBlocks(t.blocks, size, dt);
    const since = t.clickT - SQUARE_SHAKE - SCATTER_TIME;
    if (since < 0) return;
    if (t.blocks[0].delay === 0) {
      const order = t.blocks.map((_, i) => i).sort(() => Math.random() - 0.5);
      order.forEach((bi, n) => (t.blocks[bi].delay = 0.001 + n * 0.05));
    }
    const pull = 1 - Math.exp(-2.6 * dt);
    const damp = Math.exp(-8 * dt);
    let done = true;
    t.blocks.forEach((b, i) => {
      const tx = r.x + (i % SQUARE_SPLIT) * size;
      const ty = r.y + Math.floor(i / SQUARE_SPLIT) * size;
      if (since >= b.delay) {
        b.vx *= damp;
        b.vy *= damp;
        b.x += (tx - b.x) * pull;
        b.y += (ty - b.y) * pull;
      }
      if (Math.abs(tx - b.x) > 0.5 || Math.abs(ty - b.y) > 0.5) done = false;
    });
    if (done) {
      t.blocks = [];
      t.state = "home";
      t.clickT = -1;
      t.el.style.visibility = "";
    }
  }

  /**
   * A fast meeple (a charge, a throw, a drag) knocks a square out of its
   * socket. Slow walkers just tint it, as before. Once a square is loose,
   * anyone walking into it kicks it along.
   */
  private shoveSquares() {
    for (const t of this.squares) {
      const r = t.rect;
      if (!r || t.state === "towed" || t.state === "gliding" || t.state === "burst" || t.state === "held" || t.state === "gone") continue;
      for (const m of this.meeples) {
        if (m.mode !== "idle" && m.mode !== "walk" && m.mode !== "drag") continue;
        const vx = m.wx + m.vx;
        const vy = m.wy + m.vy;
        const speed = Math.hypot(vx, vy);
        if (m.mode !== "drag" && speed < (t.state === "home" ? PUSH_SPEED : 20)) continue;

        const sx = r.x + t.off.x;
        const sy = r.y + t.off.y;
        const ox = Math.min(m.x + W - 3, sx + r.width) - Math.max(m.x + 3, sx);
        const oy = Math.min(m.y + H - 3, sy + r.height) - Math.max(m.y + 3, sy);
        if (ox <= 0 || oy <= 0) continue;

        // Push it out along the axis of least overlap, at the meeple's speed or a bit more.
        const sc = squareCenter(t);
        const mc = center(m);
        if (ox < oy) {
          const n = Math.sign(sc.x - mc.x) || 1;
          t.off.x += n * ox;
          t.v.x = n * Math.max(vx * n * 1.4, 160);
          t.v.y = vy * 0.6;
        } else {
          const n = Math.sign(sc.y - mc.y) || 1;
          t.off.y += n * oy;
          t.v.y = n * Math.max(vy * n * 1.4, 160);
          t.v.x = vx * 0.6;
        }
        if (t.state === "home") t.looseFor = 0;
        t.state = "loose";
        t.restFor = 0;
      }
    }
  }

  // ----------------------------------------------------------------- lasso

  /** The tip of the right arm, where the rope is held. */
  private hand(m: Meeple): Vec {
    return { x: Math.round(m.x) + 2.5 * P, y: Math.round(m.y) + 1.5 * P };
  }

  private startLasso(m: Meeple, square: TintTarget | null) {
    const loop = this.hand(m);
    m.lasso = { phase: "twirl", t: 0, square, loop, rope: ROPE, pull: 0, tugging: false, last: loop };
    m.planting = -1;
    m.target = null;
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
    m.mode = "idle";
    m.idleFor = Math.max(m.idleFor, 0.4);
    const hand = this.hand(m);
    const sq = l.square;
    const goal = sq ? squareCenter(sq) : { x: this.cursor.x, y: this.cursor.y };
    const next = (phase: Lasso["phase"]) => {
      l.phase = phase;
      l.t = 0;
    };

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
          l.rope = Math.max(ROPE, Math.hypot(goal.x - hand.x, goal.y - hand.y));
          l.last = goal;
          next("hold");
        } else if (sq.state === "loose") {
          sq.state = "towed";
          l.rope = Math.max(ROPE, Math.hypot(goal.x - hand.x, goal.y - hand.y));
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
        let slip = !this.cursorActive || l.t > (l.pull > 0 ? LASSO_PULL : LASSO_HOLD);
        if (excess > ROPE_SNAP) slip = true;
        else if (excess > 0) {
          m.x = clamp(m.x + (dx / d) * excess, 0, this.vw - W);
          m.y = clamp(m.y + (dy / d) * excess, 0, this.vh - H);
          l.pull += dt;
          l.tugging = excess > 0.5;
          this.glance = null;
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
        if (!sq || sq.state !== "towed" || !sq.rect) {
          next("reel");
          break;
        }
        // Walk past the socket so the square, trailing on the rope, lands in it.
        const home = { x: sq.rect.x + sq.rect.width / 2, y: sq.rect.y + sq.rect.height / 2 };
        const dx = home.x - goal.x;
        const dy = home.y - goal.y;
        const d = Math.hypot(dx, dy);
        l.loop = goal;
        l.rope = Math.max(ROPE, l.rope - 160 * dt);
        if (d < 30 || l.t > 9) {
          sq.state = "gliding";
          next("reel");
          break;
        }
        m.mode = "walk";
        this.walkTo(m, home.x + (dx / d) * (ROPE + 24) - W / 2, home.y + (dy / d) * (ROPE + 24) - H / 2, 80, dt);
        break;
      }
      case "reel": {
        const k = 1 - Math.exp(-18 * dt);
        l.loop = { x: l.loop.x + (hand.x - l.loop.x) * k, y: l.loop.y + (hand.y - l.loop.y) * k };
        if (l.t > LASSO_REEL) {
          m.lasso = null;
          m.lassoCooldown = rand(8, 14);
          m.idleFor = rand(0.4, 1);
        }
        break;
      }
    }
  }

  // ---------------------------------------------------------------- garden

  /**
   * Every meeple, when left alone, now and then stops, digs, and plants a
   * flower, tuft of grass or carrot beside it. Returns true while digging.
   */
  private garden(m: Meeple, dt: number) {
    if (m.planting >= 0) {
      m.planting += dt;
      m.mode = "idle";
      m.idleFor = Math.max(m.idleFor, 0.4);
      if (m.planting >= PLANT_TIME) {
        this.plant(m);
        m.planting = -1;
        m.plantIn = rand(...PLANT_EVERY);
      }
      return true;
    }
    m.plantIn -= dt;
    if (m.plantIn <= 0 && m.mode === "idle") {
      if (this.plantSpot(m)) m.planting = 0;
      else m.plantIn = rand(2, 4);
    }
    return false;
  }

  /** Where a gardener would plant next, beside the foot it's facing, or null. */
  private plantSpot(m: Meeple): Vec | null {
    const side = m.look.x < 0 ? -1 : 1;
    const cx = m.x + W / 2 + side * (W / 2 + 2 * F);
    const x = Math.round((cx - 1.5 * F) / F) * F;
    const y = Math.round((m.y + H) / P) * P;
    const r = new DOMRect(x, y - FLOWER_BLOOM.length * F, 3 * F, FLOWER_BLOOM.length * F);
    if (r.left < MARGIN || r.right > this.vw - MARGIN || r.top < 64 || r.bottom > this.vh - MARGIN) return null;
    if (this.noPlant.some((n) => overlaps(n, r))) return null;
    if (this.flowers.some((f) => f.fade < 0 && Math.abs(f.x - x) < 4 * F && Math.abs(f.y - y) < 7 * F)) return null;
    return { x, y };
  }

  private plant(m: Meeple) {
    const spot = this.plantSpot(m);
    if (!spot) return;
    // The period's wild flowers don't count toward the garden's limit.
    const healthy = this.flowers.filter((f) => f.fade < 0 && f.life === FLOWER_LIFE);
    // Flowers come first, then grass; only the Shy One grows carrots.
    const cycle = m.cfg.id === "green" ? SHY_PLANTS : PLANTS;
    const kind = cycle[m.planted % cycle.length];
    m.planted++;
    if (healthy.length >= MAX_FLOWERS) healthy[0].fade = 0;
    this.flowers.push({
      ...spot,
      age: 0,
      petal: PETALS[Math.floor(Math.random() * PETALS.length)],
      fade: -1,
      trampled: false,
      life: FLOWER_LIFE,
      kind,
    });
  }

  private updateFlowers(dt: number) {
    for (const f of this.flowers) {
      f.age += dt;
      if (f.fade >= 0) {
        f.fade += dt;
        continue;
      }
      if (f.age > f.life) {
        f.fade = 0;
        continue;
      }
      if (f.age < 1.8) continue;
      // The Chaotic One tramples blooms; so does anything sliding through.
      const head = new DOMRect(f.x, f.y - FLOWER_BLOOM.length * F, 3 * F, 3 * F);
      for (const m of this.meeples) {
        if (m.mode !== "idle" && m.mode !== "walk" && m.mode !== "drag") continue;
        const fast = Math.hypot(m.wx + m.vx, m.wy + m.vy) > TUMBLE_SPEED;
        if (!(m.cfg.id === "red" && m.mode === "walk") && !fast) continue;
        if (overlaps(new DOMRect(m.x, m.y + 2 * P, W, 2 * P), head)) {
          f.trampled = true;
          f.fade = 0;
          break;
        }
      }
    }
    this.flowers = this.flowers.filter((f) => f.fade < (f.trampled ? TRAMPLED_TIME : WILT_TIME));
  }

  // ---------------------------------------------------------------- render

  private render() {
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawFlowers();
    for (const t of this.squares) {
      this.drawGold(t);
      const size = t.rect ? t.rect.width / SQUARE_SPLIT : 0;
      for (const b of t.blocks) this.rect(Math.round(b.x), Math.round(b.y), size, size, t.blockColor);
    }
    for (const m of this.meeples) {
      if (m.mode === "exploded" || m.mode === "reassemble") this.drawBlocks(m);
      else this.drawMeeple(m);
    }
    this.drawTags();
  }

  /** A small name tag over each meeple's head, in the pixel font. */
  private drawTags() {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = this.tagFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = ZZZ_COLOR;
    for (const m of this.meeples) {
      if (!m.tagWidth) m.tagWidth = ctx.measureText(m.cfg.tag).width;
      if (m.mode === "exploded" || m.mode === "reassemble" || m.lasso?.phase === "twirl") continue;
      // Clear of the nightcap on the Sleepy One.
      const lift = m.cfg.id === "blue" ? 13 : 6;
      ctx.fillText(m.cfg.tag, Math.round(m.x + W / 2), Math.round(m.y) - hopHeight(m) - lift);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Fill a rect with its edges snapped to whole device pixels, so the
   * meeples stay crisp at any zoom or pixel ratio.
   */
  private rect(x: number, y: number, w: number, h: number, color: string) {
    const d = this.dpr;
    const x0 = Math.round(x * d);
    const y0 = Math.round(y * d);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x0, y0, Math.round((x + w) * d) - x0, Math.round((y + h) * d) - y0);
  }

  private drawMeeple(m: Meeple) {
    let ox = Math.round(m.x);
    let oy = Math.round(m.y) - hopHeight(m);
    if (m.mode === "shake") {
      ox += Math.round(rand(-2, 2));
      oy += Math.round(rand(-2, 2));
    }
    if (m.planting >= 0) {
      // Digging: a quick bob, with dirt flicking up from its feet.
      oy -= Math.round(Math.abs(Math.sin(m.planting * 12)) * 3);
      const side = m.look.x < 0 ? -1 : 1;
      const k = (m.planting * 3) % 1;
      this.rect(ox + W / 2 + side * (W / 2 + 2 + k * 8), oy + H - 4 - k * 10, 2, 2, DIRT);
      this.rect(ox + W / 2 + side * (W / 2 + 6 + k * 4), oy + H - 2 - k * 6, 2, 2, DIRT);
    }
    const walking = m.mode === "walk" && Math.hypot(m.wx, m.wy) > 1;
    MEEPLE_BLOCKS.forEach((b, i) => {
      // Blocks 5 and 6 are the legs. Lift one at a time while walking.
      const lift = walking && ((i === 5 && m.stepFrame === 0) || (i === 6 && m.stepFrame === 1)) ? -2 : 0;
      this.rect(ox + b.x * P, oy + b.y * P + lift, P, P, m.cfg.hex);
    });
    if (m.cfg.id === "blue") for (const c of NIGHTCAP) this.rect(ox + P + c.x, oy + c.y, c.w, c.h, c.c);
    this.drawEyes(m, ox + P, oy);
    if (m.asleep) this.drawZzz(m, ox, oy);
    if (m.lasso) this.drawLasso(m, ox, oy);
    if (m.lasso?.tugging) {
      // Heels dug in: dust kicks up behind its feet, away from the pull.
      const l = m.lasso;
      const back = Math.sign(this.hand(m).x - l.loop.x) || 1;
      const k = (this.time * 4) % 1;
      this.rect(ox + W / 2 + back * (W / 2 + 2 + k * 9), oy + H - 3 - k * 9, 2, 2, DIRT);
      this.rect(ox + W / 2 + back * (W / 2 + 5 + ((k + 0.5) % 1) * 6), oy + H - 2 - ((k + 0.5) % 1) * 6, 2, 2, DIRT);
    }
  }

  private drawLasso(m: Meeple, ox: number, oy: number) {
    const l = m.lasso!;
    const hand = { x: ox + 2.5 * P, y: oy + 1.5 * P };
    if (l.phase === "twirl") {
      // Spinning overhead.
      const c = { x: ox + W / 2 + 6, y: oy - 14 };
      const a = this.time * 14;
      this.ring(c.x, c.y, 15, 5);
      this.line(hand.x, hand.y, c.x + Math.cos(a) * 15, c.y + Math.sin(a) * 5);
      return;
    }
    const sq = l.square?.rect;
    const r = sq && l.phase !== "throw" ? Math.max(7, sq.width / 2 + 3) : 7;
    this.line(hand.x, hand.y, l.loop.x, l.loop.y);
    this.ring(l.loop.x, l.loop.y, r, r);
  }

  /** A 2px pixel line. */
  private line(x0: number, y0: number, x1: number, y1: number) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= n; i++) {
      this.rect(Math.round(x0 + ((x1 - x0) * i) / n) - 1, Math.round(y0 + ((y1 - y0) * i) / n) - 1, 2, 2, ROPE_COLOR);
    }
  }

  /** A 2px pixel ellipse. */
  private ring(cx: number, cy: number, rx: number, ry: number) {
    // Enough points that the ring reads as one unbroken 2px line.
    const n = Math.max(16, Math.round(Math.PI * (rx + ry)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.rect(Math.round(cx + Math.cos(a) * rx) - 1, Math.round(cy + Math.sin(a) * ry) - 1, 2, 2, ROPE_COLOR);
    }
  }

  private drawFlowers() {
    const { ctx } = this;
    for (const f of this.flowers) {
      if (f.age < 0) continue;
      const limit = f.trampled ? TRAMPLED_TIME : WILT_TIME;
      ctx.globalAlpha = f.fade < 0 ? 1 : Math.max(0, 1 - f.fade / limit);
      const { grown, flat } = SHAPES[f.kind];
      const rows = f.trampled ? flat : f.age < 0.5 ? FLOWER_SEED : f.age < 1.8 ? FLOWER_SPROUT : grown;
      const left = f.x - ((rows[0].length - 3) / 2) * F;
      const top = f.y - rows.length * F;
      const middle = f.petal === "#FBEC5A" ? "#E05A32" : "#FBEC5A";
      rows.forEach((row, ry) =>
        [...row].forEach((ch, rx) => {
          const color =
            ch === "S" || ch === "L"
              ? STEM
              : ch === "P"
                ? f.petal
                : ch === "C"
                  ? middle
                  : ch === "O"
                    ? CARROT
                    : ch === "D"
                      ? DIRT
                      : null;
          if (color) this.rect(left + rx * F, top + ry * F, F, F, color);
        }),
      );
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

  /** Two eye slits on the head block whose top-left is (hx, hy). */
  private drawEyes(m: Meeple, hx: number, hy: number) {
    const white = "#FFFFFF";
    if (m.asleep || m.blinkFor > 0) {
      this.rect(hx + 3, hy + 5, 2, 1, white);
      this.rect(hx + 6, hy + 5, 2, 1, white);
      return;
    }
    const ex = clamp(Math.round(m.look.x * 2), -2, 2);
    const ey = clamp(Math.round(m.look.y * 2), -1, 2);
    this.rect(hx + 3 + ex, hy + 2 + ey, 2, 4, white);
    this.rect(hx + 6 + ex, hy + 2 + ey, 2, 4, white);
  }

  /** Two small pixel z's drifting up from a napping meeple. */
  private drawZzz(m: Meeple, ox: number, oy: number) {
    const { ctx } = this;
    for (let k = 0; k < 2; k++) {
      const p = (this.time / 2.4 + k / 2) % 1;
      ctx.globalAlpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      // Start past the right end of the name tag.
      const zx = Math.round(Math.max(ox + W - 2, ox + W / 2 + m.tagWidth / 2 + 3) + p * 10);
      const zy = Math.round(oy - 8 - p * 22);
      Z_GLYPH.forEach((row, ry) =>
        [...row].forEach((ch, rx) => {
          if (ch === "X") this.rect(zx + rx * 2, zy + ry * 2, 2, 2, ZZZ_COLOR);
        }),
      );
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ tinting

  /**
   * The blue headline elements take on the color of a meeple standing on
   * them, then fade back to the accent (CLAUDE.md §4). Simple box overlap.
   */
  private updateTints() {
    for (const t of this.tints) {
      if (!t.rect || t.state === "burst" || t.state === "gone") continue;
      let best: Meeple | null = null;
      let bestArea = 0;
      for (const m of this.meeples) {
        if (m.mode === "exploded" || m.mode === "reassemble") continue;
        const left = t.rect.left + t.off.x;
        const top = t.rect.top + t.off.y;
        const ox = Math.min(m.x + W, left + t.rect.width) - Math.max(m.x, left);
        const oy = Math.min(m.y + H, top + t.rect.height) - Math.max(m.y, top);
        if (ox > 0 && oy > 0 && ox * oy > bestArea) {
          best = m;
          bestArea = ox * oy;
        }
      }

      let color: string | null = null;
      if (best) {
        color = best.cfg.hex;
        // Hold briefly so a meeple flying across still leaves a flicker.
        t.holdUntil = this.time + 0.15;
      } else if (this.time < t.holdUntil) {
        color = t.color;
      }

      if (color === t.color) continue;
      t.color = color;
      // Snap on quickly, fade back slowly.
      t.el.style.transitionDuration = color ? "120ms" : "";
      t.el.style[t.prop] = color ?? "";
    }
  }
}

function center(m: Meeple): Vec {
  return { x: m.x + W / 2, y: m.y + H / 2 };
}

function squareCenter(t: TintTarget): Vec {
  const r = t.rect!;
  return { x: r.x + t.off.x + r.width / 2, y: r.y + t.off.y + r.height / 2 };
}

/** How far a meeple is off the ground, in whole px: two hops, the second smaller. */
function hopHeight(m: Meeple) {
  if (m.hop === null || m.hop < 0) return 0;
  const k = m.hop < HOP_TIME ? 1 : 0.55;
  return Math.round(Math.sin((Math.PI * (m.hop % HOP_TIME)) / HOP_TIME) * HOP_HEIGHT * k);
}

/** RYKER's period's height as it springs back up from flat, overshooting a little. */
function springBack(u: number) {
  return 1 - Math.exp(-7 * u) * Math.cos(14 * u);
}

function overlaps(a: DOMRect, b: DOMRect) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** Dragged meeples can't be pushed; the napping one is hard to shift. */
function invMass(m: Meeple) {
  if (m.mode === "drag") return 0;
  if (m.asleep) return 0.3;
  return 1;
}

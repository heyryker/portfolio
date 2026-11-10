import { HATS, hatHeight } from "./meeple-hats";
import { MEEPLES, MEEPLE_BLOCKS, type MeepleConfig } from "./meeples";

/*
 * "Release the meeples" (components/MeepleRelease.tsx). One press of the
 * button in the bottom-left corner and:
 *
 * 1. Burst: every block of all five meeples, plus a handful of loose confetti,
 *    is flung out of the button across the screen.
 * 2. Gather: the blocks fly together into the five meeples, and their hats
 *    drop on.
 * 3. Mischief, all at once: the Chaotic One shoves the project cards, the
 *    Curious One lassos the name, the Resume pill and the cards and tugs on
 *    them, the Shy One plants flowers as fast as it can, the Watcher sings,
 *    and the Sleepy One naps on top of a card. Partway through, they all stop
 *    for a song together.
 * 4. Home: a pixel cop car drives in, picks them up one by one and pulls
 *    into the button, and the flowers wilt.
 *
 * Everything is drawn on one canvas over the page that ignores the pointer,
 * so the page underneath stays clickable the whole time. The cards and links
 * they shove or tug only move by Web Animations added on top of their own
 * transforms (the card pile sets those), so nothing is left out of place.
 * A second press sends them home early. With reduced motion they only stand
 * in a row beside the button for a moment.
 */

type Vec = { x: number; y: number };

type Block = { x: number; y: number; vx: number; vy: number; sx: number; sy: number };

type Confetti = { x: number; y: number; vx: number; vy: number; size: number; color: string };

type Speck = { x: number; y: number; vx: number; vy: number; t: number; life: number; size: number; color: string };

/** A flower, in page coordinates so it scrolls with the page. */
type Flower = { x: number; y: number; age: number; petal: string; wilt: number };

type Note = { x: number; y: number; age: number; color: string; glyph: string[]; sway: number };

type Bubble = { text: string; t: number; life: number };

type Lasso = {
  el: HTMLElement;
  phase: "walk" | "twirl" | "throw" | "tug";
  t: number;
  /** Where the loop is, in viewport coordinates. */
  loop: Vec;
};

/** The cop car that rounds them up, by its bottom center. */
type Car = { x: number; y: number; vx: number; vy: number; face: 1 | -1; t: number; target: Meeple | null; parked: boolean };

type Meeple = {
  cfg: MeepleConfig;
  /** Top-left of the body, in viewport coordinates. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  look: Vec;
  stepT: number;
  step: 0 | 1;
  hop: number;
  blocks: Block[];
  /** Back inside the button. */
  home: boolean;
  bubble: Bubble | null;
  noteT: number;
  // Each meeple's own trick.
  target: Vec | null;
  wait: number;
  card: { el: HTMLElement; side: -1 | 1; hits: number; cool: number } | null;
  lasso: Lasso | null;
  plantT: number;
  nap: { el: HTMLElement; dx: number; t: number } | null;
};

const BURST = 1.0;
const GATHER = 2.15;
const CHORUS_START = 8.6;
const CHORUS_END = 10.4;
const RUN_END = 14;
/** In case one gets stuck on the way home. */
const HOME_LIMIT = 14;

const GRAVITY = 1100;
const CONFETTI = 110;
const MAX_FLOWERS = 90;
const NOTE_LIFE = 1.6;

const INK = "#221F20";
const WHITE = "#FFFFFF";
const LEAF = "#5FCC8A";
const DIRT = "#D5BC92";
const COLORS = MEEPLES.map((m) => m.hex);
const PETALS = ["#985DF6", "#E05A32", "#58B9F8", "#FBEC5A"];

// Drawn in small pixels, as in the village.
const NOTE_GLYPHS = [
  ["..XX.", "..X.X", "..X..", "..X..", "XXX..", "XXX.."],
  ["..XXXXX", "..X...X", "..X...X", "XXX.XXX", "XXX.XXX"],
];
const Z_GLYPH = ["XXXX", "..X.", ".X..", "XXXX"];
const SEED = ["DDD"];
const SPROUT = ["L.L", ".S.", ".S."];
const BLOOM = [".P.", "PCP", ".P.", ".S.", "LS.", ".S."];

// The cop car, facing right, in pixels a bit smaller than a meeple's. R/B the light bar, K
// black, W white, G window glass, Y headlight, L tail light, T tyre, S hub.
const CAR = [
  "........RB........",
  ".....KKKKKKKK.....",
  "....KGGGKGGGGK....",
  "...KGGGGKGGGGGK...",
  ".KKKKKKKKKKKKKKKKK",
  "LWWWWWWWWWWWWWWWWY",
  "KWWWWWWWWWWWWWWWWK",
  "KKKTTTKKKKKKTTTKKK",
  "...TST......TST...",
];
const CAR_COLORS: Record<string, string> = {
  K: "#221F20",
  W: "#FFFFFF",
  G: "#BFE3FB",
  Y: "#FBEC5A",
  L: "#E05A32",
  T: "#221F20",
  S: "#A1A3A6",
};

const SONGS = ["LA LA LAAA", "OOH OOH", "FA LA LA", "MI MI MI"];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export type ReleaseOptions = {
  /** The button, so they burst out of it and come back to it. */
  button: HTMLElement;
  /** A meeple made it back in. */
  onHome?: () => void;
  /** All five are back and the canvas is gone. */
  onDone?: () => void;
};

export class MeepleRelease {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private vw = 0;
  private vh = 0;
  /** One meeple pixel, in px. */
  private P = 10;
  private time = 0;
  private last = 0;
  private frame = 0;
  private returning = -1;
  private car: Car | null = null;
  private captured = false;
  private assembled = false;
  private done = false;
  private reduced: boolean;
  private meeples: Meeple[] = [];
  private confetti: Confetti[] = [];
  private specks: Speck[] = [];
  private flowers: Flower[] = [];
  private notes: Note[] = [];
  private animations: Animation[] = [];

  constructor(private opts: ReleaseOptions) {
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "meeple-release-canvas";
    document.body.append(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.visibility);
  }

  private get W() {
    return 3 * this.P;
  }

  private get H() {
    return 4 * this.P;
  }

  private origin(): Vec {
    const r = this.opts.button.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  start() {
    const o = this.origin();
    const { W, H, P } = this;
    // Spread them across the screen, one to each fifth, in a random order.
    const slots = [0.14, 0.32, 0.5, 0.68, 0.86].sort(() => Math.random() - 0.5);
    this.meeples = MEEPLES.map((cfg, i) => {
      const x = clamp(slots[i] * this.vw - W / 2 + rand(-20, 20), 8, this.vw - W - 8);
      const y = clamp(rand(0.25, 0.7) * this.vh, 60, this.vh - H - 80);
      return {
        cfg,
        x,
        y,
        vx: 0,
        vy: 0,
        look: { x: 0, y: 0 },
        stepT: 0,
        step: 0,
        hop: -1,
        blocks: MEEPLE_BLOCKS.map(() => {
          // Up and to the right, out of the bottom-left corner.
          const a = rand(-Math.PI * 0.48, -Math.PI * 0.02);
          const s = rand(700, 1500) * Math.min(1.2, Math.hypot(this.vw, this.vh) / 1500);
          return { x: o.x - P / 2, y: o.y - P / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, sx: 0, sy: 0 };
        }),
        home: false,
        bubble: null,
        noteT: 0,
        target: null,
        wait: 0,
        card: null,
        lasso: null,
        plantT: 0,
        nap: null,
      };
    });

    if (this.reduced) {
      // No burst and no running: they stand in a row beside the button.
      const r = this.opts.button.getBoundingClientRect();
      this.meeples.forEach((m, i) => {
        m.x = r.right + 16 + i * (W + 12);
        m.y = r.bottom - H;
      });
      this.meeples[0].bubble = { text: "WE'D RUN, BUT YOU ASKED FOR CALM", t: 0, life: 4 };
      this.draw();
      window.setTimeout(() => this.finish(), 4000);
      return;
    }

    for (let i = 0; i < CONFETTI; i++) {
      const a = rand(-Math.PI * 0.5, 0);
      const s = rand(500, 1600) * Math.min(1.2, Math.hypot(this.vw, this.vh) / 1500);
      this.confetti.push({
        x: o.x,
        y: o.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        size: Math.round(rand(0.35, 0.8) * P),
        color: pick(COLORS),
      });
    }
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  /** Back in the button, now. */
  recall() {
    if (this.reduced) return this.finish();
    if (this.returning < 0) this.goHome();
  }

  destroy() {
    this.done = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.visibility);
    for (const a of this.animations) a.cancel();
    this.animations = [];
    this.canvas.remove();
  }

  private finish() {
    if (this.done) return;
    this.destroy();
    this.opts.onDone?.();
  }

  private resize = () => {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.vw = document.documentElement.clientWidth;
    this.vh = window.innerHeight;
    this.P = this.vw < 640 ? 8 : 10;
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
    this.canvas.style.width = `${this.vw}px`;
    this.canvas.style.height = `${this.vh}px`;
    if (this.reduced && this.meeples.length) this.draw();
  };

  /** Hold still while the tab is hidden. */
  private visibility = () => {
    if (this.done || this.reduced) return;
    if (document.hidden) {
      cancelAnimationFrame(this.frame);
    } else {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
  };

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    if (this.done) return;
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  // ------------------------------------------------------------------ update

  private update(dt: number) {
    const t = this.time;
    if (t < BURST) this.burst(dt);
    else if (t < GATHER) this.gather();
    else {
      if (!this.assembled) this.assemble();
      if (this.returning < 0 && t >= RUN_END) this.goHome();
      for (const m of this.meeples) if (!m.home) this.think(m, dt);
      if (this.returning < 0) this.collide();
      if (this.car) this.drive(this.car, dt);
    }
    this.updateConfetti(dt);
    this.updateBits(dt);
    if (this.returning >= 0) {
      if (!this.car && this.meeples.every((m) => m.home) && !this.specks.length && !this.flowers.length) this.finish();
      else if (t - this.returning > HOME_LIMIT) this.finish();
    }
  }

  private burst(dt: number) {
    for (const m of this.meeples) {
      for (const b of m.blocks) this.fly(b, dt, this.P);
    }
  }

  /** The blocks fly together into meeples, each on a little arc. */
  private gather() {
    if (!this.captured) {
      this.captured = true;
      for (const m of this.meeples) for (const b of m.blocks) Object.assign(b, { sx: b.x, sy: b.y });
    }
    const u = ease(clamp((this.time - BURST) / (GATHER - BURST - 0.15), 0, 1));
    for (const m of this.meeples) {
      m.blocks.forEach((b, i) => {
        const tx = m.x + MEEPLE_BLOCKS[i].x * this.P;
        const ty = m.y + MEEPLE_BLOCKS[i].y * this.P;
        b.x = b.sx + (tx - b.sx) * u;
        b.y = b.sy + (ty - b.sy) * u - Math.sin(Math.PI * u) * 60;
      });
    }
  }

  /** Together at last: a pop and a hop. */
  private assemble() {
    this.assembled = true;
    for (const m of this.meeples) {
      m.hop = 0;
      this.puff(m.x + this.W / 2, m.y + this.H / 2, m.cfg.hex, 10);
    }
  }

  /** A block or a piece of confetti under gravity, bouncing off the screen's edges. */
  private fly(b: { x: number; y: number; vx: number; vy: number }, dt: number, size: number) {
    b.vy += GRAVITY * dt;
    b.vx *= 1 - dt * 0.6;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < 0) Object.assign(b, { x: 0, vx: Math.abs(b.vx) * 0.6 });
    if (b.x > this.vw - size) Object.assign(b, { x: this.vw - size, vx: -Math.abs(b.vx) * 0.6 });
    if (b.y < 0) Object.assign(b, { y: 0, vy: Math.abs(b.vy) * 0.5 });
    if (b.y > this.vh - size) {
      b.y = this.vh - size;
      b.vy = -Math.abs(b.vy) * 0.45;
      b.vx *= 0.8;
    }
  }

  private updateConfetti(dt: number) {
    if (!this.confetti.length) return;
    for (const c of this.confetti) {
      this.fly(c, dt, c.size);
      // A little flutter.
      c.vx += Math.sin(this.time * 9 + c.size) * 40 * dt;
    }
    if (this.time > GATHER + 0.6) this.confetti = [];
  }

  private updateBits(dt: number) {
    for (const s of this.specks) {
      s.t += dt;
      s.vy += 600 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    this.specks = this.specks.filter((s) => s.t < s.life);
    for (const n of this.notes) {
      n.age += dt;
      n.y -= 42 * dt;
    }
    this.notes = this.notes.filter((n) => n.age < NOTE_LIFE);
    for (const f of this.flowers) {
      f.age += dt;
      if (f.wilt !== -1) f.wilt += dt;
    }
    this.flowers = this.flowers.filter((f) => f.wilt < 0.9);
    for (const m of this.meeples) {
      if (m.bubble && (m.bubble.t += dt) > m.bubble.life) m.bubble = null;
      if (m.hop >= 0 && (m.hop += dt) > 0.35) m.hop = -1;
    }
  }

  private goHome() {
    this.returning = this.time;
    for (const m of this.meeples) {
      this.release(m);
      m.nap = null;
      m.card = null;
      if (this.time < GATHER) {
        // Pressed again mid-burst: put them together where they are.
        m.blocks.forEach((b, i) => ((b.x = m.x + MEEPLE_BLOCKS[i].x * this.P), (b.y = m.y + MEEPLE_BLOCKS[i].y * this.P)));
      }
    }
    this.time = Math.max(this.time, GATHER);
    this.captured = this.assembled = true;
    this.confetti = [];
    // Wilting one after another (a negative wilt is a delay; -1 is in bloom).
    this.flowers.forEach((f, i) => (f.wilt = -Math.min(0.8, i * 0.01) - 0.001));
    this.meeples[Math.floor(Math.random() * 5)].bubble = { text: "UH OH", t: 0, life: 1.4 };
    // In from the left, along the bottom, lights going.
    this.car = { x: -80, y: this.vh - 24, vx: 0, vy: 0, face: 1, t: 0, target: null, parked: false };
  }

  /**
   * The cop car: it drives to whichever meeple is nearest, scoops it up, and
   * when it has all five it pulls into the button.
   */
  private drive(car: Car, dt: number) {
    car.t += dt;
    const left = this.meeples.filter((m) => !m.home);
    if (car.target?.home || (car.target && !left.includes(car.target))) car.target = null;
    if (!car.target && left.length) {
      car.target = left.reduce((a, b) =>
        Math.hypot(a.x + this.W / 2 - car.x, a.y + this.H - car.y) < Math.hypot(b.x + this.W / 2 - car.x, b.y + this.H - car.y) ? a : b,
      );
    }
    const o = this.origin();
    const goal = car.target ? { x: car.target.x + this.W / 2, y: car.target.y + this.H } : { x: o.x, y: o.y + 26 };
    const dx = goal.x - car.x;
    const dy = goal.y - car.y;
    const d = Math.hypot(dx, dy);
    const speed = 640 * Math.min(1, d / 90 + 0.25);
    const k = Math.min(1, dt * 5);
    car.vx += ((d ? (dx / d) * speed : 0) - car.vx) * k;
    car.vy += ((d ? (dy / d) * speed : 0) - car.vy) * k;
    car.x += car.vx * dt;
    car.y += car.vy * dt;
    if (Math.abs(car.vx) > 40) car.face = car.vx > 0 ? 1 : -1;
    if (Math.random() < dt * 0.4) this.speck(car.x - car.face * 40, car.y - 4, "#C9C9C9");

    if (car.target && d < 22) {
      const m = car.target;
      m.home = true;
      m.bubble = null;
      this.puff(m.x + this.W / 2, m.y + this.H / 2, m.cfg.hex, 8);
      car.target = null;
    } else if (!car.target && !left.length && d < 26) {
      // Into the button, five passengers and all.
      this.puff(o.x, o.y, "#E05A32", 6);
      this.puff(o.x, o.y, "#58B9F8", 6);
      for (let i = 0; i < 5; i++) window.setTimeout(() => this.opts.onHome?.(), i * 130);
      this.car = null;
    }
  }

  // ------------------------------------------------------------------- brain

  private think(m: Meeple, dt: number) {
    const t = this.time;
    m.noteT -= dt;

    if (this.returning >= 0) {
      // Busted: they stop where they are, watch the car and hop nervously.
      m.vx *= 0.85;
      m.vy *= 0.85;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      const car = this.car;
      if (car) m.look = { x: clamp((car.x - m.x - this.W / 2) / 120, -1, 1), y: clamp((car.y - m.y - this.H) / 160, -1, 1) };
      if (m.hop < 0 && Math.random() < dt * 1.5) m.hop = 0;
      return;
    }

    if (t >= CHORUS_START && t < CHORUS_END) {
      // Everyone stops for a song.
      this.release(m);
      m.vx *= 0.8;
      m.vy *= 0.8;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.hop < 0 && Math.random() < dt * 3) m.hop = 0;
      if (m.noteT <= 0) {
        this.note(m);
        m.noteT = rand(0.15, 0.3);
      }
      if (t - dt < CHORUS_START) m.bubble = { text: pick(SONGS), t: 0, life: 1.7 };
      m.look = { x: Math.sin(t * 3 + m.x) * 0.6, y: -0.5 };
      return;
    }

    switch (m.cfg.id) {
      case "red":
        return this.shove(m, dt);
      case "yellow":
        return this.lassoing(m, dt);
      case "green":
        return this.garden(m, dt, 0.22);
      case "purple":
        return this.sing(m, dt);
      case "blue":
        return this.napping(m, dt);
    }
  }

  /** Walk toward a point; returns how far is left. */
  private steer(m: Meeple, tx: number, ty: number, speed: number, dt: number) {
    const dx = tx - m.x;
    const dy = ty - m.y;
    const d = Math.hypot(dx, dy);
    const want = d > 3 ? speed * Math.min(1, d / 60) : 0;
    const k = Math.min(1, dt * 8);
    m.vx += ((d ? (dx / d) * want : 0) - m.vx) * k;
    m.vy += ((d ? (dy / d) * want : 0) - m.vy) * k;
    m.x = clamp(m.x + m.vx * dt, 0, this.vw - this.W);
    m.y = clamp(m.y + m.vy * dt, hatHeight(m.cfg.id) * (this.P / 11), this.vh - this.H);
    if (Math.hypot(m.vx, m.vy) > 30) {
      m.look = { x: clamp(m.vx / 200, -1, 1), y: clamp(m.vy / 300, -1, 1) };
      m.stepT += dt;
      if (m.stepT > 0.1) {
        m.stepT = 0;
        m.step = m.step ? 0 : 1;
      }
    }
    return d;
  }

  private wander(m: Meeple, dt: number, speed: number) {
    if (!m.target || Math.hypot(m.target.x - m.x, m.target.y - m.y) < 8) {
      m.target = { x: rand(10, this.vw - this.W - 10), y: rand(70, this.vh - this.H - 20) };
    }
    this.steer(m, m.target.x, m.target.y, speed, dt);
  }

  /** Cards on screen, for shoving, lassoing and napping on. */
  private cards() {
    return [...document.querySelectorAll<HTMLElement>(".project-card")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top > 60 && r.bottom < this.vh - 10 && !el.closest("[hidden], [inert]");
    });
  }

  /** The Chaotic One runs at a card from the side and shoves it, twice, then picks another. */
  private shove(m: Meeple, dt: number) {
    if (m.wait > 0) {
      m.wait -= dt;
      this.wander(m, dt, 380);
      return;
    }
    if (!m.card || !m.card.el.isConnected) {
      const el = pick(this.cards());
      if (!el) return this.wander(m, dt, 420);
      const r = el.getBoundingClientRect();
      // From whichever side it's nearer, unless that's off the screen.
      let side: -1 | 1 = m.x + this.W / 2 < r.left + r.width / 2 ? -1 : 1;
      if (side < 0 && r.left < this.W) side = 1;
      if (side > 0 && r.right > this.vw - this.W) side = -1;
      m.card = { el, side, hits: 0, cool: 0 };
    }
    const c = m.card;
    const r = c.el.getBoundingClientRect();
    const tx = c.side < 0 ? r.left - this.W + 6 : r.right - 6;
    const ty = r.top + r.height / 2 - this.H / 2;
    c.cool -= dt;
    // Back up a little after each shove, then charge again.
    const back = c.cool > 0 ? c.side * 36 : 0;
    const d = this.steer(m, tx + back, ty, 560, dt);
    if (d < 8 && c.cool <= 0) {
      const push = -c.side;
      this.nudge(c.el, push * 18, push * 1.6);
      this.puff(c.side < 0 ? r.left : r.right, ty + this.H / 2, m.cfg.hex, 5);
      m.vx = c.side * 260;
      if (c.hits === 0) m.bubble = { text: pick(["BONK", "OOF", "HUP", "HYAH"]), t: 0, life: 0.8 };
      c.hits++;
      c.cool = 0.4;
      if (c.hits >= 2) {
        m.card = null;
        m.wait = rand(0.4, 1.2);
      }
    }
  }

  /** The Curious One twirls its lasso, throws it round something and tugs. */
  private lassoing(m: Meeple, dt: number) {
    if (m.wait > 0) {
      m.wait -= dt;
      this.wander(m, dt, 300);
      return;
    }
    if (!m.lasso) {
      const things = [
        ...document.querySelectorAll<HTMLElement>(".landing .name-time-name, .landing .menu-pill"),
        ...this.cards(),
      ].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < this.vh;
      });
      const el = pick(things);
      if (!el) return this.wander(m, dt, 300);
      m.lasso = { el, phase: "walk", t: 0, loop: { x: 0, y: 0 } };
    }
    const l = m.lasso;
    const r = l.el.getBoundingClientRect();
    const hand = { x: m.x + this.W - this.P / 2, y: m.y + this.P * 1.5 };
    const anchor = { x: clamp(hand.x, r.left + 8, r.right - 8), y: clamp(hand.y, r.top + 6, r.bottom - 6) };
    l.t += dt;
    if (l.phase === "walk") {
      // Somewhere a rope's length off, below or beside it.
      const below = r.bottom + 70 < this.vh - this.H;
      const tx = below ? clamp(r.left + r.width / 2 + rand(-1, 1), 0, this.vw - this.W) : r.left > this.vw / 2 ? r.left - 140 : r.right + 100;
      const ty = below ? r.bottom + 60 : r.top + r.height / 2;
      if (!m.target) m.target = { x: clamp(tx, 0, this.vw - this.W), y: clamp(ty, 60, this.vh - this.H) };
      if (this.steer(m, m.target.x, m.target.y, 340, dt) < 10 || l.t > 2.5) {
        m.target = null;
        l.phase = "twirl";
        l.t = 0;
      }
    } else if (l.phase === "twirl") {
      this.steer(m, m.x, m.y, 0, dt);
      m.look = { x: Math.sign(anchor.x - hand.x) * 0.8, y: -0.6 };
      if (l.t > 0.9) {
        l.phase = "throw";
        l.t = 0;
        m.bubble = { text: "YEEHAW", t: 0, life: 1 };
      }
    } else if (l.phase === "throw") {
      const u = Math.min(1, l.t / 0.25);
      const top = { x: m.x + this.W / 2 + 6, y: m.y - 10 - hatHeight("yellow") * (this.P / 11) };
      l.loop = { x: top.x + (anchor.x - top.x) * u, y: top.y + (anchor.y - top.y) * u };
      if (u >= 1) {
        l.phase = "tug";
        l.t = 0;
        const dx = hand.x - anchor.x;
        const dy = hand.y - anchor.y;
        const d = Math.hypot(dx, dy) || 1;
        this.tug(l.el, (dx / d) * 16, (dy / d) * 10);
      }
    } else {
      l.loop = anchor;
      // Heels dug in, leaning back.
      this.steer(m, m.x, m.y, 0, dt);
      m.look = { x: Math.sign(anchor.x - hand.x), y: 0 };
      if (Math.random() < dt * 14) this.speck(m.x + this.W / 2 - Math.sign(anchor.x - hand.x) * this.W * 0.6, m.y + this.H, DIRT);
      if (l.t > 1.8) {
        this.release(m);
        m.wait = rand(0.6, 1.4);
      }
    }
  }

  private release(m: Meeple) {
    m.lasso = null;
    m.target = null;
  }

  /** The Shy One dashes about planting flowers as fast as it can. */
  private garden(m: Meeple, dt: number, every: number) {
    this.wander(m, dt, 260);
    m.plantT -= dt;
    if (m.plantT <= 0) {
      m.plantT = every * rand(0.8, 1.3);
      this.plant(m.x + this.W / 2 + rand(-6, 6), m.y + this.H + rand(-2, 4));
    }
  }

  private plant(x: number, y: number) {
    if (this.flowers.filter((f) => f.wilt === -1).length >= MAX_FLOWERS) {
      const oldest = this.flowers.find((f) => f.wilt === -1);
      if (oldest) oldest.wilt = 0;
    }
    this.flowers.push({ x, y: y + window.scrollY, age: 0, petal: pick(PETALS), wilt: -1 });
  }

  /** The Watcher strolls about singing, and plants a flower now and then. */
  private sing(m: Meeple, dt: number) {
    this.garden(m, dt, 1.4);
    if (m.noteT <= 0) {
      this.note(m);
      m.noteT = rand(0.25, 0.45);
    }
    if (!m.bubble && Math.random() < dt * 0.5) m.bubble = { text: pick(SONGS), t: 0, life: 1.6 };
  }

  /** The Sleepy One climbs onto a card and naps there, then sleepwalks to the next. */
  private napping(m: Meeple, dt: number) {
    if (!m.nap || !m.nap.el.isConnected) {
      const el = pick(this.cards());
      if (!el) return this.wander(m, dt, 120);
      const r = el.getBoundingClientRect();
      m.nap = { el, dx: rand(0.2, 0.8) * (r.width - this.W), t: -1 };
    }
    const n = m.nap;
    const r = n.el.getBoundingClientRect();
    const tx = r.left + n.dx;
    const ty = r.top - this.H + 2;
    if (n.t < 0) {
      if (this.steer(m, tx, ty, 200, dt) < 6) {
        n.t = 0;
        m.bubble = { text: "SNORE", t: 0, life: 1.2 };
      }
    } else {
      // Asleep on it, riding along as the page scrolls.
      n.t += dt;
      m.x = tx;
      m.y = ty;
      m.vx = m.vy = 0;
      if (m.noteT <= 0) {
        this.notes.push({ x: m.x + this.W + 2, y: m.y - 4, age: 0, color: "#A1A3A6", glyph: Z_GLYPH, sway: rand(0, 6) });
        m.noteT = 0.55;
      }
      if (n.t > rand(3.2, 4.5)) m.nap = null;
    }
  }

  private note(m: Meeple) {
    this.notes.push({
      x: m.x + rand(0, this.W),
      y: m.y - hatHeight(m.cfg.id) * (this.P / 11) - 6,
      age: 0,
      color: pick([...COLORS, INK]),
      glyph: pick(NOTE_GLYPHS),
      sway: rand(0, Math.PI * 2),
    });
  }

  /** They bump off each other, the Chaotic One hardest. */
  private collide() {
    const ms = this.meeples.filter((m) => !m.home && !m.nap?.t);
    for (let i = 0; i < ms.length; i++) {
      for (let j = i + 1; j < ms.length; j++) {
        const a = ms[i];
        const b = ms[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = this.W * 0.9;
        if (d > 0 && d < min) {
          const k = (min - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * k;
          a.y -= ny * k;
          b.x += nx * k;
          b.y += ny * k;
          const kick = a.cfg.id === "red" || b.cfg.id === "red" ? 320 : 120;
          a.vx -= nx * kick;
          a.vy -= ny * kick;
          b.vx += nx * kick;
          b.vy += ny * kick;
          if (a.hop < 0) a.hop = 0;
          if (b.hop < 0) b.hop = 0;
        }
      }
    }
  }

  // ------------------------------------------------------- moving the page

  /** A shove: the element jolts aside and settles back. */
  private nudge(el: HTMLElement, x: number, deg: number) {
    this.animate(el, [
      { transform: "translate(0, 0) rotate(0deg)" },
      { transform: `translate(${x}px, 0) rotate(${deg}deg)`, offset: 0.25 },
      { transform: `translate(${-x * 0.25}px, 0) rotate(${-deg * 0.3}deg)`, offset: 0.65 },
      { transform: "translate(0, 0) rotate(0deg)" },
    ], 520);
  }

  /** A tug on the rope: pulled toward the meeple in jerks, then let go. */
  private tug(el: HTMLElement, x: number, y: number) {
    const at = (k: number) => ({ transform: `translate(${x * k}px, ${y * k}px)` });
    this.animate(el, [at(0), at(0.6), at(0.35), at(1), at(0.55), at(0.9), at(0.4), at(0)], 1800);
  }

  private animate(el: HTMLElement, keyframes: Keyframe[], duration: number) {
    // Added on top of whatever transform the element already has.
    const a = el.animate(keyframes, { duration, easing: "ease-out", composite: "add" });
    this.animations.push(a);
    a.finished.then(
      () => (this.animations = this.animations.filter((x) => x !== a)),
      () => {},
    );
  }

  private puff(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(60, 200);
      this.specks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, t: 0, life: rand(0.3, 0.6), size: 3, color });
    }
  }

  private speck(x: number, y: number, color: string) {
    this.specks.push({ x, y, vx: rand(-60, 60), vy: rand(-160, -60), t: 0, life: 0.4, size: 2, color });
  }

  // -------------------------------------------------------------------- draw

  private rect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  private pattern(rows: string[], x: number, y: number, unit: number, colors: (ch: string) => string | null) {
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        const c = ch === "." ? null : colors(ch);
        if (c) this.rect(x + rx * unit, y + ry * unit, unit, unit, c);
      }),
    );
  }

  private draw() {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.vw, this.vh);

    this.drawFlowers();

    if (this.confetti.length) {
      ctx.globalAlpha = this.time < BURST ? 1 : clamp(1 - (this.time - BURST) / 0.9, 0, 1);
      for (const c of this.confetti) this.rect(c.x, c.y, c.size, c.size, c.color);
      ctx.globalAlpha = 1;
    }

    for (const m of this.meeples) {
      if (m.home) continue;
      if (this.time < GATHER && !this.reduced) this.drawBlocks(m);
      else this.drawMeeple(m);
    }

    for (const s of this.specks) {
      ctx.globalAlpha = clamp(1 - s.t / s.life, 0, 1);
      this.rect(s.x, s.y, s.size, s.size, s.color);
    }
    ctx.globalAlpha = 1;

    for (const n of this.notes) {
      const u = n.age / NOTE_LIFE;
      ctx.globalAlpha = u < 0.1 ? u / 0.1 : u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
      this.pattern(n.glyph, n.x + Math.sin(n.age * 4 + n.sway) * 6, n.y, 2, () => n.color);
    }
    ctx.globalAlpha = 1;

    if (this.car) this.drawCar(this.car);

    for (const m of this.meeples) if (!m.home && m.bubble) this.drawBubble(m);
  }

  /**
   * A black-and-white pixel cop car, facing the way it drives, with the light
   * bar flashing red and blue and the meeples it has picked up in the back window.
   */
  private drawCar(car: Car) {
    const u = Math.round(this.P * 0.7);
    const w = CAR[0].length * u;
    const h = CAR.length * u;
    const x0 = Math.round(car.x - w / 2);
    const y0 = Math.round(car.y - h + Math.round(Math.sin(car.t * 30)) * 0.5);
    const flash = Math.floor(car.t / 0.16) % 2 === 0;
    const aboard = this.meeples.filter((m) => m.home);
    // The flash glows around the light bar.
    const lights = CAR[0].indexOf("R");
    const lx = car.face > 0 ? x0 + lights * u : x0 + w - (lights + 2) * u;
    this.ctx.globalAlpha = 0.25;
    this.rect(lx - u * (flash ? 2 : 0), y0 - u, u * 3, u * 3, "#E05A32");
    this.rect(lx + u * (flash ? 0 : 1), y0 - u, u * 3, u * 3, "#58B9F8");
    this.ctx.globalAlpha = 1;
    let pane = 0;
    CAR.forEach((row, ry) =>
      [...row].forEach((ch, i) => {
        if (ch === ".") return;
        const rx = car.face > 0 ? i : row.length - 1 - i;
        let c = CAR_COLORS[ch];
        if (ch === "R") c = flash ? "#E05A32" : "#5E1A0A";
        if (ch === "B") c = flash ? "#1D4E70" : "#58B9F8";
        if (ch === "G") {
          // Riders show in the windows, back to front.
          const m = aboard[pane++];
          if (m) c = m.cfg.hex;
        }
        this.rect(x0 + rx * u, y0 + ry * u, u, u, c);
      }),
    );
    if (Math.floor(car.t / 1.2) % 2 === 0) {
      this.ctx.font = "600 10px Inter, ui-sans-serif, system-ui, sans-serif";
      this.ctx.fillStyle = INK;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "alphabetic";
      this.ctx.fillText("WEE-OO", Math.round(car.x), y0 - u - 4);
    }
  }

  private drawBlocks(m: Meeple) {
    const { P } = this;
    m.blocks.forEach((b, i) => {
      this.rect(b.x, b.y, P, P, m.cfg.hex);
      if (i === 0) this.drawEyes(m, b.x, b.y);
    });
  }

  private drawMeeple(m: Meeple) {
    const { P } = this;
    const s = P / 11;
    const hop = m.hop >= 0 ? Math.sin((Math.PI * m.hop) / 0.35) * 8 : 0;
    const walking = Math.hypot(m.vx, m.vy) > 30;
    let ox = m.x;
    const oy = m.y - hop - (walking && m.step ? 1 : 0);
    if (m.lasso?.phase === "tug") ox += Math.round(Math.sin(this.time * 40));

    // The lasso goes behind it.
    if (m.lasso && m.lasso.phase !== "walk") this.drawLasso(m, ox, oy);

    MEEPLE_BLOCKS.forEach((b, i) => {
      const lift = walking && ((i === 5 && m.step === 0) || (i === 6 && m.step === 1)) ? -2 : 0;
      this.rect(ox + b.x * P, oy + b.y * P + lift, P, P, m.cfg.hex);
    });
    const hx = ox + P;
    // The hat drops on just after it comes together.
    const drop = this.reduced ? 0 : Math.max(0, 1 - (this.time - GATHER) / 0.25) * -24;
    for (const c of HATS[m.cfg.id]) this.rect(hx + c.x * s, oy + c.y * s + drop, Math.max(1, c.w * s), Math.max(1, c.h * s), c.c);
    this.drawEyes(m, hx, oy);
  }

  private drawEyes(m: Meeple, hx: number, hy: number) {
    const s = this.P / 11;
    if (m.cfg.id === "blue" && m.nap && m.nap.t >= 0) {
      this.rect(hx + 3 * s, hy + 5 * s, 2 * s, 1, WHITE);
      this.rect(hx + 6 * s, hy + 5 * s, 2 * s, 1, WHITE);
      return;
    }
    const ex = clamp(Math.round(m.look.x * 2), -2, 2) * s;
    const ey = clamp(Math.round(m.look.y * 2), -1, 2) * s;
    this.rect(hx + 3 * s + ex, hy + 2 * s + ey, 2 * s, 4 * s, WHITE);
    this.rect(hx + 6 * s + ex, hy + 2 * s + ey, 2 * s, 4 * s, WHITE);
  }

  private drawLasso(m: Meeple, ox: number, oy: number) {
    const l = m.lasso!;
    const hand = { x: ox + this.W - this.P / 2, y: oy + this.P * 1.5 };
    if (l.phase === "twirl") {
      const c = { x: ox + this.W / 2 + 6, y: oy - 10 - hatHeight("yellow") * (this.P / 11) };
      const a = this.time * 14;
      this.ring(c.x, c.y, 15, 5);
      this.line(hand.x, hand.y, c.x + Math.cos(a) * 15, c.y + Math.sin(a) * 5);
      return;
    }
    this.line(hand.x, hand.y, l.loop.x, l.loop.y);
    this.ring(l.loop.x, l.loop.y, 8, 6);
  }

  private line(x0: number, y0: number, x1: number, y1: number) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= n; i++) this.rect(x0 + ((x1 - x0) * i) / n - 1, y0 + ((y1 - y0) * i) / n - 1, 2, 2, INK);
  }

  private ring(cx: number, cy: number, rx: number, ry: number) {
    const n = Math.max(16, Math.round(Math.PI * (rx + ry)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.rect(cx + Math.cos(a) * rx - 1, cy + Math.sin(a) * ry - 1, 2, 2, INK);
    }
  }

  private drawFlowers() {
    const { ctx } = this;
    const u = this.P / 2;
    const sy = window.scrollY;
    for (const f of this.flowers) {
      const y = f.y - sy;
      if (y < -40 || y > this.vh + 40) continue;
      ctx.globalAlpha = f.wilt < 0 ? 1 : clamp(1 - f.wilt / 0.9, 0, 1);
      const rows = f.age < 0.2 ? SEED : f.age < 0.5 ? SPROUT : BLOOM;
      const mid = f.petal === "#FBEC5A" ? "#E05A32" : "#FBEC5A";
      this.pattern(rows, f.x - (rows[0].length * u) / 2, y - rows.length * u, u, (ch) =>
        ch === "S" || ch === "L" ? LEAF : ch === "P" ? f.petal : ch === "C" ? mid : ch === "D" ? DIRT : null,
      );
    }
    ctx.globalAlpha = 1;
  }

  /** A small white speech bubble with an ink outline, over its hat. */
  private drawBubble(m: Meeple) {
    const { ctx } = this;
    const b = m.bubble!;
    ctx.font = "600 10px Inter, ui-sans-serif, system-ui, sans-serif";
    const tw = Math.ceil(ctx.measureText(b.text).width);
    const w = tw + 12;
    const h = 18;
    const cx = clamp(m.x + this.W / 2, w / 2 + 4, this.vw - w / 2 - 4);
    const x = Math.round(cx - w / 2);
    const y = Math.round(m.y - hatHeight(m.cfg.id) * (this.P / 11) - h - 10);
    ctx.globalAlpha = b.life - b.t < 0.25 ? clamp((b.life - b.t) / 0.25, 0, 1) : 1;
    this.rect(x, y, w, h, INK);
    this.rect(x + 1, y + 1, w - 2, h - 2, WHITE);
    this.rect(cx - 3, y + h - 1, 6, 1, WHITE);
    this.rect(cx - 4, y + h - 1, 1, 2, INK);
    this.rect(cx + 3, y + h - 1, 1, 2, INK);
    this.rect(cx - 3, y + h, 6, 1, WHITE);
    this.rect(cx - 2, y + h + 1, 4, 1, INK);
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.text, Math.round(cx), y + h / 2 + 1);
    ctx.globalAlpha = 1;
  }
}

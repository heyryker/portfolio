/**
 * The meeple engine (CLAUDE.md §5): five pixel meeples that wander, react to
 * the cursor, can be dragged and thrown, and explode into pixels when clicked.
 *
 * It's a small custom requestAnimationFrame loop drawing onto one canvas,
 * rather than matter-js or a DOM node per pixel, to keep the landing page
 * light. The world is top-down (graph paper seen from above), so there is no
 * gravity: throws glide to a stop with friction.
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

// 3x5 pixel "z", drawn at 2px per pixel.
const Z_GLYPH = ["XXX", "..X", ".X.", "X..", "XXX"];

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
  purple: { speed: 22, pause: [1.5, 4], step: 0.2 },
  red: { speed: 125, pause: [0.15, 0.7], step: 0.08 },
  blue: { speed: 28, pause: [1, 3], step: 0.2 },
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
  awakeFor: number;
  scaredFor: number;
  fleeTo: Vec | null;
  rushing: boolean;
  rushCooldown: number;
  /** Position last frame, to estimate drag velocity. */
  prev: Vec;
  blocks: Block[];
};

type TintTarget = {
  el: HTMLElement;
  prop: "color" | "backgroundColor";
  rect: DOMRect | null;
  color: string | null;
  holdUntil: number;
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
  private tints: TintTarget[] = [];
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
    }));
    this.measureTints();

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

    // A meeple may glance at a case-study label when it's hovered or focused.
    for (const link of root.querySelectorAll<HTMLElement>("nav a")) {
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
      awakeFor: 0,
      scaredFor: 0,
      fleeTo: null,
      rushing: false,
      rushCooldown: rand(2, 4),
      prev: { x, y },
      blocks: [],
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
      const r = t.el.getBoundingClientRect();
      // A text box includes the line's empty space above and below the
      // glyphs. Trim it to roughly the bracket height, so a meeple only
      // tints [I'M] when it actually touches the letters.
      const fs = t.prop === "color" ? parseFloat(getComputedStyle(t.el).fontSize) : 0;
      const top = r.top + fs * 0.17;
      const bottom = r.bottom - fs * 0.12;
      t.rect = new DOMRect(r.left - c.left, top - c.top, r.width, bottom - top);
    }
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
      this.updateFace(m, dt);
    }
    this.collide();
  }

  // ---------------------------------------------------------- personality

  private get cursorActive() {
    // A cursor that has sat still for a while stops being interesting.
    return this.cursor.inside && this.time - this.cursor.lastMove < 10;
  }

  private think(m: Meeple, dt: number) {
    m.wx = 0;
    m.wy = 0;

    if (m.asleep) return;
    if (m.cfg.id === "blue") {
      m.awakeFor -= dt;
      if (m.awakeFor <= 0 && m.mode === "idle") {
        m.asleep = true;
        return;
      }
    }

    // Sliding after a throw or a bump: no walking until it slows down.
    if (Math.hypot(m.vx, m.vy) > TUMBLE_SPEED) return;

    const c = center(m);
    const toCursor = { x: this.cursor.x - c.x, y: this.cursor.y - c.y };
    const d = Math.hypot(toCursor.x, toCursor.y) || 1;
    const active = this.cursorActive;

    switch (m.cfg.id) {
      case "yellow": {
        // The Curious One: follows the cursor at a polite distance.
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
        break;
      }
      case "green": {
        // The Shy One: scoots away when the cursor gets close, then peeks back.
        if (active && d < 160 && m.scaredFor <= 0) {
          m.scaredFor = rand(1, 1.5);
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
          return;
        }
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
      return this.clampTarget(hx + rand(-60, 60), hy + rand(-30, 30));
    }
    if (m.cfg.id === "red" && Math.random() < 0.35) {
      // Head straight for another meeple. Bumps are the point.
      const others = this.meeples.filter((o) => o !== m && o.mode !== "exploded" && o.mode !== "reassemble");
      const o = others[Math.floor(Math.random() * others.length)];
      if (o) return this.clampTarget(o.x, o.y);
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
    const f = Math.exp(-2.4 * dt);
    for (const b of m.blocks) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= f;
      b.vy *= f;
      if (b.x < 0 || b.x > this.vw - P) {
        b.x = clamp(b.x, 0, this.vw - P);
        b.vx = -b.vx * 0.6;
      }
      if (b.y < 0 || b.y > this.vh - P) {
        b.y = clamp(b.y, 0, this.vh - P);
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
    if (this.hit(this.toLocal(t), 10)) e.preventDefault();
  };

  private onPointerDown = (e: PointerEvent) => {
    this.moveCursor(e);
    if (this.drag || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (this.isInteractive(e.target)) return;
    const p = this.toLocal(e);
    const m = this.hit(p, e.pointerType === "mouse" ? 3 : 10);
    if (!m) return;
    e.preventDefault();

    this.wake(m);
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
      const over = !this.isInteractive(e.target) && this.hit(this.toLocal(e), 3);
      this.root.style.cursor = over ? "grab" : "";
    }
  };

  private onPointerUp = (e: PointerEvent) => {
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

  // ---------------------------------------------------------------- render

  private render() {
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const m of this.meeples) {
      if (m.mode === "exploded" || m.mode === "reassemble") this.drawBlocks(m);
      else this.drawMeeple(m);
    }
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
    let oy = Math.round(m.y);
    if (m.mode === "shake") {
      ox += Math.round(rand(-2, 2));
      oy += Math.round(rand(-2, 2));
    }
    const walking = m.mode === "walk" && Math.hypot(m.wx, m.wy) > 1;
    MEEPLE_BLOCKS.forEach((b, i) => {
      // Blocks 5 and 6 are the legs. Lift one at a time while walking.
      const lift = walking && ((i === 5 && m.stepFrame === 0) || (i === 6 && m.stepFrame === 1)) ? -2 : 0;
      this.rect(ox + b.x * P, oy + b.y * P + lift, P, P, m.cfg.hex);
    });
    this.drawEyes(m, ox + P, oy);
    if (m.asleep) this.drawZzz(ox, oy);
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
  private drawZzz(ox: number, oy: number) {
    const { ctx } = this;
    for (let k = 0; k < 2; k++) {
      const p = (this.time / 2.4 + k / 2) % 1;
      ctx.globalAlpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      const zx = Math.round(ox + W - 2 + p * 10);
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
      if (!t.rect) continue;
      let best: Meeple | null = null;
      let bestArea = 0;
      for (const m of this.meeples) {
        if (m.mode === "exploded" || m.mode === "reassemble") continue;
        const ox = Math.min(m.x + W, t.rect.right) - Math.max(m.x, t.rect.left);
        const oy = Math.min(m.y + H, t.rect.bottom) - Math.max(m.y, t.rect.top);
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

/** Dragged meeples can't be pushed; the napping one is hard to shift. */
function invMass(m: Meeple) {
  if (m.mode === "drag") return 0;
  if (m.asleep) return 0.3;
  return 1;
}

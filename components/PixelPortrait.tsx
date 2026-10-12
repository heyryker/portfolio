"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackOnce } from "@/lib/analytics";

/*
 * The About page portrait, with a trick: click it and it shakes, bursts into
 * pixels that scatter across the screen, and the pixels drift back, bottom row
 * first, as a pixel avatar. Click again for the photo.
 *
 * The avatar is drawn by hand rather than traced from the photo, in the
 * spirit of the classic 8-bit avatar portraits: a 16 x 20 head and neck,
 * three-quarter view facing left, outlined in ink, with a tousled quiff,
 * brows over pixel eyes, a flat face and an ear with a round hoop earring.
 * Three colors; blue, the background, is the Ryker meeple's color.
 */
const COLS = 16;
const ROWS = 20;
const COLORS: Record<string, string> = {
  ".": "#58B9F8", // blue
  K: "#221F20", // ink
  Y: "#FBEC5A", // yellow
};
const AVATAR = [
  "................",
  "................",
  "...KKK.KK.......",
  "..KKKKKKKKKK....",
  "..KKKKKKKKKKK...",
  "..KKKKKKKKKKKK..",
  "..KYYYYYYKKKKK..",
  "..KYYYYYYYYKKK..",
  "..KYYYYYYYYYKK..",
  "..KKKKYYKKYYKYK.",
  "..KYKYYYKYYYKYK.",
  "..KYYYYYYYYYYK..",
  "..KYYYYYYYYYYK..",
  "..KYYYYYYYYYYK..",
  "..KYYKKKYYYYK...",
  "...KYYYYYYYK....",
  "....KKKKYYYK....",
  ".......KYYYK....",
  ".......KYYYK....",
  ".......KYYYK....",
];
// The earring is the one thing that isn't a pixel: a smooth yellow hoop,
// outlined in ink, hanging from the earlobe. In grid cells; sizes in px at
// the full 264px width.
const HOOP = { x: 14.05, y: 12.15, r: 0.85, ink: 8, gold: 3 };
// Matches the photo's object-position.
const FOCUS = { x: 0.5, y: 0.3 };

const SHAKE = 0.3; // seconds
const SCATTER = 1.1;
const SETTLE_LIMIT = 4; // give up easing and snap home after this long

type Cell = { gray: string; color: string };
type Block = { x: number; y: number; vx: number; vy: number; home: { x: number; y: number }; delay: number; from: string; to: string; landed: boolean };
type Showing = "photo" | "pixels";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Reads the photo into the grid: each cell's gray, and its color in the avatar. */
function sample(img: HTMLImageElement): Cell[] | null {
  if (!img.complete || !img.naturalWidth) return null;
  const k = 8; // subsamples per cell, each way
  const w = COLS * k;
  const h = ROWS * k;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  // object-fit: cover, at the photo's focus point.
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) * FOCUS.x, (h - dh) * FOCUS.y, dw, dh);
  const data = ctx.getImageData(0, 0, w, h).data;

  const lum: number[] = [];
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      let sum = 0;
      for (let y = 0; y < k; y++) {
        for (let x = 0; x < k; x++) {
          const i = ((cy * k + y) * w + cx * k + x) * 4;
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
      }
      lum.push(sum / (k * k));
    }
  }
  // Each block leaves as a patch of the photo and comes home as the avatar.
  return lum.map((l, i) => {
    const v = Math.round(l);
    return { gray: `rgb(${v},${v},${v})`, color: COLORS[AVATAR[Math.floor(i / COLS)][i % COLS]] };
  });
}

export function PixelPortrait({ src, alt }: { src: StaticImageData; alt: string }) {
  const frameRef = useRef<HTMLButtonElement>(null);
  const stillRef = useRef<HTMLCanvasElement>(null);
  const flyRef = useRef<HTMLCanvasElement>(null);
  const cells = useRef<Cell[] | null>(null);
  const raf = useRef(0);
  const [showing, setShowing] = useState<Showing>("photo");
  const [flying, setFlying] = useState(false);

  /** Paints the resting avatar into the frame. */
  const paintStill = useCallback(() => {
    const canvas = stillRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame || !cells.current) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = frame.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d")!;
    // Edges snapped to whole device pixels, so the blocks stay crisp.
    cells.current.forEach((c, i) => {
      const x0 = Math.round(((i % COLS) * canvas.width) / COLS);
      const y0 = Math.round((Math.floor(i / COLS) * canvas.height) / ROWS);
      const x1 = Math.round((((i % COLS) + 1) * canvas.width) / COLS);
      const y1 = Math.round(((Math.floor(i / COLS) + 1) * canvas.height) / ROWS);
      ctx.fillStyle = c.color;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    });
    // The hoop: an ink ring with a yellow one inside it, drawn smooth.
    const cell = canvas.width / COLS;
    const px = canvas.width / 264;
    const cx = HOOP.x * cell;
    const cy = HOOP.y * cell;
    const r = HOOP.r * cell - (HOOP.ink / 2) * px;
    for (const [color, width] of [
      [COLORS.K, HOOP.ink],
      [COLORS.Y, HOOP.gold],
    ] as const) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width * px;
      ctx.stroke();
    }
  }, []);

  // Keep the still sharp if the frame changes size (it's fluid on phones).
  useEffect(() => {
    if (showing !== "pixels") return;
    paintStill();
    const frame = frameRef.current;
    if (!frame) return;
    const ro = new ResizeObserver(paintStill);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [showing, paintStill]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /** Bursts the current picture and reforms it as the other one. */
  const burst = (to: Showing, origin: { x: number; y: number }) => {
    const frame = frameRef.current;
    const fly = flyRef.current;
    if (!frame || !fly || !cells.current) return;
    const ctx = fly.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const size = () => {
      fly.width = Math.round(window.innerWidth * dpr);
      fly.height = Math.round(window.innerHeight * dpr);
    };
    size();
    window.addEventListener("resize", size);

    const r0 = frame.getBoundingClientRect();
    const cw = r0.width / COLS;
    const ch = r0.height / ROWS;
    const blocks: Block[] = cells.current.map((c, i) => {
      const home = { x: (i % COLS) * cw, y: Math.floor(i / COLS) * ch };
      // Out from where it was clicked, faster for the ones nearest.
      const dx = home.x + cw / 2 - origin.x;
      const dy = home.y + ch / 2 - origin.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = rand(180, 620) * (0.6 + 0.6 * (1 - Math.min(1, d / r0.height)));
      const spin = rand(-0.6, 0.6);
      const a = Math.atan2(dy, dx) + spin;
      return {
        ...home,
        home,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        // Home again bottom row first, so the new picture builds upward.
        delay: SHAKE + SCATTER + (1 - home.y / r0.height) * 0.7 + rand(0, 0.3),
        from: to === "pixels" ? c.gray : c.color,
        to: to === "pixels" ? c.color : c.gray,
        landed: false,
      };
    });

    setFlying(true);
    const start = performance.now();
    let last = start;
    const frameStep = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      // The photo's frame follows the page if it's scrolled mid-burst.
      const r = frame.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, fly.width, fly.height);
      const jitter = t < SHAKE ? { x: Math.round(rand(-2, 2)), y: Math.round(rand(-2, 2)) } : { x: 0, y: 0 };
      let home = 0;
      for (const b of blocks) {
        if (t >= SHAKE && !b.landed) {
          if (t < b.delay) {
            // Scatter: glide to a stop, bouncing off the screen's edges.
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            const f = Math.exp(-2.2 * dt);
            b.vx *= f;
            b.vy *= f;
            const sx = r.left + b.x;
            const sy = r.top + b.y;
            if (sx < 0 || sx > vw - cw) {
              b.vx = -b.vx * 0.6;
              b.x = Math.min(Math.max(b.x, -r.left), vw - cw - r.left);
            }
            if (sy < 0 || sy > vh - ch) {
              b.vy = -b.vy * 0.6;
              b.y = Math.min(Math.max(b.y, -r.top), vh - ch - r.top);
            }
          } else {
            // Drift home, easing in.
            const k = 1 - Math.exp(-5 * dt);
            b.x += (b.home.x - b.x) * k;
            b.y += (b.home.y - b.y) * k;
            if ((Math.abs(b.x - b.home.x) < 0.4 && Math.abs(b.y - b.home.y) < 0.4) || t > SETTLE_LIMIT) {
              b.x = b.home.x;
              b.y = b.home.y;
              b.landed = true;
            }
          }
        }
        if (b.landed) home++;
        // A pixel takes its new color as it turns for home.
        const color = t >= b.delay ? b.to : b.from;
        const x0 = Math.round((r.left + b.x + jitter.x) * dpr);
        const y0 = Math.round((r.top + b.y + jitter.y) * dpr);
        const x1 = Math.round((r.left + b.x + jitter.x + cw) * dpr);
        const y1 = Math.round((r.top + b.y + jitter.y + ch) * dpr);
        ctx.fillStyle = color;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
      if (home < blocks.length) {
        raf.current = requestAnimationFrame(frameStep);
        return;
      }
      window.removeEventListener("resize", size);
      ctx.clearRect(0, 0, fly.width, fly.height);
      setFlying(false);
    };
    // Swap what the frame shows now: the pixels are on the flying canvas.
    setShowing(to);
    raf.current = requestAnimationFrame(frameStep);
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (flying) return;
    const frame = frameRef.current;
    const img = frame?.querySelector("img");
    if (!frame || !img) return;
    cells.current ??= sample(img);
    if (!cells.current) return;
    const to: Showing = showing === "photo" ? "pixels" : "photo";
    if (to === "pixels") trackOnce("Meeple play", "portrait", { action: "portrait" });
    if (window.matchMedia(REDUCED_MOTION).matches) {
      // No burst: just swap.
      setShowing(to);
      return;
    }
    const r = frame.getBoundingClientRect();
    // From the click point, or the middle for a keyboard press.
    const origin = e.detail > 0 ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: r.width / 2, y: r.height / 2 };
    burst(to, origin);
  };

  return (
    <>
      <button
        ref={frameRef}
        type="button"
        onClick={onClick}
        aria-pressed={showing === "pixels"}
        aria-label={showing === "pixels" ? "Show the photo again" : "Turn the photo into pixels"}
        title={showing === "pixels" ? "Back to the photo" : "Pixelate me"}
        className="relative block aspect-[4/5] w-full max-w-[264px] cursor-pointer overflow-hidden border border-grid"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="264px"
          placeholder="blur"
          // Hidden, not removed, while the avatar shows, so the alt text stays.
          className={`object-cover object-[50%_30%] ${showing === "photo" && !flying ? "" : "opacity-0"}`}
        />
        <canvas
          ref={stillRef}
          aria-hidden="true"
          className={`pixelated absolute inset-0 size-full ${showing === "pixels" && !flying ? "" : "invisible"}`}
        />
      </button>
      {/* The pixels in flight, over the whole screen so they can scatter past the frame. */}
      <canvas
        ref={flyRef}
        aria-hidden="true"
        className={`pixelated pointer-events-none fixed inset-0 z-40 size-full ${flying ? "" : "hidden"}`}
      />
    </>
  );
}

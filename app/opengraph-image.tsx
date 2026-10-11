import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { MEEPLES, MEEPLE_BLOCKS } from "@/lib/meeples";
import { OG_IMAGE_ALT } from "@/lib/site";

/*
 * The share card for every page that doesn't set its own (blog posts use
 * their cover): the HEY [I'M] RYKER headline on graph paper, with the five
 * meeples (CLAUDE.md §10). A static take on the landing page, not a pixel
 * copy: the cut letters are left out and the squares sit beside the type.
 */

export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CELL = 42;
const PX = 10.5; // one meeple pixel, a quarter cell, as on the site
const ACCENT = "#58B9F8";

// Hand-placed so nothing covers the type.
const POSES: Record<string, { x: number; y: number }> = {
  yellow: { x: 13 * CELL, y: 1 * CELL },
  purple: { x: 22 * CELL, y: 3 * CELL },
  green: { x: 4 * CELL, y: 11 * CELL },
  red: { x: 9 * CELL + PX * 2, y: 12 * CELL },
  blue: { x: 26 * CELL, y: 12 * CELL },
};

function Meeple({ hex, x, y }: { hex: string; x: number; y: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: PX * 3, height: PX * 4, display: "flex" }}>
      {MEEPLE_BLOCKS.map((b) => (
        <div
          key={`${b.x}-${b.y}`}
          style={{ position: "absolute", left: b.x * PX, top: b.y * PX, width: PX, height: PX, background: hex }}
        />
      ))}
      <div style={{ position: "absolute", left: PX + 3, top: 2, width: 2, height: 4, background: "#fff" }} />
      <div style={{ position: "absolute", left: PX + 6, top: 2, width: 2, height: 4, background: "#fff" }} />
    </div>
  );
}

// Read synchronously so the image is prerendered at build time, not per request.
const font = (file: string) => readFileSync(path.join(process.cwd(), "assets/fonts", file));

export default function OpengraphImage() {
  const inter = font("Inter-ExtraBold.ttf");
  const silkscreen = font("Silkscreen-Regular.ttf");

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#fff",
          backgroundImage: "linear-gradient(#EEEFEF 1px, transparent 1px), linear-gradient(90deg, #EEEFEF 1px, transparent 1px)",
          backgroundSize: `${CELL}px ${CELL}px`,
          fontFamily: "Inter",
          color: "#000",
        }}
      >
        {/* Home mark */}
        <div style={{ position: "absolute", left: CELL - 6, top: CELL - 6, width: 12, height: 12, background: ACCENT }} />

        <div style={{ position: "absolute", left: 2 * CELL, top: 2 * CELL, display: "flex", alignItems: "flex-start" }}>
          <div style={{ width: CELL, height: CELL, background: ACCENT, marginRight: 12 }} />
          <div style={{ fontSize: 230, lineHeight: 0.8, letterSpacing: "-0.015em" }}>HEY</div>
          <div style={{ fontSize: 96, lineHeight: 0.8, color: ACCENT, marginLeft: 16, marginTop: 6 }}>[I&rsquo;M]</div>
        </div>
        <div style={{ position: "absolute", left: 7 * CELL, top: 7 * CELL, display: "flex", alignItems: "flex-end" }}>
          <div style={{ fontSize: 230, lineHeight: 0.8, letterSpacing: "-0.015em" }}>RYKER</div>
          <div style={{ width: CELL, height: CELL, background: ACCENT, marginLeft: 10 }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 2 * CELL,
            bottom: CELL - 4,
            fontFamily: "Silkscreen",
            fontSize: 22,
            color: "#A1A3A6",
            letterSpacing: "0.04em",
          }}
        >
          RYKER MARBLE / BRAND AND CREATIVE LEAD
        </div>

        {MEEPLES.map((m) => (
          <Meeple key={m.id} hex={m.hex} {...POSES[m.id]} />
        ))}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: inter, weight: 800, style: "normal" },
        { name: "Silkscreen", data: silkscreen, weight: 400, style: "normal" },
      ],
    },
  );
}

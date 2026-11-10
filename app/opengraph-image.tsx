import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { CASE_STUDIES } from "@/lib/work";
import { OG_IMAGE_ALT } from "@/lib/site";

/*
 * The share card for every page that doesn't set its own (case studies and
 * blog posts use their hero or cover): a static take on the landing page.
 * "RYKER MARBLE" in Inter 500 caps with the yellow marker behind it, the
 * role underneath, and the case studies as the same gray cards the landing
 * page lists. Black and white with a yellow accent, like the site.
 */

export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#ffd60a";
const CARD_BG = "#f4f4f4";
const MUTED = "#767676";

// Read synchronously so the image is prerendered at build time, not per request.
const font = (file: string) => readFileSync(path.join(process.cwd(), "assets/fonts", file));

export default function OpengraphImage() {
  const regular = font("inter-latin-400-normal.woff");
  const medium = font("inter-latin-500-normal.woff");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          padding: "112px 56px 56px",
          background: "#fff",
          fontFamily: "Inter",
          color: "#000",
        }}
      >
        <div style={{ position: "relative", display: "flex" }}>
          {/* The hover marker from the site: a thick yellow band behind the letters. */}
          <div
            style={{ position: "absolute", left: -6, right: -6, bottom: 4, height: 30, background: ACCENT }}
          />
          <div style={{ position: "relative", fontSize: 84, fontWeight: 500, lineHeight: 1, letterSpacing: "0.02em" }}>
            RYKER MARBLE
          </div>
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: MUTED }}>Brand &amp; Creative Lead, Utah</div>

        <div style={{ display: "flex", gap: 16, marginTop: "auto", width: "100%" }}>
          {CASE_STUDIES.map((c) => (
            <div
              key={c.slug}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                height: 150,
                padding: 24,
                borderRadius: 16,
                background: CARD_BG,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.15 }}>{c.name}</div>
              <div style={{ marginTop: 8, fontSize: 22, color: MUTED }}>{c.area}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}

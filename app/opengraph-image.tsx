import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { OG_IMAGE_ALT } from "@/lib/site";

/*
 * The share card for every page that doesn't set its own (case studies and
 * blog posts use their hero or cover): just "RYKER MARBLE" in Inter 500
 * caps, black on white, like the name on the landing page.
 */

export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read synchronously so the image is prerendered at build time, not per request.
const medium = readFileSync(path.join(process.cwd(), "assets/fonts", "inter-latin-500-normal.woff"));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#fff",
          fontFamily: "Inter",
          fontSize: 96,
          fontWeight: 500,
          letterSpacing: "0.02em",
          color: "#000",
        }}
      >
        RYKER MARBLE
      </div>
    ),
    { ...size, fonts: [{ name: "Inter", data: medium, weight: 500, style: "normal" }] },
  );
}

import { ImageResponse } from "next/og";

// Black with a yellow square: the black, white and yellow brand (matches app/icon.svg).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "flex-end", padding: 36, background: "#000000" }}>
        <div style={{ width: 48, height: 48, marginTop: 60, background: "#ffd60a" }} />
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

// The home mark: one blue pixel square on white.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <div style={{ width: 96, height: 96, background: "#58b9f8" }} />
      </div>
    ),
    size,
  );
}

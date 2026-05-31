import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1e293b",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "96px",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 240,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-8px",
            lineHeight: 1,
          }}
        >
          PA
        </span>
      </div>
    ),
    { ...size }
  );
}

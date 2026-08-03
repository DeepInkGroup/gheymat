import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const GRADIENT = "linear-gradient(135deg, #EF4136 0%, #F7941D 25%, #FFD200 50%, #39B54A 72%, #2E9DF7 100%)";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <div style={{ position: "relative", width: 132, height: 132, display: "flex" }}>
          <svg
            width="132"
            height="132"
            viewBox="0 0 100 100"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4136" />
                <stop offset="25%" stopColor="#F7941D" />
                <stop offset="50%" stopColor="#FFD200" />
                <stop offset="72%" stopColor="#39B54A" />
                <stop offset="100%" stopColor="#2E9DF7" />
              </linearGradient>
            </defs>
            <path
              d="M 11.94 67.75 A 42 42 0 1 1 32.25 88.06 L 37.32 77.19 A 30 30 0 1 0 22.81 62.68 Z"
              fill="url(#grad)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 66,
                fontWeight: 800,
                fontFamily: "Arial, Helvetica, sans-serif",
                backgroundImage: GRADIENT,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              $
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

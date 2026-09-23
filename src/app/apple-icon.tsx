import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

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
          background: "#000",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
          <rect x="4.5" y="4.5" width="23" height="23" rx="3.2" stroke="#FFD60A" strokeWidth="2.4" />
          <path d="M16 4.5V9M16 27.5V23M4.5 16H9M27.5 16H23" stroke="#FFD60A" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.9" fill="#fff" />
          <circle cx="11.6" cy="20.4" r="1.25" fill="#fff" fillOpacity="0.5" />
        </svg>
      </div>
    ),
    { ...size },
  );
}

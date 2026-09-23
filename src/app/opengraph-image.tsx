import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "CenterFace AI — Lock onto anything. Motion tracking and face lock in your browser.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

/* Hero face sits at (0.662, 0.49) of a 1792×1008 frame → scaled to 1200 wide. */
const IMG_W = 1200;
const IMG_H = 675;
const IMG_TOP = -22;
const SQ = 240;
const FACE_X = 0.662 * IMG_W;
const FACE_Y = 0.49 * IMG_H + IMG_TOP;

export default async function OpengraphImage() {
  let src = "";
  try {
    const photo = await readFile(join(process.cwd(), "public/images/hero-portrait.jpg"));
    src = `data:image/jpeg;base64,${photo.toString("base64")}`;
  } catch {
    src = "";
  }
  const tick = { position: "absolute" as const, background: "#FFD60A", display: "flex" };

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: "#000", color: "#fff" }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} width={IMG_W} height={IMG_H} alt="" style={{ position: "absolute", left: 0, top: IMG_TOP }} />
        ) : (
          <div style={{ position: "absolute", width: "100%", height: "100%", background: "radial-gradient(circle at 65% 50%, #1c1c1f 0%, #000 80%)" }} />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: FACE_X - SQ / 2,
            top: FACE_Y - SQ / 2,
            width: SQ,
            height: SQ,
            border: "3px solid #FFD60A",
            borderRadius: 6,
            display: "flex",
          }}
        >
          <div style={{ ...tick, left: SQ / 2 - 4, top: -3, width: 3, height: 20 }} />
          <div style={{ ...tick, left: SQ / 2 - 4, bottom: -3, width: 3, height: 20 }} />
          <div style={{ ...tick, top: SQ / 2 - 4, left: -3, width: 20, height: 3 }} />
          <div style={{ ...tick, top: SQ / 2 - 4, right: -3, width: 20, height: 3 }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: FACE_X - 62,
            top: FACE_Y - SQ / 2 - 44,
            display: "flex",
            background: "#FFD60A",
            color: "#000",
            fontSize: 17,
            letterSpacing: 2,
            padding: "5px 10px",
            borderRadius: 5,
          }}
        >
          AE/AF LOCK
        </div>

        <div style={{ position: "absolute", left: 64, top: 56, display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="46" height="46" viewBox="0 0 32 32" fill="none">
            <rect x="4.5" y="4.5" width="23" height="23" rx="3.2" stroke="#FFD60A" strokeWidth="2.4" />
            <path d="M16 4.5V9M16 27.5V23M4.5 16H9M27.5 16H23" stroke="#FFD60A" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.9" fill="#fff" />
          </svg>
          <span style={{ fontSize: 30, letterSpacing: -0.5 }}>CenterFace AI</span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 64,
            top: 250,
            display: "flex",
            flexDirection: "column",
            fontSize: 108,
            letterSpacing: -5,
            lineHeight: 1,
          }}
        >
          <span>Lock onto</span>
          <span>anything.</span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 52,
            display: "flex",
            fontSize: 19,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          FACE LOCK · POINT TRACK · AUTO REFRAME · IN YOUR BROWSER
        </div>
      </div>
    ),
    { ...size },
  );
}

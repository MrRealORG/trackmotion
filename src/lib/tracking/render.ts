import type {
  Attachment,
  BlendKind,
  CameraKey,
  CameraSettings,
  FontKind,
  FxSettings,
  Grade,
  Track,
} from "./types";
import {
  applyCam,
  camAt,
  coversOutput,
  identityCam,
  outToSrc,
  srcToOut,
  type Cam,
  type CamPath,
} from "./camera";
import { resolveTrack } from "./smooth";

// SVG path data for icons that can be drawn on canvas via Path2D.
// These match the Icons.tsx component used in the React UI.
const ICON_PATHS: Record<string, string> = {
  sunglasses: "M2 8h20v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-2 3 3 0 0 1-3 2H5a3 3 0 0 1-3-3V8zm3 7a5 5 0 0 0 4-2m4-3h4",
  fire: "M12 2c1 3-1 4-2 6-1 1-2 2-2 4a4 4 0 0 0 8 0c0-2-1-3-2-4 1 2-1 3-2 1 2-2 2-5 0-7z",
  star: "M12 2l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7z",
  crown: "M2 8l4 4 6-8 6 8 4-4-2 12H4L2 8z",
  heart: "M12 21s-7-5-9-9a5 5 0 0 1 9-4 5 5 0 0 1 9 4c-2 4-9 9-9 9z",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  sparkle: "M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7z",
  rocket: "M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10zm-3 16h6M10 20l1 2m3-2l-1 2M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  bolt: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  unicorn: "M5 21V9c0-4 3-7 7-7 3 0 5 2 6 5l-3 1c-1-2-2-3-3-3-2 0-3 1-4 3l4 2v8M9 9l-2-3",
  skull: "M12 2a8 8 0 0 0-8 8v5l3 3h2v-3h6v3h2l3-3v-5a8 8 0 0 0-8-8zM9 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  ghost: "M5 21V11a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2-3 2zM9 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  frog: "M3 10a9 9 0 0 1 18 0v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM9 16h6",
  pizza: "M12 2L2 6l4 14a2 2 0 0 0 2.5 1.5L12 19l3.5 2.5A2 2 0 0 0 18 20L22 6 12 2zM9 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-3 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  gamepad: "M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-7 2.5L14 16h-4l-1 .5A4 4 0 0 1 2 14v-2a4 4 0 0 1 4-4zM7 12h2m-1-1v2m7-1h0m3 0h0",
  rainbow: "M2 18a10 10 0 0 1 20 0M5 18a7 7 0 0 1 14 0M8 18a4 4 0 0 1 8 0",
  diamond: "M6 3h12l3 6-9 12L3 9l3-6zm3 6h6l-3 12",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  warning: "M12 2L2 20h20L12 2zm0 6v6m0 4v0",
  check: "M5 12l5 5L20 7",
  close: "M6 6l12 12M18 6L6 18",
  pin: "M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  eye: "M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
  nose: "M6 3h12a2 2 0 0 1 2 2v6a8 8 0 0 1-16 0V5a2 2 0 0 1 2-2zm4 12a2 2 0 1 0 4 0",
  glasses: "M2 8h20v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-2 3 3 0 0 1-3 2H5a3 3 0 0 1-3-3V8z",
  // ---- Thug Life / Meme icons ----
  thugGlasses: "M1 7h8a3 3 0 0 1 3 3v0a3 3 0 0 1 3 0h8v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-1a1 1 0 0 0-2 0v1a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V7z",
  goldChain: "M6 8h12l2 3-2 5H6l-2-5 2-3zm0 8l-1 4M18 16l1 4M9 12h6",
  thugHat: "M2 10L6 4h12l4 6H2zm0 0v3h20v-3M8 10l1-4M16 10l-1-4",
  money: "M3 6h18v12H3V6zm3 2c0 2 12 2 12 4s-12 2-12 4m3-6c0 1 6 1 6 2s-6 1-6 2",
  dollarSign: "M12 2v20M16 6c-2-2-6-1-6 2s4 2 6 4-2 4-6 2",
  cigarette: "M2 14h14v4H2v-4zm14-1h2v6h-2V13zm2-2h2v8h-2v-8z",
  grill: "M4 8h16v8H4V8zm2 2v4h3v-4H6zm5 0v4h2v-4h-2zm4 0v4h3v-4h-3z",
  bandana: "M3 8c4-2 14-2 18 0l-1 4c-4-1-12-1-16 0L3 8zm0 0l-2 3M21 8l2 3M6 12l-2 6M18 12l2 6",
  goldTooth: "M6 10h12v6H6v-6zm2 1v4M10 11v4M14 11v4M18 11v4",
  crown2: "M3 18l2-12 4 5 3-7 3 7 4-5 2 12H3zm0 2h18",
  flame2: "M12 2c1 4-2 5-3 8-1 2 0 4 2 4 3 0 4-3 3-6 3 2 4 5 2 8-2 3-6 4-8 1-3-3-2-9 1-15z",
  skull2: "M12 3a8 8 0 0 0-8 8v4l2 2v3h2v-2h8v2h2v-3l2-2v-4a8 8 0 0 0-8-8zM9 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 18h4",
  lightning: "M13 2L4 14h6l-2 8 10-12h-6l1-8z",
  hundred: "M4 8c0-2 1-3 3-3s3 1 3 3v8c0 2-1 3-3 3s-3-1-3-3V8zm10 0c0-2 1-3 3-3s3 1 3 3v8c0 2-1 3-3 3s-3-1-3-3V8z",
  fire2: "M12 2c2 3-1 5-2 7-1 2 1 3 2 2-2 4 0 7 2 7 4 0 5-4 3-8 0 3-2 4-3 3 2-4 0-8-2-11z",
};

const ICON_CACHE = new Map<string, Path2D>();

function getIconPath(name: string): Path2D | null {
  if (!ICON_PATHS[name]) return null;
  let p = ICON_CACHE.get(name);
  if (!p) {
    p = new Path2D(ICON_PATHS[name]);
    ICON_CACHE.set(name, p);
  }
  return p;
}

// Map emoji strings to icon names for backward compatibility
const EMOJI_MAP: Record<string, string> = {
  "😎": "sunglasses", "🕶️": "glasses", "🔥": "fire", "⭐": "star",
  "💥": "target", "👑": "crown", "❤️": "heart", "🎯": "target",
  "💫": "sparkle", "✨": "sparkle", "🚀": "rocket", "😂": "sparkle",
  "🤯": "skull", "👀": "eye", "💪": "bolt", "🎉": "sparkle",
  "💯": "star", "🌟": "star", "⚡": "bolt", "🦄": "unicorn",
  "🎩": "crown", "🧢": "crown", "💎": "diamond", "🌈": "rainbow",
  "🍕": "pizza", "🎮": "gamepad", "😈": "skull", "👻": "ghost",
  "💀": "skull", "🤡": "ghost", "🐸": "frog", "🙈": "warning",
  "💨": "bolt", "💧": "diamond", "❄️": "star", "🎵": "music",
  "📍": "pin", "❌": "close", "✅": "check", "⚠️": "warning",
};

// Map Thug Life sticker names to generated image paths
const STICKER_IMAGES: Record<string, string> = {
  thugGlasses: "/images/sticker-glasses.png",
  goldChain: "/images/sticker-chain.png",
  thugHat: "/images/sticker-hat.png",
  money: "/images/sticker-money.png",
  grill: "/images/sticker-grill.png",
  crown2: "/images/sticker-crown.png",
  fire2: "/images/sticker-fire.png",
  skull2: "/images/sticker-skull.png",
};

// Preload sticker images
const stickerImgCache = new Map<string, HTMLImageElement>();
function getStickerImage(name: string): HTMLImageElement | null {
  const src = STICKER_IMAGES[name];
  if (!src) return null;
  let img = stickerImgCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    stickerImgCache.set(src, img);
  }
  return img;
}

export const GRADES: Record<Grade, string> = {
  none: "",
  vivid: "saturate(1.4) contrast(1.08)",
  punch: "contrast(1.25) saturate(1.25) brightness(1.03)",
  bw: "grayscale(1) contrast(1.2)",
  vintage: "sepia(0.45) contrast(1.05) saturate(0.85) brightness(1.02)",
  cinematic: "contrast(1.15) saturate(0.8) brightness(0.95)",
  cool: "hue-rotate(-12deg) saturate(1.15) brightness(1.02)",
  warm: "sepia(0.25) saturate(1.3) hue-rotate(-6deg)",
};

const BLEND: Record<BlendKind, GlobalCompositeOperation> = {
  normal: "source-over",
  screen: "screen",
  multiply: "multiply",
  overlay: "overlay",
  add: "lighter",
  difference: "difference",
};

export const FONTS: Record<FontKind, (s: number) => string> = {
  bold: (s) => `800 ${s}px system-ui, -apple-system, "Segoe UI", sans-serif`,
  impact: (s) => `${s}px Impact, "Arial Black", "Haettenschweiler", sans-serif`,
  serif: (s) => `700 ${s}px Georgia, "Times New Roman", serif`,
  mono: (s) => `700 ${s}px ui-monospace, "SF Mono", Consolas, monospace`,
  rounded: (s) => `800 ${s}px "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif`,
};

const images = new Map<string, HTMLImageElement>();
export const assetEvents = { onLoad: () => {} };

function getImage(src: string) {
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.onload = () => assetEvents.onLoad();
    img.src = src;
    images.set(src, img);
  }
  return img;
}

export interface PreviewOpts {
  markers: boolean;
  selectedTrackId: string | null;
  selectedAttachmentId: string | null;
  dragBox: { x0: number; y0: number; x1: number; y1: number } | null;
  uiScale: number; // output units per CSS pixel
}

export interface RenderArgs {
  ctx: CanvasRenderingContext2D;
  ps: number; // backing pixels per output unit
  outW: number;
  outH: number;
  source: CanvasImageSource | null;
  srcW: number; // logical source size (display)
  srcH: number;
  srcPxW: number; // actual pixel size of `source`
  srcPxH: number;
  frame: number;
  fps: number;
  tracks: Track[];
  attachments: Attachment[];
  camera: CameraSettings;
  keys: CameraKey[];
  fx: FxSettings;
  path: CamPath | null;
  cameraOff: boolean;
  frozenCam?: Cam | null;
  motionSamples: number;
  preview?: PreviewOpts;
  enhance?: import("./types").EnhanceSettings;
  colorGrade?: import("./types").ColorGradeSettings;
}

export interface Pose {
  px: number;
  py: number;
  cx: number;
  cy: number;
  rT: number;
  sT: number;
  size: number;
}

const clampI = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Where an attachment sits (source pixels) at a frame. */
export function attachmentPose(
  att: Attachment,
  tracks: Track[],
  fps: number,
  srcW: number,
  srcH: number,
  frame: number,
): Pose | null {
  const t = tracks.find((x) => x.id === att.trackId);
  if (!t) return null;
  const sm = resolveTrack(t, tracks, fps, srcW / srcH);
  if (!sm.valid) return null;
  const f = clampI(frame, 0, sm.n - 1);
  const px = sm.x[f] * srcW;
  const py = sm.y[f] * srcH;
  const rT = att.followRotation ? sm.r[f] : 0;
  const sT = att.followScale ? sm.s[f] : 1;
  const c = Math.cos(rT);
  const s = Math.sin(rT);
  const ox = (att.offsetX * c - att.offsetY * s) * sT;
  const oy = (att.offsetX * s + att.offsetY * c) * sT;
  return { px, py, cx: px + ox, cy: py + oy, rT, sT, size: att.size * att.scale * sT };
}

let tiny: HTMLCanvasElement | null = null;
let mid: HTMLCanvasElement | null = null;
let mosaic: HTMLCanvasElement | null = null;

function sized(c: HTMLCanvasElement | null, w: number, h: number) {
  const cv = c ?? document.createElement("canvas");
  if (cv.width !== w) cv.width = w;
  if (cv.height !== h) cv.height = h;
  return cv;
}

/** Super cheap blurred background (downscale -> upscale), great on low-end GPUs. */
function drawBlurFill(a: RenderArgs) {
  const { ctx, outW, outH, ps } = a;
  const tw = 24;
  const th = Math.max(2, Math.round((24 * outH) / outW));
  tiny = sized(tiny, tw, th);
  mid = sized(mid, tw * 4, th * 4);
  const t = tiny.getContext("2d")!;
  const s = Math.max(tw / a.srcPxW, th / a.srcPxH);
  const dw = a.srcPxW * s;
  const dh = a.srcPxH * s;
  t.drawImage(a.source!, (tw - dw) / 2, (th - dh) / 2, dw, dh);
  const m = mid.getContext("2d")!;
  m.imageSmoothingQuality = "high";
  m.drawImage(tiny, 0, 0, mid.width, mid.height);
  ctx.setTransform(ps, 0, 0, ps, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mid, 0, 0, outW, outH);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, outW, outH);
}

function camMotion(p: Cam, c: Cam, outW: number, outH: number) {
  let m = 0;
  for (const [x, y] of [
    [0, 0],
    [outW, 0],
    [0, outH],
    [outW, outH],
    [outW / 2, outH / 2],
  ]) {
    const [sx, sy] = outToSrc(c, x, y);
    const [qx, qy] = srcToOut(p, sx, sy);
    m = Math.max(m, Math.hypot(qx - x, qy - y));
  }
  return m;
}

function starPath(ctx: CanvasRenderingContext2D, outer: number, inner: number) {
  let rot = -Math.PI / 2;
  const step = Math.PI / 5;
  ctx.moveTo(Math.cos(rot) * outer, Math.sin(rot) * outer);
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos(rot) * outer, Math.sin(rot) * outer);
    rot += step;
    ctx.lineTo(Math.cos(rot) * inner, Math.sin(rot) * inner);
    rot += step;
  }
  ctx.closePath();
}

function heartPath(ctx: CanvasRenderingContext2D, r: number) {
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.3, r * 0.1, -r * 0.9, -r * 1.1, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.9, -r * 1.1, r * 1.3, r * 0.1, 0, r * 0.9);
  ctx.closePath();
}

function drawSprite(ctx: CanvasRenderingContext2D, att: Attachment) {
  const size = att.size;
  if (att.kind === "emoji") {
    // First check if this is a data URL (admin-uploaded sticker)
    if (att.emoji.startsWith('data:image/') || att.emoji.startsWith('blob:')) {
      const img = getImage(att.emoji);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
      return;
    }
    // First check if this is a generated image sticker
    const stickerImg = getStickerImage(att.emoji);
    if (stickerImg && stickerImg.complete && stickerImg.naturalWidth > 0) {
      // Draw the image sticker centered on the attachment point
      const w = size;
      const h = size;
      ctx.drawImage(stickerImg, -w / 2, -h / 2, w, h);
      return;
    }
    // Otherwise try to render as SVG icon; fall back to emoji text if unknown
    const iconName = EMOJI_MAP[att.emoji] || att.emoji;
    const iconPath = getIconPath(iconName);
    if (iconPath) {
      // Draw SVG icon scaled to the attachment size.
      const scale = size / 24;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(12, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = att.color || "#facc15";
      ctx.strokeStyle = att.color || "#facc15";
      ctx.fill(iconPath);
      ctx.stroke(iconPath);
      ctx.restore();
    } else {
      // Fallback: draw emoji as text
      ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(att.emoji, 0, size * 0.05);
    }
  } else if (att.kind === "text") {
    ctx.font = FONTS[att.font](size);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (att.stroke) {
      ctx.lineJoin = "round";
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(att.text, 0, 0);
    }
    ctx.fillStyle = att.color;
    ctx.fillText(att.text, 0, 0);
  } else if (att.kind === "shape") {
    const r = size / 2;
    ctx.fillStyle = att.color;
    ctx.strokeStyle = att.color;
    ctx.beginPath();
    if (att.shape === "ring") {
      ctx.lineWidth = r * 0.16;
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    if (att.shape === "circle") ctx.arc(0, 0, r, 0, Math.PI * 2);
    else if (att.shape === "rect") ctx.rect(-r, -r, r * 2, r * 2);
    else if (att.shape === "star") starPath(ctx, r, r * 0.45);
    else heartPath(ctx, r);
    ctx.fill();
    if (att.stroke) {
      ctx.lineWidth = r * 0.1;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke();
    }
  } else if (att.kind === "image" && att.imageSrc) {
    const img = getImage(att.imageSrc);
    if (img.complete && img.naturalWidth > 0) {
      const w = size;
      const h = (size * img.naturalHeight) / img.naturalWidth;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
  }
}

function drawPixelate(a: RenderArgs, att: Attachment, pose: Pose) {
  const { ctx } = a;
  const size = pose.size;
  const half = size / 2;
  const blocks = Math.round(4 + (1 - att.strength) * 16);
  mosaic = sized(mosaic, blocks, blocks);
  const m = mosaic.getContext("2d")!;
  const kx = a.srcPxW / a.srcW;
  const ky = a.srcPxH / a.srcH;
  m.clearRect(0, 0, blocks, blocks);
  m.drawImage(
    a.source!,
    (pose.cx - half) * kx,
    (pose.cy - half) * ky,
    size * kx,
    size * ky,
    0,
    0,
    blocks,
    blocks,
  );
  ctx.save();
  ctx.beginPath();
  if (att.shape === "rect") ctx.rect(pose.cx - half, pose.cy - half, size, size);
  else ctx.ellipse(pose.cx, pose.cy, half, half * 1.15, pose.rT, 0, Math.PI * 2);
  ctx.clip();
  ctx.imageSmoothingEnabled = att.soft;
  ctx.drawImage(mosaic, 0, 0, blocks, blocks, pose.cx - half, pose.cy - half, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.restore();
}

function drawAttachments(a: RenderArgs, cam: Cam) {
  const { ctx, ps } = a;
  for (const att of a.attachments) {
    if (!att.visible) continue;
    const pose = attachmentPose(att, a.tracks, a.fps, a.srcW, a.srcH, a.frame);
    if (!pose) continue;
    if (att.kind === "spotlight") {
      ctx.setTransform(ps, 0, 0, ps, 0, 0);
      const [ox, oy] = srcToOut(cam, pose.cx, pose.cy);
      const r = pose.size * cam.z * 0.5;
      const g = ctx.createRadialGradient(ox, oy, r * 0.65, ox, oy, r * 1.35);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${0.92 * att.strength})`);
      ctx.globalAlpha = att.opacity;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, a.outW, a.outH);
      ctx.globalAlpha = 1;
      continue;
    }
    ctx.setTransform(ps, 0, 0, ps, 0, 0);
    applyCam(ctx, cam);
    ctx.globalAlpha = att.opacity;
    ctx.globalCompositeOperation = BLEND[att.blend] ?? "source-over";
    if (att.kind === "pixelate") {
      if (a.source) drawPixelate(a, att, pose);
    } else {
      ctx.translate(pose.px, pose.py);
      ctx.rotate(pose.rT);
      ctx.scale(pose.sT, pose.sT);
      ctx.translate(att.offsetX, att.offsetY);
      ctx.rotate((att.rotation * Math.PI) / 180);
      ctx.scale(att.scale, att.scale);
      drawSprite(ctx, att);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}

function drawOverlays(a: RenderArgs, cam: Cam) {
  const p = a.preview!;
  const { ctx, ps } = a;
  const u = p.uiScale;
  ctx.setTransform(ps, 0, 0, ps, 0, 0);
  const aspect = a.srcW / a.srcH;
  if (p.markers) {
    for (const t of a.tracks) {
      if (!t.visible) continue;
      const sm = resolveTrack(t, a.tracks, a.fps, aspect);
      if (!sm.valid) continue;
      const f = clampI(a.frame, 0, sm.n - 1);
      const sx = sm.x[f] * a.srcW;
      const sy = sm.y[f] * a.srcH;
      const [ox, oy] = srcToOut(cam, sx, sy);
      const sel = p.selectedTrackId === t.id;
      const raw = t.samples[f];
      const lost = t.type !== "pair" && (!raw || raw.c < 0.1);
      const col = lost ? "#ef4444" : t.color;
      ctx.lineWidth = (sel ? 2.4 : 1.5) * u;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      if (t.type === "point") {
        const hw = (t.boxW * a.srcW * sm.s[f]) / 2;
        const hh = (t.boxH * a.srcH * sm.s[f]) / 2;
        const cs = Math.cos(sm.r[f]);
        const sn = Math.sin(sm.r[f]);
        ctx.beginPath();
        const pts = [
          [-hw, -hh],
          [hw, -hh],
          [hw, hh],
          [-hw, hh],
        ];
        pts.forEach(([dx, dy], i) => {
          const [qx, qy] = srcToOut(cam, sx + dx * cs - dy * sn, sy + dx * sn + dy * cs);
          if (i) ctx.lineTo(qx, qy);
          else ctx.moveTo(qx, qy);
        });
        ctx.closePath();
        ctx.setLineDash(lost ? [4 * u, 4 * u] : sel ? [] : [6 * u, 3 * u]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (t.type === "pair" && t.pair) {
        const A = a.tracks.find((x) => x.id === t.pair![0]);
        const B = a.tracks.find((x) => x.id === t.pair![1]);
        if (A && B) {
          const sa = resolveTrack(A, a.tracks, a.fps, aspect);
          const sb = resolveTrack(B, a.tracks, a.fps, aspect);
          const [x1, y1] = srcToOut(cam, sa.x[f] * a.srcW, sa.y[f] * a.srcH);
          const [x2, y2] = srcToOut(cam, sb.x[f] * a.srcW, sb.y[f] * a.srcH);
          ctx.setLineDash([5 * u, 4 * u]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      const r = (sel ? 9 : 7) * u;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox - r * 1.9, oy);
      ctx.lineTo(ox - r * 0.45, oy);
      ctx.moveTo(ox + r * 0.45, oy);
      ctx.lineTo(ox + r * 1.9, oy);
      ctx.moveTo(ox, oy - r * 1.9);
      ctx.lineTo(ox, oy - r * 0.45);
      ctx.moveTo(ox, oy + r * 0.45);
      ctx.lineTo(ox, oy + r * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ox, oy, 1.7 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `600 ${11 * u}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      const label = lost ? `${t.name} · lost` : t.name;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(ox + r + 3 * u, oy - r - 16 * u, tw + 8 * u, 15 * u);
      ctx.fillStyle = col;
      ctx.fillText(label, ox + r + 7 * u, oy - r - 3.5 * u);
    }
  }
  if (p.selectedAttachmentId) {
    const att = a.attachments.find((x) => x.id === p.selectedAttachmentId);
    if (att && att.visible) {
      const pose = attachmentPose(att, a.tracks, a.fps, a.srcW, a.srcH, a.frame);
      if (pose) {
        const [ox, oy] = srcToOut(cam, pose.cx, pose.cy);
        const r = Math.max(14 * u, pose.size * cam.z * 0.55);
        ctx.setLineDash([5 * u, 4 * u]);
        ctx.lineWidth = 1.5 * u;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
  if (p.dragBox) {
    const b = p.dragBox;
    ctx.setLineDash([6 * u, 4 * u]);
    ctx.lineWidth = 2 * u;
    ctx.strokeStyle = "#FFD60A";
    ctx.fillStyle = "rgba(255,214,10,0.12)";
    const x = Math.min(b.x0, b.x1);
    const y = Math.min(b.y0, b.y1);
    ctx.fillRect(x, y, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
    ctx.strokeRect(x, y, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
    ctx.setLineDash([]);
  }
}

/** Composites one output frame. Returns the camera used (for hit-testing). */
export function renderFrame(a: RenderArgs): Cam {
  const { ctx, ps, outW, outH } = a;
  ctx.setTransform(ps, 0, 0, ps, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, outW, outH);
  const cam =
    a.frozenCam ??
    (a.cameraOff || !a.path
      ? identityCam(a.srcW, a.srcH, outW, outH, a.cameraOff)
      : camAt(a.path, a.frame));
  if (!a.source) {
    if (a.preview) drawOverlays(a, cam);
    return cam;
  }

  if (!a.cameraOff && a.camera.fill === "blur" && !coversOutput(cam, a.srcW, a.srcH, outW, outH)) {
    drawBlurFill(a);
  }

  const grade = GRADES[a.fx.grade];
  // Build enhance + color grade filter string.
  // Canvas2D ctx.filter supports: brightness, contrast, saturate, hue-rotate, blur, sepia, grayscale
  const en = a.enhance;
  const cg = a.colorGrade;
  const filters: string[] = [];
  if (grade) filters.push(grade);
  if (en) {
    if (en.brightness) filters.push(`brightness(${1 + en.brightness})`);
    if (en.contrast) filters.push(`contrast(${1 + en.contrast})`);
    if (en.saturation) filters.push(`saturate(${1 + en.saturation})`);
    if (en.exposure) filters.push(`brightness(${1 + en.exposure * 0.5})`);
  }
  if (cg) {
    if (cg.temperature) {
      // Warm = more red, less blue. Cool = opposite.
      filters.push(`sepia(${Math.abs(cg.temperature) * 0.3})`);
      if (cg.temperature > 0) filters.push(`saturate(${1 + cg.temperature * 0.1}) hue-rotate(-${cg.temperature * 10}deg)`);
      else filters.push(`hue-rotate(${-cg.temperature * 10}deg)`);
    }
    if (cg.hue) filters.push(`hue-rotate(${cg.hue}deg)`);
  }
  const filterStr = filters.length ? filters.join(" ") : "none";
  let n = 1;
  let shutter = 0;
  if (!a.cameraOff && !a.frozenCam && a.path && a.camera.motionBlur > 0.01 && a.frame > 0) {
    const prev = camAt(a.path, a.frame - 1);
    const len = camMotion(prev, cam, outW, outH) * a.camera.motionBlur;
    n = Math.max(1, Math.min(a.motionSamples, Math.ceil(len / 2.5)));
    shutter = a.camera.motionBlur;
  }
  ctx.filter = filterStr;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  for (let i = 0; i < n; i++) {
    const c = i === 0 || !a.path ? cam : camAt(a.path, a.frame - (i / (n - 1)) * shutter);
    ctx.setTransform(ps, 0, 0, ps, 0, 0);
    applyCam(ctx, c);
    ctx.globalAlpha = 1 / (i + 1);
    ctx.drawImage(a.source, 0, 0, a.srcW, a.srcH);
  }
  ctx.globalAlpha = 1;
  ctx.filter = "none";

  drawAttachments(a, cam);

  ctx.setTransform(ps, 0, 0, ps, 0, 0);
  if (a.fx.vignette > 0.01) {
    const g = ctx.createRadialGradient(
      outW / 2,
      outH / 2,
      Math.min(outW, outH) * 0.3,
      outW / 2,
      outH / 2,
      Math.hypot(outW, outH) * 0.55,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${a.fx.vignette * 0.85})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, outW, outH);
  }
  if (a.fx.flash && a.keys.length) {
    let kf = -1;
    for (const k of a.keys) if (k.frame <= a.frame) kf = k.frame;
    const d = a.frame - kf;
    if (kf >= 0 && d < 8) {
      ctx.fillStyle = `rgba(255,255,255,${Math.pow(1 - d / 8, 2) * 0.8})`;
      ctx.fillRect(0, 0, outW, outH);
    }
  }
  if (a.preview) drawOverlays(a, cam);
  return cam;
}

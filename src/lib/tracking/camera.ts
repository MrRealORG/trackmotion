import type { CameraKey, CameraSettings, Ease, Track } from "./types";
import { gaussian, resolveTrack } from "./smooth";

/** Camera transform: source point L maps to output anchor A, rotated by rot, scaled by z. */
export interface Cam {
  lx: number;
  ly: number;
  rot: number;
  z: number;
  ax: number;
  ay: number;
}

export interface CamPath {
  n: number;
  lx: Float32Array;
  ly: Float32Array;
  rot: Float32Array;
  z: Float32Array;
  ax: Float32Array;
  ay: Float32Array;
}

export interface CamValues {
  zoom: number;
  rotation: number;
  panX: number;
  panY: number;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function easeFn(e: Ease, t: number): number {
  switch (e) {
    case "linear":
      return t;
    case "easeIn":
      return t * t * t;
    case "easeOut":
      return 1 - Math.pow(1 - t, 3);
    case "ease":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case "hold":
      return 0;
  }
}

/** Keyframed camera values (zoom/rotation/pan) at a frame. Keys must be sorted. */
export function camValuesAt(c: CameraSettings, keys: CameraKey[], frame: number): CamValues {
  if (!keys.length) return { zoom: c.zoom, rotation: c.rotation, panX: c.panX, panY: c.panY };
  const pick = (k: CameraKey): CamValues => ({
    zoom: k.zoom,
    rotation: k.rotation,
    panX: k.panX,
    panY: k.panY,
  });
  if (frame <= keys[0].frame) return pick(keys[0]);
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return pick(last);
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1].frame <= frame) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = easeFn(a.ease, (frame - a.frame) / Math.max(1, b.frame - a.frame));
  return {
    zoom: a.zoom + (b.zoom - a.zoom) * t,
    rotation: a.rotation + (b.rotation - a.rotation) * t,
    panX: a.panX + (b.panX - a.panX) * t,
    panY: a.panY + (b.panY - a.panY) * t,
  };
}

function hash(i: number, seed: number) {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
function noise1(t: number, seed: number) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i, seed) + (hash(i + 1, seed) - hash(i, seed)) * u;
}
function shakeNoise(t: number, seed: number) {
  return noise1(t, seed) * 0.7 + noise1(t * 2.3, seed + 7) * 0.3;
}

export function srcToOut(c: Cam, sx: number, sy: number): [number, number] {
  const dx = (sx - c.lx) * c.z;
  const dy = (sy - c.ly) * c.z;
  const cs = Math.cos(c.rot);
  const sn = Math.sin(c.rot);
  return [c.ax + dx * cs - dy * sn, c.ay + dx * sn + dy * cs];
}

export function outToSrc(c: Cam, ox: number, oy: number): [number, number] {
  const dx = ox - c.ax;
  const dy = oy - c.ay;
  const cs = Math.cos(-c.rot);
  const sn = Math.sin(-c.rot);
  return [c.lx + (dx * cs - dy * sn) / c.z, c.ly + (dx * sn + dy * cs) / c.z];
}

export function applyCam(ctx: CanvasRenderingContext2D, c: Cam) {
  ctx.translate(c.ax, c.ay);
  ctx.rotate(c.rot);
  ctx.scale(c.z, c.z);
  ctx.translate(-c.lx, -c.ly);
}

export function identityCam(srcW: number, srcH: number, outW: number, outH: number, contain: boolean): Cam {
  const z = contain ? Math.min(outW / srcW, outH / srcH) : Math.max(outW / srcW, outH / srcH);
  return { lx: srcW / 2, ly: srcH / 2, rot: 0, z, ax: outW / 2, ay: outH / 2 };
}

export function camAt(p: CamPath, f: number): Cam {
  const n = p.n;
  if (f <= 0 || n === 1) f = Math.max(0, Math.min(f, 0));
  if (f >= n - 1) f = n - 1;
  const i = Math.floor(f);
  const j = Math.min(n - 1, i + 1);
  const t = f - i;
  const L = (a: Float32Array) => a[i] + (a[j] - a[i]) * t;
  return { lx: L(p.lx), ly: L(p.ly), rot: L(p.rot), z: L(p.z), ax: L(p.ax), ay: L(p.ay) };
}

/** Whether the transformed source fully covers the output (no borders visible). */
export function coversOutput(c: Cam, srcW: number, srcH: number, outW: number, outH: number) {
  const corners: [number, number][] = [
    [0, 0],
    [outW, 0],
    [0, outH],
    [outW, outH],
  ];
  for (const [x, y] of corners) {
    const [sx, sy] = outToSrc(c, x, y);
    if (sx < -0.5 || sy < -0.5 || sx > srcW + 0.5 || sy > srcH + 0.5) return false;
  }
  return true;
}

function requiredZoom(
  lx: number,
  ly: number,
  rot: number,
  ax: number,
  ay: number,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
) {
  const cs = Math.cos(-rot);
  const sn = Math.sin(-rot);
  let z = 0;
  for (const [ox, oy] of [
    [0, 0],
    [outW, 0],
    [0, outH],
    [outW, outH],
  ]) {
    const dx = ox - ax;
    const dy = oy - ay;
    const rx = dx * cs - dy * sn;
    const ry = dx * sn + dy * cs;
    if (rx > 0) z = Math.max(z, rx / Math.max(1e-3, srcW - lx));
    else if (rx < 0) z = Math.max(z, -rx / Math.max(1e-3, lx));
    if (ry > 0) z = Math.max(z, ry / Math.max(1e-3, srcH - ly));
    else if (ry < 0) z = Math.max(z, -ry / Math.max(1e-3, ly));
  }
  return z;
}

function buildPath(
  tracks: Track[],
  c: CameraSettings,
  keys: CameraKey[],
  fps: number,
  n: number,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
): CamPath {
  const k0 = Math.max(outW / srcW, outH / srcH);
  const lx = new Float32Array(n);
  const ly = new Float32Array(n);
  const rot = new Float32Array(n);
  const z = new Float32Array(n);
  const ax = new Float32Array(n);
  const ay = new Float32Array(n);

  let px: Float32Array | null = null;
  let py: Float32Array | null = null;
  let pr: Float32Array | null = null;
  let pscale: Float32Array | null = null;
  let f0 = 0;
  const t = c.targetId ? tracks.find((x) => x.id === c.targetId) : undefined;
  if (t) {
    const sm = resolveTrack(t, tracks, fps, srcW / srcH);
    if (sm.valid) {
      const sig = c.smoothing * c.smoothing * fps * 1.5;
      const m = sm.n;
      const xs = new Float32Array(m);
      const ys = new Float32Array(m);
      for (let i = 0; i < m; i++) {
        xs[i] = sm.x[i] * srcW;
        ys[i] = sm.y[i] * srcH;
      }
      px = gaussian(xs, sig);
      py = gaussian(ys, sig);
      pr = gaussian(sm.r, sig);
      pscale = gaussian(sm.s, sig);
      f0 = Math.min(sm.first, m - 1);
    }
  }

  for (let f = 0; f < n; f++) {
    let cx = srcW / 2;
    let cy = srcH / 2;
    let r = 0;
    let zm = 1;
    if (px && py && pr && pscale) {
      const i = Math.min(f, px.length - 1);
      if (c.anchor === "start") {
        cx = srcW / 2 + c.follow * (px[i] - px[f0]);
        cy = srcH / 2 + c.follow * (py[i] - py[f0]);
      } else {
        cx = srcW / 2 + c.follow * (px[i] - srcW / 2);
        cy = srcH / 2 + c.follow * (py[i] - srcH / 2);
      }
      r = -c.lockRotation * (pr[i] - pr[f0]);
      const rel = pscale[i] / Math.max(1e-4, pscale[f0]);
      zm = clamp(1 + c.lockScale * (1 / Math.max(1e-3, rel) - 1), 0.25, 4);
    }
    const v = camValuesAt(c, keys, f);
    let sx = 0;
    let sy = 0;
    let sr = 0;
    if (c.shake > 0) {
      const tt = (f / fps) * (0.6 + c.shakeSpeed * 5);
      sx = shakeNoise(tt, 1) * c.shake * 0.035 * outW;
      sy = shakeNoise(tt, 2) * c.shake * 0.035 * outH;
      sr = shakeNoise(tt, 3) * c.shake * 0.03;
    }
    lx[f] = cx;
    ly[f] = cy;
    rot[f] = r + (v.rotation * Math.PI) / 180 + sr;
    z[f] = k0 * v.zoom * zm;
    ax[f] = outW / 2 + v.panX * outW + sx;
    ay[f] = outH / 2 + v.panY * outH + sy;
  }

  if (c.fill === "autozoom") {
    let F = 1;
    for (let f = 0; f < n; f++) {
      F = Math.max(F, requiredZoom(lx[f], ly[f], rot[f], ax[f], ay[f], srcW, srcH, outW, outH) / z[f]);
    }
    F = Math.min(F, 3);
    if (F > 1) for (let f = 0; f < n; f++) z[f] *= F;
  }
  return { n, lx, ly, rot, z, ax, ay };
}

const memo: { args: unknown[]; path: CamPath }[] = [];

export function getCameraPath(
  tracks: Track[],
  camera: CameraSettings,
  keys: CameraKey[],
  fps: number,
  n: number,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
): CamPath {
  const args = [tracks, camera, keys, fps, n, srcW, srcH, outW, outH];
  for (const m of memo) if (m.args.every((v, i) => v === args[i])) return m.path;
  const path = buildPath(tracks, camera, keys, fps, n, srcW, srcH, outW, outH);
  memo.unshift({ args, path });
  if (memo.length > 2) memo.pop();
  return path;
}

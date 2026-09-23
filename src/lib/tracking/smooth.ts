import type { Sample, Track } from "./types";

/** Dense, gap-filled, smoothed trajectory (x/y normalized, s relative scale, r radians). */
export interface Smoothed {
  n: number;
  x: Float32Array;
  y: Float32Array;
  s: Float32Array;
  r: Float32Array;
  valid: boolean;
  first: number;
  last: number;
}

function empty(n: number): Smoothed {
  return {
    n,
    x: new Float32Array(n).fill(0.5),
    y: new Float32Array(n).fill(0.5),
    s: new Float32Array(n).fill(1),
    r: new Float32Array(n),
    valid: false,
    first: 0,
    last: 0,
  };
}

/** Zero-phase gaussian smoothing (edge-clamped). */
export function gaussian(src: Float32Array, sigma: number): Float32Array {
  if (sigma < 0.3) return src;
  const n = src.length;
  const r = Math.ceil(sigma * 3);
  const k = new Float32Array(2 * r + 1);
  let ks = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + r] = v;
    ks += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= ks;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = -r; j <= r; j++) {
      let idx = i + j;
      if (idx < 0) idx = 0;
      else if (idx >= n) idx = n - 1;
      s += src[idx] * k[j + r];
    }
    out[i] = s;
  }
  return out;
}

function median3(a: Float32Array): Float32Array {
  const n = a.length;
  if (n < 3) return a;
  const out = new Float32Array(n);
  out[0] = a[0];
  out[n - 1] = a[n - 1];
  for (let i = 1; i < n - 1; i++) {
    const p = a[i - 1];
    const q = a[i];
    const r = a[i + 1];
    out[i] = Math.max(Math.min(p, q), Math.min(Math.max(p, q), r));
  }
  return out;
}

export function sigmaFor(smoothing: number, fps: number) {
  return 0.35 + smoothing * smoothing * fps * 0.6;
}

function computeSmoothed(samples: (Sample | null)[], smoothing: number, fps: number): Smoothed {
  const n = samples.length;
  let good: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = samples[i];
    if (p && p.c >= 0.35) good.push(i);
  }
  if (!good.length) {
    good = [];
    for (let i = 0; i < n; i++) if (samples[i]) good.push(i);
  }
  if (!good.length) return empty(n);

  // Also collect "weak" samples (conf > 0 but < 0.35) — these are predicted
  // positions during brief tracking losses. We'll use them for interpolation
  // so the track stays smooth through gaps instead of jumping.
  const weak = new Set<number>();
  for (let i = 0; i < n; i++) {
    const p = samples[i];
    if (p && p.c > 0 && p.c < 0.35) weak.add(i);
  }

  // unwrap rotation over the good samples
  const gr = new Float32Array(good.length);
  let prevR = samples[good[0]]!.r;
  for (let k = 0; k < good.length; k++) {
    let v = samples[good[k]]!.r;
    if (k > 0) {
      while (v - prevR > Math.PI) v -= Math.PI * 2;
      while (v - prevR < -Math.PI) v += Math.PI * 2;
    }
    gr[k] = v;
    prevR = v;
  }

  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const s = new Float32Array(n);
  const r = new Float32Array(n);
  const lastK = good.length - 1;
  let k = 0;
  for (let i = 0; i < n; i++) {
    while (k < lastK && good[k + 1] <= i) k++;
    if (i <= good[0] || k === lastK) {
      const kk = i <= good[0] ? 0 : lastK;
      const p = samples[good[kk]]!;
      x[i] = p.x;
      y[i] = p.y;
      s[i] = p.s;
      r[i] = gr[kk];
    } else if (weak.has(i)) {
      // Use the weak (predicted) sample directly — it's the momentum-predicted
      // position which is more accurate than linear interpolation for fast motion.
      const p = samples[i]!;
      x[i] = p.x;
      y[i] = p.y;
      s[i] = p.s;
      r[i] = p.r;
    } else {
      const a = samples[good[k]]!;
      const b = samples[good[k + 1]]!;
      const t = (i - good[k]) / (good[k + 1] - good[k]);
      x[i] = a.x + (b.x - a.x) * t;
      y[i] = a.y + (b.y - a.y) * t;
      s[i] = a.s + (b.s - a.s) * t;
      r[i] = gr[k] + (gr[k + 1] - gr[k]) * t;
    }
  }
  const sig = sigmaFor(smoothing, fps);
  const pre = smoothing > 0.04;
  return {
    n,
    x: gaussian(pre ? median3(x) : x, sig),
    y: gaussian(pre ? median3(y) : y, sig),
    s: gaussian(s, sig),
    r: gaussian(r, sig),
    valid: true,
    first: good[0],
    last: good[lastK],
  };
}

const cache = new WeakMap<Track, { fps: number; sm: Smoothed }>();

export function smoothTrack(t: Track, fps: number): Smoothed {
  const hit = cache.get(t);
  if (hit && hit.fps === fps) return hit.sm;
  const sm = computeSmoothed(t.samples, t.smoothing, fps);
  cache.set(t, { fps, sm });
  return sm;
}

const pairCache = new Map<
  string,
  { a: Track; b: Track; self: Track; fps: number; aspect: number; sm: Smoothed }
>();

/** Resolves any track (incl. 2-point "pair" tracks) to a smoothed trajectory. */
export function resolveTrack(t: Track, tracks: Track[], fps: number, aspect: number): Smoothed {
  if (t.type !== "pair") return smoothTrack(t, fps);
  const [ia, ib] = t.pair ?? ["", ""];
  const A = tracks.find((x) => x.id === ia);
  const B = tracks.find((x) => x.id === ib);
  if (!A || !B) return empty(t.samples.length);
  const hit = pairCache.get(t.id);
  if (hit && hit.a === A && hit.b === B && hit.self === t && hit.fps === fps && hit.aspect === aspect)
    return hit.sm;
  const sa = smoothTrack(A, fps);
  const sb = smoothTrack(B, fps);
  const n = Math.min(sa.n, sb.n);
  if (!sa.valid || !sb.valid || n === 0) return empty(t.samples.length);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const s = new Float32Array(n);
  const r = new Float32Array(n);
  const ang = new Float32Array(n);
  const dist = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    x[i] = (sa.x[i] + sb.x[i]) / 2;
    y[i] = (sa.y[i] + sb.y[i]) / 2;
    const dx = (sb.x[i] - sa.x[i]) * aspect;
    const dy = sb.y[i] - sa.y[i];
    let a = Math.atan2(dy, dx);
    if (i > 0) {
      while (a - prev > Math.PI) a -= Math.PI * 2;
      while (a - prev < -Math.PI) a += Math.PI * 2;
    }
    ang[i] = a;
    prev = a;
    dist[i] = Math.hypot(dx, dy);
  }
  const f0 = Math.min(n - 1, Math.max(sa.first, sb.first));
  const d0 = Math.max(1e-6, dist[f0]);
  for (let i = 0; i < n; i++) {
    r[i] = ang[i] - ang[f0];
    s[i] = dist[i] / d0;
  }
  const sig = sigmaFor(t.smoothing, fps);
  const sm: Smoothed = {
    n,
    x: gaussian(x, sig),
    y: gaussian(y, sig),
    s: gaussian(s, sig),
    r: gaussian(r, sig),
    valid: true,
    first: f0,
    last: Math.min(sa.last, sb.last),
  };
  pairCache.set(t.id, { a: A, b: B, self: t, fps, aspect, sm });
  return sm;
}

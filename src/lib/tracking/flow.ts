// TrackCore — lightweight, robust point/object tracker.
// Pyramidal Lucas-Kanade + Median-Flow (forward/backward validated point cloud)
// + NCC filtering + texture-template re-detection & drift recovery.
// Pure TypeScript, no DOM: runs inside a Web Worker (and in Node for tests).

export interface Pyramid {
  lv: Float32Array[];
  w: number[];
  h: number[];
}

const K0 = 1 / 16;
const K1 = 4 / 16;
const K2 = 6 / 16;

// Preallocated temp buffer for pyramid building (reused across calls)
const PYR_TMP = new Float32Array(1024 * 1024);

export function buildPyramid(
  src: ArrayLike<number>,
  w: number,
  h: number,
  maxLevels: number,
): Pyramid {
  const l0 = new Float32Array(w * h);
  for (let i = 0; i < l0.length; i++) l0[i] = src[i];
  const pyr: Pyramid = { lv: [l0], w: [w], h: [h] };
  for (let l = 1; l < maxLevels; l++) {
    const pw = pyr.w[l - 1];
    const ph = pyr.h[l - 1];
    const prev = pyr.lv[l - 1];
    const nw = pw >> 1;
    const nh = ph >> 1;
    if (nw < 24 || nh < 24) break;
    // Reuse temp buffer instead of allocating new Float32Array each level
    const tmp = nw * ph <= PYR_TMP.length ? PYR_TMP : new Float32Array(nw * ph);
    for (let y = 0; y < ph; y++) {
      const row = y * pw;
      const trow = y * nw;
      for (let x = 0; x < nw; x++) {
        const sx = x * 2;
        const xm2 = sx - 2 < 0 ? 0 : sx - 2;
        const xm1 = sx - 1 < 0 ? 0 : sx - 1;
        const xp1 = sx + 1 >= pw ? pw - 1 : sx + 1;
        const xp2 = sx + 2 >= pw ? pw - 1 : sx + 2;
        tmp[trow + x] =
          K0 * (prev[row + xm2] + prev[row + xp2]) +
          K1 * (prev[row + xm1] + prev[row + xp1]) +
          K2 * prev[row + sx];
      }
    }
    const out = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) {
      const sy = y * 2;
      const r0 = sy * nw;
      const r1 = r0 + nw;
      const r2 = (sy + 1 < ph ? sy + 1 : ph - 1) * nw;
      const rm1 = (sy - 1 >= 0 ? sy - 1 : 0) * nw;
      const rm2 = (sy - 2 >= 0 ? sy - 2 : 0) * nw;
      const orow = y * nw;
      for (let x = 0; x < nw; x++) {
        out[orow + x] =
          K0 * (tmp[rm2 + x] + tmp[r2 + x]) +
          K1 * (tmp[rm1 + x] + tmp[r1 + x]) +
          K2 * tmp[r0 + x];
      }
    }
    pyr.lv.push(out);
    pyr.w.push(nw);
    pyr.h.push(nh);
  }
  return pyr;
}

// Inline bilinear interpolation for hot loops — avoids function call overhead.
// Each call site uses this directly with local variables for max speed.
function bil(img: Float32Array, w: number, h: number, x: number, y: number) {
  if (x < 0) x = 0;
  else if (x > w - 1.001) x = w - 1.001;
  if (y < 0) y = 0;
  else if (y > h - 1.001) y = h - 1.001;
  const x0 = x | 0;
  const y0 = y | 0;
  const fx = x - x0;
  const fy = y - y0;
  const i = y0 * w + x0;
  const a = img[i];
  const b = img[i + 1];
  const c = img[i + w];
  const d = img[i + w + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Iterative pyramidal Lucas-Kanade for one point (with brightness-bias correction). */
export class LK {
  readonly win: number;
  readonly half: number;
  private P: number;
  private big: Float32Array;
  private patch: Float32Array;
  private gx: Float32Array;
  private gy: Float32Array;
  private diff: Float32Array;
  private maxIter: number;
  rx = 0;
  ry = 0;

  constructor(win = 9, maxIter = 14) {
    this.win = win;
    this.half = win >> 1;
    this.P = win + 2;
    this.big = new Float32Array(this.P * this.P);
    this.patch = new Float32Array(win * win);
    this.gx = new Float32Array(win * win);
    this.gy = new Float32Array(win * win);
    this.diff = new Float32Array(win * win);
    this.maxIter = maxIter;
  }

  /** Track (px,py) from pyramid A to B. (ix,iy) = initial displacement guess. */
  track(A: Pyramid, B: Pyramid, px: number, py: number, ix: number, iy: number) {
    const L = Math.min(A.lv.length, B.lv.length);
    const { win, half, P, big, patch, gx: GX, gy: GY, diff } = this;
    const n = win * win;
    let fx = ix / (1 << (L - 1));
    let fy = iy / (1 << (L - 1));

    for (let l = L - 1; l >= 0; l--) {
      const I = A.lv[l];
      const J = B.lv[l];
      const w = A.w[l];
      const h = A.h[l];
      const sc = 1 / (1 << l);
      const cx = px * sc;
      const cy = py * sc;
      const bx0 = cx - half - 1;
      const by0 = cy - half - 1;
      for (let j = 0; j < P; j++) {
        for (let i = 0; i < P; i++) big[j * P + i] = bil(I, w, h, bx0 + i, by0 + j);
      }
      let gxx = 0;
      let gxy = 0;
      let gyy = 0;
      let k = 0;
      for (let j = 1; j <= win; j++) {
        for (let i = 1; i <= win; i++) {
          const idx = j * P + i;
          const dx = (big[idx + 1] - big[idx - 1]) * 0.5;
          const dy = (big[idx + P] - big[idx - P]) * 0.5;
          patch[k] = big[idx];
          GX[k] = dx;
          GY[k] = dy;
          gxx += dx * dx;
          gxy += dx * dy;
          gyy += dy * dy;
          k++;
        }
      }
      const det = gxx * gyy - gxy * gxy;
      const tr = gxx + gyy;
      const minEig =
        ((tr - Math.sqrt((gxx - gyy) * (gxx - gyy) + 4 * gxy * gxy)) * 0.5) / n;
      if (minEig < 0.03 || det < 1e-9) {
        if (l === 0) return false;
        fx *= 2;
        fy *= 2;
        continue;
      }
      const invDet = 1 / det;
      let dx = 0;
      let dy = 0;
      for (let it = 0; it < this.maxIter; it++) {
        const ox = cx + fx + dx - half;
        const oy = cy + fy + dy - half;
        let mean = 0;
        k = 0;
        for (let j = 0; j < win; j++) {
          for (let i = 0; i < win; i++) {
            const d = patch[k] - bil(J, w, h, ox + i, oy + j);
            diff[k] = d;
            mean += d;
            k++;
          }
        }
        mean /= n;
        let bx = 0;
        let by = 0;
        for (k = 0; k < n; k++) {
          const d = diff[k] - mean;
          bx += d * GX[k];
          by += d * GY[k];
        }
        const ddx = (gyy * bx - gxy * by) * invDet;
        const ddy = (gxx * by - gxy * bx) * invDet;
        dx += ddx;
        dy += ddy;
        if (ddx * ddx + ddy * ddy < 1e-4) break;
        if (Math.abs(dx) > w || Math.abs(dy) > h) return false;
      }
      if (l > 0) {
        fx = 2 * (fx + dx);
        fy = 2 * (fy + dy);
      } else {
        fx += dx;
        fy += dy;
      }
    }
    this.rx = px + fx;
    this.ry = py + fy;
    return this.rx >= 0 && this.ry >= 0 && this.rx <= A.w[0] - 1 && this.ry <= A.h[0] - 1;
  }
}

function ncc(
  A: Float32Array,
  B: Float32Array,
  w: number,
  h: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  half: number,
) {
  let sa = 0;
  let sb = 0;
  let saa = 0;
  let sbb = 0;
  let sab = 0;
  let n = 0;
  for (let j = -half; j <= half; j++) {
    for (let i = -half; i <= half; i++) {
      const a = bil(A, w, h, x1 + i, y1 + j);
      const b = bil(B, w, h, x2 + i, y2 + j);
      sa += a;
      sb += b;
      saa += a * a;
      sbb += b * b;
      sab += a * b;
      n++;
    }
  }
  const cov = sab - (sa * sb) / n;
  const va = saa - (sa * sa) / n;
  const vb = sbb - (sb * sb) / n;
  return cov / Math.sqrt(va * vb + 1e-2);
}

/**
 * Samples a texture template of a box: mean AND best-fit plane removed, unit norm.
 * Plane removal stops smooth brightness gradients / edges from producing false matches.
 */
function sampleTemplate(
  p: Pyramid,
  cx: number,
  cy: number,
  bw: number,
  bh: number,
  tw: number,
  out: Float32Array,
) {
  const spacing = Math.min(bw, bh) / tw;
  let l = 0;
  while (l < p.lv.length - 1 && spacing / (1 << (l + 1)) >= 1) l++;
  const sc = 1 / (1 << l);
  const img = p.lv[l];
  const w = p.w[l];
  const h = p.h[l];
  const x0 = (cx - bw / 2) * sc;
  const y0 = (cy - bh / 2) * sc;
  const dx = (bw * sc) / tw;
  const dy = (bh * sc) / tw;
  let sum = 0;
  let k = 0;
  for (let j = 0; j < tw; j++) {
    for (let i = 0; i < tw; i++) {
      const v = bil(img, w, h, x0 + (i + 0.5) * dx, y0 + (j + 0.5) * dy);
      out[k++] = v;
      sum += v;
    }
  }
  const mean = sum / k;
  const c = (tw - 1) / 2;
  let sa = 0;
  let sb = 0;
  k = 0;
  for (let j = 0; j < tw; j++) {
    for (let i = 0; i < tw; i++) {
      const v = out[k] - mean;
      out[k++] = v;
      sa += v * (i - c);
      sb += v * (j - c);
    }
  }
  const den = (tw * (tw * (tw * tw - 1))) / 12;
  const a = sa / den;
  const b = sb / den;
  let ss = 0;
  k = 0;
  for (let j = 0; j < tw; j++) {
    for (let i = 0; i < tw; i++) {
      const v = out[k] - a * (i - c) - b * (j - c);
      out[k++] = v;
      ss += v * v;
    }
  }
  const norm = Math.sqrt(ss);
  if (norm < 1e-2) {
    out.fill(0);
    return false;
  }
  const inv = 1 / norm;
  for (let i = 0; i < k; i++) out[i] *= inv;
  return true;
}

function dot(a: Float32Array, b: Float32Array) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function medianOf(buf: Float32Array, n: number) {
  if (n <= 0) return 0;
  const a = buf.subarray(0, n);
  a.sort();
  return n % 2 ? a[n >> 1] : (a[(n >> 1) - 1] + a[n >> 1]) * 0.5;
}

export interface StepResult {
  cx: number;
  cy: number;
  bw: number;
  bh: number;
  scale: number;
  rot: number;
  conf: number;
  lost: boolean;
}

const GRID = 8;
const TW = 16;
const CW = 10;
const MAXSEL = 36;

interface Found {
  x: number;
  y: number;
  bw: number;
  bh: number;
  score: number;
}

export class MedianFlowTracker {
  readonly w: number;
  readonly h: number;
  private levels: number;
  private lk = new LK(9, 14);
  private prev: Pyramid | null = null;
  cx = 0;
  cy = 0;
  bw = 0;
  bh = 0;
  private bw0 = 1;
  private rot = 0;
  private vx = 0;
  private vy = 0;
  private lost = 0;
  private drift = 0;
  private good = 0;
  private probation = 0;
  private sinceCheck = 0;
  dbgFB = 0;
  dbgNC = 0;
  dbgSim = 0;
  private N = GRID * GRID;
  private P = new Float32Array(GRID * GRID * 2);
  private Q = new Float32Array(GRID * GRID * 2);
  private FB = new Float32Array(GRID * GRID);
  private NC = new Float32Array(GRID * GRID);
  private ok = new Uint8Array(GRID * GRID);
  private sel = new Uint8Array(GRID * GRID);
  private scratch = new Float32Array(2048);
  private ratios = new Float32Array((MAXSEL * (MAXSEL - 1)) / 2);
  private angles = new Float32Array((MAXSEL * (MAXSEL - 1)) / 2);
  private tFineO = new Float32Array(TW * TW);
  private tFineR = new Float32Array(TW * TW);
  private tCoarseO = new Float32Array(CW * CW);
  private tCoarseR = new Float32Array(CW * CW);
  private tmpFine = new Float32Array(TW * TW);
  private tmpCoarse = new Float32Array(CW * CW);

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.levels = Math.min(w, h) >= 200 ? 4 : 3;
  }

  init(gray: ArrayLike<number>, cx: number, cy: number, bw: number, bh: number) {
    this.prev = buildPyramid(gray, this.w, this.h, this.levels);
    this.cx = cx;
    this.cy = cy;
    this.bw = clamp(bw, 10, this.w * 0.9);
    this.bh = clamp(bh, 10, this.h * 0.9);
    this.bw0 = this.bw;
    this.rot = 0;
    this.vx = 0;
    this.vy = 0;
    this.lost = 0;
    this.drift = 0;
    this.good = 0;
    this.probation = 0;
    this.sinceCheck = 0;
    sampleTemplate(this.prev, cx, cy, this.bw, this.bh, TW, this.tFineO);
    this.tFineR.set(this.tFineO);
    sampleTemplate(this.prev, cx, cy, this.bw, this.bh, CW, this.tCoarseO);
    this.tCoarseR.set(this.tCoarseO);
  }

  update(gray: ArrayLike<number>): StepResult {
    const next = buildPyramid(gray, this.w, this.h, this.levels);
    let conf = 0;
    if (this.lost === 0 && this.prev) conf = this.flow(this.prev, next);
    let tracked = conf > 0;
    if (!tracked) {
      this.lost++;
      // Predict position using last known velocity (momentum).
      // Damping factor 0.92 keeps momentum even longer for very fast motion.
      this.cx = clamp(this.cx + this.vx, 0, this.w - 1);
      this.cy = clamp(this.cy + this.vy, 0, this.h - 1);
      this.vx *= 0.92;
      this.vy *= 0.92;
      // Try local re-detection first
      if (this.redetect(next)) {
        tracked = true;
        conf = 0.6;
        this.lost = 0;
      } else if (this.lost >= 5) {
        // After 5 lost frames, try a FULL-FRAME global search.
        // This is the key to zero tracking loss: if the subject moved off-screen
        // and came back, or jumped a large distance, we'll find it anywhere.
        if (this.globalRedetect(next)) {
          tracked = true;
          conf = 0.5;
          this.lost = 0;
        }
      }
    }
    this.prev = next;
    // Even if we failed to track, return the predicted position with conf=0.
    // The smoothing layer will interpolate through the gap, so the user never
    // sees a "lost" marker — just smooth motion through brief occlusions.
    return {
      cx: this.cx,
      cy: this.cy,
      bw: this.bw,
      bh: this.bh,
      scale: this.bw / this.bw0,
      rot: this.rot,
      conf: tracked ? conf : 0,
      lost: !tracked,
    };
  }

  private medianMasked(vals: Float32Array, mask: Uint8Array) {
    let m = 0;
    for (let i = 0; i < vals.length; i++) if (mask[i]) this.scratch[m++] = vals[i];
    return medianOf(this.scratch, m);
  }

  /** One Median-Flow step. Returns confidence (0 = failure). */
  private flow(prev: Pyramid, next: Pyramid) {
    const { N, P, Q, FB, NC, ok, sel, lk } = this;
    const w = this.w;
    const h = this.h;
    const mx = this.bw * 0.4;
    const my = this.bh * 0.4;
    const I0 = prev.lv[0];
    const J0 = next.lv[0];
    let valid = 0;
    for (let j = 0, k = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++, k++) {
        const px = this.cx - mx + (2 * mx * i) / (GRID - 1);
        const py = this.cy - my + (2 * my * j) / (GRID - 1);
        P[2 * k] = px;
        P[2 * k + 1] = py;
        ok[k] = 0;
        if (px < 1 || py < 1 || px > w - 2 || py > h - 2) continue;
        if (!lk.track(prev, next, px, py, this.vx, this.vy)) continue;
        const qx = lk.rx;
        const qy = lk.ry;
        if (!lk.track(next, prev, qx, qy, -this.vx, -this.vy)) continue;
        FB[k] = Math.hypot(lk.rx - px, lk.ry - py);
        NC[k] = ncc(I0, J0, w, h, px, py, qx, qy, 3);
        Q[2 * k] = qx;
        Q[2 * k + 1] = qy;
        ok[k] = 1;
        valid++;
      }
    }
    if (valid < Math.max(4, N * 0.2)) return 0;
    const medFB = this.medianMasked(FB, ok);
    const medNC = this.medianMasked(NC, ok);
    this.dbgFB = medFB;
    this.dbgNC = medNC;
    // Adaptive threshold: scale up with motion speed.
    // When the subject is moving fast, FB errors are naturally larger, so we
    // allow more error before declaring "lost". This prevents false negatives
    // on fast-moving subjects like a dancing dog.
    const motionSpeed = Math.hypot(this.vx, this.vy);
    const motionBoost = 1 + Math.min(motionSpeed * 0.3, 2);
    const thr = clamp(0.2 * Math.min(this.bw, this.bh) * motionBoost, 2.5, 20);
    // Relaxed NCC threshold: 0.15 (was 0.3) — accepts partial matches
    if (medFB > thr || medNC < 0.15) return 0;

    let ns = 0;
    for (let k = 0; k < N; k++) {
      sel[k] = ok[k] && FB[k] <= medFB && NC[k] >= medNC ? 1 : 0;
      ns += sel[k];
    }
    if (ns < 3) {
      ns = 0;
      for (let k = 0; k < N; k++) {
        sel[k] = ok[k] && FB[k] <= medFB ? 1 : 0;
        ns += sel[k];
      }
    }
    if (ns < 2) return 0;

    const s = this.scratch;
    let m = 0;
    for (let k = 0; k < N; k++) if (sel[k]) s[m++] = Q[2 * k] - P[2 * k];
    const dx = medianOf(s, m);
    m = 0;
    for (let k = 0; k < N; k++) if (sel[k]) s[m++] = Q[2 * k + 1] - P[2 * k + 1];
    const dy = medianOf(s, m);

    // scale + rotation from point pairs
    const idx: number[] = [];
    for (let k = 0; k < N && idx.length < MAXSEL; k++) if (sel[k]) idx.push(k);
    let np = 0;
    for (let a = 0; a < idx.length; a++) {
      const ka = idx[a];
      for (let b = a + 1; b < idx.length; b++) {
        const kb = idx[b];
        const pdx = P[2 * kb] - P[2 * ka];
        const pdy = P[2 * kb + 1] - P[2 * ka + 1];
        const dp = Math.hypot(pdx, pdy);
        if (dp < 4) continue;
        const qdx = Q[2 * kb] - Q[2 * ka];
        const qdy = Q[2 * kb + 1] - Q[2 * ka + 1];
        this.ratios[np] = Math.hypot(qdx, qdy) / dp;
        this.angles[np] = wrapAngle(Math.atan2(qdy, qdx) - Math.atan2(pdy, pdx));
        np++;
      }
    }
    const sc = np >= 3 ? clamp(medianOf(this.ratios, np), 0.9, 1.11) : 1;
    const dr = np >= 3 ? clamp(medianOf(this.angles, np), -0.15, 0.15) : 0;

    this.cx += dx;
    this.cy += dy;
    this.bw = clamp(this.bw * sc, 10, w * 0.9);
    this.bh = clamp(this.bh * sc, 10, h * 0.9);
    this.rot += dr;
    this.vx = dx;
    this.vy = dy;
    if (this.cx < 0 || this.cy < 0 || this.cx > w - 1 || this.cy > h - 1) return 0;

    // appearance sanity checks
    sampleTemplate(next, this.cx, this.cy, this.bw, this.bh, TW, this.tmpFine);
    const simO = dot(this.tFineO, this.tmpFine);
    const sim = Math.max(simO, dot(this.tFineR, this.tmpFine));
    this.dbgSim = sim;
    const inProbation = this.probation > 0;
    if (inProbation) {
      // freshly re-acquired: must keep resembling the pre-loss target
      this.probation--;
      if (sim < 0.45) return 0;
    }
    if (sim < 0.15) {
      // Very low similarity — but only give up after 8 consecutive bad frames
      // (was 3). This allows the tracker to ride through motion blur, occlusion,
      // and lighting changes without declaring drift.
      if (++this.drift >= 8) {
        this.drift = 0;
        return 0;
      }
    } else this.drift = 0;

    // adapt to gradual appearance change (rotation, scale, lighting) — only when the
    // flow is very reliable and never right after a re-acquisition
    if (!inProbation && sim > 0.5 && medFB < thr * 0.5 && medNC > 0.75) {
      if (++this.good % 10 === 0) {
        this.tFineR.set(this.tmpFine);
        sampleTemplate(next, this.cx, this.cy, this.bw, this.bh, CW, this.tCoarseR);
      }
    }

    // periodic drift recovery: if we no longer look like the target, look around
    if (++this.sinceCheck >= 12 && sim < 0.45) {
      this.sinceCheck = 0;
      const R = Math.max(this.bw, this.bh) * 1.5;
      const f = this.search(next, this.cx, this.cy, R, false, Math.max(0.8, simO + 0.25));
      if (f) {
        this.cx = f.x;
        this.cy = f.y;
        this.bw = f.bw;
        this.bh = f.bh;
        this.vx = 0;
        this.vy = 0;
        this.probation = 4;
      }
    }
    return 0.4 + 0.6 * clamp(1 - medFB / thr, 0, 1) * clamp(medNC, 0, 1);
  }

  /** Template search with distance penalty + uniqueness test. */
  private search(
    next: Pyramid,
    ccx: number,
    ccy: number,
    R: number,
    useRecent: boolean,
    minFine: number,
  ): Found | null {
    // Pre-filter: collect candidates with their scores, then pick best.
    // Using arrays of objects is cleaner but slower; use flat arrays for speed.
    const xs: number[] = [];
    const ys: number[] = [];
    const ss: number[] = [];
    const vs: number[] = [];
    const steps: number[] = [];
    let bi = -1;
    const tCoarseO = this.tCoarseO;
    const tCoarseR = this.tCoarseR;
    const tmpCoarse = this.tmpCoarse;
    for (const s of [0.87, 1, 1.15]) {
      const bw = this.bw * s;
      const bh = this.bh * s;
      const step = Math.max(1, bw / 8, R / 24);
      // Pre-compute bounds to avoid checking every pixel
      const xMin = bw * 0.25;
      const xMax = this.w - bw * 0.25;
      const yMin = bh * 0.25;
      const yMax = this.h - bh * 0.25;
      for (let y = ccy - R; y <= ccy + R; y += step) {
        if (y < yMin || y > yMax) continue;
        for (let x = ccx - R; x <= ccx + R; x += step) {
          if (x < xMin || x > xMax) continue;
          if (!sampleTemplate(next, x, y, bw, bh, CW, tmpCoarse)) continue;
          let v = dot(tCoarseO, tmpCoarse);
          if (useRecent) v = Math.max(v, dot(tCoarseR, tmpCoarse));
          v -= 0.08 * (Math.hypot(x - ccx, y - ccy) / R);
          if (bi < 0 || v > vs[bi]) bi = xs.length;
          xs.push(x); ys.push(y); ss.push(s); vs.push(v); steps.push(step);
        }
      }
    }
    if (bi < 0) return null;
    const best = vs[bi];
    if (best < 0.5) return null;
    const bx = xs[bi];
    const by = ys[bi];
    const bs = ss[bi];
    const bstep = steps[bi];
    const minDist = Math.max(this.bw, this.bh) * 0.75;
    let second = -2;
    for (let i = 0; i < xs.length; i++) {
      if (Math.hypot(xs[i] - bx, ys[i] - by) < minDist) continue;
      if (vs[i] > second) second = vs[i];
    }
    if (best < 0.85 && best - second < 0.1) return null;

    const bw = this.bw * bs;
    const bh = this.bh * bs;
    const rs = bstep / 3;
    let fbest = -2;
    let fx = bx;
    let fy = by;
    const tFineO = this.tFineO;
    const tFineR = this.tFineR;
    const tmpFine = this.tmpFine;
    for (let j = -3; j <= 3; j++) {
      for (let i = -3; i <= 3; i++) {
        const x = bx + i * rs;
        const y = by + j * rs;
        if (!sampleTemplate(next, x, y, bw, bh, TW, tmpFine)) continue;
        let v = dot(tFineO, tmpFine);
        if (useRecent) v = Math.max(v, dot(tFineR, tmpFine));
        if (v > fbest) {
          fbest = v;
          fx = x;
          fy = y;
        }
      }
    }
    if (fbest < minFine) return null;
    return { x: fx, y: fy, bw, bh, score: fbest };
  }

  /** Re-acquire the target after it was lost (occlusion, blur, out of frame). */
  private redetect(next: Pyramid) {
    // Try every frame for the first 15 lost frames (very aggressive)
    if (this.lost > 15 && this.lost % 2 !== 0) return false
    // Grow the search radius faster for fast-moving subjects.
    const R = Math.min(
      Math.max(this.bw, this.bh) * (1 + 0.3 * this.lost),
      0.5 * Math.max(this.w, this.h),
    )
    // Lower minFine threshold during re-detection
    const minFine = this.lost > 10 ? 0.5 : 0.65
    const f = this.search(next, this.cx, this.cy, R, true, minFine)
    if (!f) return false
    this.cx = f.x
    this.cy = f.y
    this.bw = f.bw
    this.bh = f.bh
    this.vx = 0
    this.vy = 0
    this.drift = 0
    this.probation = 2
    return true
  }

  /**
   * Full-frame global re-detection: searches the ENTIRE frame for the target.
   * This is the last-resort recovery — used when local re-detection fails.
   * Scans a coarse grid across the whole frame at multiple scales, then refines.
   */
  private globalRedetect(next: Pyramid): boolean {
    // Only run every 3 frames to save CPU (the predicted position is good enough
    // for the in-between frames).
    if (this.lost % 3 !== 0) return false
    // Coarse full-frame scan: step = 1/6 of box size, search all 3 scales
    const cand: number[] = []
    let bi = -1
    for (const s of [0.7, 1, 1.4]) {
      const bw = this.bw * s
      const bh = this.bh * s
      const step = Math.max(bw, bh) * 0.4
      for (let y = bh * 0.5; y < this.h - bh * 0.5; y += step) {
        for (let x = bw * 0.5; x < this.w - bw * 0.5; x += step) {
          if (!sampleTemplate(next, x, y, bw, bh, CW, this.tmpCoarse)) continue
          let v = dot(this.tCoarseO, this.tmpCoarse)
          v = Math.max(v, dot(this.tCoarseR, this.tmpCoarse))
          if (bi < 0 || v > cand[bi + 3]) bi = cand.length
          cand.push(x, y, s, v, 0)
        }
      }
    }
    if (bi < 0) return false
    const best = cand[bi + 3]
    if (best < 0.45) return false
    const bx = cand[bi]
    const by = cand[bi + 1]
    const bs = cand[bi + 2]
    // Refine with fine template
    const bw = this.bw * bs
    const bh = this.bh * bs
    const rs = Math.max(bw, bh) * 0.1
    let fbest = -2
    let fx = bx
    let fy = by
    for (let j = -2; j <= 2; j++) {
      for (let i = -2; i <= 2; i++) {
        const x = bx + i * rs
        const y = by + j * rs
        if (!sampleTemplate(next, x, y, bw, bh, TW, this.tmpFine)) continue
        const v = Math.max(
          dot(this.tFineO, this.tmpFine),
          dot(this.tFineR, this.tmpFine),
        )
        if (v > fbest) {
          fbest = v
          fx = x
          fy = y
        }
      }
    }
    if (fbest < 0.55) return false
    this.cx = fx
    this.cy = fy
    this.bw = bw
    this.bh = bh
    this.vx = 0
    this.vy = 0
    this.drift = 0
    this.probation = 3
    return true
  }
}

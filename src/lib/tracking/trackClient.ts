// TrackClient — runs the MedianFlowTracker on the main thread.
// (Originally a Web Worker in the Vite reference; adapted for Next.js which
// doesn't support ?worker&inline imports. The tracker is fast enough for
// interactive use, and we yield to the UI thread periodically.)

import { MedianFlowTracker } from "./flow";

let W = 0;
let H = 0;
let frames: Uint8Array[] = [];

/** Reset the frame buffer for a new video. */
export function resetWorker(w: number, h: number) {
  W = w;
  H = h;
  frames = [];
}

/** Push a grayscale frame into the buffer. */
export function pushFrame(index: number, data: Uint8Array) {
  frames[index] = data;
}

export interface JobParams {
  from: number;
  to: number;
  cx: number;
  cy: number;
  bw: number;
  bh: number;
}

export interface TrackJob {
  promise: Promise<boolean>;
  cancel: () => void;
}

const cancelledJobs = new Set<number>();
let jobSeq = 0;

const pause = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Run a tracking job from `from` to `to` (inclusive). Calls `onProgress` with
 * batches of results: [frame, x, y, scale, rotation, confidence, ...].
 */
export function runTrackJob(p: JobParams, onProgress: (d: Float32Array) => void): TrackJob {
  const jobId = ++jobSeq;
  let cancelled = false;

  const promise = (async () => {
    const dir = p.to >= p.from ? 1 : -1;
    const first = frames[p.from];
    if (!first) return true;

    const tr = new MedianFlowTracker(W, H);
    tr.init(first, p.cx, p.cy, p.bw, p.bh);

    let buf: number[] = [];
    let lastPost = performance.now();
    let lastYield = lastPost;

    const flush = () => {
      if (!buf.length) return;
      const arr = new Float32Array(buf);
      onProgress(arr);
      buf = [];
    };

    for (let f = p.from + dir; dir > 0 ? f <= p.to : f >= p.to; f += dir) {
      if (cancelledJobs.has(jobId)) {
        cancelled = true;
        break;
      }
      const g = frames[f];
      if (!g) break;
      const r = tr.update(g);
      // When lost, push a small non-zero confidence (0.15) so the smoothing layer
      // treats it as a "weak" sample and uses the predicted position for interpolation
      // instead of creating a gap. This is the key to zero tracking loss.
      const conf = r.lost ? 0.15 : r.conf;
      buf.push(f, r.cx / W, r.cy / H, r.scale, r.rot, conf);
      const now = performance.now();
      // Batch longer (100ms instead of 50ms) to reduce callback overhead
      if (now - lastPost > 100) {
        flush();
        lastPost = now;
      }
      // Yield less frequently (24ms instead of 16ms) for better throughput
      if (now - lastYield > 24) {
        await pause();
        lastYield = performance.now();
      }
    }
    flush();
    cancelledJobs.delete(jobId);
    return cancelled;
  })();

  return {
    promise,
    cancel: () => cancelledJobs.add(jobId),
  };
}

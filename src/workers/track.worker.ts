/// <reference lib="webworker" />
import { MedianFlowTracker } from "../lib/tracking/flow";

// Holds the grayscale analysis frames and runs tracking jobs off the main thread.
let W = 0;
let H = 0;
let frames: Uint8Array[] = [];
const cancelled = new Set<number>();

interface TrackMsg {
  type: "track";
  jobId: number;
  from: number;
  to: number;
  cx: number;
  cy: number;
  bw: number;
  bh: number;
}

type Msg =
  | { type: "init"; w: number; h: number }
  | { type: "frame"; index: number; data: Uint8Array }
  | TrackMsg
  | { type: "cancel"; jobId: number };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

const pause = () => new Promise<void>((r) => setTimeout(r, 0));

async function runJob(m: TrackMsg) {
  const dir = m.to >= m.from ? 1 : -1;
  const first = frames[m.from];
  if (!first) {
    ctx.postMessage({ type: "done", jobId: m.jobId, cancelled: false });
    return;
  }
  const tr = new MedianFlowTracker(W, H);
  tr.init(first, m.cx, m.cy, m.bw, m.bh);
  let buf: number[] = [];
  let lastPost = performance.now();
  let lastYield = lastPost;
  const flush = () => {
    if (!buf.length) return;
    const arr = new Float32Array(buf);
    ctx.postMessage({ type: "progress", jobId: m.jobId, data: arr }, [arr.buffer]);
    buf = [];
  };
  for (let f = m.from + dir; dir > 0 ? f <= m.to : f >= m.to; f += dir) {
    if (cancelled.has(m.jobId)) break;
    const g = frames[f];
    if (!g) break;
    const r = tr.update(g);
    buf.push(f, r.cx / W, r.cy / H, r.scale, r.rot, r.lost ? 0 : r.conf);
    const now = performance.now();
    if (now - lastPost > 50) {
      flush();
      lastPost = now;
    }
    if (now - lastYield > 16) {
      await pause(); // lets "cancel" messages in
      lastYield = performance.now();
    }
  }
  flush();
  const wasCancelled = cancelled.has(m.jobId);
  cancelled.delete(m.jobId);
  ctx.postMessage({ type: "done", jobId: m.jobId, cancelled: wasCancelled });
}

ctx.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data;
  switch (m.type) {
    case "init":
      W = m.w;
      H = m.h;
      frames = [];
      break;
    case "frame":
      frames[m.index] = m.data;
      break;
    case "track":
      runJob(m).catch((err) =>
        ctx.postMessage({ type: "error", jobId: m.jobId, message: String(err) }),
      );
      break;
    case "cancel":
      cancelled.add(m.jobId);
      break;
  }
};

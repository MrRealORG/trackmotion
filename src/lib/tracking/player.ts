import { store } from "./store";
import { clamp, frameAtTime } from "./util";
import type { Aspect } from "./types";

export const player = {
  video: null as HTMLVideoElement | null,
  /** mediaTime of the first frame as reported by the <video> element */
  elOffset: 0,
};

/** Midpoint of a frame's display interval (robust seeking). */
export function timeForFrame(f: number): number {
  const info = store.get().video;
  if (!info) return 0;
  const T = info.frameTimes;
  const n = T.length;
  const i = clamp(Math.round(f), 0, n - 1);
  const next = i < n - 1 ? T[i + 1] : T[i] + 1 / info.fps;
  return Math.min(Math.max(0, info.duration - 0.001), player.elOffset + (T[i] + next) / 2);
}

export function frameForTime(t: number): number {
  const info = store.get().video;
  if (!info) return 0;
  return frameAtTime(info.frameTimes, t - player.elOffset);
}

export function seek(f: number) {
  const st = store.get();
  const info = st.video;
  if (!info) return;
  const fr = clamp(Math.round(f), 0, info.frameCount - 1);
  store.set(st.playing ? { frame: fr, playing: false } : { frame: fr });
  const v = player.video;
  if (v && v.readyState >= 1) v.currentTime = timeForFrame(fr);
}

export function step(d: number) {
  seek(store.get().frame + d);
}

export function togglePlay() {
  const st = store.get();
  if (!st.video || !st.analysisReady) return;
  store.set({ playing: !st.playing });
}

export function outputSize(w: number, h: number, aspect: Aspect, short?: number) {
  const even = (x: number) => Math.max(2, Math.round(x / 2) * 2);
  if (aspect === "source") {
    if (!short) return { w: even(w), h: even(h) };
    const s = short / Math.min(w, h);
    return { w: even(w * s), h: even(h * s) };
  }
  const [a, b] = aspect.split(":").map(Number);
  const r = a / b;
  const base = short ?? Math.min(w, h);
  return r >= 1 ? { w: even(base * r), h: even(base) } : { w: even(base), h: even(base / r) };
}

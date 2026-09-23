export const uid = () => Math.random().toString(36).slice(2, 10);

export const TRACK_COLORS = [
  "#FFD60A",
  "#f472b6",
  "#4ade80",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#2dd4bf",
  "#f97316",
];

export const pickColor = (n: number) => TRACK_COLORS[n % TRACK_COLORS.length];

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export const EMOJIS = [
  "😎", "🕶️", "🔥", "⭐", "💥", "👑", "❤️", "🎯", "💫", "✨",
  "🚀", "😂", "🤯", "👀", "💪", "🎉", "💯", "🌟", "⚡", "🦄",
  "🎩", "🧢", "💎", "🌈", "🍕", "🎮", "😈", "👻", "💀", "🤡",
  "🐸", "🙈", "💨", "💧", "❄️", "🎵", "📍", "❌", "✅", "⚠️",
];

export function isLowEnd(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

/** Largest frame index whose presentation time <= t (small tolerance). */
export function frameAtTime(times: Float64Array, t: number): number {
  const n = times.length;
  if (n === 0) return 0;
  const tt = t + 0.004;
  if (tt <= times[0]) return 0;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (times[mid] <= tt) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function nextFrameId() {
  return Date.now() + Math.random();
}

'use client'

import { useEffect, useRef } from "react";
import { store, useApp } from "@/lib/tracking/store";
import { seek, step, togglePlay } from "@/lib/tracking/player";
import { fmtTime } from "@/lib/tracking/util";
import { Icon } from "./Icons";
import type { Track } from "@/lib/tracking/types";

function TrackBar({ track, n, selected }: { track: Track; n: number; selected: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const paint = () => {
      const w = Math.max(1, Math.round(cvs.clientWidth));
      if (cvs.width !== w) cvs.width = w;
      cvs.height = 8;
      const ctx = cvs.getContext("2d")!;
      ctx.clearRect(0, 0, w, 8);
      if (track.type === "pair") {
        ctx.fillStyle = track.color;
        ctx.globalAlpha = selected ? 0.95 : 0.55;
        ctx.fillRect(0, 1, w, 6);
        return;
      }
      for (let x = 0; x < w; x++) {
        const f0 = Math.floor((x / w) * n);
        const f1 = Math.max(f0 + 1, Math.floor(((x + 1) / w) * n));
        let minC = 2;
        for (let f = f0; f < f1 && f < n; f++) {
          const s = track.samples[f];
          const c = s ? s.c : -1;
          if (c < minC) minC = c;
        }
        if (minC === 2 || minC < 0) continue;
        ctx.globalAlpha = selected ? 1 : 0.6;
        // Only show red for truly lost frames (c < 0.1), not weak predictions (0.1-0.35)
        ctx.fillStyle = minC < 0.1 ? "#ef4444" : track.color;
        ctx.fillRect(x, 1, 1, 6);
      }
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(cvs);
    return () => ro.disconnect();
  }, [track, n, selected]);
  return <canvas ref={ref} className="block h-2 w-full" />;
}

export default function Timeline() {
  const video = useApp((s) => s.video);
  const frame = useApp((s) => s.frame);
  const playing = useApp((s) => s.playing);
  const tracks = useApp((s) => s.tracks);
  const keys = useApp((s) => s.keys);
  const loop = useApp((s) => s.loop);
  const muted = useApp((s) => s.muted);
  const ready = useApp((s) => s.analysisReady);
  const selectedTrackId = useApp((s) => s.selectedTrackId);
  const scrubRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  if (!video) return null;
  const n = video.frameCount;
  const pct = n > 1 ? (frame / (n - 1)) * 100 : 0;
  const time = video.frameTimes[Math.min(frame, n - 1)] ?? 0;

  const scrubTo = (clientX: number) => {
    const el = scrubRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    seek(Math.round(t * (n - 1)));
  };

  return (
    <div className="flex flex-col gap-2 border-t border-white/10 bg-black/80 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2">
        <button onClick={() => step(-1)} className="tl-btn" title="Previous frame (←)">
          <Icon name="prev" size={16} />
        </button>
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="flex h-8 min-w-[76px] items-center justify-center gap-1 rounded-lg bg-lock px-3 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-40"
          title="Play / pause (Space)"
        >
          {playing ? <><Icon name="pause" size={16} /> Pause</> : <><Icon name="play" size={16} /> Play</>}
        </button>
        <button onClick={() => step(1)} className="tl-btn" title="Next frame (→)">
          <Icon name="next" size={16} />
        </button>
        <div className="ml-1 font-mono text-xs text-white/80">
          {fmtTime(time)} <span className="text-white/30">/ {fmtTime(video.duration)}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden font-mono text-[10px] text-white/35 sm:inline">
            f {frame}/{n - 1} · {video.fps}fps
          </span>
          <button
            onClick={() => store.set({ loop: !loop })}
            className={`tl-btn ${loop ? "text-lock" : "text-white/40"}`}
            title="Loop"
          >
            <Icon name="loop" size={16} />
          </button>
          <button onClick={() => store.set({ muted: !muted })} className="tl-btn" title="Mute">
            <Icon name={muted ? "mute" : "volume"} size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrubRef}
        className="relative cursor-pointer select-none rounded-md bg-white/[0.04] px-0 py-1.5 ring-1 ring-white/5"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          scrubTo(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && scrubTo(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div className="relative h-3">
          {keys.map((k) => (
            <button
              key={k.id}
              title={`Camera keyframe · frame ${k.frame}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                seek(k.frame);
              }}
              className={`absolute top-0.5 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] border ${
                k.frame === frame ? "border-white bg-lock" : "border-lock/70 bg-lock/60"
              }`}
              style={{ left: `${(k.frame / Math.max(1, n - 1)) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex max-h-16 flex-col gap-[3px] overflow-hidden">
          {tracks.length === 0 && <div className="h-2 rounded bg-white/[0.04]" />}
          {tracks.map((t) => (
            <TrackBar key={t.id} track={t} n={n} selected={t.id === selectedTrackId} />
          ))}
        </div>
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-[2px] -translate-x-1/2 rounded bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

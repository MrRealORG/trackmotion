'use client'

import { useRef, useState } from "react";
import { store, useApp } from "@/lib/tracking/store";
import { exportProject, type ExportQuality, type ExportResult } from "@/lib/tracking/exporter";
import { outputSize } from "@/lib/tracking/player";
import { Seg, Toggle } from "./ui";
import { ExportReady } from "./ExportReady";
import { recordExport } from "@/lib/firebase";

type Res = "720" | "1080" | "source";

export default function ExportModal() {
  const open = useApp((s) => s.exportOpen);
  const video = useApp((s) => s.video);
  const aspect = useApp((s) => s.aspect);
  const [res, setRes] = useState<Res | null>(null);
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [audio, setAudio] = useState(true);
  const [prog, setProg] = useState<{ done: number; total: number; t0: number } | null>(null);
  const [result, setResult] = useState<(ExportResult & { url: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const ctlRef = useRef<AbortController | null>(null);

  if (!open || !video) return null;
  const srcShort = Math.min(video.width, video.height);
  const r: Res = res ?? (srcShort > 1080 ? "1080" : "source");
  const short = r === "source" ? Math.min(2160, srcShort) : Number(r);
  const size = outputSize(video.width, video.height, aspect, short);

  const start = async () => {
    const ctl = new AbortController();
    ctlRef.current = ctl;
    setError(null);
    setResult(null);
    const t0 = performance.now();
    setProg({ done: 0, total: video.frameCount, t0 });
    store.set({ playing: false });
    let last = 0;
    try {
      const out = await exportProject({
        state: store.get(),
        outW: size.w,
        outH: size.h,
        quality,
        audio,
        signal: ctl.signal,
        onProgress: (done, total) => {
          const now = performance.now();
          if (now - last > 100 || done === total) {
            last = now;
            setProg({ done, total, t0 });
          }
        },
      });
      setResult({ ...out, url: URL.createObjectURL(out.blob) });
      setShowAd(true);
      // Log the render in Cloud Firestore in real time
      void recordExport({
        name: `${video.name.replace(/\.[^.]+$/, "")} — ${r}p.${out.ext}`,
        resolution: `${r}p`,
        duration: video.duration,
        bytes: out.blob.size,
      });
    } catch (e) {
      if (!ctl.signal.aborted) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProg(null);
      ctlRef.current = null;
    }
  };

  const close = () => {
    ctlRef.current?.abort();
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProg(null);
    setError(null);
    setShowAd(false);
    store.set({ exportOpen: false });
  };

  const p = prog ? prog.done / Math.max(1, prog.total) : 0;
  const elapsed = prog ? (performance.now() - prog.t0) / 1000 : 0;
  const eta = prog && prog.done > 5 ? (elapsed / prog.done) * (prog.total - prog.done) : null;
  const outName = `${video.name.replace(/\.[^.]+$/, "")}-trackweb.${result?.ext ?? "mp4"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c1e] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{result ? "🎉 Your edit is ready" : "Export video"}</h2>
          <button onClick={close} className="rounded-lg px-2 py-1 text-white/50 hover:bg-white/10">
            ✕
          </button>
        </div>

        {result ? (
          <div className="flex flex-col gap-3">
            <video src={result.url} controls autoPlay loop playsInline className="max-h-[50vh] w-full rounded-lg bg-black" />
            {showAd ? (
              <ExportReady onComplete={() => setShowAd(false)} />
            ) : (
              <a
                href={result.url}
                download={outName}
                className="rounded-full bg-lock py-2.5 text-center font-semibold text-black hover:brightness-110"
              >
                Download {result.ext.toUpperCase()} ({(result.blob.size / 1e6).toFixed(1)} MB)
              </a>
            )}
            <button onClick={() => { setResult(null); setShowAd(false); }} className="text-xs text-white/50 hover:text-white/80">
              Export again with other settings
            </button>
          </div>
        ) : prog ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="text-sm text-white/70">Rendering frame {prog.done} / {prog.total}…</div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-lock transition-all" style={{ width: `${p * 100}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[11px] text-white/45">
              <span>{Math.round(p * 100)}%</span>
              <span>{eta !== null ? `~${Math.ceil(eta)}s left` : "starting…"}</span>
            </div>
            <button onClick={() => ctlRef.current?.abort()} className="mt-1 rounded-lg bg-white/10 py-2 text-sm hover:bg-white/15">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 text-xs text-white/50">Resolution</div>
              <Seg
                value={r}
                onChange={setRes}
                options={[
                  { value: "720", label: "720p" },
                  { value: "1080", label: "1080p" },
                  { value: "source", label: `Original (${Math.min(2160, srcShort)}p)` },
                ]}
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-white/50">Quality</div>
              <Seg
                value={quality}
                onChange={setQuality}
                options={[
                  { value: "standard", label: "Small file" },
                  { value: "high", label: "High" },
                  { value: "max", label: "Max" },
                ]}
              />
            </div>
            <Toggle label="Include original audio" checked={audio} onChange={setAudio} />
            <div className="rounded-lg bg-white/[0.04] p-3 text-[11px] leading-relaxed text-white/50">
              Output: <b className="text-white/80">{size.w}×{size.h}</b> · {video.fps} fps ·{" "}
              {video.webcodecs ? "MP4 (H.264), frame-exact, faster than realtime" : "WebM, realtime recording (older browser)"}.
              Rendered 100% on your device.
            </div>
            {error && <div className="rounded-lg bg-red-500/15 p-2 text-xs text-red-300">Export failed: {error}</div>}
            <button
              onClick={start}
              className="rounded-full bg-lock py-2.5 font-semibold text-black hover:brightness-110"
            >
              Render &amp; export
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

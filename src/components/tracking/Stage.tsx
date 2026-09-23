'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { store, useApp } from "@/lib/tracking/store";
import { frameForTime, outputSize, player, timeForFrame } from "@/lib/tracking/player";
import { getCameraPath, outToSrc, srcToOut, type Cam } from "@/lib/tracking/camera";
import { assetEvents, attachmentPose, renderFrame, type Pose } from "@/lib/tracking/render";
import { resolveTrack } from "@/lib/tracking/smooth";
import { createPointTrack, movePointSample, runPointTrack, toast, updateAttachment } from "@/lib/tracking/actions";
import type { Attachment, Track } from "@/lib/tracking/types";

type Drag =
  | { kind: "place"; x0: number; y0: number; x1: number; y1: number }
  | { kind: "track"; id: string; cam: Cam; moved: boolean }
  | { kind: "att"; id: string; cam: Cam; sx0: number; sy0: number; ox0: number; oy0: number; rT: number; sT: number };

type Hit = { type: "track"; track: Track } | { type: "att"; att: Attachment; pose: Pose };

type RVFCVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function Stage() {
  const video = useApp((s) => s.video);
  const aspect = useApp((s) => s.aspect);
  const mode = useApp((s) => s.mode);
  const playing = useApp((s) => s.playing);
  const muted = useApp((s) => s.muted);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const camRef = useRef<Cam | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const lastDrawn = useRef<unknown>(null);
  const force = useRef(false);
  const rafRef = useRef(0);
  const [css, setCss] = useState({ w: 0, h: 0 });
  const [cursor, setCursor] = useState("default");

  const out = video ? outputSize(video.width, video.height, aspect) : { w: 16, h: 9 };

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const ar = out.w / out.h;
      let w = r.width;
      let h = w / ar;
      if (h > r.height) {
        h = r.height;
        w = h * ar;
      }
      setCss({ w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [out.w, out.h]);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    const st = store.get();
    const info = st.video;
    if (!cvs || !info) return;
    const v = videoRef.current;
    const { w: ow, h: oh } = outputSize(info.width, info.height, st.aspect);
    const cssW = cvs.clientWidth || 1;
    // Quality-based DPR cap — lower values = faster rendering on low-end devices
    const dprCap = st.quality === "high" ? 2 : st.quality === "low" ? 1 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const longCap = st.quality === "low" ? 640 : st.quality === "high" ? 1920 : 1280;
    let bw = Math.min(Math.round(cssW * dpr), ow);
    const long = Math.max(bw, (bw * oh) / ow);
    if (long > longCap) bw = Math.round((bw * longCap) / long);
    bw = Math.max(2, bw);
    const bh = Math.max(2, Math.round((bw * oh) / ow));
    // Only resize canvas if dimensions actually changed (avoids clearing)
    if (cvs.width !== bw) cvs.width = bw;
    if (cvs.height !== bh) cvs.height = bh;
    const ctx = cvs.getContext("2d", { alpha: false });
    if (!ctx) return;
    const ready = !!v && v.readyState >= 2 && v.videoWidth > 0;
    const cameraOff = st.mode === "place" || !st.cameraPreview;
    const path = cameraOff
      ? null
      : getCameraPath(st.tracks, st.camera, st.keys, info.fps, info.frameCount, info.width, info.height, ow, oh);
    const d = dragRef.current;
    camRef.current = renderFrame({
      ctx,
      ps: bw / ow,
      outW: ow,
      outH: oh,
      source: ready ? v : null,
      srcW: info.width,
      srcH: info.height,
      srcPxW: v?.videoWidth || info.width,
      srcPxH: v?.videoHeight || info.height,
      frame: st.frame,
      fps: info.fps,
      tracks: st.tracks,
      attachments: st.attachments,
      camera: st.camera,
      keys: st.keys,
      fx: st.fx,
      path,
      cameraOff,
      frozenCam: d && d.kind !== "place" ? d.cam : null,
      motionSamples: st.quality === "low" ? 2 : st.quality === "high" ? 8 : 4,
      enhance: st.enhance,
      colorGrade: st.colorGrade,
      preview: {
        markers: st.showMarkers || st.mode === "place",
        selectedTrackId: st.selectedTrackId,
        selectedAttachmentId: st.tab === "overlay" ? st.selectedAttachmentId : null,
        dragBox: d && d.kind === "place" ? { x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1 } : null,
        uiScale: ow / cssW,
      },
    });
    lastDrawn.current = st;
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const v = videoRef.current;
      const st = store.get();
      if (!st.playing && v && v.seeking) return;
      // Shallow comparison of the fields that affect rendering.
      // This is much more effective than comparing the whole state object
      // (which is always a new reference after any store.set call).
      const last = lastDrawn.current as any;
      if (
        last &&
        !force.current &&
        last.frame === st.frame &&
        last.playing === st.playing &&
        last.mode === st.mode &&
        last.aspect === st.aspect &&
        last.cameraPreview === st.cameraPreview &&
        last.showMarkers === st.showMarkers &&
        last.selectedTrackId === st.selectedTrackId &&
        last.selectedAttachmentId === st.selectedAttachmentId &&
        last.tab === st.tab &&
        last.tracks === st.tracks &&
        last.attachments === st.attachments &&
        last.camera === st.camera &&
        last.keys === st.keys &&
        last.fx === st.fx &&
        last.quality === st.quality &&
        last.enhance === st.enhance &&
        last.colorGrade === st.colorGrade
      ) return;
      force.current = false;
      draw();
    });
  }, [draw]);

  const redraw = useCallback(() => {
    force.current = true;
    schedule();
  }, [schedule]);

  useEffect(() => store.subscribe(schedule), [schedule]);
  useEffect(() => {
    assetEvents.onLoad = redraw;
  }, [redraw]);
  useEffect(() => {
    redraw();
  }, [css.w, css.h, redraw]);
  useEffect(() => {
    player.video = videoRef.current;
    return () => {
      player.video = null;
    };
  }, [video?.url]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const onLoaded = () => {
    const v = videoRef.current as RVFCVideo | null;
    if (!v) return;
    player.elOffset = 0;
    if (v.requestVideoFrameCallback) {
      v.requestVideoFrameCallback((_n, m) => {
        if (v.currentTime < 0.06 && m.mediaTime < 0.5) player.elOffset = m.mediaTime;
        redraw();
      });
    }
    v.currentTime = timeForFrame(store.get().frame);
    redraw();
  };

  // Playback: draw synchronously on each presented video frame → overlays never lag.
  useEffect(() => {
    const v = videoRef.current as RVFCVideo | null;
    const info = store.get().video;
    if (!v || !info || !playing) return;
    let stop = false;
    let rvfcId = 0;
    let rafId = 0;
    let lastCb = performance.now();
    if (store.get().frame >= info.frameCount - 1) v.currentTime = timeForFrame(0);
    const onFrame = (t: number) => {
      const f = frameForTime(t);
      if (f !== store.get().frame) store.set({ frame: f });
      draw();
    };
    if (v.requestVideoFrameCallback) {
      const cb = (_now: number, m: { mediaTime: number }) => {
        if (stop) return;
        lastCb = performance.now();
        onFrame(m.mediaTime);
        rvfcId = v.requestVideoFrameCallback!(cb);
      };
      rvfcId = v.requestVideoFrameCallback(cb);
    }
    const watchdog = () => {
      if (stop) return;
      if (!v.requestVideoFrameCallback || performance.now() - lastCb > 300) onFrame(v.currentTime);
      rafId = requestAnimationFrame(watchdog);
    };
    rafId = requestAnimationFrame(watchdog);
    v.muted = store.get().muted;
    v.play().catch((e) => {
      console.warn(e);
      store.set({ playing: false });
    });
    const onEnded = () => {
      if (store.get().loop) {
        v.currentTime = timeForFrame(0);
        v.play().catch(() => store.set({ playing: false }));
      } else store.set({ playing: false, frame: info.frameCount - 1 });
    };
    v.addEventListener("ended", onEnded);
    return () => {
      stop = true;
      cancelAnimationFrame(rafId);
      if (rvfcId && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(rvfcId);
      v.removeEventListener("ended", onEnded);
      v.pause();
      v.currentTime = timeForFrame(store.get().frame);
    };
  }, [playing, draw]);

  // ---------- pointer interaction ----------
  const toOut = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const st = store.get();
    const info = st.video!;
    const { w: ow, h: oh } = outputSize(info.width, info.height, st.aspect);
    return {
      x: ((e.clientX - r.left) / r.width) * ow,
      y: ((e.clientY - r.top) / r.height) * oh,
      u: ow / r.width,
    };
  };

  const hitTest = (ox: number, oy: number, u: number): Hit | null => {
    const st = store.get();
    const info = st.video;
    const cam = camRef.current;
    if (!info || !cam) return null;
    if (st.showMarkers) {
      for (let i = st.tracks.length - 1; i >= 0; i--) {
        const t = st.tracks[i];
        if (!t.visible) continue;
        const sm = resolveTrack(t, st.tracks, info.fps, info.width / info.height);
        if (!sm.valid) continue;
        const f = Math.min(st.frame, sm.n - 1);
        const [px, py] = srcToOut(cam, sm.x[f] * info.width, sm.y[f] * info.height);
        if (Math.hypot(ox - px, oy - py) <= 16 * u) return { type: "track", track: t };
      }
    }
    for (let i = st.attachments.length - 1; i >= 0; i--) {
      const a = st.attachments[i];
      if (!a.visible || a.kind === "spotlight") continue;
      const pose = attachmentPose(a, st.tracks, info.fps, info.width, info.height, st.frame);
      if (!pose) continue;
      const [px, py] = srcToOut(cam, pose.cx, pose.cy);
      const r = Math.max(16 * u, pose.size * cam.z * 0.5);
      if (Math.hypot(ox - px, oy - py) <= r) return { type: "att", att: a, pose };
    }
    return null;
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = store.get();
    if (!st.video || !st.analysisReady || st.task) return;
    const { x, y, u } = toOut(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (st.mode === "place") {
      dragRef.current = { kind: "place", x0: x, y0: y, x1: x, y1: y };
      redraw();
      return;
    }
    if (st.playing) store.set({ playing: false });
    const hit = hitTest(x, y, u);
    const cam = camRef.current;
    if (!hit || !cam) return;
    if (hit.type === "track") {
      store.set({ selectedTrackId: hit.track.id });
      if (hit.track.type !== "point") {
        toast("AI face & 2-point trackers are automatic — use Smoothness to refine");
        return;
      }
      dragRef.current = { kind: "track", id: hit.track.id, cam: { ...cam }, moved: false };
    } else {
      store.set({ selectedAttachmentId: hit.att.id, selectedTrackId: hit.att.trackId });
      const [sx, sy] = outToSrc(cam, x, y);
      dragRef.current = {
        kind: "att",
        id: hit.att.id,
        cam: { ...cam },
        sx0: sx,
        sy0: sy,
        ox0: hit.att.offsetX,
        oy0: hit.att.offsetY,
        rT: hit.pose.rT,
        sT: hit.pose.sT,
      };
    }
    setCursor("grabbing");
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = store.get();
    const info = st.video;
    if (!info) return;
    const { x, y, u } = toOut(e);
    const d = dragRef.current;
    if (!d) {
      if (st.mode === "place") setCursor("crosshair");
      else setCursor(hitTest(x, y, u) ? "grab" : "default");
      return;
    }
    if (d.kind === "place") {
      d.x1 = x;
      d.y1 = y;
      redraw();
      return;
    }
    const [sx, sy] = outToSrc(d.cam, x, y);
    if (d.kind === "track") {
      d.moved = true;
      movePointSample(d.id, st.frame, clamp01(sx / info.width), clamp01(sy / info.height));
    } else {
      const dx = sx - d.sx0;
      const dy = sy - d.sy0;
      const c = Math.cos(-d.rT);
      const s = Math.sin(-d.rT);
      updateAttachment(d.id, {
        offsetX: Math.round(d.ox0 + (dx * c - dy * s) / d.sT),
        offsetY: Math.round(d.oy0 + (dx * s + dy * c) / d.sT),
      });
    }
  };

  const onUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    const st = store.get();
    const info = st.video;
    if (!d || !info) return;
    if (d.kind === "place") {
      const cam = camRef.current;
      if (cam) {
        const [sx0, sy0] = outToSrc(cam, d.x0, d.y0);
        const [sx1, sy1] = outToSrc(cam, d.x1, d.y1);
        let bw = Math.abs(sx1 - sx0);
        let bh = Math.abs(sy1 - sy0);
        let cx = (sx0 + sx1) / 2;
        let cy = (sy0 + sy1) / 2;
        const minB = Math.min(info.width, info.height) * 0.03;
        if (bw < minB || bh < minB) {
          const def = Math.min(info.width, info.height) * 0.09;
          bw = def;
          bh = def;
          cx = sx0;
          cy = sy0;
        }
        if (cx >= 0 && cy >= 0 && cx <= info.width && cy <= info.height) {
          createPointTrack(cx / info.width, cy / info.height, bw / info.width, bh / info.height);
        }
      }
    } else if (d.kind === "track" && d.moved) {
      void runPointTrack(d.id, st.frame, "forward");
    }
    setCursor("default");
    redraw();
  };

  return (
    <div ref={wrapRef} className="relative flex h-full w-full items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: css.w, height: css.h, cursor, touchAction: "none" }}
        className="rounded-lg bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      {mode === "place" && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-lock px-4 py-1.5 text-xs font-semibold text-black shadow-lg">
          Click a spot — or drag a box around it — to track it
        </div>
      )}
      {video && (
        <video
          ref={videoRef}
          src={video.url}
          playsInline
          preload="auto"
          onLoadedData={onLoaded}
          onSeeked={redraw}
          className="pointer-events-none absolute bottom-0 right-0 h-[2px] w-[2px] opacity-[0.01]"
        />
      )}
    </div>
  );
}

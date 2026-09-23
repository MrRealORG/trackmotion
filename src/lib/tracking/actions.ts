import { DEFAULT_CAMERA, DEFAULT_FX, store } from "./store";
import type {
  Aspect,
  Attachment,
  AttachmentKind,
  CameraKey,
  CameraSettings,
  Ease,
  FaceAnchor,
  FaceFrame,
  FxSettings,
  Sample,
  Track,
  VideoInfo,
} from "./types";
import { iterateFrames, probeFile } from "./media";
import { pushFrame, resetWorker, runTrackJob } from "./trackClient";
import { beginFaceSession, detectFace, loadFaceModel } from "./face";
import { camValuesAt } from "./camera";
import { isLowEnd, pickColor, uid } from "./util";

// ---------- toast & progress tasks ----------
let toastTimer = 0;
export function toast(text: string) {
  store.set({ toast: { id: Date.now(), text } });
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => store.set({ toast: null }), 3400);
}

let cancelFn: (() => void) | null = null;
let lastTaskUpdate = 0;
function startTask(label: string, total: number, detail?: string, cancel?: () => void) {
  cancelFn = cancel ?? null;
  lastTaskUpdate = 0;
  store.set({ task: { label, detail, current: 0, total, cancellable: !!cancel } });
}
function progressTask(current: number, patch?: { label?: string; detail?: string; total?: number }) {
  const now = performance.now();
  if (!patch && now - lastTaskUpdate < 80) return;
  lastTaskUpdate = now;
  const t = store.get().task;
  if (t) store.set({ task: { ...t, current, ...patch } });
}
function endTask() {
  cancelFn = null;
  store.set({ task: null });
}
export function cancelTask() {
  cancelFn?.();
}

// ---------- loading & one-time analysis ----------
function analysisSize(w: number, h: number, n: number) {
  const budget = isLowEnd() ? 110e6 : 170e6; // bytes of grayscale frames kept in the worker
  const perFrame = budget / Math.max(1, n);
  const aspect = w / h;
  const px = (md: number) => (aspect >= 1 ? md * (md / aspect) : md * md * aspect);
  let maxDim = isLowEnd() ? 400 : 480;
  while (maxDim > 200 && px(maxDim) > perFrame) maxDim -= 20;
  const s = Math.min(1, maxDim / Math.max(w, h));
  return { aw: Math.max(32, Math.round(w * s)), ah: Math.max(32, Math.round(h * s)) };
}

let loadSeq = 0;

export function closeVideo() {
  loadSeq++;
  const v = store.get().video;
  if (v) URL.revokeObjectURL(v.url);
  cancelFn?.();
  store.set({
    video: null,
    file: null,
    analysisReady: false,
    analysisSize: null,
    faceFrames: null,
    tracks: [],
    attachments: [],
    keys: [],
    camera: DEFAULT_CAMERA,
    fx: DEFAULT_FX,
    playing: false,
    frame: 0,
    task: null,
    exportOpen: false,
  });
}

export async function loadFile(file: File) {
  const my = ++loadSeq;
  const prev = store.get().video;
  if (prev) URL.revokeObjectURL(prev.url);
  store.set({ playing: false });
  const url = URL.createObjectURL(file);
  startTask("Opening video…", 0);
  let probe;
  try {
    probe = await probeFile(file, url);
  } catch (e) {
    endTask();
    URL.revokeObjectURL(url);
    toast(e instanceof Error ? e.message : "Could not open this video");
    return;
  }
  if (my !== loadSeq) return;
  const n0 = Math.max(1, Math.round(probe.duration * probe.fps));
  const grid = new Float64Array(n0);
  for (let i = 0; i < n0; i++) grid[i] = i / probe.fps;
  let info: VideoInfo = {
    name: file.name,
    url,
    width: probe.width,
    height: probe.height,
    duration: probe.duration,
    fps: probe.fps,
    frameCount: n0,
    frameTimes: grid,
    hasAudio: probe.hasAudio,
    webcodecs: probe.webcodecs,
  };
  store.set({
    video: info,
    file,
    analysisReady: false,
    analysisSize: null,
    faceFrames: null,
    tracks: [],
    attachments: [],
    keys: [],
    camera: DEFAULT_CAMERA,
    fx: DEFAULT_FX,
    aspect: "source",
    frame: 0,
    playing: false,
    mode: "view",
    selectedTrackId: null,
    selectedAttachmentId: null,
    tab: "magic",
  });

  const { aw, ah } = analysisSize(probe.width, probe.height, n0);
  const cvs = document.createElement("canvas");
  cvs.width = aw;
  cvs.height = ah;
  const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
  let times: number[] = [];
  let aborted = false;
  for (const useWC of probe.webcodecs ? [true, false] : [false]) {
    resetWorker(aw, ah);
    const ctl = new AbortController();
    startTask("Preparing motion engine", n0, "Reading every frame once — tracking is instant after this", () =>
      ctl.abort(),
    );
    try {
      times = await iterateFrames({
        file,
        url,
        width: aw,
        height: ah,
        webcodecs: useWC,
        fps: probe.fps,
        duration: probe.duration,
        signal: ctl.signal,
        onFrame: (canvas, i) => {
          ctx.drawImage(canvas, 0, 0, aw, ah);
          const d = ctx.getImageData(0, 0, aw, ah).data;
          // Reuse grayBuf — the worker transfers the buffer so we need a fresh one,
          // but at least we avoid allocating during the hot loop.
          const g = new Uint8Array(aw * ah);
          for (let p = 0, q = 0; q < g.length; p += 4, q++) {
            g[q] = (d[p] * 77 + d[p + 1] * 150 + d[p + 2] * 29) >> 8;
          }
          pushFrame(i, g);
          progressTask(i + 1);
        },
      });
      aborted = ctl.signal.aborted;
      if (times.length > 0 || aborted) {
        info = { ...info, webcodecs: useWC };
        break;
      }
    } catch (e) {
      console.warn("Analysis failed" + (useWC ? ", retrying with fallback decoder" : ""), e);
      times = [];
    }
    if (my !== loadSeq) return;
  }
  if (my !== loadSeq) return;
  endTask();
  if (aborted || times.length === 0) {
    closeVideo();
    toast(aborted ? "Cancelled" : "Could not decode this video in your browser");
    return;
  }
  const t0 = times[0];
  const ft = Float64Array.from(times, (t) => t - t0);
  store.set({
    video: { ...info, frameCount: ft.length, frameTimes: ft },
    analysisReady: true,
    analysisSize: { w: aw, h: ah },
  });
  toast("Ready! Try a Magic edit ✨ or add your own tracker");
}

// ---------- tracks ----------
function setTrackSamples(id: string, samples: (Sample | null)[]) {
  store.set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, samples } : t)) }));
}

export function updateTrack(id: string, patch: Partial<Track>) {
  store.set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
}

export function deleteTrack(id: string) {
  store.set((s) => {
    const gone = new Set([id, ...s.tracks.filter((t) => t.pair?.includes(id)).map((t) => t.id)]);
    return {
      tracks: s.tracks.filter((t) => !gone.has(t.id)),
      attachments: s.attachments.filter((a) => !gone.has(a.trackId)),
      selectedTrackId: s.selectedTrackId && gone.has(s.selectedTrackId) ? null : s.selectedTrackId,
      camera: s.camera.targetId && gone.has(s.camera.targetId) ? { ...s.camera, targetId: null } : s.camera,
    };
  });
}

export function createPointTrack(nx: number, ny: number, nbw: number, nbh: number) {
  const st = store.get();
  const info = st.video;
  if (!info || !st.analysisReady) return;
  const n = info.frameCount;
  const f = Math.min(st.frame, n - 1);
  const samples: (Sample | null)[] = new Array(n).fill(null);
  samples[f] = { x: nx, y: ny, s: 1, r: 0, c: 1 };
  const count = st.tracks.filter((t) => t.type === "point").length + 1;
  const t: Track = {
    id: uid(),
    name: `Point ${count}`,
    type: "point",
    color: pickColor(st.tracks.length),
    boxW: nbw,
    boxH: nbh,
    samples,
    smoothing: 0.25,
    visible: true,
  };
  store.set({ tracks: [...st.tracks, t], selectedTrackId: t.id, mode: "view" });
  void runPointTrack(t.id, f, "both");
}

let activeJob: { cancel: () => void } | null = null;

export async function runPointTrack(id: string, from: number, dir: "both" | "forward" | "backward") {
  const st = store.get();
  const info = st.video;
  const as = st.analysisSize;
  const t = st.tracks.find((x) => x.id === id);
  if (!info || !as || !t || t.type !== "point" || store.get().task) return;
  const n = info.frameCount;
  let seed = t.samples[from];
  if (!seed) {
    for (let d = 1; d < n && !seed; d++) seed = t.samples[from - d] ?? t.samples[from + d] ?? null;
  }
  if (!seed) return;
  const cx = seed.x * as.w;
  const cy = seed.y * as.h;
  const bw = Math.max(10, t.boxW * as.w * seed.s);
  const bh = Math.max(10, t.boxH * as.h * seed.s);
  const ranges: [number, number][] = [];
  if (dir !== "backward" && from < n - 1) ranges.push([from, n - 1]);
  if (dir !== "forward" && from > 0) ranges.push([from, 0]);
  const total = ranges.reduce((a, [s, e]) => a + Math.abs(e - s), 0);
  if (!total) return;

  const cleared = t.samples.slice();
  for (const [s, e] of ranges) {
    for (let i = Math.min(s, e); i <= Math.max(s, e); i++) if (i !== from) cleared[i] = null;
  }
  cleared[from] = { ...seed, c: 1 };
  setTrackSamples(id, cleared);

  let cancelled = false;
  startTask(`Tracking ${t.name}`, total, "TrackCore · forward/backward verified optical flow", () => {
    cancelled = true;
    activeJob?.cancel();
  });
  let done = 0;
  const base = { s: seed.s, r: seed.r };
  for (const [s, e] of ranges) {
    if (cancelled) break;
    const job = runTrackJob({ from: s, to: e, cx, cy, bw, bh }, (d) => {
      const cur = store.get().tracks.find((x) => x.id === id);
      if (!cur) return;
      const arr = cur.samples.slice();
      for (let k = 0; k < d.length; k += 6) {
        arr[d[k]] = { x: d[k + 1], y: d[k + 2], s: base.s * d[k + 3], r: base.r + d[k + 4], c: d[k + 5] };
        done++;
      }
      setTrackSamples(id, arr);
      progressTask(done);
    });
    activeJob = job;
    try {
      await job.promise;
    } catch (err) {
      console.error(err);
      toast("Tracking error");
      break;
    }
  }
  activeJob = null;
  endTask();
  const cur = store.get().tracks.find((x) => x.id === id);
  if (cur && !cancelled) {
    const have = cur.samples.filter(Boolean) as Sample[];
    const good = have.filter((p) => p.c >= 0.1).length;
    const pct = Math.round((good / Math.max(1, have.length)) * 100);
    toast(
      pct > 90
        ? `Tracked ${cur.name} — ${pct}% locked`
        : `${cur.name}: ${pct}% locked. Gaps are auto-filled; drag the marker to fix & re-track.`,
    );
  }
}

/** Manual correction: move a point tracker at a frame. */
export function movePointSample(id: string, f: number, nx: number, ny: number) {
  const t = store.get().tracks.find((x) => x.id === id);
  if (!t || t.type !== "point") return;
  const arr = t.samples.slice();
  const old = arr[f];
  let s = old?.s ?? 1;
  let r = old?.r ?? 0;
  if (!old) {
    for (let d = 1; d < arr.length; d++) {
      const p = arr[f - d] ?? arr[f + d];
      if (p) {
        s = p.s;
        r = p.r;
        break;
      }
    }
  }
  arr[f] = { x: nx, y: ny, s, r, c: 1 };
  setTrackSamples(id, arr);
}

export function createPairTrack(aId: string, bId: string) {
  const st = store.get();
  const A = st.tracks.find((t) => t.id === aId);
  const B = st.tracks.find((t) => t.id === bId);
  if (!A || !B || aId === bId) return null;
  const t: Track = {
    id: uid(),
    name: `2-Point ${A.name} ↔ ${B.name}`,
    type: "pair",
    pair: [aId, bId],
    color: pickColor(st.tracks.length),
    boxW: 0,
    boxH: 0,
    samples: [],
    smoothing: 0.2,
    visible: true,
  };
  store.set({ tracks: [...st.tracks, t], selectedTrackId: t.id });
  toast("2-point tracker: position + rotation + scale");
  return t.id;
}

// ---------- face AI ----------
export const ANCHOR_LABEL: Record<FaceAnchor, string> = {
  nose: "Nose",
  eyesCenter: "Between eyes",
  eyeL: "Left eye",
  eyeR: "Right eye",
  mouth: "Mouth",
  forehead: "Forehead",
  chin: "Chin",
  center: "Whole face",
};

let facePromise: Promise<boolean> | null = null;

export function ensureFace(): Promise<boolean> {
  if (store.get().faceFrames) return Promise.resolve(true);
  if (!facePromise) facePromise = analyzeFaces().finally(() => (facePromise = null));
  return facePromise;
}

async function analyzeFaces(): Promise<boolean> {
  const st = store.get();
  const info = st.video;
  const file = st.file;
  if (!info || !file) return false;
  const ctl = new AbortController();
  startTask("Loading face AI…", info.frameCount, "Downloading the on-device face model (first time only)", () =>
    ctl.abort(),
  );
  let lm;
  try {
    lm = await loadFaceModel();
  } catch (e) {
    console.error(e);
    endTask();
    toast("Face AI could not load — check your internet connection");
    return false;
  }
  if (ctl.signal.aborted) {
    endTask();
    return false;
  }
  progressTask(0, { label: "Finding the face in every frame", detail: "AI face landmarks · runs 100% on your device" });
  beginFaceSession();
  const k = Math.min(1, 640 / Math.max(info.width, info.height));
  const w = Math.max(2, Math.round(info.width * k));
  const h = Math.max(2, Math.round(info.height * k));
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const frames: (FaceFrame | null)[] = new Array(info.frameCount).fill(null);
  const step = st.quality === "low" || (st.quality === "auto" && isLowEnd()) ? 2 : 1;
  const dt = 1000 / info.fps;
  let pending = 0;
  let found = 0;
  try {
    await iterateFrames({
      file,
      url: info.url,
      width: w,
      height: h,
      webcodecs: info.webcodecs,
      fps: info.fps,
      duration: info.duration,
      signal: ctl.signal,
      onFrame: (canvas, i) => {
        pending += dt;
        if (i < frames.length && (i % step === 0 || i === frames.length - 1)) {
          ctx.drawImage(canvas, 0, 0, w, h);
          const ff = detectFace(lm, cvs, pending);
          frames[i] = ff;
          if (ff) found++;
          pending = 0;
        }
        progressTask(i + 1);
      },
    });
  } catch (e) {
    console.error(e);
    endTask();
    toast("Face analysis failed");
    return false;
  }
  endTask();
  if (ctl.signal.aborted) return false;
  if (!found) {
    toast("No face found in this video 🤔 Try a point tracker instead");
    return false;
  }
  store.set({ faceFrames: frames });
  return true;
}

function firstFace(): FaceFrame | null {
  const ff = store.get().faceFrames;
  if (!ff) return null;
  for (const f of ff) if (f) return f;
  return null;
}

export async function addFaceTrack(anchor: FaceAnchor, select = true): Promise<string | null> {
  const existing = store.get().tracks.find((t) => t.type === "face" && t.anchor === anchor);
  if (existing) {
    if (select) store.set({ selectedTrackId: existing.id });
    return existing.id;
  }
  if (!(await ensureFace())) return null;
  const st = store.get();
  const ff = st.faceFrames!;
  const info = st.video!;
  const f0 = firstFace()!;
  const size0 = Math.max(1e-6, f0.size);
  const samples: (Sample | null)[] = new Array(info.frameCount).fill(null);
  for (let i = 0; i < samples.length; i++) {
    const f = ff[i];
    if (f) samples[i] = { x: f.pts[anchor][0], y: f.pts[anchor][1], s: f.size / size0, r: f.roll, c: 1 };
  }
  const facePx = size0 * Math.max(info.width, info.height) * 2.6;
  const t: Track = {
    id: uid(),
    name: `Face · ${ANCHOR_LABEL[anchor]}`,
    type: "face",
    anchor,
    color: pickColor(st.tracks.length),
    boxW: facePx / info.width,
    boxH: facePx / info.height,
    samples,
    smoothing: 0.35,
    visible: true,
  };
  store.set({ tracks: [...st.tracks, t], ...(select ? { selectedTrackId: t.id } : {}) });
  return t.id;
}

// ---------- attachments ----------
export function addAttachment(kind: AttachmentKind, trackId?: string | null, patch?: Partial<Attachment>) {
  const st = store.get();
  const info = st.video;
  const tid = trackId ?? st.selectedTrackId;
  if (!info || !tid) {
    toast("Select a tracker first");
    return null;
  }
  const base = Math.round(Math.min(info.width, info.height) * 0.14);
  const att: Attachment = {
    id: uid(),
    trackId: tid,
    kind,
    emoji: "😎",
    text: "WOW",
    font: "impact",
    shape: kind === "pixelate" ? "circle" : "star",
    color: "#facc15",
    stroke: true,
    size: kind === "spotlight" || kind === "pixelate" ? Math.round(base * 1.8) : base,
    offsetX: 0,
    offsetY: kind === "text" ? -base : 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    blend: "normal",
    followRotation: true,
    followScale: true,
    visible: true,
    strength: kind === "spotlight" ? 0.75 : 0.6,
    soft: false,
    ...patch,
  };
  store.set({ attachments: [...st.attachments, att], selectedAttachmentId: att.id });
  return att.id;
}

export function updateAttachment(id: string, patch: Partial<Attachment>) {
  store.set((s) => ({ attachments: s.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
}

export function deleteAttachment(id: string) {
  store.set((s) => ({
    attachments: s.attachments.filter((a) => a.id !== id),
    selectedAttachmentId: s.selectedAttachmentId === id ? null : s.selectedAttachmentId,
  }));
}

// ---------- camera & keyframes ----------
export function setCamera(patch: Partial<CameraSettings>) {
  store.set((s) => ({ camera: { ...s.camera, ...patch } }));
}

export function setFx(patch: Partial<FxSettings>) {
  store.set((s) => ({ fx: { ...s.fx, ...patch } }));
}

export type AnimProp = "zoom" | "rotation" | "panX" | "panY";

const sortKeys = (k: CameraKey[]) => k.slice().sort((a, b) => a.frame - b.frame);

/** AE-style: with keyframes present, editing a value auto-keys the current frame. */
export function setAnimated(prop: AnimProp, value: number) {
  const st = store.get();
  if (!st.keys.length) {
    setCamera({ [prop]: value } as Partial<CameraSettings>);
    return;
  }
  const f = st.frame;
  const cur = camValuesAt(st.camera, st.keys, f);
  const idx = st.keys.findIndex((k) => k.frame === f);
  const keys =
    idx >= 0
      ? st.keys.map((k, i) => (i === idx ? { ...k, [prop]: value } : k))
      : sortKeys([...st.keys, { id: uid(), frame: f, ...cur, [prop]: value, ease: "ease" as Ease }]);
  store.set({ keys });
}

export function addKey() {
  const st = store.get();
  const f = st.frame;
  if (st.keys.some((k) => k.frame === f)) return;
  const cur = camValuesAt(st.camera, st.keys, f);
  store.set({ keys: sortKeys([...st.keys, { id: uid(), frame: f, ...cur, ease: "ease" }]) });
}

export function removeKeyAt(f: number) {
  const st = store.get();
  const k = st.keys.find((x) => x.frame === f);
  if (!k) return;
  const keys = st.keys.filter((x) => x !== k);
  store.set(
    keys.length
      ? { keys }
      : { keys, camera: { ...st.camera, zoom: k.zoom, rotation: k.rotation, panX: k.panX, panY: k.panY } },
  );
}

export function setKeyEase(f: number, ease: Ease) {
  store.set((s) => ({ keys: s.keys.map((k) => (k.frame === f ? { ...k, ease } : k)) }));
}

export function clearKeys() {
  const st = store.get();
  const cur = camValuesAt(st.camera, st.keys, st.frame);
  store.set({ keys: [], camera: { ...st.camera, ...cur } });
}

// ---------- project save / load ----------
import type { ProjectFile, SpeedKey, FreezeFrame, EnhanceSettings, ColorGradeSettings, Template } from "./types";

export const DEFAULT_ENHANCE: EnhanceSettings = {
  brightness: 0, contrast: 0, saturation: 0, sharpen: 0,
  denoise: 0, clarity: 0, exposure: 0, highlights: 0, shadows: 0,
};

export const DEFAULT_COLOR_GRADE: ColorGradeSettings = {
  liftR: 0, liftG: 0, liftB: 0,
  gammaR: 0, gammaG: 0, gammaB: 0,
  gainR: 0, gainG: 0, gainB: 0,
  temperature: 0, tint: 0, hue: 0,
};

export function saveProject() {
  const st = store.get()
  const v = st.video
  if (!v) {
    toast("Load a video first")
    return
  }
  const project: ProjectFile = {
    version: 1,
    videoName: v.name,
    videoWidth: v.width,
    videoHeight: v.height,
    videoFps: v.fps,
    videoDuration: v.duration,
    tracks: st.tracks,
    attachments: st.attachments,
    camera: st.camera,
    keys: st.keys,
    fx: st.fx,
    aspect: st.aspect,
    speedKeys: st.speedKeys,
    freezeFrames: st.freezeFrames,
    trimStart: st.trimStart,
    trimEnd: st.trimEnd,
    enhance: st.enhance,
    colorGrade: st.colorGrade,
    savedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${v.name.replace(/\.[^.]+$/, "")}-project.json`
  a.click()
  URL.revokeObjectURL(url)
  toast("Project saved")
}

export function loadProject(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const project = JSON.parse(reader.result as string) as ProjectFile
      const st = store.get()
      const v = st.video
      if (!v) {
        toast("Load a video first, then load the project")
        return
      }
      // Verify the project matches the loaded video
      if (project.videoWidth !== v.width || project.videoHeight !== v.height) {
        toast("Warning: project was saved for a different video size")
      }
      store.set({
        tracks: project.tracks || [],
        attachments: project.attachments || [],
        camera: project.camera || DEFAULT_CAMERA,
        keys: project.keys || [],
        fx: project.fx || DEFAULT_FX,
        aspect: project.aspect || "source",
        speedKeys: project.speedKeys || [],
        freezeFrames: project.freezeFrames || [],
        trimStart: project.trimStart || 0,
        trimEnd: project.trimEnd || 0,
        enhance: project.enhance || { ...DEFAULT_ENHANCE },
        colorGrade: project.colorGrade || { ...DEFAULT_COLOR_GRADE },
        selectedTrackId: null,
        selectedAttachmentId: null,
      })
      toast("Project loaded")
    } catch {
      toast("Could not load project file")
    }
  }
  reader.readAsText(file)
}

// ---------- speed ramp (time remapping) ----------
export function addSpeedKey(speed: number = 1) {
  const st = store.get()
  const f = st.frame
  if (st.speedKeys.some((k) => k.frame === f)) {
    toast("Speed key already exists at this frame")
    return
  }
  const key: SpeedKey = {
    id: uid(),
    frame: f,
    speed,
    ease: "ease",
  }
  const keys = [...st.speedKeys, key].sort((a, b) => a.frame - b.frame)
  store.set({ speedKeys: keys })
  toast(`Speed key added: ${speed}x at frame ${f}`)
}

export function removeSpeedKey(id: string) {
  store.set((s) => ({ speedKeys: s.speedKeys.filter((k) => k.id !== id) }))
}

export function updateSpeedKey(id: string, patch: Partial<SpeedKey>) {
  store.set((s) => ({
    speedKeys: s.speedKeys.map((k) => (k.id === id ? { ...k, ...patch } : k)),
  }))
}

export function clearSpeedKeys() {
  store.set({ speedKeys: [] })
  toast("Speed keys cleared")
}

/** Compute the source frame for a given output frame, accounting for speed ramps. */
export function sourceFrameFor(outputFrame: number, speedKeys: SpeedKey[]): number {
  if (speedKeys.length === 0) return outputFrame
  const sorted = [...speedKeys].sort((a, b) => a.frame - b.frame)
  // If before the first key, use the first key's speed
  if (outputFrame <= sorted[0].frame) {
    return outputFrame * sorted[0].speed
  }
  // Find the segment
  let srcFrame = sorted[0].frame * sorted[0].speed
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]
    const next = sorted[i + 1]
    if (!next || outputFrame <= next.frame) {
      const segEnd = next ? next.frame : outputFrame
      const segLen = segEnd - cur.frame
      const inSeg = Math.min(outputFrame, segEnd) - cur.frame
      srcFrame += inSeg * cur.speed
      break
    }
    // Add full segment
    const next2 = sorted[i + 1]
    srcFrame += (next2.frame - cur.frame) * cur.speed
  }
  return Math.round(srcFrame)
}

// ---------- freeze frame ----------
export function addFreezeFrame(duration: number = 15) {
  const st = store.get()
  const f = st.frame
  const ff: FreezeFrame = {
    id: uid(),
    sourceFrame: f,
    atFrame: f,
    duration,
  }
  store.set({ freezeFrames: [...st.freezeFrames, ff] })
  toast(`Freeze frame added (${duration} frames)`)
}

export function removeFreezeFrame(id: string) {
  store.set((s) => ({ freezeFrames: s.freezeFrames.filter((f) => f.id !== id) }))
}

export function updateFreezeFrame(id: string, patch: Partial<FreezeFrame>) {
  store.set((s) => ({
    freezeFrames: s.freezeFrames.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  }))
}

export function clearFreezeFrames() {
  store.set({ freezeFrames: [] })
  toast("Freeze frames cleared")
}

export type PresetId =
  | "noseLock"
  | "faceLock"
  | "eyeLock"
  | "smoothFollow"
  | "shake"
  | "zoomPunch"
  | "reframe"
  | "blurFace"
  | "sunglasses"
  | "spotlight"
  | "lockSelected"
  | "reset";

const cam = (patch: Partial<CameraSettings>): CameraSettings => ({ ...DEFAULT_CAMERA, ...patch });

export async function applyPreset(id: PresetId) {
  const st0 = store.get();
  const info = st0.video;
  if (!info || !st0.analysisReady || st0.task) return;
  const facePx = () => (firstFace()?.size ?? 0.05) * Math.max(info.width, info.height);
  switch (id) {
    case "noseLock": {
      const tid = await addFaceTrack("nose");
      if (!tid) return;
      store.set({ camera: cam({ targetId: tid, smoothing: 0.1, lockRotation: 1, zoom: 1.6, motionBlur: 0.4 }), keys: [] });
      toast("👃 Nose locked to the camera!");
      break;
    }
    case "faceLock": {
      const tid = await addFaceTrack("center");
      if (!tid) return;
      store.set({
        camera: cam({ targetId: tid, smoothing: 0.12, lockRotation: 1, lockScale: 1, zoom: 1.8, motionBlur: 0.4 }),
        keys: [],
      });
      toast("🙂 Face locked — position, rotation & size");
      break;
    }
    case "eyeLock": {
      const tid = await addFaceTrack("eyesCenter");
      if (!tid) return;
      store.set({
        camera: cam({ targetId: tid, smoothing: 0.1, lockRotation: 1, lockScale: 0.8, zoom: 2.3, motionBlur: 0.5 }),
        keys: [],
      });
      toast("👁️ Eyes locked!");
      break;
    }
    case "smoothFollow": {
      const tid = await addFaceTrack("center");
      if (!tid) return;
      store.set({ camera: cam({ targetId: tid, smoothing: 0.62, zoom: 1.3 }), keys: [] });
      toast("🎥 Smooth cinematic follow");
      break;
    }
    case "shake": {
      const tid = await addFaceTrack("nose");
      if (!tid) return;
      store.set({
        camera: cam({ targetId: tid, smoothing: 0.1, lockRotation: 0.8, zoom: 1.5, shake: 0.5, shakeSpeed: 0.6, motionBlur: 0.8 }),
        keys: [],
      });
      toast("💥 Shake edit applied");
      break;
    }
    case "zoomPunch": {
      const tid = await addFaceTrack("nose");
      if (!tid) return;
      const f = store.get().frame;
      const f2 = Math.min(info.frameCount - 1, f + Math.max(2, Math.round(info.fps * 0.3)));
      store.set({
        camera: cam({ targetId: tid, smoothing: 0.1, lockRotation: 0.6, motionBlur: 0.7 }),
        keys: [
          { id: uid(), frame: f, zoom: 1.1, rotation: 0, panX: 0, panY: 0, ease: "easeOut" },
          { id: uid(), frame: f2, zoom: 2.1, rotation: 0, panX: 0, panY: 0, ease: "ease" },
        ],
        fx: { ...store.get().fx, flash: true },
      });
      toast("🔍 Zoom punch from the current frame (edit keys in Camera)");
      break;
    }
    case "reframe": {
      const tid = await addFaceTrack("center");
      if (!tid) return;
      store.set({ aspect: "9:16", camera: cam({ targetId: tid, smoothing: 0.55, zoom: 1 }), keys: [] });
      toast("📱 Auto-reframed to 9:16 following the face");
      break;
    }
    case "blurFace": {
      const tid = await addFaceTrack("center", false);
      if (!tid) return;
      addAttachment("pixelate", tid, { size: Math.round(facePx() * 3.6), strength: 0.75, shape: "circle" });
      store.set({ tab: "overlay", selectedTrackId: tid });
      toast("🙈 Face blurred — follows the face automatically");
      break;
    }
    case "sunglasses": {
      const tid = await addFaceTrack("eyesCenter", false);
      if (!tid) return;
      addAttachment("emoji", tid, { emoji: "🕶️", size: Math.round(facePx() * 2.9), offsetY: Math.round(facePx() * 0.1) });
      store.set({ tab: "overlay", selectedTrackId: tid });
      toast("🕶️ Deal with it");
      break;
    }
    case "spotlight": {
      const tid = await addFaceTrack("center", false);
      if (!tid) return;
      addAttachment("spotlight", tid, { size: Math.round(facePx() * 4.5), strength: 0.8 });
      store.set({ tab: "overlay", selectedTrackId: tid });
      toast("🔦 Spotlight on the face");
      break;
    }
    case "lockSelected": {
      const t = st0.tracks.find((x) => x.id === st0.selectedTrackId) ?? st0.tracks[st0.tracks.length - 1];
      if (!t) {
        toast("Add a point tracker first (Track tab), then lock it");
        store.set({ tab: "track" });
        return;
      }
      store.set({
        camera: cam({ targetId: t.id, smoothing: 0.15, lockRotation: t.type === "point" ? 0 : 1, zoom: 1.4, motionBlur: 0.4 }),
        keys: [],
      });
      toast(`🎯 Camera locked to ${t.name}`);
      break;
    }
    case "reset":
      store.set({
        camera: DEFAULT_CAMERA,
        keys: [],
        fx: DEFAULT_FX,
        aspect: "source",
        enhance: { ...DEFAULT_ENHANCE },
        colorGrade: { ...DEFAULT_COLOR_GRADE },
        trimStart: 0,
        trimEnd: store.get().video?.frameCount ?? 0,
      });
      toast("All settings reset");
      break;
  }
}

// ---------- enhance (image enhancement) ----------
export function setEnhance(patch: Partial<EnhanceSettings>) {
  store.set((s) => ({ enhance: { ...s.enhance, ...patch } }));
}

export function resetEnhance() {
  store.set({ enhance: { ...DEFAULT_ENHANCE } });
  toast("Enhancement reset");
}

// ---------- color grading ----------
export function setColorGrade(patch: Partial<ColorGradeSettings>) {
  store.set((s) => ({ colorGrade: { ...s.colorGrade, ...patch } }));
}

export function resetColorGrade() {
  store.set({ colorGrade: { ...DEFAULT_COLOR_GRADE } });
  toast("Color grade reset");
}

// ---------- trim ----------
export function setTrim(start: number, end: number) {
  const info = store.get().video;
  if (!info) return;
  const s = Math.max(0, Math.min(start, end));
  const e = Math.min(info.frameCount - 1, Math.max(start, end));
  store.set({ trimStart: s, trimEnd: e });
}

export function resetTrim() {
  const info = store.get().video;
  store.set({ trimStart: 0, trimEnd: info ? info.frameCount - 1 : 0 });
  toast("Trim reset");
}

// ---------- templates ----------
export const TEMPLATES: Template[] = [
  {
    id: "viral-nose",
    name: "Viral Nose Lock",
    icon: "nose",
    category: "viral",
    description: "The classic — nose pinned, world moves, motion blur",
    camera: { smoothing: 0.1, lockRotation: 1, zoom: 1.6, motionBlur: 0.4 },
    fx: { grade: "punch", vignette: 0.3 },
  },
  {
    id: "cinematic-follow",
    name: "Cinematic Follow",
    icon: "camera",
    category: "cinematic",
    description: "Smooth lazy camera with film look",
    camera: { smoothing: 0.62, zoom: 1.3 },
    fx: { grade: "cinematic", vignette: 0.4 },
    colorGrade: { temperature: 0.15, tint: -0.05 },
  },
  {
    id: "shorts-916",
    name: "Shorts 9:16",
    icon: "expand",
    category: "social",
    description: "Auto-reframe to vertical for TikTok/Shorts",
    aspect: "9:16",
    camera: { smoothing: 0.55, zoom: 1 },
  },
  {
    id: "punch-zoom",
    name: "Beat Punch",
    icon: "zoom",
    category: "viral",
    description: "Snap zoom with flash on the beat",
    camera: { smoothing: 0.1, motionBlur: 0.7 },
    fx: { flash: true },
  },
  {
    id: "glitch-shake",
    name: "Glitch Shake",
    icon: "shake",
    category: "fun",
    description: "Hard shake with motion blur for energy",
    camera: { smoothing: 0.1, shake: 0.6, shakeSpeed: 0.8, motionBlur: 0.8 },
    fx: { grade: "punch" },
  },
  {
    id: "warm-vintage",
    name: "Warm Vintage",
    icon: "look",
    category: "cinematic",
    description: "Sepia tones with lifted shadows",
    fx: { grade: "vintage", vignette: 0.35 },
    enhance: { shadows: 0.3, saturation: 0.15 },
    colorGrade: { temperature: 0.3, tint: 0.05 },
  },
  {
    id: "cool-noir",
    name: "Cool Noir",
    icon: "look",
    category: "cinematic",
    description: "High contrast B&W with cool tint",
    fx: { grade: "bw", vignette: 0.5 },
    enhance: { contrast: 0.4, clarity: 0.3 },
    colorGrade: { temperature: -0.2 },
  },
  {
    id: "vivid-pop",
    name: "Vivid Pop",
    icon: "sparkle",
    category: "social",
    description: "Punchy saturated colors for social media",
    fx: { grade: "vivid" },
    enhance: { saturation: 0.3, contrast: 0.15, clarity: 0.2 },
  },
  {
    id: "clean-enhance",
    name: "Clean Enhance",
    icon: "bolt",
    category: "pro",
    description: "Subtle sharpen + denoise + clarity for crisp video",
    enhance: { sharpen: 0.3, denoise: 0.2, clarity: 0.25, exposure: 0.05 },
  },
  {
    id: "portrait-glow",
    name: "Portrait Glow",
    icon: "face",
    category: "pro",
    description: "Soft skin with lifted shadows — great for faces",
    enhance: { shadows: 0.35, clarity: 0.1, denoise: 0.15 },
    fx: { grade: "warm", vignette: 0.2 },
  },
  {
    id: "deal-with-it",
    name: "Deal With It",
    icon: "sunglasses",
    category: "fun",
    description: "Auto-track eyes and add sunglasses",
    attachments: [{ kind: "emoji", emoji: "sunglasses", size: 120 }],
  },
  {
    id: "spotlight-face",
    name: "Spotlight",
    icon: "spotlight",
    category: "cinematic",
    description: "Darken everything except the tracked subject",
    attachments: [{ kind: "spotlight", size: 300 }],
  },
];

export async function applyTemplate(tpl: Template) {
  const st = store.get();
  const info = st.video;
  if (!info || !st.analysisReady || st.task) return;
  const patch: Partial<{ camera: CameraSettings; fx: FxSettings; aspect: Aspect; enhance: EnhanceSettings; colorGrade: ColorGradeSettings }> = {};
  if (tpl.camera) patch.camera = { ...DEFAULT_CAMERA, ...st.camera, ...tpl.camera };
  if (tpl.fx) patch.fx = { ...st.fx, ...tpl.fx };
  if (tpl.aspect) patch.aspect = tpl.aspect;
  if (tpl.enhance) patch.enhance = { ...st.enhance, ...tpl.enhance } as EnhanceSettings;
  if (tpl.colorGrade) patch.colorGrade = { ...st.colorGrade, ...tpl.colorGrade };
  store.set(patch as any);
  // Auto-add attachments if the template specifies them
  if (tpl.attachments && tpl.attachments.length) {
    // Need a face track for face-based attachments
    const needsFace = tpl.attachments.some((a) => a.kind === "emoji" || a.kind === "spotlight" || a.kind === "pixelate");
    if (needsFace && !st.faceFrames) {
      const ok = await ensureFace();
      if (!ok) {
        toast("This template needs a face — try another video");
        return;
      }
    }
    let tid = st.selectedTrackId;
    if (needsFace && !tid) {
      tid = await addFaceTrack("eyesCenter", false) || await addFaceTrack("center", false);
    }
    if (tid) {
      for (const a of tpl.attachments) {
        addAttachment(a.kind, tid, {
          emoji: a.emoji || "sparkle",
          text: a.text || "",
          size: a.size || Math.round(Math.min(info.width, info.height) * 0.14),
        });
      }
      store.set({ tab: "overlay", selectedTrackId: tid });
    }
  }
  toast(`Template applied: ${tpl.name}`);
}

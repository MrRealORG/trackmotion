import { ALL_FORMATS, BlobSource, CanvasSink, Input } from "mediabunny";

export interface Probe {
  width: number;
  height: number;
  duration: number;
  fps: number;
  hasAudio: boolean;
  webcodecs: boolean;
}

const STD_FPS = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 90, 120];

function snapFps(f: number) {
  if (!isFinite(f) || f <= 1) return 30;
  for (const s of STD_FPS) if (Math.abs(f - s) < 0.35) return s;
  return Math.round(f * 100) / 100;
}

function loadElementMeta(url: string) {
  return new Promise<{ width: number; height: number; duration: number }>((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;
    v.onloadedmetadata = () =>
      resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration });
    v.onerror = () => reject(new Error("This video format is not supported by your browser."));
  });
}

export async function probeFile(file: File, url: string): Promise<Probe> {
  if (typeof VideoDecoder !== "undefined") {
    let input: Input | null = null;
    try {
      input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
      const vt = await input.getPrimaryVideoTrack();
      if (vt && (await vt.canDecode())) {
        const duration = await input.computeDuration();
        const stats = await vt.computePacketStats(120);
        const at = await input.getPrimaryAudioTrack();
        return {
          width: vt.displayWidth,
          height: vt.displayHeight,
          duration,
          fps: snapFps(stats.averagePacketRate),
          hasAudio: !!at,
          webcodecs: true,
        };
      }
    } catch (e) {
      console.warn("WebCodecs probe failed, falling back", e);
    } finally {
      input?.dispose();
    }
  }
  const m = await loadElementMeta(url);
  return { ...m, fps: 30, hasAudio: true, webcodecs: false };
}

export interface IterateOptions {
  file: File;
  url: string;
  width: number;
  height: number;
  webcodecs: boolean;
  fps: number;
  duration: number;
  signal: AbortSignal;
  onFrame: (canvas: CanvasImageSource, index: number, timestamp: number) => void | Promise<void>;
}

function seekEl(v: HTMLVideoElement, t: number) {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v.removeEventListener("seeked", finish);
      resolve();
    };
    v.addEventListener("seeked", finish);
    setTimeout(finish, 3000);
    v.currentTime = t;
  });
}

const yieldUI = () => new Promise<void>((r) => setTimeout(r, 0));

/** Decodes every frame in presentation order. Returns the frame timestamps. */
export async function iterateFrames(o: IterateOptions): Promise<number[]> {
  const times: number[] = [];
  let lastYield = performance.now();
  if (o.webcodecs) {
    const input = new Input({ source: new BlobSource(o.file), formats: ALL_FORMATS });
    try {
      const vt = await input.getPrimaryVideoTrack();
      if (!vt) throw new Error("No video track");
      const sink = new CanvasSink(vt, { width: o.width, height: o.height, fit: "fill", poolSize: 2 });
      let i = 0;
      for await (const wc of sink.canvases()) {
        if (o.signal.aborted) break;
        times.push(wc.timestamp);
        await o.onFrame(wc.canvas, i++, wc.timestamp);
        if (performance.now() - lastYield > 30) {
          await yieldUI();
          lastYield = performance.now();
        }
      }
      return times;
    } finally {
      input.dispose();
    }
  }
  // Fallback: seek a hidden video element frame by frame.
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = o.url;
  await new Promise<void>((resolve, reject) => {
    v.onloadeddata = () => resolve();
    v.onerror = () => reject(new Error("Could not decode video"));
  });
  const cvs = document.createElement("canvas");
  cvs.width = o.width;
  cvs.height = o.height;
  const ctx = cvs.getContext("2d")!;
  const n = Math.max(1, Math.floor(o.duration * o.fps));
  for (let i = 0; i < n; i++) {
    if (o.signal.aborted) break;
    await seekEl(v, Math.min(o.duration - 0.001, (i + 0.5) / o.fps));
    ctx.drawImage(v, 0, 0, o.width, o.height);
    times.push(i / o.fps);
    await o.onFrame(cvs, i, i / o.fps);
  }
  v.removeAttribute("src");
  v.load();
  return times;
}

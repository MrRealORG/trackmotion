import {
  ALL_FORMATS,
  AudioSampleSink,
  AudioSampleSource,
  BlobSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  EncodedAudioPacketSource,
  EncodedPacketSink,
  Input,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
  canEncodeAudio,
  canEncodeVideo,
  type AudioCodec,
} from "mediabunny";
import type { AppState } from "./store";
import { getCameraPath } from "./camera";
import { renderFrame, type RenderArgs } from "./render";
import { frameAtTime } from "./util";

export type ExportQuality = "standard" | "high" | "max";

export interface ExportOptions {
  state: AppState;
  outW: number;
  outH: number;
  quality: ExportQuality;
  audio: boolean;
  onProgress: (done: number, total: number) => void;
  signal: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  ext: "mp4" | "webm";
  method: "webcodecs" | "realtime";
}

const BPP: Record<ExportQuality, number> = { standard: 0.08, high: 0.14, max: 0.24 };

export async function exportProject(o: ExportOptions): Promise<ExportResult> {
  const v = o.state.video!;
  if (v.webcodecs && typeof VideoEncoder !== "undefined") {
    try {
      return await exportWebCodecs(o);
    } catch (e) {
      if (o.signal.aborted) throw e;
      console.warn("WebCodecs export failed, using realtime fallback", e);
    }
  }
  return exportRealtime(o);
}

function baseArgs(o: ExportOptions, ctx: CanvasRenderingContext2D): Omit<RenderArgs, "source" | "srcPxW" | "srcPxH" | "frame" | "motionSamples"> {
  const st = o.state;
  const info = st.video!;
  return {
    ctx,
    ps: 1,
    outW: o.outW,
    outH: o.outH,
    srcW: info.width,
    srcH: info.height,
    fps: info.fps,
    tracks: st.tracks,
    attachments: st.attachments,
    camera: st.camera,
    keys: st.keys,
    fx: st.fx,
    path: getCameraPath(st.tracks, st.camera, st.keys, info.fps, info.frameCount, info.width, info.height, o.outW, o.outH),
    cameraOff: false,
    enhance: st.enhance,
    colorGrade: st.colorGrade,
  };
}

async function exportWebCodecs(o: ExportOptions): Promise<ExportResult> {
  const st = o.state;
  const info = st.video!;
  const { outW, outH } = o;
  const bitrate = Math.round(outW * outH * info.fps * BPP[o.quality]);
  let codec: "avc" | "vp9" | "vp8" | null = null;
  for (const c of ["avc", "vp9", "vp8"] as const) {
    if (await canEncodeVideo(c, { width: outW, height: outH, bitrate })) {
      codec = c;
      break;
    }
  }
  if (!codec) throw new Error("No video encoder available");
  const isMp4 = codec === "avc";
  const format = isMp4 ? new Mp4OutputFormat({ fastStart: "in-memory" }) : new WebMOutputFormat();
  const input = new Input({ source: new BlobSource(st.file!), formats: ALL_FORMATS });
  try {
    const vt = await input.getPrimaryVideoTrack();
    if (!vt) throw new Error("No video track");
    const output = new Output({ format, target: new BufferTarget() });
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const videoSource = new CanvasSource(canvas, { codec, bitrate, keyFrameInterval: 2 });
    output.addVideoTrack(videoSource, { frameRate: info.fps });

    let audioJob: (() => Promise<void>) | null = null;
    if (o.audio) {
      const at = await input.getPrimaryAudioTrack();
      if (at) {
        const supported = format.getSupportedAudioCodecs();
        if (at.codec && supported.includes(at.codec)) {
          const src = new EncodedAudioPacketSource(at.codec);
          output.addAudioTrack(src);
          audioJob = async () => {
            const cfg = await at.getDecoderConfig();
            const sink = new EncodedPacketSink(at);
            let first = true;
            for await (const pkt of sink.packets()) {
              if (o.signal.aborted) break;
              await src.add(pkt, first && cfg ? { decoderConfig: cfg } : undefined);
              first = false;
            }
            src.close();
          };
        } else if (await at.canDecode()) {
          let target: AudioCodec | null = null;
          for (const c of supported) {
            if ((c === "aac" || c === "opus") && (await canEncodeAudio(c))) {
              target = c;
              break;
            }
          }
          if (target) {
            const src = new AudioSampleSource({ codec: target, bitrate: 160_000 });
            output.addAudioTrack(src);
            audioJob = async () => {
              const sink = new AudioSampleSink(at);
              for await (const s of sink.samples()) {
                if (o.signal.aborted) {
                  s.close();
                  break;
                }
                await src.add(s);
                s.close();
              }
              src.close();
            };
          }
        }
      }
    }

    await output.start();
    const k = Math.min(1, 2560 / Math.max(info.width, info.height));
    const dw = Math.max(2, Math.round(info.width * k));
    const dh = Math.max(2, Math.round(info.height * k));
    const base = baseArgs(o, ctx);
    const n = info.frameCount;

    const videoJob = async () => {
      const sink = new CanvasSink(vt, { width: dw, height: dh, fit: "fill", poolSize: 1 });
      let i = 0;
      let shift: number | null = null;
      for await (const wc of sink.canvases()) {
        if (o.signal.aborted) break;
        if (shift === null) shift = wc.timestamp < 0 ? -wc.timestamp : 0;
        renderFrame({
          ...base,
          source: wc.canvas,
          srcPxW: dw,
          srcPxH: dh,
          frame: Math.min(i, n - 1),
          motionSamples: 10,
        });
        await videoSource.add(wc.timestamp + shift, wc.duration > 0 ? wc.duration : 1 / info.fps);
        i++;
        o.onProgress(Math.min(i, n), n);
      }
      videoSource.close();
    };

    await Promise.all([videoJob(), audioJob ? audioJob() : Promise.resolve()]);
    if (o.signal.aborted) {
      await output.cancel();
      throw new DOMException("Export cancelled", "AbortError");
    }
    await output.finalize();
    const buf = output.target.buffer;
    if (!buf) throw new Error("Export produced no data");
    return {
      blob: new Blob([buf], { type: isMp4 ? "video/mp4" : "video/webm" }),
      ext: isMp4 ? "mp4" : "webm",
      method: "webcodecs",
    };
  } finally {
    input.dispose();
  }
}

/** Fallback for browsers without WebCodecs encoders: records a realtime playback. */
async function exportRealtime(o: ExportOptions): Promise<ExportResult> {
  const st = o.state;
  const info = st.video!;
  const v = document.createElement("video");
  v.src = info.url;
  v.playsInline = true;
  v.preload = "auto";
  await new Promise<void>((res, rej) => {
    v.onloadeddata = () => res();
    v.onerror = () => rej(new Error("Video load failed"));
  });
  const canvas = document.createElement("canvas");
  canvas.width = o.outW;
  canvas.height = o.outH;
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(info.fps);
  let actx: AudioContext | null = null;
  if (o.audio) {
    try {
      actx = new AudioContext();
      const node = actx.createMediaElementSource(v);
      const dest = actx.createMediaStreamDestination();
      node.connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch {
      v.muted = true;
    }
  } else v.muted = true;
  const types = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  const rec = new MediaRecorder(stream, {
    mimeType: mime || undefined,
    videoBitsPerSecond: Math.round(o.outW * o.outH * info.fps * BPP[o.quality]),
  });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
  const base = baseArgs(o, ctx);
  const n = info.frameCount;
  const draw = () => {
    const f = frameAtTime(info.frameTimes, v.currentTime);
    renderFrame({ ...base, source: v, srcPxW: v.videoWidth, srcPxH: v.videoHeight, frame: f, motionSamples: 5 });
    o.onProgress(Math.min(n, f + 1), n);
  };
  draw();
  rec.start(250);
  await v.play();
  await new Promise<void>((resolve) => {
    v.onended = () => resolve();
    const tick = () => {
      if (o.signal.aborted || v.ended) {
        resolve();
        return;
      }
      draw();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  v.pause();
  rec.stop();
  await stopped;
  actx?.close();
  if (o.signal.aborted) throw new DOMException("Export cancelled", "AbortError");
  const isMp4 = mime.startsWith("video/mp4");
  return {
    blob: new Blob(chunks, { type: isMp4 ? "video/mp4" : "video/webm" }),
    ext: isMp4 ? "mp4" : "webm",
    method: "realtime",
  };
}

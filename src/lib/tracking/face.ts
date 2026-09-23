import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { FaceAnchor, FaceFrame } from "./types";

// Must match the installed @mediapipe/tasks-vision version exactly.
const VERSION = "1.0.1";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let loader: Promise<FaceLandmarker> | null = null;
let ts = 0; // VIDEO mode requires strictly increasing timestamps across ALL runs

export function loadFaceModel(): Promise<FaceLandmarker> {
  if (!loader) {
    loader = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM);
      const make = (delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      try {
        return await make("GPU");
      } catch (e) {
        console.warn("GPU delegate failed, using CPU", e);
        return await make("CPU");
      }
    })().catch((e) => {
      loader = null;
      throw e;
    });
  }
  return loader;
}

/** Start a new analysis session (big timestamp gap resets MediaPipe's temporal tracking). */
export function beginFaceSession() {
  ts += 10_000;
}

type P = [number, number];

export function detectFace(
  lm: FaceLandmarker,
  img: HTMLCanvasElement,
  deltaMs: number,
): FaceFrame | null {
  ts += Math.max(1, deltaMs);
  const res = lm.detectForVideo(img, Math.round(ts));
  const L = res.faceLandmarks?.[0];
  if (!L || L.length < 468) return null;
  const iw = img.width;
  const ih = img.height;
  const pt = (i: number): P => [L[i].x, L[i].y];
  const avg = (idx: number[]): P => {
    let x = 0;
    let y = 0;
    for (const i of idx) {
      x += L[i].x;
      y += L[i].y;
    }
    return [x / idx.length, y / idx.length];
  };
  const irisA: P = L.length >= 478 ? pt(468) : avg([33, 133]);
  const irisB: P = L.length >= 478 ? pt(473) : avg([362, 263]);
  const [eyeL, eyeR] = irisA[0] <= irisB[0] ? [irisA, irisB] : [irisB, irisA];
  const eyesCenter: P = [(eyeL[0] + eyeR[0]) / 2, (eyeL[1] + eyeR[1]) / 2];
  const mouth = avg([13, 14]);
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < 468; i++) {
    cx += L[i].x;
    cy += L[i].y;
  }
  const pts: Record<FaceAnchor, P> = {
    nose: pt(1),
    eyesCenter,
    eyeL,
    eyeR,
    mouth,
    forehead: pt(151),
    chin: pt(152),
    center: [cx / 468, cy / 468],
  };
  const roll = Math.atan2((eyeR[1] - eyeL[1]) * ih, (eyeR[0] - eyeL[0]) * iw);
  const iod = Math.hypot((eyeR[0] - eyeL[0]) * iw, (eyeR[1] - eyeL[1]) * ih);
  const em = Math.hypot((mouth[0] - eyesCenter[0]) * iw, (mouth[1] - eyesCenter[1]) * ih);
  const size = ((iod + em) * 0.5) / Math.max(iw, ih);
  return { pts, roll, size };
}

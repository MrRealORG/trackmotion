import { useSyncExternalStore } from "react";
import type {
  Aspect,
  Attachment,
  CameraKey,
  CameraSettings,
  ColorGradeSettings,
  EnhanceSettings,
  FaceFrame,
  FreezeFrame,
  FxSettings,
  SpeedKey,
  Task,
  Track,
  VideoInfo,
} from "./types";

export type Tab = "magic" | "templates" | "track" | "camera" | "overlay" | "time" | "enhance" | "trim" | "fx";

export interface AppState {
  video: VideoInfo | null;
  file: File | null;
  analysisReady: boolean;
  analysisSize: { w: number; h: number } | null;
  faceFrames: (FaceFrame | null)[] | null;
  tracks: Track[];
  attachments: Attachment[];
  camera: CameraSettings;
  keys: CameraKey[];
  fx: FxSettings;
  aspect: Aspect;
  frame: number;
  playing: boolean;
  loop: boolean;
  muted: boolean;
  tab: Tab;
  mode: "view" | "place";
  selectedTrackId: string | null;
  selectedAttachmentId: string | null;
  showMarkers: boolean;
  cameraPreview: boolean;
  quality: "low" | "auto" | "high";
  task: Task | null;
  toast: { id: number; text: string } | null;
  exportOpen: boolean;
  speedKeys: SpeedKey[];
  freezeFrames: FreezeFrame[];
  trimStart: number;
  trimEnd: number;
  enhance: EnhanceSettings;
  colorGrade: ColorGradeSettings;
}

export const DEFAULT_CAMERA: CameraSettings = {
  targetId: null,
  follow: 1,
  smoothing: 0.15,
  lockRotation: 0,
  lockScale: 0,
  anchor: "center",
  zoom: 1,
  rotation: 0,
  panX: 0,
  panY: 0,
  shake: 0,
  shakeSpeed: 0.5,
  motionBlur: 0,
  fill: "blur",
};

export const DEFAULT_FX: FxSettings = { grade: "none", vignette: 0, flash: false };

export const DEFAULT_ENHANCE: EnhanceSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
  denoise: 0,
  clarity: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
};

export const DEFAULT_COLOR_GRADE: ColorGradeSettings = {
  liftR: 0, liftG: 0, liftB: 0,
  gammaR: 0, gammaG: 0, gammaB: 0,
  gainR: 0, gainG: 0, gainB: 0,
  temperature: 0,
  tint: 0,
  hue: 0,
};

const initial: AppState = {
  video: null,
  file: null,
  analysisReady: false,
  analysisSize: null,
  faceFrames: null,
  tracks: [],
  attachments: [],
  camera: DEFAULT_CAMERA,
  keys: [],
  fx: DEFAULT_FX,
  aspect: "source",
  frame: 0,
  playing: false,
  loop: true,
  muted: false,
  tab: "magic",
  mode: "view",
  selectedTrackId: null,
  selectedAttachmentId: null,
  showMarkers: true,
  cameraPreview: true,
  quality: "auto",
  task: null,
  toast: null,
  exportOpen: false,
  speedKeys: [],
  freezeFrames: [],
  trimStart: 0,
  trimEnd: 0,
  enhance: DEFAULT_ENHANCE,
  colorGrade: DEFAULT_COLOR_GRADE,
};

type Listener = () => void;
let state: AppState = initial;
const listeners = new Set<Listener>();

export const store = {
  get: () => state,
  set(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    const p = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...p };
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useApp<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => sel(store.get()), () => sel(initial));
}

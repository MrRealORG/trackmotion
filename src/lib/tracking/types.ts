export type TrackType = "point" | "face" | "pair";

export type FaceAnchor =
  | "nose"
  | "eyesCenter"
  | "eyeL"
  | "eyeR"
  | "mouth"
  | "forehead"
  | "chin"
  | "center";

/** One tracked sample. x/y normalized (0..1), s = scale relative, r = rotation (rad), c = confidence */
export interface Sample {
  x: number;
  y: number;
  s: number;
  r: number;
  c: number;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  anchor?: FaceAnchor;
  pair?: [string, string];
  /** tracker box size (normalized to video width/height) */
  boxW: number;
  boxH: number;
  samples: (Sample | null)[];
  smoothing: number; // 0..1
  visible: boolean;
}

export type AttachmentKind = "emoji" | "text" | "image" | "shape" | "pixelate" | "spotlight";
export type ShapeKind = "circle" | "ring" | "rect" | "star" | "heart";
export type FontKind = "bold" | "impact" | "serif" | "mono" | "rounded";
export type BlendKind = "normal" | "screen" | "multiply" | "overlay" | "add" | "difference";

export interface Attachment {
  id: string;
  trackId: string;
  kind: AttachmentKind;
  emoji: string;
  text: string;
  font: FontKind;
  imageSrc?: string;
  shape: ShapeKind;
  color: string;
  stroke: boolean;
  size: number; // source pixels
  offsetX: number; // source pixels, in the tracker's local frame
  offsetY: number;
  scale: number;
  rotation: number; // degrees
  opacity: number;
  blend: BlendKind;
  followRotation: boolean;
  followScale: boolean;
  visible: boolean;
  strength: number; // pixelate block strength / spotlight darkness
  soft: boolean; // pixelate: smooth blur look
}

export type Ease = "linear" | "ease" | "easeIn" | "easeOut" | "hold";

export interface CameraKey {
  id: string;
  frame: number;
  zoom: number;
  rotation: number;
  panX: number;
  panY: number;
  ease: Ease;
}

export type FillMode = "blur" | "black" | "autozoom";
export type AnchorMode = "center" | "start";

export interface CameraSettings {
  targetId: string | null;
  follow: number; // 0..1 how strongly the camera follows the target
  smoothing: number; // 0..1 camera path smoothing
  lockRotation: number; // 0..1
  lockScale: number; // 0..1
  anchor: AnchorMode;
  zoom: number;
  rotation: number; // deg
  panX: number; // fraction of output width
  panY: number;
  shake: number; // 0..1
  shakeSpeed: number; // 0..1
  motionBlur: number; // 0..1 shutter
  fill: FillMode;
}

export type Grade = "none" | "vivid" | "punch" | "bw" | "vintage" | "cinematic" | "cool" | "warm";

export interface FxSettings {
  grade: Grade;
  vignette: number;
  flash: boolean;
}

export type Aspect = "source" | "9:16" | "1:1" | "4:5" | "16:9";

export interface VideoInfo {
  name: string;
  url: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  frameCount: number;
  /** presentation time of each frame (seconds, first frame = 0) */
  frameTimes: Float64Array;
  hasAudio: boolean;
  webcodecs: boolean;
}

export interface FaceFrame {
  pts: Record<FaceAnchor, [number, number]>;
  roll: number;
  size: number;
}

export interface Task {
  label: string;
  detail?: string;
  current: number;
  total: number;
  cancellable: boolean;
}

// ---- New features ----

/** Speed ramp keyframe — controls time remapping for speed effects. */
export interface SpeedKey {
  id: string;
  frame: number;       // output frame
  speed: number;       // 0 = freeze, 1 = normal, 2 = 2x, 0.5 = slow-mo, -1 = reverse
  ease: Ease;
}

/** Freeze frame marker — holds a specific frame for N output frames. */
export interface FreezeFrame {
  id: string;
  sourceFrame: number; // which frame to freeze on
  atFrame: number;     // where in the timeline to insert it
  duration: number;    // how many frames to hold
}

/** Project file format for save/load. */
export interface ProjectFile {
  version: 1;
  videoName: string;
  videoWidth: number;
  videoHeight: number;
  videoFps: number;
  videoDuration: number;
  tracks: Track[];
  attachments: Attachment[];
  camera: CameraSettings;
  keys: CameraKey[];
  fx: FxSettings;
  aspect: Aspect;
  speedKeys: SpeedKey[];
  freezeFrames: FreezeFrame[];
  trimStart: number;
  trimEnd: number;
  enhance: EnhanceSettings;
  colorGrade: ColorGradeSettings;
  savedAt: string;
}

/** Video trim range (frame numbers). */
export interface TrimSettings {
  start: number;
  end: number;
}

/** Image enhancement settings (applied on-device). */
export interface EnhanceSettings {
  brightness: number;   // -1..1, 0 = neutral
  contrast: number;     // -1..1
  saturation: number;   // -1..1
  sharpen: number;      // 0..1
  denoise: number;      // 0..1
  clarity: number;      // 0..1 (local contrast)
  exposure: number;     // -1..1
  highlights: number;   // -1..1 (recover blown highlights)
  shadows: number;      // -1..1 (lift crushed shadows)
}

/** Advanced color grading (like DaVinci Resolve lift/gamma/gain wheels). */
export interface ColorGradeSettings {
  liftR: number;   // -1..1
  liftG: number;
  liftB: number;
  gammaR: number;  // -1..1
  gammaG: number;
  gammaB: number;
  gainR: number;   // -1..1
  gainG: number;
  gainB: number;
  temperature: number; // -1..1 (cool to warm)
  tint: number;        // -1..1 (green to magenta)
  hue: number;         // -180..180 degrees
}

/** One-click template that auto-applies camera + effects + attachments. */
export interface Template {
  id: string;
  name: string;
  icon: string;
  category: "viral" | "cinematic" | "social" | "fun" | "pro";
  description: string;
  // What this template does:
  camera?: Partial<CameraSettings>;
  fx?: Partial<FxSettings>;
  enhance?: Partial<EnhanceSettings>;
  colorGrade?: Partial<ColorGradeSettings>;
  aspect?: Aspect;
  // Attachments to auto-add (e.g. text overlay)
  attachments?: Array<{ kind: AttachmentKind; text?: string; emoji?: string; size?: number }>;
}

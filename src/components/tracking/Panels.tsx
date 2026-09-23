'use client'

import { useState } from "react";
import { store, useApp, type Tab } from "@/lib/tracking/store";
import {
  ANCHOR_LABEL,
  addAttachment,
  addFaceTrack,
  addKey,
  applyPreset,
  clearKeys,
  createPairTrack,
  deleteAttachment,
  deleteTrack,
  removeKeyAt,
  runPointTrack,
  setAnimated,
  setCamera,
  setFx,
  setKeyEase,
  updateAttachment,
  updateTrack,
  type PresetId,
} from "@/lib/tracking/actions";
import { camValuesAt } from "@/lib/tracking/camera";
import { seek } from "@/lib/tracking/player";
import { EMOJIS } from "@/lib/tracking/util";
import type {
  Attachment,
  AttachmentKind,
  BlendKind,
  Ease,
  FaceAnchor,
  FontKind,
  Grade,
  ShapeKind,
} from "@/lib/tracking/types";
import { Chip, Section, Seg, Slider, Toggle } from "./ui";
import { Icon, type IconName, ATTACHMENT_ICONS } from "./Icons";
import { getUploadedAssets, type UploadedAsset } from "@/lib/tracking/assets";
import {
  addSpeedKey,
  removeSpeedKey,
  updateSpeedKey,
  clearSpeedKeys,
  addFreezeFrame,
  removeFreezeFrame,
  updateFreezeFrame,
  clearFreezeFrames,
  saveProject,
  loadProject,
  setEnhance,
  resetEnhance,
  setColorGrade,
  resetColorGrade,
  setTrim,
  resetTrim,
  TEMPLATES,
  applyTemplate,
} from "@/lib/tracking/actions";

const pct = (v: number) => `${Math.round(v * 100)}%`;

// ---------------- MAGIC ----------------
const PRESETS: { id: PresetId; icon: IconName; title: string; desc: string; hot?: boolean }[] = [
  { id: "lockSelected", icon: "lock", title: "Lock My Tracker", desc: "Stabilize / lock any object you tracked", hot: true },
  { id: "zoomPunch", icon: "zoom", title: "Zoom Punch", desc: "Snap zoom + flash from this frame" },
  { id: "shake", icon: "shake", title: "Shake Edit", desc: "Lock + camera shake + motion blur" },
  { id: "smoothFollow", icon: "camera", title: "Smooth Follow", desc: "Cinematic, lazy camera follow" },
  { id: "reframe", icon: "expand", title: "Auto Reframe 9:16", desc: "Landscape to Shorts / TikTok" },
  { id: "reset", icon: "reset", title: "Reset", desc: "Clear all camera & effects" },
];

function MagicTab() {
  const faceReady = useApp((s) => !!s.faceFrames);
  const busy = useApp((s) => !!s.task);
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-gradient-to-br from-lock/10 via-lock/5 to-fuchsia-500/15 p-3 ring-1 ring-white/10">
        <div className="text-sm font-bold">One-click edits</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">
          Pick an edit — we track, lock the camera and style it for you. Everything stays editable in the other tabs.
        </p>
        <div className="mt-2 text-[10px] text-white/40">
          Face AI: {faceReady ? "✅ analyzed" : "runs automatically on first use"}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            disabled={busy}
            onClick={() => applyPreset(p.id)}
            className={`group relative flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 disabled:opacity-50 ${
              p.hot
                ? "col-span-2 border-lock/40 bg-gradient-to-r from-lock/15 to-lock/5 hover:border-lock/70"
                : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={p.hot ? "text-2xl" : "text-xl"}><Icon name={p.icon} size={p.hot ? 28 : 24} /></span>
              <span className="text-[13px] font-semibold">{p.title}</span>
              {p.hot && (
                <span className="rounded-full bg-lock px-1.5 py-0.5 text-[9px] font-bold text-black">POPULAR</span>
              )}
            </div>
            <span className="text-[11px] leading-snug text-white/50">{p.desc}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => applyPreset("reset")}
        className="rounded-lg bg-white/5 py-2 text-xs text-white/60 ring-1 ring-white/10 hover:bg-white/10"
      >
        Reset camera & effects
      </button>
    </div>
  );
}

// ---------------- TRACK ----------------
function TrackTab() {
  const tracks = useApp((s) => s.tracks);
  const selected = useApp((s) => s.selectedTrackId);
  const mode = useApp((s) => s.mode);
  const frame = useApp((s) => s.frame);
  const targetId = useApp((s) => s.camera.targetId);
  const busy = useApp((s) => !!s.task);
  const points = tracks.filter((t) => t.type === "point");
  const [pa, setPa] = useState("");
  const [pb, setPb] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Section title="Point tracker">
        <button
          disabled={busy}
          onClick={() => store.set({ mode: mode === "place" ? "view" : "place", playing: false })}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold shadow transition disabled:opacity-50 ${
            mode === "place"
              ? "bg-lock text-black"
              : "bg-white/[0.1] text-white hover:bg-white/[0.16]"
          }`}
        >
          {mode === "place" ? "Cancel placing" : "Track anything — click it on the video"}
        </button>
        <p className="text-[11px] leading-relaxed text-white/45">
          Click a spot or drag a box around an object. TrackCore follows it forwards &amp; backwards, re-finds it after
          it is hidden, and you can drag the marker at any frame to correct it.
        </p>
      </Section>

      {points.length >= 2 && (
        <Section title="2-point tracker (rotation + scale)">
          <div className="grid grid-cols-2 gap-2">
            {[
              [pa, setPa],
              [pb, setPb],
            ].map(([v, set], i) => (
              <select
                key={i}
                value={v as string}
                onChange={(e) => (set as (s: string) => void)(e.target.value)}
                className="rounded-md bg-black/40 px-2 py-1.5 text-xs ring-1 ring-white/10"
              >
                <option value="">Point {i ? "B" : "A"}…</option>
                {points.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <button
            disabled={!pa || !pb || pa === pb}
            onClick={() => createPairTrack(pa, pb)}
            className="rounded-lg bg-white/10 py-1.5 text-xs font-medium hover:bg-white/15 disabled:opacity-40"
          >
            Link points
          </button>
        </Section>
      )}

      <div className="flex flex-col gap-2">
        {tracks.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
            No trackers yet — add a point or AI face tracker above.
          </p>
        )}
        {tracks.map((t) => {
          const have = t.samples.filter(Boolean);
          const good = have.filter((s) => s && s.c >= 0.1).length;
          const q = have.length ? Math.round((good / have.length) * 100) : 100;
          const sel = t.id === selected;
          return (
            <div
              key={t.id}
              onClick={() => store.set({ selectedTrackId: t.id })}
              className={`cursor-pointer rounded-xl border p-2.5 transition ${
                sel ? "border-lock/50 bg-lock/[0.08]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
                <input
                  value={t.name}
                  onChange={(e) => updateTrack(t.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none"
                />
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/55">
                  {t.type === "pair" ? "2-pt" : t.type}
                </span>
                {t.type !== "pair" && (
                  <span className={`text-[10px] font-mono ${q > 90 ? "text-lock" : "text-lock"}`}>{q}%</span>
                )}
              </div>
              {sel && (
                <div className="mt-2.5 flex flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <Slider
                    label="Smoothness"
                    value={t.smoothing}
                    min={0}
                    max={1}
                    onChange={(v) => updateTrack(t.id, { smoothing: v })}
                    fmt={pct}
                  />
                  {t.type === "point" && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ["backward", "◀ Back"],
                          ["both", "◀▶ Both"],
                          ["forward", "Fwd ▶"],
                        ] as const
                      ).map(([d, l]) => (
                        <button
                          key={d}
                          disabled={busy}
                          onClick={() => runPointTrack(t.id, frame, d)}
                          title={`Re-track ${d} from frame ${frame}`}
                          className="rounded-md bg-white/[0.06] py-1.5 text-[11px] hover:bg-white/15 disabled:opacity-40"
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCamera({ targetId: targetId === t.id ? null : t.id })}
                      className={`rounded-md px-2 py-1 text-[11px] ${
                        targetId === t.id ? "bg-lock text-black" : "bg-white/[0.06] hover:bg-white/15"
                      }`}
                    >
                      {targetId === t.id ? "Camera locked" : "Lock camera"}
                    </button>
                    <button
                      onClick={() => store.set({ tab: "overlay" })}
                      className="rounded-md bg-white/[0.06] px-2 py-1 text-[11px] hover:bg-white/15"
                    >
                      Attach
                    </button>
                    <button
                      onClick={() => updateTrack(t.id, { visible: !t.visible })}
                      className="rounded-md bg-white/[0.06] px-2 py-1 text-[11px] hover:bg-white/15"
                    >
                      {t.visible ? "Hide marker" : "Show marker"}
                    </button>
                    <button
                      onClick={() => deleteTrack(t.id)}
                      className="ml-auto rounded-md px-2 py-1 text-[11px] text-red-300/80 hover:bg-red-500/15"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- CAMERA ----------------
function CameraTab() {
  const tracks = useApp((s) => s.tracks);
  const c = useApp((s) => s.camera);
  const keys = useApp((s) => s.keys);
  const frame = useApp((s) => s.frame);
  const aspect = useApp((s) => s.aspect);
  const preview = useApp((s) => s.cameraPreview);
  const v = camValuesAt(c, keys, frame);
  const keyHere = keys.find((k) => k.frame === frame);
  const prevKey = [...keys].reverse().find((k) => k.frame < frame);
  const nextKey = keys.find((k) => k.frame > frame);

  return (
    <div className="flex flex-col gap-3">
      <Section
        title="Camera target"
        right={
          <div className="w-24">
            <Toggle label="Preview" checked={preview} onChange={(x) => store.set({ cameraPreview: x })} />
          </div>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!c.targetId} onClick={() => setCamera({ targetId: null })}>
            Static
          </Chip>
          {tracks.map((t) => (
            <Chip key={t.id} active={c.targetId === t.id} color={t.color} onClick={() => setCamera({ targetId: t.id })}>
              {t.name}
            </Chip>
          ))}
        </div>
        {!tracks.length && <p className="text-[11px] text-white/40">Add a tracker, then lock the camera to it.</p>}
        {c.targetId && (
          <>
            <Slider label="Follow strength" value={c.follow} min={0} max={1} onChange={(x) => setCamera({ follow: x })} fmt={pct} />
            <Slider label="Camera smoothness" value={c.smoothing} min={0} max={1} onChange={(x) => setCamera({ smoothing: x })} fmt={pct} />
            <Slider label="Lock rotation" value={c.lockRotation} min={0} max={1} onChange={(x) => setCamera({ lockRotation: x })} fmt={pct} />
            <Slider label="Lock size (zoom with subject)" value={c.lockScale} min={0} max={1} onChange={(x) => setCamera({ lockScale: x })} fmt={pct} />
            <Seg
              value={c.anchor}
              onChange={(x) => setCamera({ anchor: x })}
              options={[
                { value: "center", label: "Pin to center" },
                { value: "start", label: "Pin where it starts" },
              ]}
            />
          </>
        )}
      </Section>

      <Section
        title="Animate (keyframes)"
        right={
          <span className="text-[10px] text-white/40">
            {keys.length ? `${keys.length} keys · auto-key on` : "static"}
          </span>
        }
      >
        <Slider label="Zoom" value={v.zoom} min={0.5} max={5} step={0.01} onChange={(x) => setAnimated("zoom", x)} fmt={(x) => `${x.toFixed(2)}×`} />
        <Slider label="Rotation" value={v.rotation} min={-180} max={180} step={0.5} onChange={(x) => setAnimated("rotation", x)} fmt={(x) => `${x.toFixed(0)}°`} />
        <div className="grid grid-cols-2 gap-2">
          <Slider label="Pan X" value={v.panX} min={-0.5} max={0.5} onChange={(x) => setAnimated("panX", x)} fmt={pct} />
          <Slider label="Pan Y" value={v.panY} min={-0.5} max={0.5} onChange={(x) => setAnimated("panY", x)} fmt={pct} />
        </div>
        <div className="flex items-center gap-1.5">
          <button disabled={!prevKey} onClick={() => prevKey && seek(prevKey.frame)} className="rounded-md bg-white/[0.06] px-2 py-1.5 text-xs disabled:opacity-30">
            ◆‹
          </button>
          {keyHere ? (
            <button onClick={() => removeKeyAt(frame)} className="flex-1 rounded-md bg-lock/15 py-1.5 text-xs text-lock-2 ring-1 ring-lock/30">
              ✕ Remove key here
            </button>
          ) : (
            <button onClick={addKey} className="flex-1 rounded-md bg-lock py-1.5 text-xs font-semibold text-black hover:brightness-110">
              ◆ Add keyframe
            </button>
          )}
          <button disabled={!nextKey} onClick={() => nextKey && seek(nextKey.frame)} className="rounded-md bg-white/[0.06] px-2 py-1.5 text-xs disabled:opacity-30">
            ›◆
          </button>
        </div>
        {keyHere && (
          <Seg
            value={keyHere.ease}
            onChange={(e: Ease) => setKeyEase(frame, e)}
            options={[
              { value: "linear", label: "Linear" },
              { value: "ease", label: "Ease" },
              { value: "easeIn", label: "In" },
              { value: "easeOut", label: "Out" },
              { value: "hold", label: "Hold" },
            ]}
          />
        )}
        {keys.length > 0 && (
          <button onClick={clearKeys} className="text-left text-[11px] text-white/40 hover:text-white/70">
            Clear all keyframes
          </button>
        )}
      </Section>

      <Section title="Shake & blur">
        <Slider label="Camera shake" value={c.shake} min={0} max={1} onChange={(x) => setCamera({ shake: x })} fmt={pct} />
        {c.shake > 0 && <Slider label="Shake speed" value={c.shakeSpeed} min={0} max={1} onChange={(x) => setCamera({ shakeSpeed: x })} fmt={pct} />}
        <Slider label="Motion blur" value={c.motionBlur} min={0} max={1} onChange={(x) => setCamera({ motionBlur: x })} fmt={pct} />
      </Section>

      <Section title="Frame">
        <Seg
          value={aspect}
          onChange={(a) => store.set({ aspect: a })}
          options={[
            { value: "source", label: "Original" },
            { value: "9:16", label: "9:16" },
            { value: "1:1", label: "1:1" },
            { value: "4:5", label: "4:5" },
            { value: "16:9", label: "16:9" },
          ]}
        />
        <div className="text-[11px] text-white/45">Border fill (when the camera moves past the edge)</div>
        <Seg
          value={c.fill}
          onChange={(f) => setCamera({ fill: f })}
          options={[
            { value: "blur", label: "Blur" },
            { value: "autozoom", label: "Auto-zoom" },
            { value: "black", label: "Black" },
          ]}
        />
      </Section>
    </div>
  );
}

// ---------------- OVERLAYS ----------------
const KINDS: { kind: AttachmentKind; icon: IconName; label: string }[] = [
  { kind: "emoji", icon: "sparkle", label: "Icon" },
  { kind: "text", icon: "text", label: "Text" },
  { kind: "shape", icon: "star", label: "Shape" },
  { kind: "image", icon: "image", label: "Image" },
  { kind: "pixelate", icon: "blur", label: "Blur" },
  { kind: "spotlight", icon: "spotlight", label: "Spotlight" },
];

function AttachmentEditor({ a }: { a: Attachment }) {
  const up = (p: Partial<Attachment>) => updateAttachment(a.id, p);
  const uploadedStickers = typeof window !== 'undefined' ? getUploadedAssets('sticker') : [];
  return (
    <div className="flex flex-col gap-2.5 pt-2.5" onClick={(e) => e.stopPropagation()}>
      {a.kind === "emoji" && (
        <>
          {/* Admin-uploaded stickers */}
          {uploadedStickers.length > 0 && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Your Uploads</div>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-black/20 p-1.5">
                {uploadedStickers.map((s: UploadedAsset) => (
                  <button
                    key={s.id}
                    onClick={() => up({ emoji: s.dataUrl, imageSrc: s.dataUrl })}
                    className={`aspect-square overflow-hidden rounded hover:ring-2 hover:ring-lock ${a.emoji === s.dataUrl ? "ring-2 ring-lock" : ""}`}
                  >
                    <img src={s.dataUrl} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Image-based Thug Life stickers */}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Thug Life Stickers</div>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-black/20 p-1.5">
            {[
              { src: "/images/sticker-glasses.png", name: "thugGlasses" },
              { src: "/images/sticker-chain.png", name: "goldChain" },
              { src: "/images/sticker-hat.png", name: "thugHat" },
              { src: "/images/sticker-money.png", name: "money" },
              { src: "/images/sticker-grill.png", name: "grill" },
              { src: "/images/sticker-crown.png", name: "crown2" },
              { src: "/images/sticker-fire.png", name: "fire2" },
              { src: "/images/sticker-skull.png", name: "skull2" },
            ].map((s) => (
              <button
                key={s.name}
                onClick={() => up({ emoji: s.name })}
                className={`aspect-square overflow-hidden rounded hover:ring-2 hover:ring-lock ${a.emoji === s.name ? "ring-2 ring-lock" : ""}`}
              >
                <img src={s.src} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          {/* SVG icons */}
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">SVG Icons</div>
          <div className="grid grid-cols-6 gap-1 rounded-lg bg-black/20 p-1.5">
            {ATTACHMENT_ICONS.map((iconName) => (
              <button
                key={iconName}
                onClick={() => up({ emoji: iconName })}
                className={`flex items-center justify-center rounded py-1.5 hover:bg-white/10 ${a.emoji === iconName ? "bg-lock/25" : ""}`}
              >
                <Icon name={iconName} size={22} />
              </button>
            ))}
          </div>
        </>
      )}
      {a.kind === "text" && (
        <>
          <input
            value={a.text}
            onChange={(e) => up({ text: e.target.value })}
            className="rounded-md bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/10 focus:ring-lock"
            placeholder="Your text…"
          />
          <Seg
            value={a.font}
            onChange={(f: FontKind) => up({ font: f })}
            options={[
              { value: "impact", label: "Impact" },
              { value: "bold", label: "Bold" },
              { value: "rounded", label: "Round" },
              { value: "serif", label: "Serif" },
              { value: "mono", label: "Mono" },
            ]}
          />
        </>
      )}
      {a.kind === "shape" && (
        <Seg
          value={a.shape}
          onChange={(s: ShapeKind) => up({ shape: s })}
          options={[
            { value: "star", label: "★" },
            { value: "heart", label: "♥" },
            { value: "circle", label: "●" },
            { value: "ring", label: "◯" },
            { value: "rect", label: "■" },
          ]}
        />
      )}
      {a.kind === "pixelate" && (
        <>
          <Seg
            value={a.shape === "rect" ? "rect" : "circle"}
            onChange={(s: ShapeKind) => up({ shape: s })}
            options={[
              { value: "circle", label: "Oval" },
              { value: "rect", label: "Box" },
            ]}
          />
          <Toggle label="Soft blur (instead of pixels)" checked={a.soft} onChange={(x) => up({ soft: x })} />
        </>
      )}
      {a.kind === "image" && (
        <label className="cursor-pointer rounded-md border border-dashed border-white/15 px-2 py-2 text-center text-xs text-white/55 hover:bg-white/5">
          {a.imageSrc ? "Change image" : "Upload PNG / logo / sticker"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const r = new FileReader();
              r.onload = () => up({ imageSrc: r.result as string });
              r.readAsDataURL(file);
            }}
          />
        </label>
      )}
      {(a.kind === "text" || a.kind === "shape") && (
        <div className="flex items-center gap-2">
          <input type="color" value={a.color} onChange={(e) => up({ color: e.target.value })} className="h-7 w-10 cursor-pointer rounded bg-transparent" />
          <div className="flex-1">
            <Toggle label="Outline" checked={a.stroke} onChange={(x) => up({ stroke: x })} />
          </div>
        </div>
      )}
      <Slider label="Size" value={a.size} min={8} max={1600} step={1} onChange={(x) => up({ size: x })} fmt={(x) => `${Math.round(x)}px`} />
      {(a.kind === "pixelate" || a.kind === "spotlight") && (
        <Slider label={a.kind === "pixelate" ? "Strength" : "Darkness"} value={a.strength} min={0} max={1} onChange={(x) => up({ strength: x })} fmt={pct} />
      )}
      {a.kind !== "pixelate" && a.kind !== "spotlight" && (
        <>
          <Slider label="Rotation" value={a.rotation} min={-180} max={180} step={1} onChange={(x) => up({ rotation: x })} fmt={(x) => `${x}°`} />
          <Seg
            value={a.blend}
            onChange={(b: BlendKind) => up({ blend: b })}
            options={[
              { value: "normal", label: "Normal" },
              { value: "screen", label: "Screen" },
              { value: "add", label: "Add" },
              { value: "multiply", label: "Mult" },
              { value: "overlay", label: "Ovl" },
            ]}
          />
        </>
      )}
      <Slider label="Opacity" value={a.opacity} min={0} max={1} onChange={(x) => up({ opacity: x })} fmt={pct} />
      <div className="grid grid-cols-2 gap-x-3">
        <Toggle label="Follow rotation" checked={a.followRotation} onChange={(x) => up({ followRotation: x })} />
        <Toggle label="Follow size" checked={a.followScale} onChange={(x) => up({ followScale: x })} />
      </div>
      <p className="text-[10px] text-white/35">Tip: drag it on the video to position it.</p>
    </div>
  );
}

function OverlayTab() {
  const tracks = useApp((s) => s.tracks);
  const attachments = useApp((s) => s.attachments);
  const selectedTrackId = useApp((s) => s.selectedTrackId);
  const selectedAtt = useApp((s) => s.selectedAttachmentId);
  const tid = selectedTrackId ?? tracks[0]?.id ?? null;
  const list = attachments.filter((a) => a.trackId === tid);

  if (!tracks.length)
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/45">
        Overlays stick to trackers. Add a point or face tracker first (Track tab) — or use a Magic edit.
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      <Section title="Attach to">
        <div className="flex flex-wrap gap-1.5">
          {tracks.map((t) => (
            <Chip key={t.id} active={t.id === tid} color={t.color} onClick={() => store.set({ selectedTrackId: t.id })}>
              {t.name}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              onClick={() => addAttachment(k.kind, tid)}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-white/[0.04] py-2 text-[11px] text-white/70 ring-1 ring-white/5 hover:bg-white/10"
            >
              <Icon name={k.icon} size={20} />
              {k.label}
            </button>
          ))}
        </div>
      </Section>
      {list.length === 0 && <p className="text-center text-[11px] text-white/35">Nothing attached to this tracker yet.</p>}
      {list.map((a) => (
        <div
          key={a.id}
          onClick={() => store.set({ selectedAttachmentId: a.id === selectedAtt ? null : a.id })}
          className={`cursor-pointer rounded-xl border p-2.5 ${
            a.id === selectedAtt ? "border-lock/50 bg-lock/[0.07]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{a.kind === "emoji" ? <Icon name={(a.emoji as IconName) || "sparkle"} size={20} /> : <Icon name={KINDS.find((k) => k.kind === a.kind)?.icon || "sparkle"} size={20} />}</span>
            <span className="flex-1 truncate text-[12px] font-medium capitalize">
              {a.kind === "text" ? `“${a.text}”` : a.kind === "pixelate" ? "Blur / pixelate" : a.kind}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateAttachment(a.id, { visible: !a.visible });
              }}
              className="rounded px-1.5 text-xs text-white/60 hover:bg-white/10"
            >
              {a.visible ? "👁️" : "🚫"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteAttachment(a.id);
              }}
              className="rounded px-1.5 text-xs text-white/40 hover:bg-red-500/20 hover:text-red-300"
            >
              ✕
            </button>
          </div>
          {a.id === selectedAtt && <AttachmentEditor a={a} />}
        </div>
      ))}
    </div>
  );
}

// ---------------- LOOK ----------------
const GRADE_LIST: { value: Grade; label: string; sw: string }[] = [
  { value: "none", label: "None", sw: "from-zinc-500 to-zinc-700" },
  { value: "vivid", label: "Vivid", sw: "from-pink-500 to-orange-400" },
  { value: "punch", label: "Punch", sw: "from-red-500 to-yellow-400" },
  { value: "cinematic", label: "Cinema", sw: "from-teal-700 to-orange-700" },
  { value: "bw", label: "B&W", sw: "from-white to-black" },
  { value: "vintage", label: "Vintage", sw: "from-amber-200 to-amber-700" },
  { value: "cool", label: "Cool", sw: "from-sky-400 to-indigo-600" },
  { value: "warm", label: "Warm", sw: "from-yellow-300 to-rose-500" },
];

function FxTab() {
  const fx = useApp((s) => s.fx);
  const quality = useApp((s) => s.quality);
  const markers = useApp((s) => s.showMarkers);
  return (
    <div className="flex flex-col gap-3">
      <Section title="Color grade">
        <div className="grid grid-cols-4 gap-1.5">
          {GRADE_LIST.map((g) => (
            <button
              key={g.value}
              onClick={() => setFx({ grade: g.value })}
              className={`flex flex-col items-center gap-1 rounded-lg p-1.5 text-[10px] ring-1 ${
                fx.grade === g.value ? "bg-white/10 ring-lock" : "ring-white/5 hover:bg-white/5"
              }`}
            >
              <span className={`h-7 w-full rounded bg-gradient-to-br ${g.sw}`} />
              {g.label}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Effects">
        <Slider label="Vignette" value={fx.vignette} min={0} max={1} onChange={(x) => setFx({ vignette: x })} fmt={pct} />
        <Toggle label="⚡ White flash on camera keyframes" checked={fx.flash} onChange={(x) => setFx({ flash: x })} />
      </Section>
      <Section title="Performance">
        <div className="text-[11px] text-white/45">Preview quality (export is always full quality)</div>
        <Seg
          value={quality}
          onChange={(q) => store.set({ quality: q })}
          options={[
            { value: "low", label: "Low-end" },
            { value: "auto", label: "Auto" },
            { value: "high", label: "High" },
          ]}
        />
        <Toggle label="Show tracker markers" checked={markers} onChange={(x) => store.set({ showMarkers: x })} />
      </Section>
    </div>
  );
}

// ---------------- TIME (speed ramp + freeze frame) ----------------
function TimeTab() {
  const speedKeys = useApp((s) => s.speedKeys);
  const freezeFrames = useApp((s) => s.freezeFrames);
  const frame = useApp((s) => s.frame);
  const busy = useApp((s) => !!s.task);
  const n = useApp((s) => s.video?.frameCount ?? 0);

  return (
    <div className="flex flex-col gap-3">
      <Section title="Speed ramp (time remapping)">
        <p className="text-[11px] leading-relaxed text-white/45">
          Add speed keyframes to create slow-motion, speed-ramp, or reverse sections.
          Each key sets the playback speed until the next key.
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            disabled={busy}
            onClick={() => addSpeedKey(0.25)}
            className="rounded-lg bg-white/[0.04] py-2 text-[11px] ring-1 ring-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            <Icon name="speed" size={18} className="mx-auto mb-0.5" />
            0.25x
          </button>
          <button
            disabled={busy}
            onClick={() => addSpeedKey(0.5)}
            className="rounded-lg bg-white/[0.04] py-2 text-[11px] ring-1 ring-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            <Icon name="speed" size={18} className="mx-auto mb-0.5" />
            0.5x
          </button>
          <button
            disabled={busy}
            onClick={() => addSpeedKey(1)}
            className="rounded-lg bg-white/[0.04] py-2 text-[11px] ring-1 ring-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            <Icon name="play" size={18} className="mx-auto mb-0.5" />
            1x
          </button>
          <button
            disabled={busy}
            onClick={() => addSpeedKey(2)}
            className="rounded-lg bg-white/[0.04] py-2 text-[11px] ring-1 ring-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            <Icon name="rocket" size={18} className="mx-auto mb-0.5" />
            2x
          </button>
        </div>
        {speedKeys.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {speedKeys.map((k) => (
              <div key={k.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2">
                <span className="font-mono text-[11px] text-white/50">f{k.frame}</span>
                <input
                  type="range"
                  min={-2}
                  max={3}
                  step={0.05}
                  value={k.speed}
                  onChange={(e) => updateSpeedKey(k.id, { speed: Number(e.target.value) })}
                  className="tw-range flex-1"
                />
                <span className="w-12 text-right font-mono text-[11px] text-lock">{k.speed.toFixed(2)}x</span>
                <button
                  onClick={() => removeSpeedKey(k.id)}
                  className="rounded p-1 text-red-300/70 hover:bg-red-500/15"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={clearSpeedKeys}
              className="rounded-lg bg-white/5 py-1.5 text-[11px] text-white/50 hover:bg-white/10"
            >
              Clear all speed keys
            </button>
          </div>
        )}
      </Section>

      <Section title="Freeze frame">
        <p className="text-[11px] leading-relaxed text-white/45">
          Hold the current frame for a number of frames — great for emphasis or beat-synced pauses.
        </p>
        <button
          disabled={busy}
          onClick={() => addFreezeFrame(15)}
          className="rounded-lg bg-lock py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
        >
          <Icon name="freeze" size={16} className="mr-1.5 inline" />
          Freeze at frame {frame}
        </button>
        {freezeFrames.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {freezeFrames.map((ff) => (
              <div key={ff.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2">
                <Icon name="freeze" size={16} className="text-lock" />
                <span className="font-mono text-[11px] text-white/50">f{ff.sourceFrame}</span>
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={ff.duration}
                  onChange={(e) => updateFreezeFrame(ff.id, { duration: Number(e.target.value) })}
                  className="tw-range flex-1"
                />
                <span className="w-10 text-right font-mono text-[11px] text-lock">{ff.duration}f</span>
                <button
                  onClick={() => removeFreezeFrame(ff.id)}
                  className="rounded p-1 text-red-300/70 hover:bg-red-500/15"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={clearFreezeFrames}
              className="rounded-lg bg-white/5 py-1.5 text-[11px] text-white/50 hover:bg-white/10"
            >
              Clear all freeze frames
            </button>
          </div>
        )}
      </Section>

      <Section title="Project save / load">
        <p className="text-[11px] leading-relaxed text-white/45">
          Save your tracking project to a JSON file. Load it later with the same video to restore all tracks, attachments, camera, and effects.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={saveProject}
            className="rounded-lg bg-white/10 py-2 text-xs font-medium hover:bg-white/15"
          >
            <Icon name="save" size={16} className="mr-1.5 inline" />
            Save project
          </button>
          <label className="cursor-pointer rounded-lg bg-white/10 py-2 text-center text-xs font-medium hover:bg-white/15">
            <Icon name="load" size={16} className="mr-1.5 inline" />
            Load project
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && loadProject(e.target.files[0])}
            />
          </label>
        </div>
      </Section>
    </div>
  );
}

// ---------------- ENHANCE ----------------
function EnhanceTab() {
  const en = useApp((s) => s.enhance);
  const cg = useApp((s) => s.colorGrade);
  const busy = useApp((s) => !!s.task);
  return (
    <div className="flex flex-col gap-3">
      <Section title="Light">
        <Slider label="Exposure" value={en.exposure} min={-1} max={1} onChange={(v) => setEnhance({ exposure: v })} fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`} />
        <Slider label="Brightness" value={en.brightness} min={-1} max={1} onChange={(v) => setEnhance({ brightness: v })} fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`} />
        <Slider label="Contrast" value={en.contrast} min={-1} max={1} onChange={(v) => setEnhance({ contrast: v })} fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`} />
        <Slider label="Highlights" value={en.highlights} min={-1} max={1} onChange={(v) => setEnhance({ highlights: v })} fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`} />
        <Slider label="Shadows" value={en.shadows} min={-1} max={1} onChange={(v) => setEnhance({ shadows: v })} fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`} />
      </Section>
      <Section title="Color">
        <Slider label="Saturation" value={en.saturation} min={-1} max={1} onChange={(v) => setEnhance({ saturation: v })} fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`} />
        <Slider label="Temperature" value={cg.temperature} min={-1} max={1} onChange={(v) => setColorGrade({ temperature: v })} fmt={(v) => v > 0 ? `+${Math.round(v * 100)} warm` : v < 0 ? `${Math.round(v * 100)} cool` : "0"} />
        <Slider label="Tint" value={cg.tint} min={-1} max={1} onChange={(v) => setColorGrade({ tint: v })} fmt={(v) => v > 0 ? `+${Math.round(v * 100)} magenta` : v < 0 ? `${Math.round(v * 100)} green` : "0"} />
        <Slider label="Hue shift" value={cg.hue} min={-180} max={180} step={1} onChange={(v) => setColorGrade({ hue: v })} fmt={(v) => `${v}deg`} />
      </Section>
      <Section title="Detail">
        <Slider label="Sharpen" value={en.sharpen} min={0} max={1} onChange={(v) => setEnhance({ sharpen: v })} fmt={pct} />
        <Slider label="Clarity" value={en.clarity} min={0} max={1} onChange={(v) => setEnhance({ clarity: v })} fmt={pct} />
        <Slider label="Denoise" value={en.denoise} min={0} max={1} onChange={(v) => setEnhance({ denoise: v })} fmt={pct} />
      </Section>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={resetEnhance} className="rounded-lg bg-white/5 py-2 text-xs text-white/60 ring-1 ring-white/10 hover:bg-white/10">
          Reset enhance
        </button>
        <button onClick={resetColorGrade} className="rounded-lg bg-white/5 py-2 text-xs text-white/60 ring-1 ring-white/10 hover:bg-white/10">
          Reset color
        </button>
      </div>
    </div>
  );
}

// ---------------- TRIM ----------------
function TrimTab() {
  const video = useApp((s) => s.video);
  const trimStart = useApp((s) => s.trimStart);
  const trimEnd = useApp((s) => s.trimEnd);
  const frame = useApp((s) => s.frame);
  if (!video) return null;
  const n = video.frameCount;
  const dur = video.duration;
  const trimDur = ((trimEnd - trimStart + 1) / video.fps);
  return (
    <div className="flex flex-col gap-3">
      <Section title="Trim video">
        <p className="text-[11px] leading-relaxed text-white/45">
          Set the start and end frames. The exported video will only include this range.
        </p>
        <div className="rounded-lg bg-black/30 p-3">
          <div className="mb-1 flex justify-between text-[11px] text-white/50">
            <span>Start: frame {trimStart}</span>
            <span>{(trimStart / video.fps).toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={n - 2}
            step={1}
            value={trimStart}
            onChange={(e) => setTrim(Number(e.target.value), trimEnd)}
            className="tw-range w-full"
            style={{ ["--p" as string]: `${(trimStart / (n - 1)) * 100}%` }}
          />
          <div className="mb-1 mt-3 flex justify-between text-[11px] text-white/50">
            <span>End: frame {trimEnd}</span>
            <span>{(trimEnd / video.fps).toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min={1}
            max={n - 1}
            step={1}
            value={trimEnd}
            onChange={(e) => setTrim(trimStart, Number(e.target.value))}
            className="tw-range w-full"
            style={{ ["--p" as string]: `${(trimEnd / (n - 1)) * 100}%` }}
          />
        </div>
        <div className="rounded-lg bg-white/[0.04] p-2.5 text-center text-xs">
          <span className="text-white/50">Output duration: </span>
          <span className="font-mono font-semibold text-lock">{trimDur.toFixed(2)}s</span>
          <span className="text-white/40"> ({trimEnd - trimStart + 1} frames)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setTrim(frame, trimEnd); }}
            className="rounded-lg bg-white/[0.06] py-1.5 text-[11px] hover:bg-white/15"
          >
            Set start to here
          </button>
          <button
            onClick={() => { setTrim(trimStart, frame); }}
            className="rounded-lg bg-white/[0.06] py-1.5 text-[11px] hover:bg-white/15"
          >
            Set end to here
          </button>
        </div>
        <button onClick={resetTrim} className="rounded-lg bg-white/5 py-1.5 text-[11px] text-white/60 hover:bg-white/10">
          Reset trim
        </button>
      </Section>
    </div>
  );
}

// ---------------- SHELL ----------------
const TABS: { id: Tab; icon: IconName; label: string }[] = [
  { id: "magic", icon: "magic", label: "Magic" },
  { id: "track", icon: "track", label: "Track" },
  { id: "camera", icon: "camera", label: "Camera" },
  { id: "overlay", icon: "overlay", label: "Overlays" },
  { id: "time", icon: "speed", label: "Time" },
  { id: "enhance", icon: "bolt", label: "Enhance" },
  { id: "trim", icon: "contract", label: "Trim" },
  { id: "fx", icon: "look", label: "Look" },
];

export default function Panels() {
  const tab = useApp((s) => s.tab);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-8 gap-0.5 border-b border-white/10 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => store.set({ tab: t.id })}
            className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[9px] font-medium transition ${
              tab === t.id ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "magic" && <MagicTab />}
        {tab === "track" && <TrackTab />}
        {tab === "camera" && <CameraTab />}
        {tab === "overlay" && <OverlayTab />}
        {tab === "time" && <TimeTab />}
        {tab === "enhance" && <EnhanceTab />}
        {tab === "trim" && <TrimTab />}
        {tab === "fx" && <FxTab />}
      </div>
    </div>
  );
}

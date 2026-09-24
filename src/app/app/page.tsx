"use client";

import { useEffect } from "react";
import Link from "next/link";
import { store, useApp } from "@/lib/tracking/store";
import { cancelTask, closeVideo, loadFile } from "@/lib/tracking/actions";
import { step, togglePlay } from "@/lib/tracking/player";
import { hydrateAssets } from "@/lib/tracking/assets";
import { Icon } from "@/components/tracking/Icons";
import Stage from "@/components/tracking/Stage";
import Timeline from "@/components/tracking/Timeline";
import Panels from "@/components/tracking/Panels";
import ExportModal from "@/components/tracking/ExportModal";
import { Library, StudioStart } from "@/components/tracking/Library";
import { Mark } from "@/components/site/Mark";
import { Banner300x250 } from "@/components/ads/Banner300x250";

const RAIL = [
  { href: "/", label: "Index" },
  { href: "/app", label: "Studio" },
  { href: "/about", label: "About" },
];

function Spinner() {
  return (
    <svg className="ios-spin h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="12"
          y1="2.5"
          x2="12"
          y2="7"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity={0.18 + (i / 7) * 0.82}
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
    </svg>
  );
}

function TaskOverlay() {
  const task = useApp((s) => s.task);
  if (!task) return null;
  const p = task.total > 0 ? Math.min(1, task.current / task.total) : 0;
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[22px] bg-[#1c1c1e]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <Spinner />
          <div className="text-[15px] font-semibold">{task.label}</div>
        </div>
        {task.detail && <div className="mt-2 text-[13px] text-white/50">{task.detail}</div>}
        {task.total > 0 && (
          <>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-lock transition-[width] duration-150" style={{ width: `${p * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-white/45">
              <span>
                {task.current} / {task.total} frames
              </span>
              <span>{Math.round(p * 100)}%</span>
            </div>
          </>
        )}
        {/* Ad during video import / decoding / tracking operations */}
        <div className="mt-4 flex justify-center overflow-hidden">
          <Banner300x250 className="my-0" />
        </div>
        {task.cancellable && (
          <button
            onClick={cancelTask}
            className="mt-4 w-full rounded-[12px] bg-white/[0.08] py-2 text-[13px] font-medium text-lock transition-colors hover:bg-white/[0.12]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/** Toasts appear as a Dynamic-Island pill at the top of the screen. */
function Toast() {
  const t = useApp((s) => s.toast);
  if (!t) return null;
  return (
    <div
      key={t.id}
      role="status"
      className="toast-in fixed left-1/2 top-3 z-[130] flex items-center gap-2.5 rounded-full bg-black px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
    >
      <i className="inline-block h-2 w-2 rounded-full bg-lock" />
      {t.text}
    </div>
  );
}

export default function StudioPage() {
  const video = useApp((s) => s.video);
  const ready = useApp((s) => s.analysisReady);

  useEffect(() => {
    void hydrateAssets();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (!store.get().video || store.get().task) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (t && t.tagName === "BUTTON") t.blur();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        step(e.shiftKey ? 10 : 1);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        step(e.shiftKey ? -10 : -1);
      } else if (e.code === "Escape") store.set({ mode: "view" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.08] px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="CenterFace AI — home">
          <Mark size={22} />
          <span className="hidden text-[13.5px] font-semibold tracking-[-0.02em] sm:block">CenterFace</span>
          <span className="osd hidden text-white/35 lg:block">Studio</span>
        </Link>

        {video && (
          <div className="ml-3 hidden min-w-0 items-center gap-2 md:flex">
            <i className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-lock" />
            <span className="truncate font-mono text-[11px] text-white/45">
              {video.name} · {video.width}×{video.height} · {video.fps.toFixed(2)} fps · {video.frameCount} frames
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Library />
          {video && (
            <>
              <label className="tl-btn cursor-pointer">
                New
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
                />
              </label>
              <button onClick={closeVideo} className="tl-btn hidden sm:inline-flex" title="Close video" aria-label="Close video">
                ✕
              </button>
              <button
                disabled={!ready}
                onClick={() => store.set({ exportOpen: true, playing: false })}
                className="flex h-8 items-center gap-1.5 rounded-[9px] bg-lock px-3.5 text-[12.5px] font-semibold text-black transition-transform duration-200 ease-ios hover:scale-[1.03] active:scale-[0.97] disabled:opacity-35"
              >
                <Icon name="download" size={13} />
                Export
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Sections" className="hidden w-11 shrink-0 flex-col items-center gap-7 border-r border-white/[0.08] py-6 md:flex">
          {RAIL.map((r) => {
            const active = r.href === "/app";
            return (
              <Link
                key={r.href}
                href={r.href}
                aria-current={active ? "page" : undefined}
                className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] [writing-mode:vertical-rl] transition-colors ${
                  active ? "text-lock" : "text-white/30 hover:text-white/75"
                }`}
              >
                {r.label}
              </Link>
            );
          })}
          <span className="osd mt-auto text-white/15 [writing-mode:vertical-rl]">On-device</span>
        </nav>

        {!video ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <StudioStart />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <main className="flex min-h-[45vh] min-w-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 p-2 sm:p-4">
                <Stage />
              </div>
              <Timeline />
            </main>
            <aside className="flex min-h-0 flex-col border-t border-white/[0.08] bg-[#0a0a0b] lg:w-[360px] lg:border-l lg:border-t-0 max-lg:h-[46vh]">
              <Panels />
            </aside>
          </div>
        )}
      </div>

      <TaskOverlay />
      <ExportModal />
      <Toast />
    </div>
  );
}

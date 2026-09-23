"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Mark } from "@/components/site/Mark";
import { removeAsset, uploadAssets } from "@/lib/tracking/assets";

type AssetRow = { id: string; name: string; type: string; dataUrl: string; uploadedAt: number };
type ProjectRow = { id: string; name: string; videoName: string; duration: number | null; createdAt: number };
type ExportRow = {
  id: string;
  name: string;
  resolution: string;
  width: number | null;
  height: number | null;
  frames: number | null;
  duration: number | null;
  bytes: number | null;
  createdAt: number;
};
type NoteRow = { id: string; name: string; email: string; message: string; status: string; createdAt: number };
type Tab = "overview" | "library" | "projects" | "renders" | "notes";
type Kind = "sticker" | "preview" | "background";

const GLYPH: Record<Tab, ReactNode> = {
  overview: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1.3" />
      <rect x="9" y="2" width="5" height="5" rx="1.3" />
      <rect x="2" y="9" width="5" height="5" rx="1.3" />
      <rect x="9" y="9" width="5" height="5" rx="1.3" />
    </svg>
  ),
  library: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.6l1.95 3.95 4.35.63-3.15 3.07.74 4.33L8 11.53l-3.89 2.05.74-4.33L1.7 6.18l4.35-.63z" />
    </svg>
  ),
  projects: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.8 4.3A1.5 1.5 0 013.3 2.8h3.1l1.5 1.5h4.8a1.5 1.5 0 011.5 1.5v6.4a1.5 1.5 0 01-1.5 1.5H3.3a1.5 1.5 0 01-1.5-1.5z" />
    </svg>
  ),
  renders: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M5 3.2v9.6c0 .5.55.8.97.53l7.2-4.8a.63.63 0 000-1.06l-7.2-4.8A.63.63 0 005 3.2z" />
    </svg>
  ),
  notes: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.8" y="3.3" width="12.4" height="9.4" rx="1.8" fill="currentColor" />
      <path d="M2.8 4.6L8 8.6l5.2-4" stroke="#000" strokeOpacity="0.35" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

const NAV: { id: Tab; label: string; tint: string }[] = [
  { id: "overview", label: "Overview", tint: "#8e8e93" },
  { id: "library", label: "Overlay library", tint: "#ff9f0a" },
  { id: "projects", label: "Saved projects", tint: "#0a84ff" },
  { id: "renders", label: "Render log", tint: "#ff453a" },
  { id: "notes", label: "Notes", tint: "#30d158" },
];

const KINDS: { value: Kind; label: string }[] = [
  { value: "sticker", label: "Stickers" },
  { value: "preview", label: "Previews" },
  { value: "background", label: "Backgrounds" },
];

function IconTile({ tint, children, size = 28 }: { tint: string; children: ReactNode; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[7px] text-white"
      style={{ background: tint, width: size, height: size }}
    >
      {children}
    </span>
  );
}

function Group({ header, children, footer }: { header?: string; children: ReactNode; footer?: string }) {
  return (
    <section>
      {header ? <h3 className="px-4 pb-2 text-[13px] uppercase tracking-[0.04em] text-white/45">{header}</h3> : null}
      <div className="overflow-hidden rounded-[14px] bg-[#1c1c1e]">{children}</div>
      {footer ? <p className="px-4 pt-2 text-[12.5px] text-white/35">{footer}</p> : null}
    </section>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-[10px] bg-[#1c1c1e] p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
            value === o.value ? "bg-[#636366] text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]" : "text-white/60 hover:text-white"
          }`}
        >
          {o.label}
          {typeof o.count === "number" ? <span className="ml-1.5 tabular-nums text-white/45">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

const mb = (b: number | null) => (b ? `${(b / 1048576).toFixed(1)} MB` : "—");
const rel = (t: number) => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
const toMs = (v: unknown) => (typeof v === "number" ? v : new Date(String(v)).getTime());

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(String(r.status));
  return (await r.json()) as T;
}

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [renders, setRenders] = useState<ExportRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [kind, setKind] = useState<Kind>("sticker");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState<number | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, p, e, n] = await Promise.all([
        getJSON<AssetRow[]>("/api/assets"),
        getJSON<ProjectRow[]>("/api/projects"),
        getJSON<ExportRow[]>("/api/exports"),
        getJSON<NoteRow[]>("/api/feedback"),
      ]);
      setAssets(a);
      setProjects(p.map((x) => ({ ...x, createdAt: toMs(x.createdAt) })).sort((x, y) => y.createdAt - x.createdAt));
      setRenders(e.map((x) => ({ ...x, createdAt: toMs(x.createdAt) })));
      setNotes(n.map((x) => ({ ...x, createdAt: toMs(x.createdAt) })));
      setError(null);
      setSynced(Date.now());
    } catch {
      setError("Can’t reach the database right now — showing the last loaded data.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const bytes = renders.reduce((s, e) => s + (e.bytes ?? 0), 0);
    const frames = renders.reduce((s, e) => s + (e.frames ?? 0), 0);
    const dur = renders.reduce((s, e) => s + (e.duration ?? 0), 0);
    const unread = notes.filter((n) => n.status === "new").length;
    return { bytes, frames, dur, unread };
  }, [renders, notes]);

  const bars = useMemo(() => {
    const base = synced ?? 0;
    const days = Array.from({ length: 14 }, (_, i) => {
      const dt = new Date(base);
      dt.setHours(0, 0, 0, 0);
      dt.setDate(dt.getDate() - (13 - i));
      return { at: dt.getTime(), n: 0 };
    });
    for (const e of renders) {
      const t = new Date(e.createdAt).setHours(0, 0, 0, 0);
      const slot = days.find((x) => x.at === t);
      if (slot) slot.n += 1;
    }
    return { days, max: Math.max(1, ...days.map((x) => x.n)), total: days.reduce((s, x) => s + x.n, 0) };
  }, [renders, synced]);

  const term = q.trim().toLowerCase();
  const match = (s: string) => !term || s.toLowerCase().includes(term);
  const fAssets = assets.filter((a) => a.type === kind && match(a.name));
  const fProjects = projects.filter((p) => match(`${p.name} ${p.videoName}`));
  const fRenders = renders.filter((r) => match(r.name));
  const fNotes = notes.filter((n) => match(`${n.name} ${n.email} ${n.message}`));

  const activity = useMemo(
    () =>
      [
        ...renders.map((r) => ({ t: r.createdAt, label: `Exported ${r.name}`, tab: "renders" as Tab })),
        ...projects.map((p) => ({ t: p.createdAt, label: `Saved “${p.name}”`, tab: "projects" as Tab })),
        ...notes.map((n) => ({ t: n.createdAt, label: `Note from ${n.name}`, tab: "notes" as Tab })),
      ]
        .sort((a, b) => b.t - a.t)
        .slice(0, 7),
    [renders, projects, notes],
  );

  const counts: Record<Tab, number | null> = {
    overview: null,
    library: assets.length,
    projects: projects.length,
    renders: renders.length,
    notes: stats.unread || notes.length,
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      await uploadAssets(files, kind);
      await load();
    } finally {
      setBusy(false);
    }
  };
  const del = async (url: string) => {
    await fetch(url, { method: "DELETE" }).catch(() => {});
    await load();
  };
  const delAsset = async (id: string) => {
    setAssets((a) => a.filter((x) => x.id !== id));
    await removeAsset(id);
    await load();
  };
  const markRead = async (id: string) => {
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "read" }),
    }).catch(() => {});
  };

  const current = NAV.find((n) => n.id === tab)!;

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white md:flex-row">
      {/* ─────────────────────────────────────────────── sidebar ── */}
      <aside className="w-full shrink-0 border-b border-white/[0.08] px-4 pb-4 pt-5 md:sticky md:top-0 md:h-dvh md:w-[300px] md:overflow-y-auto md:border-b-0 md:border-r md:pb-8">
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2" aria-label="TrackWeb Motion — home">
            <Mark size={24} />
            <span className="text-[14px] font-semibold tracking-[-0.02em]">TrackWeb</span>
          </Link>
          <Link href="/app" className="text-[14px] font-medium text-lock">
            Studio
          </Link>
        </div>
        <h1 className="mt-6 px-2 text-[34px] font-bold tracking-[-0.03em]">Admin</h1>

        <label className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#1c1c1e] px-3 py-2">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-white/40" aria-hidden="true">
            <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search the current list"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/35 outline-none focus-visible:outline-none"
          />
        </label>

        {/* mobile: horizontal pills */}
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                tab === n.id ? "bg-lock text-black" : "bg-[#1c1c1e] text-white/70"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* desktop: Settings-style grouped list */}
        <nav className="mt-5 hidden overflow-hidden rounded-[12px] bg-[#1c1c1e] md:block" aria-label="Admin sections">
          {NAV.map((n, i) => {
            const active = tab === n.id;
            const c = counts[n.id];
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                aria-current={active ? "page" : undefined}
                className={`relative flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-[#3a3a3c]" : "hover:bg-white/[0.04]"
                }`}
              >
                {i > 0 && !active ? <span className="absolute left-[52px] right-0 top-0 h-px bg-white/[0.08]" /> : null}
                <IconTile tint={n.tint}>{GLYPH[n.id]}</IconTile>
                <span className="flex-1 text-[15px]">{n.label}</span>
                {n.id === "notes" && stats.unread > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lock px-1.5 text-[11.5px] font-semibold tabular-nums text-black">
                    {stats.unread}
                  </span>
                ) : c !== null ? (
                  <span className="text-[14px] tabular-nums text-white/40">{c}</span>
                ) : null}
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none" className="text-white/25" aria-hidden="true">
                  <path d="M1.5 1.5L6.5 6.5 1.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </nav>

        <p className="mt-5 hidden px-3 text-[12.5px] leading-relaxed text-white/35 md:block">
          Postgres · Drizzle ORM
          <br />
          {synced ? `Synced ${new Date(synced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Syncing…"}
        </p>
      </aside>

      {/* ─────────────────────────────────────────────────── main ── */}
      <main className="min-w-0 flex-1 px-5 pb-16 pt-8 sm:px-10 sm:pt-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="osd text-white/40">Admin · {current.label}</p>
            <h2 className="mt-2 text-[34px] font-bold tracking-[-0.03em] sm:text-[40px]">{current.label}</h2>
          </div>
          <button onClick={() => void load()} className="tl-btn h-9 px-4 text-[13px]">
            Refresh
          </button>
        </header>

        {error ? (
          <div className="mt-6 rounded-[14px] bg-rec/10 px-4 py-3 text-[14px] text-rec ring-1 ring-rec/25">{error}</div>
        ) : null}

        {/* ───────────────────────────────────────────── overview ── */}
        {tab === "overview" && (
          <div className="mt-8 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {(
                [
                  { id: "renders", l: "Renders", v: renders.length, s: `${mb(stats.bytes)} total` },
                  { id: "projects", l: "Projects", v: projects.length, s: "Saved from the studio" },
                  { id: "library", l: "Overlays", v: assets.length, s: "In the library" },
                  { id: "notes", l: "Notes", v: notes.length, s: `${stats.unread} unread` },
                ] as { id: Tab; l: string; v: number; s: string }[]
              ).map((w) => (
                <button
                  key={w.id}
                  onClick={() => setTab(w.id)}
                  className="rounded-[22px] bg-[#1c1c1e] p-5 text-left transition-colors hover:bg-[#232326]"
                >
                  <div className="flex items-center gap-2.5">
                    <IconTile tint={NAV.find((n) => n.id === w.id)!.tint}>{GLYPH[w.id]}</IconTile>
                    <span className="text-[14px] font-medium text-white/70">{w.l}</span>
                  </div>
                  <div className="mt-6 text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{w.v}</div>
                  <div className="mt-2 text-[13px] text-white/45">{w.s}</div>
                </button>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-[22px] bg-[#1c1c1e] p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[17px] font-semibold">Renders</h3>
                  <span className="text-[13px] text-white/45">Last 14 days</span>
                </div>
                <p className="mt-1 text-[13px] text-white/45">
                  <span className="text-[28px] font-semibold tabular-nums text-white">{bars.total}</span> exports ·{" "}
                  {stats.frames.toLocaleString()} frames · {stats.dur.toFixed(1)}s of footage
                </p>
                <div className="mt-6 flex h-44 items-end gap-[6px]">
                  {bars.days.map((x, i) => (
                    <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
                      <div
                        className={`w-full rounded-[5px] transition-colors ${x.n ? "bg-lock group-hover:bg-lock-2" : "bg-white/[0.12]"}`}
                        style={{ height: `${x.n ? Math.max(8, (x.n / bars.max) * 100) : 3}%` }}
                      />
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#3a3a3c] px-1.5 py-0.5 text-[11px] tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
                        {x.n}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[11.5px] tabular-nums text-white/35">
                  <span>
                    {synced
                      ? new Date(bars.days[0].at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                      : "—"}
                  </span>
                  <span>Today</span>
                </div>
              </div>

              <Group header="Latest activity">
                {activity.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[14px] text-white/40">Nothing recorded yet.</div>
                ) : (
                  activity.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setTab(a.tab)}
                      className="relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      {i > 0 ? <span className="absolute left-[56px] right-0 top-0 h-px bg-white/[0.08]" /> : null}
                      <IconTile tint={NAV.find((n) => n.id === a.tab)!.tint}>{GLYPH[a.tab]}</IconTile>
                      <span className="min-w-0 flex-1 truncate text-[14.5px]">{a.label}</span>
                      <span className="shrink-0 text-[12.5px] tabular-nums text-white/40">{rel(a.t)}</span>
                    </button>
                  ))
                )}
              </Group>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────── library ── */}
        {tab === "library" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Seg
                value={kind}
                onChange={setKind}
                options={KINDS.map((k) => ({ ...k, count: assets.filter((a) => a.type === k.value).length }))}
              />
              <label className="btn-lock h-10 cursor-pointer px-5 text-[14px]">
                Upload
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
              </label>
            </div>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                void onFiles(e.dataTransfer.files);
              }}
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border-[1.5px] border-dashed px-6 py-12 text-center transition-colors ${
                drag ? "border-lock bg-lock/[0.06]" : "border-white/15 bg-[#1c1c1e]/40 hover:border-white/30"
              }`}
            >
              <IconTile tint="#ff9f0a" size={44}>
                {GLYPH.library}
              </IconTile>
              <span className="text-[16px] font-semibold">{busy ? "Uploading…" : `Drop ${kind}s here`}</span>
              <span className="max-w-sm text-[13.5px] text-white/45">
                PNG, JPG or WebP. Stored in Postgres and available in the studio’s sticker picker straight away.
              </span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
            </label>

            {fAssets.length === 0 ? (
              <p className="mt-10 text-center text-[14px] text-white/40">No {kind}s {term ? "match your search" : "yet"}.</p>
            ) : (
              <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {fAssets.map((a) => (
                  <li key={a.id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-[18px] bg-[#1c1c1e] p-4">
                      <img src={a.dataUrl} alt={a.name} className="h-full w-full object-contain" loading="lazy" />
                    </div>
                    <button
                      onClick={() => void delAsset(a.id)}
                      aria-label={`Delete ${a.name}`}
                      className="absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#3a3a3c] shadow-lg ring-2 ring-black transition-colors hover:bg-rec"
                    >
                      <span className="block h-[2px] w-2.5 rounded bg-white" />
                    </button>
                    <p className="mt-2 truncate px-1 text-center text-[12px] text-white/55">{a.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────── projects ── */}
        {tab === "projects" && (
          <div className="mt-8 max-w-4xl">
            <Group header={`${fProjects.length} saved`} footer="Projects are saved from the studio’s Library menu.">
              {fProjects.length === 0 ? (
                <div className="px-4 py-8 text-center text-[14px] text-white/40">No projects {term ? "match" : "yet"}.</div>
              ) : (
                fProjects.map((p, i) => (
                  <div key={p.id} className="group relative flex items-center gap-3 px-4 py-3">
                    {i > 0 ? <span className="absolute left-[56px] right-0 top-0 h-px bg-white/[0.08]" /> : null}
                    <IconTile tint="#0a84ff">{GLYPH.projects}</IconTile>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{p.name}</div>
                      <div className="truncate text-[13px] text-white/45">
                        {p.videoName}
                        {p.duration ? ` · ${p.duration.toFixed(1)}s` : ""}
                      </div>
                    </div>
                    <span className="hidden shrink-0 text-[13px] tabular-nums text-white/40 sm:block">{rel(p.createdAt)}</span>
                    <button
                      onClick={() => void del(`/api/projects?id=${encodeURIComponent(p.id)}`)}
                      className="shrink-0 text-[14px] font-medium text-rec transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </Group>
          </div>
        )}

        {/* ────────────────────────────────────────────── renders ── */}
        {tab === "renders" && (
          <div className="mt-8 max-w-4xl">
            <Group header={`${fRenders.length} exports`} footer="Every export from the studio is logged automatically.">
              {fRenders.length === 0 ? (
                <div className="px-4 py-8 text-center text-[14px] text-white/40">No renders {term ? "match" : "yet"}.</div>
              ) : (
                fRenders.map((r, i) => (
                  <div key={r.id} className="group relative flex items-center gap-3 px-4 py-3">
                    {i > 0 ? <span className="absolute left-[56px] right-0 top-0 h-px bg-white/[0.08]" /> : null}
                    <IconTile tint="#ff453a">{GLYPH.renders}</IconTile>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{r.name}</div>
                      <div className="truncate font-mono text-[12px] text-white/45">
                        {r.width && r.height ? `${r.width}×${r.height}` : r.resolution} · {r.frames ?? "—"} frames · {mb(r.bytes)}
                      </div>
                    </div>
                    <span className="hidden shrink-0 text-[13px] tabular-nums text-white/40 sm:block">{rel(r.createdAt)}</span>
                    <button
                      onClick={() => void del(`/api/exports?id=${encodeURIComponent(r.id)}`)}
                      className="shrink-0 text-[14px] font-medium text-rec transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </Group>
          </div>
        )}

        {/* ──────────────────────────────────────────────── notes ── */}
        {tab === "notes" && (
          <div className="mt-8 max-w-3xl">
            <Group header={`${stats.unread} unread`} footer="Notes arrive from the contact form on the About page.">
              {fNotes.length === 0 ? (
                <div className="px-4 py-8 text-center text-[14px] text-white/40">No notes {term ? "match" : "yet"}.</div>
              ) : (
                fNotes.map((n, i) => {
                  const open = openNote === n.id;
                  return (
                    <div key={n.id} className="relative px-4 py-4">
                      {i > 0 ? <span className="absolute left-9 right-0 top-0 h-px bg-white/[0.08]" /> : null}
                      <div className="flex gap-3">
                        <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.status === "new" ? "bg-lock" : "bg-transparent"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-[15px] font-semibold">{n.name}</span>
                            <span className="shrink-0 text-[13px] tabular-nums text-white/40">{rel(n.createdAt)}</span>
                          </div>
                          <a href={`mailto:${n.email}`} className="text-[13px] text-white/45 transition-colors hover:text-white">
                            {n.email}
                          </a>
                          <p className={`mt-1.5 whitespace-pre-line text-[14.5px] leading-[1.55] text-white/75 ${open ? "" : "line-clamp-2"}`}>
                            {n.message}
                          </p>
                          <div className="mt-3 flex gap-5 text-[14px] font-medium">
                            <button
                              onClick={() => {
                                setOpenNote(open ? null : n.id);
                                if (n.status === "new") void markRead(n.id);
                              }}
                              className="text-lock"
                            >
                              {open ? "Collapse" : "Open"}
                            </button>
                            {n.status === "new" ? (
                              <button onClick={() => void markRead(n.id)} className="text-white/60 hover:text-white">
                                Mark read
                              </button>
                            ) : null}
                            <button onClick={() => void del(`/api/feedback?id=${encodeURIComponent(n.id)}`)} className="text-rec">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </Group>
          </div>
        )}
      </main>
    </div>
  );
}

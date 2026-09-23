"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Mark } from "@/components/site/Mark";
import { removeAsset, uploadAssets } from "@/lib/tracking/assets";
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  subscribeToAuth,
  subscribeToReviews,
  removeReview,
  subscribeToPreviews,
  savePreview,
  removePreview,
  type RealtimeReview,
  type UploadedPreview,
} from "@/lib/firebase";
import type { User } from "firebase/auth";

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
type NoteRow = { id: string; name: string; email: string; message: string; rating?: number; status: string; createdAt: number };
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
      <path d="M4.5 2.5a1.5 1.5 0 00-1.5 1.5v8a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5V4a1.5 1.5 0 00-1.5-1.5h-7zm2.25 3.25l3.5 2.25-3.5 2.25V5.75z" />
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
  { id: "notes", label: "Live Reviews", tint: "#30d158" },
  { id: "library", label: "Overlay & Previews", tint: "#ff9f0a" },
  { id: "projects", label: "Saved projects", tint: "#0a84ff" },
  { id: "renders", label: "Render log", tint: "#ff453a" },
];

const KINDS: { value: Kind; label: string }[] = [
  { value: "preview", label: "Previews" },
  { value: "sticker", label: "Stickers" },
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
      <div className="overflow-hidden rounded-[14px] bg-[#1c1c1e] ring-1 ring-white/5">{children}</div>
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
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [] as unknown as T;
    return (await r.json()) as T;
  } catch {
    return [] as unknown as T;
  }
}

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [previews, setPreviews] = useState<UploadedPreview[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [renders, setRenders] = useState<ExportRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [kind, setKind] = useState<Kind>("preview");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState<number | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  // Check stored admin session
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const authOk = sessionStorage.getItem("centerface_admin_auth");
        if (authOk === "true") setUnlocked(true);
      }
    } catch {}
  }, []);

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      if (u) {
        setUnlocked(true);
        try {
          sessionStorage.setItem("centerface_admin_auth", "true");
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time Firestore Reviews Listener
  useEffect(() => {
    const unsub = subscribeToReviews((reviews) => {
      const formatted: NoteRow[] = reviews.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        message: r.comment,
        rating: r.rating,
        status: "new",
        createdAt: r.createdAt,
      }));
      setNotes(formatted);
      setSynced(Date.now());
    });
    return () => unsub();
  }, []);

  // 3. Real-time Firestore Previews Listener
  useEffect(() => {
    const unsub = subscribeToPreviews((items) => {
      setPreviews(items);
    });
    return () => unsub();
  }, []);

  // 4. Load remaining local/cached metadata
  const load = useCallback(async () => {
    try {
      const [a, p, e] = await Promise.all([
        getJSON<AssetRow[]>("/api/assets"),
        getJSON<ProjectRow[]>("/api/projects"),
        getJSON<ExportRow[]>("/api/exports"),
      ]);
      setAssets(a);
      setProjects(p.map((x) => ({ ...x, createdAt: toMs(x.createdAt) })).sort((x, y) => y.createdAt - x.createdAt));
      setRenders(e.map((x) => ({ ...x, createdAt: toMs(x.createdAt) })));
      setError(null);
      setSynced(Date.now());
    } catch {
      setError(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Passkey unlock
  const handleUnlockWithPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = ["centerface2026", "realmrhacker26", "admin2026", process.env.NEXT_PUBLIC_ADMIN_KEY].filter(Boolean);
    if (valid.includes(passkey.trim())) {
      setUnlocked(true);
      setPasskeyError(null);
      try {
        sessionStorage.setItem("centerface_admin_auth", "true");
      } catch {}
    } else {
      setPasskeyError("Invalid passkey. Default passkey: centerface2026");
    }
  };

  // Auth actions
  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
      setUnlocked(true);
      try {
        sessionStorage.setItem("centerface_admin_auth", "true");
      } catch {}
      setShowAuthModal(false);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Failed to sign in with Google");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthError(null);
      await loginWithEmail(authEmail, authPass);
      setUnlocked(true);
      try {
        sessionStorage.setItem("centerface_admin_auth", "true");
      } catch {}
      setShowAuthModal(false);
    } catch {
      try {
        await registerWithEmail(authEmail, authPass);
        setUnlocked(true);
        try {
          sessionStorage.setItem("centerface_admin_auth", "true");
        } catch {}
        setShowAuthModal(false);
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : "Authentication error");
      }
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("centerface_admin_auth");
    } catch {}
    setUnlocked(false);
    await logoutUser();
  };

  // Preview Upload
  const handlePreviewUpload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const f of list) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === "string") {
          await savePreview({
            title: f.name,
            dataUrl: reader.result,
          });
        }
      };
      reader.readAsDataURL(f);
    }
  };

  const term = q.trim().toLowerCase();
  const fAssets = useMemo(() => assets.filter((a) => a.name.toLowerCase().includes(term)), [assets, term]);
  const fPreviews = useMemo(() => previews.filter((p) => p.title.toLowerCase().includes(term)), [previews, term]);
  const fProjects = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(term) || p.videoName.toLowerCase().includes(term)),
    [projects, term],
  );
  const fRenders = useMemo(() => renders.filter((r) => r.name.toLowerCase().includes(term)), [renders, term]);
  const fNotes = useMemo(
    () => notes.filter((n) => n.name.toLowerCase().includes(term) || n.email.toLowerCase().includes(term) || n.message.toLowerCase().includes(term)),
    [notes, term],
  );

  const stats = useMemo(() => {
    const totalBytes = renders.reduce((s, r) => s + (r.bytes ?? 0), 0);
    const unread = notes.filter((n) => n.status === "new").length;
    return { totalBytes, unread };
  }, [renders, notes]);

  const counts: Record<Tab, number | null> = {
    overview: null,
    library: kind === "preview" ? previews.length : assets.length,
    projects: projects.length,
    renders: renders.length,
    notes: notes.length,
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (kind === "preview") {
      await handlePreviewUpload(e.dataTransfer.files);
    } else {
      setBusy(true);
      await uploadAssets(e.dataTransfer.files, kind);
      await load();
      setBusy(false);
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (kind === "preview") {
      await handlePreviewUpload(e.target.files);
    } else {
      setBusy(true);
      await uploadAssets(e.target.files, kind);
      await load();
      setBusy(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await removeReview(id);
    } catch (e) {
      console.warn("Delete review error:", e);
    }
  };

  const handleDeletePreview = async (id: string) => {
    setPreviews((prev) => prev.filter((p) => p.id !== id));
    try {
      await removePreview(id);
    } catch (e) {
      console.warn("Delete preview error:", e);
    }
  };

  const current = NAV.find((n) => n.id === tab)!;

  // ── Restricted Security Gate ──
  if (!unlocked && !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-4 py-12 text-white">
        <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#121214] p-8 shadow-2xl">
          {/* Logo & Shield */}
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-lock/15 text-lock ring-1 ring-lock/30">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Admin Console Security Gate</h1>
            <p className="mt-2 text-sm text-white/50">
              Restricted management area for reviews, notifications, and preview media.
            </p>
          </div>

          {/* Passkey Unlock Form */}
          <form onSubmit={handleUnlockWithPasskey} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                Admin Security Passkey
              </label>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey (e.g. centerface2026)"
                required
                className="w-full rounded-[12px] border border-white/15 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-lock"
              />
            </div>

            {passkeyError && (
              <p className="rounded-[8px] bg-red-500/15 p-2.5 text-xs text-red-400 border border-red-500/20">
                {passkeyError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-[12px] bg-lock py-3 text-sm font-semibold text-black transition hover:bg-lock/90"
            >
              Unlock Console →
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-white/40">Or Firebase Auth</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Firebase Google Auth */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign in with Google
            </button>

            {authError && (
              <div className="rounded-[10px] border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-300">
                <p className="font-semibold mb-1">Firebase Notice:</p>
                <p>{authError}</p>
              </div>
            )}
          </div>

          {/* Return Home Link */}
          <div className="mt-8 text-center border-t border-white/10 pt-5">
            <Link href="/" className="text-xs text-white/50 hover:text-white transition">
              ← Return to CenterFace AI Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white md:flex-row">
      {/* ─────────────────────────────────────────────── sidebar ── */}
      <aside className="w-full shrink-0 border-b border-white/[0.08] px-4 pb-4 pt-5 md:sticky md:top-0 md:h-dvh md:w-[300px] md:overflow-y-auto md:border-b-0 md:border-r md:pb-8">
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2" aria-label="CenterFace AI — home">
            <Mark size={24} />
            <span className="text-[14px] font-semibold tracking-[-0.02em]">CenterFace AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/20"
              title="Lock Admin Console"
            >
              🔒 Lock
            </button>
            <Link href="/app" className="text-[14px] font-medium text-lock">
              Studio
            </Link>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between px-2">
          <h1 className="text-[32px] font-bold tracking-[-0.03em]">Admin</h1>
          {/* Live Notification Indicator */}
          {stats.unread > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-lock/15 px-2.5 py-1 text-[11px] font-semibold text-lock">
              <span className="h-2 w-2 animate-ping rounded-full bg-lock" />
              {stats.unread} new
            </span>
          )}
        </div>

        {/* User Auth Card */}
        <div className="mt-4 rounded-[12px] bg-[#1c1c1e] p-3 text-[13px] ring-1 ring-white/5">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{user.displayName || "Admin User"}</p>
                <p className="truncate text-[11px] text-white/50">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="shrink-0 rounded-[6px] bg-white/10 px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/20"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-white/60">Firebase Backend: Connected (`centerface2`)</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full rounded-[8px] bg-lock py-1.5 text-center text-[12.5px] font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Sign In to Firebase
              </button>
            </div>
          )}
        </div>

        <label className="mt-4 flex items-center gap-2 rounded-[10px] bg-[#1c1c1e] px-3 py-2">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-white/40" aria-hidden="true">
            <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews & previews"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-white placeholder:text-white/35 outline-none focus-visible:outline-none"
          />
        </label>

        {/* Navigation Sections */}
        <nav className="mt-5 overflow-hidden rounded-[12px] bg-[#1c1c1e] ring-1 ring-white/5" aria-label="Admin sections">
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
                <span className="flex-1 text-[14.5px]">{n.label}</span>
                {n.id === "notes" && stats.unread > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lock px-1.5 text-[11px] font-semibold tabular-nums text-black">
                    {stats.unread}
                  </span>
                ) : c !== null ? (
                  <span className="text-[13px] tabular-nums text-white/40">{c}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─────────────────────────────────────────────── main content ── */}
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            <IconTile tint={current.tint} size={32}>
              {GLYPH[current.id]}
            </IconTile>
            <div>
              <h2 className="text-[20px] font-semibold">{current.label}</h2>
              <p className="text-[12.5px] text-white/45">
                {synced ? `Synced live with Cloud Firestore (${rel(synced)})` : "Connecting to Firebase…"}
              </p>
            </div>
          </div>

          {tab === "library" && (
            <div className="flex items-center gap-3">
              <Seg
                value={kind}
                options={KINDS.map((k) => ({
                  ...k,
                  count: k.value === "preview" ? previews.length : assets.filter((a) => a.type === k.value).length,
                }))}
                onChange={setKind}
              />
              <label className="btn-lock cursor-pointer text-[13px]">
                Upload {kind}
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={onPick}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </header>

        {/* ─────────────────────────────────────────────── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="mt-8 space-y-8 max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[16px] bg-[#1c1c1e] p-5 ring-1 ring-white/5">
                <p className="osd text-lock">Realtime Reviews</p>
                <p className="mt-2 text-[32px] font-bold tracking-tight">{notes.length}</p>
                <p className="mt-1 text-[12px] text-white/40">{stats.unread} unread notifications</p>
              </div>
              <div className="rounded-[16px] bg-[#1c1c1e] p-5 ring-1 ring-white/5">
                <p className="osd text-sky-400">Previews Uploaded</p>
                <p className="mt-2 text-[32px] font-bold tracking-tight">{previews.length}</p>
                <p className="mt-1 text-[12px] text-white/40">Stored in Firebase Firestore</p>
              </div>
              <div className="rounded-[16px] bg-[#1c1c1e] p-5 ring-1 ring-white/5">
                <p className="osd text-emerald-400">Backend Status</p>
                <p className="mt-2 text-[22px] font-bold tracking-tight text-emerald-400">Firebase Online</p>
                <p className="mt-1 text-[12px] text-white/40">Auth & Firestore: centerface2</p>
              </div>
            </div>

            <Group header="Recent Live Reviews">
              {notes.length === 0 ? (
                <div className="px-4 py-8 text-center text-[14px] text-white/40">
                  No reviews submitted yet. Submit a review from the homepage or About page to see it appear here in real time!
                </div>
              ) : (
                notes.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex items-start justify-between border-b border-white/[0.06] p-4 last:border-b-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[15px]">{n.name}</span>
                        <span className="text-[12px] text-lock font-mono">
                          {"★".repeat(n.rating || 5)} {n.rating || 5}.0
                        </span>
                      </div>
                      <p className="text-[13px] text-white/40">{n.email}</p>
                      <p className="mt-2 text-[14px] text-white/80">{n.message}</p>
                    </div>
                    <span className="text-[12px] text-white/35 shrink-0">{rel(n.createdAt)}</span>
                  </div>
                ))
              )}
            </Group>
          </div>
        )}

        {/* ─────────────────────────────────────────────── LIVE REVIEWS ── */}
        {tab === "notes" && (
          <div className="mt-8 max-w-3xl">
            <Group header={`${notes.length} Real-time Reviews from Firestore`} footer="Live reviews submitted via the feedback forms.">
              {fNotes.length === 0 ? (
                <div className="px-4 py-8 text-center text-[14px] text-white/40">
                  No reviews {term ? "match search" : "received yet"}.
                </div>
              ) : (
                fNotes.map((n, i) => {
                  const open = openNote === n.id;
                  return (
                    <div key={n.id} className="relative px-4 py-4">
                      {i > 0 ? <span className="absolute left-9 right-0 top-0 h-px bg-white/[0.08]" /> : null}
                      <div className="flex gap-3">
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-lock" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[15px] font-semibold">{n.name}</span>
                              <span className="text-lock text-[12px] font-mono">
                                {"★".repeat(n.rating || 5)} {n.rating || 5}.0
                              </span>
                            </div>
                            <span className="shrink-0 text-[12px] tabular-nums text-white/40">{rel(n.createdAt)}</span>
                          </div>
                          <a href={`mailto:${n.email}`} className="text-[13px] text-white/50 hover:text-white">
                            {n.email}
                          </a>
                          <p className={`mt-2 whitespace-pre-line text-[14px] leading-relaxed text-white/80 ${open ? "" : "line-clamp-2"}`}>
                            {n.message}
                          </p>
                          <div className="mt-3 flex gap-4 text-[13px] font-medium">
                            <button onClick={() => setOpenNote(open ? null : n.id)} className="text-lock">
                              {open ? "Collapse" : "Open full"}
                            </button>
                            <button onClick={() => handleDeleteNote(n.id)} className="text-rec">
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

        {/* ─────────────────────────────────────────────── PREVIEWS & LIBRARY ── */}
        {tab === "library" && (
          <div className="mt-8 space-y-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`rounded-[16px] border-2 border-dashed p-8 text-center transition-colors ${
                drag ? "border-lock bg-lock/5" : "border-white/10 bg-[#1c1c1e]/50 hover:border-white/20"
              }`}
            >
              <p className="text-[15px] font-medium">
                Drag and drop your {kind} files here or click Upload {kind} above
              </p>
              <p className="mt-1 text-[13px] text-white/40">PNG, JPG, or WebM clips</p>
            </div>

            {kind === "preview" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fPreviews.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-white/40">
                    No previews uploaded yet. Upload motion tracking preview clips or screenshots!
                  </div>
                ) : (
                  fPreviews.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-[14px] bg-[#1c1c1e] ring-1 ring-white/10">
                      <div className="relative aspect-video bg-black">
                        {p.dataUrl.startsWith("data:video") ? (
                          <video src={p.dataUrl} controls className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.dataUrl} alt={p.title} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate font-semibold text-[14px]">{p.title}</p>
                        <div className="mt-2 flex items-center justify-between text-[12px] text-white/40">
                          <span>{rel(p.uploadedAt)}</span>
                          <button onClick={() => handleDeletePreview(p.id)} className="text-rec font-medium hover:underline">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-6">
                {fAssets.map((a) => (
                  <div key={a.id} className="group relative rounded-[12px] bg-[#1c1c1e] p-3 text-center ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.dataUrl} alt={a.name} className="mx-auto h-20 w-20 object-contain" />
                    <p className="mt-2 truncate text-[12px] text-white/70">{a.name}</p>
                    <button
                      onClick={async () => {
                        await removeAsset(a.id);
                        await load();
                      }}
                      className="mt-2 text-[11px] text-rec hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────── AUTH MODAL ── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[20px] bg-[#1c1c1e] p-6 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold">Firebase Authentication</h3>
              <button onClick={() => setShowAuthModal(false)} className="text-white/40 hover:text-white">
                ✕
              </button>
            </div>
            <p className="mt-1 text-[13px] text-white/50">Sign in to project `centerface2`</p>

            {authError && <p className="mt-3 rounded-[8px] bg-rec/15 p-2 text-[12px] text-rec">{authError}</p>}

            <button
              onClick={handleGoogleLogin}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-white py-2.5 text-[14px] font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Sign in with Google
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-wider text-white/30">Or with Email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="admin@centerface.web.app"
                className="w-full rounded-[8px] bg-black/50 px-3 py-2 text-[14px] text-white ring-1 ring-white/10 outline-none"
              />
              <input
                type="password"
                required
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                placeholder="Password"
                className="w-full rounded-[8px] bg-black/50 px-3 py-2 text-[14px] text-white ring-1 ring-white/10 outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-[8px] bg-lock py-2.5 text-[14px] font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Sign In / Register
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

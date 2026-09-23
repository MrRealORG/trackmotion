import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MEDIA } from "@/lib/media";
import { Corners, Cover, Lock, PixelShades, TrackPath } from "@/components/site/Viewfinder";
import { ScrollVar, Timecode, WordReveal } from "@/components/site/Motion";
import { ScrollReframe } from "@/components/site/ScrollReframe";
import { HomeReviews } from "@/components/site/HomeReviews";

export const metadata: Metadata = {
  title: { absolute: "CenterFace AI — Free Online Face Lock & Motion Tracking (No Watermark)" },
  description:
    "Click anything in a video and CenterFace AI follows it through every frame. Face lock, nose lock, point tracking, virtual camera moves and auto-reframe to 9:16 — frame-exact MP4 with audio, no upload, no signup.",
  alternates: { canonical: "/" },
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const d = (ms: number): Vars => ({ "--d": `${ms}ms` });

const SPECS: { title: string; rows: [string, string][] }[] = [
  {
    title: "Tracking",
    rows: [
      ["Tracker", "Pyramidal Lucas–Kanade"],
      ["Verification", "Forward–backward check"],
      ["Seed points", "Shi–Tomasi corners"],
      ["Motion model", "RANSAC similarity"],
    ],
  },
  {
    title: "Face",
    rows: [
      ["Model", "MediaPipe Face Mesh"],
      ["Anchors", "8 — nose, eyes, mouth, chin…"],
      ["Runtime", "WASM + GPU delegate"],
    ],
  },
  {
    title: "Output",
    rows: [
      ["Formats", "MP4 · WebM"],
      ["Resolution", "720p · 1080p · Source"],
      ["Audio", "Preserved"],
      ["Watermark", "None"],
    ],
  },
  {
    title: "Privacy",
    rows: [
      ["Upload", "None — on-device"],
      ["Account", "Not required"],
    ],
  },
];

const STATS: [string, string][] = [
  ["0", "Edits created"],
  ["0", "Active creators"],
  ["0.0", "Average rating"],
  ["0 B", "Uploaded, ever"],
];

const LEVELS: [number, string][] = [
  [40, "2×"],
  [100, "1×"],
  [160, "¼×"],
];

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TileText({ kicker, title, body, large = false }: { kicker: string; title: string; body?: string; large?: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
      <p className="osd text-lock">{kicker}</p>
      <h3
        className={`mt-3 font-semibold tracking-[-0.035em] ${
          large ? "text-[clamp(1.9rem,3.2vw,2.8rem)] leading-[1.02]" : "text-[25px] leading-[1.08]"
        }`}
      >
        {title}
      </h3>
      {body ? <p className="mt-3 max-w-md text-[14.5px] leading-[1.55] text-white/60">{body}</p> : null}
    </div>
  );
}

function RampChart() {
  const keys: [number, number][] = [
    [150, 40],
    [260, 100],
    [360, 160],
    [430, 160],
    [530, 100],
  ];
  return (
    <svg viewBox="0 0 600 190" className="h-auto w-full" aria-hidden="true">
      <rect x="360" y="12" width="70" height="172" rx="8" fill="rgba(255,214,10,0.07)" />
      <text x="395" y="30" textAnchor="middle" fontSize="11" letterSpacing="1.8" className="fill-lock font-mono">
        FREEZE
      </text>
      {LEVELS.map(([y, label]) => (
        <g key={label}>
          <line x1="44" x2="600" y1={y} y2={y} stroke="rgba(255,255,255,0.09)" strokeDasharray="2 6" />
          <text x="0" y={y + 4} fontSize="12" className="fill-white/40 font-mono">
            {label}
          </text>
        </g>
      ))}
      <path
        className="ramp"
        pathLength={1}
        d="M44 100 C100 100 110 40 150 40 C200 40 215 100 260 100 C300 100 318 160 360 160 L430 160 C470 160 488 100 530 100 L600 100"
        fill="none"
        stroke="#FFD60A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {keys.map(([x, y]) => (
        <rect
          key={x}
          x={x - 5}
          y={y - 5}
          width="10"
          height="10"
          rx="1.5"
          transform={`rotate(45 ${x} ${y})`}
          fill="#000"
          stroke="#FFD60A"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export default function HomePage() {
  const { hero, dancer, skate, rider, husky } = MEDIA;

  return (
    <>
      {/* ───────────────────────────────────────────── viewfinder hero ── */}
      <section className="hero cq h-[100svh] min-h-[640px] w-full bg-black" aria-labelledby="hero-title">
        <ScrollVar name="--hp" />
        <div className="hero-par absolute inset-0">
          <div className="breathe absolute inset-0">
            <Cover ratio={hero.ratio} fx={0.66} fy={0.45}>
              <img src={hero.src} alt={hero.alt} fetchPriority="high" decoding="async" />
              <Lock x={hero.face.x} y={hero.face.y} size={hero.face.s} delay={250} />
            </Cover>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.5)_36%,rgba(0,0,0,0)_60%)] sm:block" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="thirds pointer-events-none absolute inset-0" />
        <Corners inset={18} className="hidden sm:block" />

        <div className="osd absolute left-10 top-[84px] hidden items-center gap-2 text-white/75 sm:flex">
          <i className="rec-dot inline-block h-2 w-2 rounded-full bg-rec" />
          REC <Timecode className="tnum text-white" />
        </div>
        <div className="rv absolute left-1/2 top-[84px] -translate-x-1/2" style={d(1250)}>
          <span className="osd block rounded-[4px] bg-lock px-2 py-1 text-black">AE/AF Lock</span>
        </div>
        <div className="osd absolute right-10 top-[84px] hidden text-white/55 sm:block">4K · 60 · HDR</div>

        <div className="hero-copy absolute inset-x-0 bottom-0 pb-24 sm:pb-16 lg:pb-20">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
            <p className="rv osd text-lock">Face lock · Nose lock · Point tracking</p>
            <h1 id="hero-title" className="h-display mt-5 text-[clamp(3.2rem,8.4vw,8rem)]">
              <span className="mask-line">
                <span>Lock onto</span>
              </span>
              <span className="mask-line" style={d(110)}>
                <span>anything.</span>
              </span>
              <span className="sr-only"> A motion tracking and face lock video editor that runs in your browser.</span>
            </h1>
            <div className="mt-8 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <p className="rv max-w-md text-[16.5px] leading-[1.55] text-white/70" style={d(220)}>
                Click a face, a nose, a wheel. CenterFace AI follows it through every frame — right in your browser, with
                nothing uploaded.
              </p>
              <div className="rv flex flex-wrap items-center gap-3" style={d(320)}>
                <Link href="/app" className="btn-lock">
                  Open the studio
                  <Arrow />
                </Link>
                <a href="#virtual-camera" className="btn-ghost">
                  Watch it lock
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────── statement ── */}
      <section className="mx-auto max-w-[1120px] px-6 py-32 sm:px-10 sm:py-44" aria-label="What CenterFace AI does">
        <p className="rv osd text-white/40">01 — What it does</p>
        <WordReveal
          className="mt-8 text-[clamp(1.9rem,4.4vw,3.7rem)] font-semibold leading-[1.1] tracking-[-0.038em]"
          text="Point at anything that moves. CenterFace AI solves its motion across every frame, finds it again after it disappears, and welds whatever you like to it — text, stickers, a camera move — without your clip ever leaving the device."
        />
      </section>

      {/* ────────────────────────────────────────── virtual camera ── */}
      <section id="virtual-camera" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 pb-16 sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="rv osd text-white/40">02 — Virtual camera</p>
            <h2 className="h-title mt-5 text-[clamp(2.4rem,6vw,5rem)]">
              <span className="mask-line">
                <span>One click.</span>
              </span>
              <span className="mask-line" style={d(100)}>
                <span className="text-white/40">The camera does the rest.</span>
              </span>
            </h2>
          </div>
          <p className="rv max-w-sm text-[15px] leading-relaxed text-white/55">
            Keep scrolling. The lock stays welded to the dancer while the camera pushes in, recentres and solves a
            vertical crop — the exact pipeline the studio runs.
          </p>
        </div>
      </section>
      <ScrollReframe src={dancer.src} alt={dancer.alt} ratio={dancer.ratio} subject={dancer.subject} />

      {/* ────────────────────────────────────────────────── bento ── */}
      <section id="features" className="mx-auto max-w-[1280px] px-4 py-28 sm:px-8 sm:py-40">
        <div className="px-2">
          <p className="rv osd text-white/40">03 — In the viewfinder</p>
          <h2 className="h-title mt-5 max-w-3xl text-[clamp(2.4rem,6vw,5rem)]">
            <span className="mask-line">
              <span>Every tool,</span>
            </span>
            <span className="mask-line" style={d(100)}>
              <span className="text-white/40">nothing in the way.</span>
            </span>
          </h2>
        </div>

        <div className="mt-14 grid auto-rows-[23rem] grid-cols-1 gap-3 sm:auto-rows-[24rem] sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <article className="tile cq rv md:col-span-2 lg:row-span-2">
            <Cover ratio={skate.ratio} fx={0.42} fy={0.55} className="tile-img">
              <img src={skate.src} alt={skate.alt} loading="lazy" decoding="async" />
              <TrackPath ratio={skate.ratio} from={[0.16, 0.8]} via={[0.25, 0.44]} to={[skate.board.x, skate.board.y]} />
              <Lock x={skate.board.x} y={skate.board.y} size={skate.board.s} tag="Point · 0.98" delay={250} />
            </Cover>
            <div className="tile-shade" />
            <span className="osd absolute left-6 top-6 flex items-center gap-2 text-white/70">
              <i className="rec-dot inline-block h-2 w-2 rounded-full bg-rec" />
              Tracking
            </span>
            <TileText
              large
              kicker="Point tracking"
              title="Click it once. It stays clicked."
              body="Pyramidal optical flow with a forward–backward check. If the target hides for a second, the tracker finds it again when it comes back."
            />
          </article>

          <article className="tile cq rv md:col-span-2" style={d(80)}>
            <Cover ratio={husky.ratio} fx={0.5} fy={0.5} className="tile-img">
              <img src={husky.src} alt={husky.alt} loading="lazy" decoding="async" />
              <Lock x={husky.face.x} y={husky.face.y} size={husky.face.s} tag="Face · eyes" delay={200} />
              <PixelShades x={husky.shades.x} y={husky.shades.y} w={husky.shades.w} />
            </Cover>
            <div className="tile-shade" />
            <TileText
              kicker="Stick anything on"
              title="Deal with it."
              body="Stickers, text, shapes and your own PNGs, pinned to a track. Offset, rotation and scale follow the motion."
            />
          </article>

          <article className="tile cq rv" style={d(140)}>
            <Cover ratio={rider.ratio} fx={rider.rider.x} fy={0.5} className="tile-img">
              <img src={rider.src} alt={rider.alt} loading="lazy" decoding="async" />
              <Lock x={rider.rider.x} y={rider.rider.y} size={rider.rider.s} delay={200} />
            </Cover>
            <div className="tile-shade" />
            <div className="glass absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full">
              <span className="tnum text-[11.5px] font-semibold text-lock">2×</span>
            </div>
            <TileText kicker="Virtual camera" title="Follow, punch in, shake." />
          </article>

          <article className="tile rv" style={d(200)}>
            <div className="absolute inset-x-6 top-6">
              <div className="relative aspect-video overflow-hidden rounded-[10px] bg-black/50 ring-1 ring-white/15">
                <div className="thirds absolute inset-0" />
                <div className="pan absolute inset-y-[7%] left-1/2 aspect-[9/16] -translate-x-1/2 rounded-[6px] shadow-[0_0_0_999px_rgba(0,0,0,0.55)] ring-[1.5px] ring-lock">
                  <span className="absolute left-1/2 top-[45%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                </div>
                <span className="osd absolute left-2 top-2 text-white/55">16:9</span>
              </div>
              <div className="mt-4 flex gap-2">
                {["9:16", "4:5", "1:1"].map((r, i) => (
                  <span
                    key={r}
                    className={`osd rounded-full px-2.5 py-1 ${i === 0 ? "bg-lock text-black" : "bg-white/[0.08] text-white/60"}`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <TileText kicker="Auto reframe" title="16:9 in. 9:16 out." />
          </article>

          <article className="tile rv" style={d(80)}>
            <div className="absolute inset-x-6 top-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[64px] font-semibold leading-none tracking-[-0.05em]">MP4</span>
                <span className="osd text-white/40">H.264 · AAC</span>
              </div>
              <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="render-bar h-full rounded-full bg-lock" />
              </div>
              <div className="tnum mt-2.5 flex justify-between font-mono text-[11px] text-white/45">
                <span>1080 × 1920</span>
                <span>60 fps</span>
              </div>
            </div>
            <TileText kicker="Frame-exact export" title="What you see is the file." />
          </article>

          <article className="tile rv md:col-span-2 lg:col-span-1" style={d(140)}>
            <div className="absolute inset-x-6 top-6">
              <div className="flex items-end gap-2">
                <span className="tnum text-[120px] font-semibold leading-[0.78] tracking-[-0.06em]">0</span>
                <span className="pb-1 text-[20px] font-semibold text-white/40">bytes</span>
              </div>
              <p className="osd mt-5 text-white/40">Sent to any server</p>
            </div>
            <TileText kicker="Private by design" title="Your clip never leaves the tab." />
          </article>

          <article className="tile rv md:col-span-2" style={d(200)}>
            <div className="absolute inset-x-6 top-6">
              <RampChart />
            </div>
            <TileText kicker="Speed ramps & freeze frames" title="Bend time on the beat." />
          </article>
        </div>
      </section>

      {/* ─────────────────────────────────────────── reviews ── */}
      <HomeReviews />

      {/* ───────────────────────────────────────── specifications ── */}
      <section id="specs" className="mx-auto max-w-[1280px] px-6 py-28 sm:px-10 sm:py-40">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="rv osd text-white/40">05 — Specifications</p>
            <h2 className="h-title mt-5 text-[clamp(2.4rem,5.4vw,4.4rem)]">
              <span className="mask-line">
                <span>The fine print,</span>
              </span>
              <span className="mask-line" style={d(100)}>
                <span className="text-white/40">in plain sight.</span>
              </span>
            </h2>
            <p className="rv mt-6 max-w-sm text-[15px] leading-relaxed text-white/55">
              The same techniques a desktop compositor uses — ported to typed arrays, a worker thread and WebAssembly.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {SPECS.map((g) => (
              <div key={g.title} className="rv">
                <h3 className="px-4 pb-2 text-[13px] uppercase tracking-[0.04em] text-white/45">{g.title}</h3>
                <dl className="overflow-hidden rounded-[14px] bg-[#1c1c1e]">
                  {g.rows.map(([k, v], i) => (
                    <div key={k} className="relative flex min-h-[50px] items-center justify-between gap-6 px-4 py-3">
                      {i > 0 ? <span className="absolute left-4 right-0 top-0 h-px bg-white/[0.08]" /> : null}
                      <dt className="text-[15px] text-white">{k}</dt>
                      <dd className="text-right text-[15px] text-white/50">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── quote + stats ── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-6 py-28 sm:px-10 sm:py-36">
          <figure className="mx-auto max-w-4xl text-center">
            <blockquote className="h-title text-[clamp(2rem,4.8vw,4rem)] leading-[1.04]">
              <span className="mask-line">
                <span>“It replaced a forty-minute</span>
              </span>
              <span className="mask-line" style={d(90)}>
                <span>After Effects rig with</span>
              </span>
              <span className="mask-line" style={d(180)}>
                <span className="text-lock">four clicks.”</span>
              </span>
            </blockquote>
            <figcaption className="rv mt-8 text-[14px] text-white/50">Nadia Oyelaran — Editor, second unit</figcaption>
          </figure>

          <dl className="rv mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-white/[0.08] lg:grid-cols-4">
            {STATS.map(([v, l]) => (
              <div key={l} className="bg-black px-6 py-8">
                <dt className="tnum text-[clamp(2.2rem,4vw,3.2rem)] font-semibold leading-none tracking-[-0.045em]">{v}</dt>
                <dd className="mt-3 text-[13px] text-white/50">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────────────────────────────────────────── shutter CTA ── */}
      <section className="relative overflow-hidden border-t border-white/10" aria-labelledby="cta-title">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_100%,rgba(255,214,10,0.10),transparent_70%)]" />
        <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-6 py-32 text-center sm:py-44">
          <p className="rv osd text-white/40">06 — Begin</p>
          <h2 id="cta-title" className="h-display mt-6 text-[clamp(3.2rem,10vw,8.5rem)]">
            <span className="mask-line">
              <span>Hit record.</span>
            </span>
          </h2>
          <p className="rv mt-6 max-w-md text-[16px] leading-relaxed text-white/55">
            The studio opens instantly. Bring a clip — leave nothing behind.
          </p>
          <div className="rv mt-14 flex flex-col items-center gap-4">
            <Link href="/app" className="shutter" aria-label="Open the studio">
              <i />
            </Link>
            <span className="osd text-white/45">Open the studio</span>
          </div>
        </div>
      </section>
    </>
  );
}

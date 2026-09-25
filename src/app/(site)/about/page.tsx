import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MEDIA } from "@/lib/media";
import { Corners, Cover, Lock } from "@/components/site/Viewfinder";
import { Timecode, WordReveal } from "@/components/site/Motion";
import { NoteForm } from "@/components/site/NoteForm";

export const metadata: Metadata = {
  title: "About — how browser motion tracking works · RealHackers",
  description:
    "How CenterFace AI tracks motion inside a browser tab: pyramidal Lucas–Kanade optical flow with forward–backward checks, RANSAC similarity fits, MediaPipe face mesh and a smoothing path solver. Built by Ahmad Raza and the RealHackers studio.",
  alternates: { canonical: "/about" },
  keywords: [
    "Ahmad Raza",
    "RealHackers",
    "realhackers.pages.dev",
    "how motion tracking works",
    "Lucas-Kanade optical flow in the browser",
    "RANSAC similarity transform",
    "MediaPipe face mesh",
    "on-device video processing",
    "centerface ai",
  ],
  openGraph: {
    title: "About CenterFace AI — Built by RealHackers (Founder: Ahmad Raza)",
    description:
      "Optical flow, robust estimation and a path solver, running entirely in your browser tab. Built with craft by RealHackers.",
    url: "/about",
  },
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const d = (ms: number): Vars => ({ "--d": `${ms}ms` });

const PIPELINE: [string, string, string][] = [
  ["01", "Seed", "Your click — or a cluster of Shi–Tomasi corners around it — becomes the reference patch."],
  ["02", "Follow", "Pyramidal Lucas–Kanade optical flow carries that patch from frame to frame across three pyramid levels."],
  ["03", "Verify", "Every sample is tracked backwards too. Where A → B → A′ drifts, the sample is dropped instead of corrupting the path."],
  ["04", "Fit", "RANSAC fits a similarity transform to the survivors — translation, rotation and scale — and throws out the outliers."],
  ["05", "Solve", "A smoothing path solver turns the raw trajectory into camera motion, with a scene-cut guard that stops at hard edits."],
];

const FAQ = [
  {
    q: "Who built CenterFace AI?",
    a: "CenterFace AI was engineered and architected by Ahmad Raza, Founder of RealHackers (https://realhackers.pages.dev/). RealHackers is a minimal design and engineering studio building calm, fast, and high-performance digital products.",
  },
  {
    q: "Does my video get uploaded anywhere?",
    a: "No. Decoding, analysis, compositing and encoding all run inside your browser tab. The only things that ever reach the server are the overlays and projects you explicitly choose to save to the library.",
  },
  {
    q: "What can I actually track?",
    a: "Three kinds of track: a point track on anything you can click, a face track bound to one of eight mesh anchors, and a pair track built from two point tracks, which also solves rotation and scale.",
  },
  {
    q: "What do I get when I export?",
    a: "An MP4 with your audio intact, at 720p, 1080p or source resolution. Rendering is frame-exact — what the compositor shows is what lands in the file. No watermark, no queue.",
  },
  {
    q: "Do I need a powerful computer or a GPU?",
    a: "No. The tracker runs on typed arrays in a worker thread, so the interface never freezes. Face mesh uses a GPU delegate where one is available and falls back to the CPU where it isn't.",
  },
  {
    q: "How much does it cost?",
    a: "The studio is free to use. There's no account, no trial clock and no export limit.",
  },
];

const SKILLS = [
  "AI Motion Tracking",
  "Computer Vision & Optical Flow",
  "MediaPipe Face Mesh",
  "WebAssembly & WebCodecs",
  "Full-Stack Web Engineering",
  "Client-Side Privacy Architecture",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: "About CenterFace AI & RealHackers Studio",
      description: "Learn how CenterFace AI motion tracking works and meet its creator Ahmad Raza from RealHackers.",
      publisher: {
        "@type": "Organization",
        name: "RealHackers",
        url: "https://realhackers.pages.dev",
        email: "hello@realhackers.studio",
        founder: {
          "@type": "Person",
          name: "Ahmad Raza",
          url: "https://realhackers.pages.dev",
        },
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function AboutPage() {
  const { rig } = MEDIA;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ───────────────────────────────────────────────────── hero ── */}
      <section className="mx-auto max-w-[1280px] px-6 pt-36 sm:px-10 sm:pt-44">
        <p className="rv osd text-lock">About CenterFace AI</p>
        <h1 className="h-display mt-6 text-[clamp(2.9rem,7.2vw,6.6rem)]">
          <span className="mask-line">
            <span>A tracker that never</span>
          </span>
          <span className="mask-line" style={d(110)}>
            <span className="text-white/40">asks for your file.</span>
          </span>
        </h1>
        <p className="rv mt-8 max-w-xl text-[17px] leading-[1.6] text-white/60" style={d(220)}>
          CenterFace AI is a motion-tracking studio built as a single web page. It uses the same machinery as a
          desktop compositor — optical flow, robust estimation, a path solver — and runs all of it in the tab you
          already have open.
        </p>
      </section>

      {/* ─────────────────────────────────────────────── viewfinder ── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-16 sm:px-8 sm:pt-20">
        <figure className="rv cq h-[64svh] min-h-[380px] rounded-[28px] bg-[#0c0c0d]">
          <Cover ratio={rig.ratio} fx={0.56} fy={0.45}>
            <img src={rig.src} alt={rig.alt} loading="lazy" decoding="async" />
            <Lock x={rig.lens.x} y={rig.lens.y} size={rig.lens.s} tag="Lens · locked" delay={300} />
          </Cover>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />
          <div className="thirds pointer-events-none absolute inset-0" />
          <Corners inset={18} />
          <div className="osd absolute left-7 top-7 flex items-center gap-2 text-white/70">
            <i className="rec-dot inline-block h-2 w-2 rounded-full bg-rec" />
            REC <Timecode className="tnum text-white" />
          </div>
          <figcaption className="osd absolute bottom-7 left-7 text-white/55">Fig. 1 — The engine, in a browser tab</figcaption>
        </figure>
      </section>

      {/* ─────────────────────────────────────────────────── why ── */}
      <section className="mx-auto max-w-[1280px] px-6 py-28 sm:px-10 sm:py-36">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <p className="rv osd text-white/40">01 — Why it exists</p>
          <div>
            <WordReveal
              className="text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.18] tracking-[-0.03em]"
              text="Rigging a sticker to someone's head used to mean a tracked null, a stabilised pre-comp and forty minutes in a suite that costs more than the camera. Every web tool that promised to replace it wanted your clip uploaded first."
            />
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              <p className="rv text-[15.5px] leading-[1.7] text-white/55">
                So the pipeline was rebuilt for the browser: a median-flow tracker over pyramidal optical flow in plain
                typed arrays, a RANSAC solver for the transform between tracked pairs, a smoothing path solver for the
                camera, and MediaPipe face mesh for the anchors a face gives you for free.
              </p>
              <p className="rv text-[15.5px] leading-[1.7] text-white/55" style={d(80)}>
                It&apos;s deliberately narrow. No broadcast grading, no 3D camera solve, no render farm. It does the one
                job that used to take an afternoon — locking an overlay to real motion — in about the time it takes to
                find the clip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────── pipeline ── */}
      <section className="border-y border-white/10 bg-[#0a0a0b]">
        <div className="mx-auto max-w-[1280px] px-6 py-28 sm:px-10 sm:py-36">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="rv osd text-white/40">02 — The pipeline</p>
              <h2 className="h-title mt-5 text-[clamp(2.2rem,4.6vw,3.8rem)]">
                <span className="mask-line">
                  <span>Five stages.</span>
                </span>
                <span className="mask-line" style={d(90)}>
                  <span className="text-white/40">Every frame.</span>
                </span>
              </h2>
            </div>
            <ol>
              {PIPELINE.map(([n, title, body], i) => (
                <li
                  key={n}
                  className="rv grid grid-cols-[3rem_1fr] gap-x-4 gap-y-2 border-t border-white/10 py-8 last:border-b sm:grid-cols-[3.5rem_9rem_1fr]"
                  style={d(i * 50)}
                >
                  <span className="tnum pt-1 font-mono text-[13px] text-lock">{n}</span>
                  <h3 className="text-[21px] font-semibold tracking-[-0.03em]">{title}</h3>
                  <p className="col-start-2 max-w-xl text-[15px] leading-[1.65] text-white/55 sm:col-start-3">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── faq ── */}
      <section id="faq" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-28 sm:px-10 sm:py-36">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="rv osd text-white/40">03 — Questions</p>
            <h2 className="h-title mt-5 text-[clamp(2.2rem,4.6vw,3.8rem)]">
              <span className="mask-line">
                <span>Plainly</span>
              </span>
              <span className="mask-line" style={d(90)}>
                <span className="text-white/40">answered.</span>
              </span>
            </h2>
          </div>
          <div className="rv overflow-hidden rounded-[18px] bg-[#1c1c1e]">
            {FAQ.map((f, i) => (
              <details key={f.q} className="group relative" open={i === 0}>
                {i > 0 ? <span className="absolute left-5 right-0 top-0 h-px bg-white/[0.08]" /> : null}
                <summary className="flex cursor-pointer items-center justify-between gap-6 px-5 py-5 text-[16.5px] font-medium transition-colors hover:bg-white/[0.02]">
                  <span>{f.q}</span>
                  <svg
                    className="h-4 w-4 shrink-0 text-white/35 transition-transform duration-300 group-open:rotate-90"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="px-5 pb-6 text-[15px] leading-[1.7] text-white/55">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────── founder & studio ── */}
      <section id="founder" className="scroll-mt-24 border-t border-white/10 bg-[#080809]">
        <div className="mx-auto max-w-[1280px] px-6 py-28 sm:px-10 sm:py-36">
          <div className="flex flex-col gap-4">
            <p className="rv osd text-lock">04 — Studio &amp; Founder</p>
            <h2 className="h-title text-[clamp(2.4rem,5.6vw,4.5rem)]">
              <span className="mask-line">
                <span>Made by</span>
              </span>
              <span className="mask-line" style={d(90)}>
                <span className="text-lock">RealHackers.</span>
              </span>
            </h2>
            <p className="rv max-w-2xl text-[16.5px] leading-relaxed text-white/60">
              CenterFace AI is designed, engineered, and maintained by{" "}
              <strong className="text-white">Ahmad Raza</strong>, Founder of{" "}
              <a
                href="https://realhackers.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lock underline underline-offset-4 hover:brightness-125"
              >
                RealHackers
              </a>{" "}
              — a digital engineering and design studio focused on building calm, fast software with unreasonable standards.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {/* ── Founder Profile Card ── */}
            <div className="rv rounded-[24px] border border-white/10 bg-[#141416] p-7 sm:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-xl">
                  <img
                    src="https://pub-bc5ccd066c6146bf8205cf1f26838d76.r2.dev/team/1789065606779-2mhh26.webp"
                    alt="Ahmad Raza — Founder of RealHackers"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-lock/15 px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-lock">
                      Founder &amp; Architect
                    </span>
                    <span className="osd text-white/30">Pakistan</span>
                  </div>
                  <h3 className="mt-2 text-2xl font-bold text-white">Ahmad Raza</h3>
                  <p className="text-[14px] text-white/50">Founder &amp; Lead Developer at RealHackers</p>
                </div>
              </div>

              <p className="mt-6 text-[15px] leading-relaxed text-white/70">
                Ahmad built CenterFace AI to eliminate the bloat, fees, and privacy leaks of traditional video editors.
                By porting pyramidal Lucas–Kanade optical flow, MediaPipe face mesh, and WebCodecs to the browser,
                creators can produce frame-exact face lock edits in 10 seconds on any device without uploading a single byte.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-white/75"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
                <a
                  href="https://realhackers.pages.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-lock px-5 py-2.5 text-[13.5px] font-semibold text-black transition hover:scale-105 hover:bg-lock/90"
                >
                  Visit Portfolio
                  <span aria-hidden="true">↗</span>
                </a>
                <a
                  href="https://realhackers.pages.dev/team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-white/10"
                >
                  Meet the Team ↗
                </a>
                <a
                  href="mailto:hello@realhackers.studio"
                  className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-white/60 hover:text-lock transition-colors ml-auto"
                >
                  hello@realhackers.studio
                </a>
              </div>
            </div>

            {/* ── RealHackers Studio Card ── */}
            <div className="rv flex flex-col justify-between rounded-[24px] border border-lock/30 bg-gradient-to-b from-[#18181b] via-[#121214] to-[#0d0d0f] p-7 shadow-xl sm:p-9">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-lock">
                    Design &amp; Engineering Studio
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Active &amp; Shipping
                  </span>
                </div>

                <h3 className="mt-4 text-3xl font-bold tracking-tight text-white">
                  RealHackers
                </h3>
                <p className="mt-1 font-mono text-[13px] text-white/40">
                  “Quiet work for loud problems.”
                </p>

                <p className="mt-5 text-[15px] leading-relaxed text-white/70">
                  RealHackers is a technology and digital engineering studio focused on building premium websites,
                  AI-powered tools, software products, automation systems, and innovative digital experiences.
                  Every product is built with craft, speed, and quiet confidence.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-xl font-bold text-lock">100%</div>
                    <div className="mt-0.5 text-[11px] text-white/50 uppercase tracking-wider">Client-Side</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-xl font-bold text-white">0 KB</div>
                    <div className="mt-0.5 text-[11px] text-white/50 uppercase tracking-wider">Data Uploaded</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center col-span-2 sm:col-span-1">
                    <div className="text-xl font-bold text-emerald-400">60 FPS</div>
                    <div className="mt-0.5 text-[11px] text-white/50 uppercase tracking-wider">GPU Accelerated</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-white/40">Explore studio portfolio:</span>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://realhackers.pages.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-lock hover:underline"
                    >
                      realhackers.pages.dev ↗
                    </a>
                    <span className="text-white/20">·</span>
                    <a
                      href="https://realhackers.pages.dev/gallery"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-white/70 hover:text-white hover:underline"
                    >
                      Gallery ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────── contact ── */}
      <section id="contact" className="scroll-mt-24 border-t border-white/10">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-28 sm:px-10 sm:py-36 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="rv osd text-white/40">05 — Say hello</p>
            <h2 className="h-title mt-5 text-[clamp(2.4rem,5vw,4.2rem)]">
              <span className="mask-line">
                <span>Send a note.</span>
              </span>
            </h2>
            <p className="rv mt-6 max-w-md text-[15.5px] leading-relaxed text-white/55">
              Feature requests, bug reports, custom studio inquiries, and enterprise builds all land in the admin console
              and reach Ahmad Raza directly.
            </p>

            <div className="rv mt-8 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-white/40">Studio Email:</span>
                <a
                  href="mailto:hello@realhackers.studio"
                  className="font-mono text-[14px] font-medium text-lock hover:underline"
                >
                  hello@realhackers.studio
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-white/40">Portfolio:</span>
                <a
                  href="https://realhackers.pages.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[14px] text-white/80 hover:text-white hover:underline"
                >
                  https://realhackers.pages.dev
                </a>
              </div>
            </div>
          </div>
          <div className="rv">
            <NoteForm />
          </div>
        </div>
      </section>
    </>
  );
}

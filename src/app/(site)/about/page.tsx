import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { MEDIA } from "@/lib/media";
import { Corners, Cover, Lock } from "@/components/site/Viewfinder";
import { Timecode, WordReveal } from "@/components/site/Motion";
import { NoteForm } from "@/components/site/NoteForm";

export const metadata: Metadata = {
  title: "About — how browser motion tracking works",
  description:
    "How CenterFace AI tracks motion inside a browser tab: pyramidal Lucas–Kanade optical flow with forward–backward checks, RANSAC similarity fits, MediaPipe face mesh and a smoothing path solver — all on-device, nothing uploaded.",
  alternates: { canonical: "/about" },
  keywords: [
    "how motion tracking works",
    "Lucas-Kanade optical flow in the browser",
    "RANSAC similarity transform",
    "MediaPipe face mesh",
    "on-device video processing",
    "centerface ai",
  ],
  openGraph: {
    title: "About CenterFace AI — a tracker that never asks for your file",
    description:
      "Optical flow, robust estimation and a path solver, running entirely in your browser tab. Here's how it works.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
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

      {/* ─────────────────────────────────────────────── contact ── */}
      <section id="contact" className="scroll-mt-24 border-t border-white/10">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-28 sm:px-10 sm:py-36 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="rv osd text-white/40">04 — Say hello</p>
            <h2 className="h-title mt-5 text-[clamp(2.4rem,5vw,4.2rem)]">
              <span className="mask-line">
                <span>Send a note.</span>
              </span>
            </h2>
            <p className="rv mt-6 max-w-md text-[15.5px] leading-relaxed text-white/55">
              Feature requests, bug reports and clips that broke the tracker all land in the admin console. Every one
              gets read.
            </p>
            <p className="rv mt-8 font-mono text-[13px] text-white/40">studio@trackwebmotion.app</p>
          </div>
          <div className="rv">
            <NoteForm />
          </div>
        </div>
      </section>
    </>
  );
}

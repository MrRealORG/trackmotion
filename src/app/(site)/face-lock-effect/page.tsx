import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MEDIA } from "@/lib/media";
import { Mark } from "@/components/site/Mark";
import { ResponsiveBanner } from "@/components/ads/ResponsiveBanner";
import { NativeBanner } from "@/components/ads/NativeBanner";

export const metadata: Metadata = {
  title: "Face Lock Effect Online — Free Video Face Tracking Tool & Tutorial (No Watermark)",
  description:
    "Create the viral TikTok & Reels face lock effect online in seconds. Learn how to do face lock without After Effects, compare the best Tracket Motion: Video Editor alternatives for PC, and export frame-exact 9:16 MP4 with no watermark.",
  alternates: { canonical: "/face-lock-effect" },
  keywords: [
    "face lock effect",
    "face lock video editor",
    "how to do face lock in after effects",
    "tracket motion alternative",
    "tracket motion video editor online",
    "free face track app",
    "lock on effect tiktok",
    "face tracking video editor online free",
    "nose lock edit",
    "motion tracking video editor",
    "auto reframe 9:16",
    "after effects face lock tutorial",
    "centerface ai",
  ],
  openGraph: {
    title: "Face Lock Effect Online — Free AI Motion Tracking Video Editor",
    description:
      "Lock onto any face or nose in your video. 100% free, runs in your browser, no software download, no watermark.",
    url: "/face-lock-effect",
    images: ["/opengraph-image"],
  },
};

const FAQ_ITEMS = [
  {
    q: "What is the viral face lock effect and why is it trending?",
    a: "The face lock effect (also known as the lock-on effect or face stabilization) keeps the subject's face or nose completely stationary in the center of the video frame while the background dynamically tilts, pans, and moves. It went viral on TikTok, Instagram Reels, and YouTube Shorts for dance trends, running clips, and athletic highlights because it gives casual footage a high-budget music video aesthetic.",
  },
  {
    q: "How do you do the face lock effect online without After Effects?",
    a: "With CenterFace AI, you don't need After Effects. Simply open CenterFace AI in your browser, drop your video, click the nose or eye anchor on the first frame, and click Track. CenterFace uses Lucas-Kanade optical flow and MediaPipe neural networks to automatically lock the camera onto your face in under 10 seconds.",
  },
  {
    q: "Is there a web or PC version of Tracket Motion: Video Editor?",
    a: "Tracket Motion: Video Editor is only available as a mobile app on Google Play Store and iOS App Store. If you want to edit videos on your PC, Mac, or browser without transferring gigabytes of camera footage to your phone, CenterFace AI is the ultimate in-browser alternative with zero ads, zero downloads, and frame-exact MP4 export.",
  },
  {
    q: "Is CenterFace AI really free with no watermark?",
    a: "Yes! CenterFace AI is 100% free and never places a watermark on your exported videos. There are no paywalls, no trial expirations, and no account requirements.",
  },
  {
    q: "Can I export in 9:16 vertical format for TikTok and Instagram Reels?",
    a: "Yes. CenterFace AI includes dedicated 9:16 vertical auto-reframe, 16:9 widescreen, 4:5 social, and 1:1 square crop presets with intact original audio.",
  },
  {
    q: "Does my video get uploaded to any server or cloud?",
    a: "Never. All AI tracking, video decoding, compositing, and rendering run entirely on your device inside your browser tab using WebAssembly and Web Workers. Your media never leaves your computer.",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Platform & Access",
    centerface: "Any Web Browser (PC, Mac, Mobile)",
    afterEffects: "Windows / Mac (Heavy 15GB Install)",
    tracketMotion: "Android Play Store Only (Mobile)",
    capcut: "Mobile App & Desktop App",
  },
  {
    feature: "Cost",
    centerface: "100% Free (No Watermark)",
    afterEffects: "$34.99 / month (Adobe Cloud)",
    tracketMotion: "Free with In-App Ads & Purchases",
    capcut: "Freemium ($9.99/mo for Pro Features)",
  },
  {
    feature: "Time to Edit Face Lock",
    centerface: "~10 seconds (1-Click AI)",
    afterEffects: "25–40 minutes (Manual Tracking)",
    tracketMotion: "3–5 minutes (Mobile Screen)",
    capcut: "1–2 minutes (Mobile Lock-on)",
  },
  {
    feature: "Watermark on Export",
    centerface: "Zero Watermark (Clean)",
    afterEffects: "None (Paid License)",
    tracketMotion: "Ad-supported export",
    capcut: "End card watermark (removable)",
  },
  {
    feature: "Privacy & Data",
    centerface: "100% Local On-Device (0 Upload)",
    afterEffects: "Local Files",
    tracketMotion: "Mobile analytics & app trackers",
    capcut: "Cloud connected",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: "How to Create the Viral Face Lock Effect in 10 Seconds",
      description: "Step-by-step guide to locking a camera onto a face in any video using CenterFace AI in your browser.",
      totalTime: "PT10S",
      step: [
        {
          "@type": "HowToStep",
          name: "Upload Video",
          text: "Open CenterFace AI and drop your video file into the studio. Video stays 100% private in your browser.",
          url: "https://centerface.web.app/#step1",
        },
        {
          "@type": "HowToStep",
          name: "Select Face Anchor",
          text: "Click on the subject's nose or eyes on the first frame to attach the AI motion tracker.",
          url: "https://centerface.web.app/#step2",
        },
        {
          "@type": "HowToStep",
          name: "Track and Auto-Reframe",
          text: "Click Track to calculate the trajectory and select 9:16 vertical reframe for TikTok or Reels.",
          url: "https://centerface.web.app/#step3",
        },
        {
          "@type": "HowToStep",
          name: "Export Clean MP4",
          text: "Click Export to save a frame-exact MP4 with audio and zero watermarks.",
          url: "https://centerface.web.app/#step4",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ],
};

export default function FaceLockPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ───────────────────────────────────────────────────── Hero ── */}
      <section className="relative mx-auto max-w-[1280px] px-6 pt-32 sm:px-10 sm:pt-40">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-lock/15 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-lock">
            Trending Creator Tool
          </span>
          <span className="text-[13px] text-white/40">·</span>
          <span className="text-[13px] text-white/50">100% Free · In-Browser · No Watermark</span>
        </div>

        <h1 className="h-display mt-6 max-w-4xl text-[clamp(2.7rem,6.8vw,5.6rem)] leading-[1.05]">
          Viral Face Lock Effect.
          <br />
          <span className="text-white/40">In Your Browser in 10 Seconds.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-white/70 sm:text-[19px]">
          Lock your camera dead-center on any face, nose, or eyes. Create the trending TikTok, Instagram Reels, and
          YouTube Shorts lock-on edits without expensive software, complex keyframes, or mobile app downloads.
        </p>

        {/* ── Interactive Launch Hero Card (Clicking opens editor on home) ── */}
        <div className="mt-10">
          <Link
            href="/"
            className="group relative block overflow-hidden rounded-[24px] border border-white/15 bg-gradient-to-b from-[#18181b] to-[#09090b] p-6 shadow-2xl transition hover:border-lock/60 sm:p-10"
            title="Click to launch CenterFace AI editor on the home page"
          >
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 rounded-full bg-lock animate-pulse" />
                  <span className="text-[14px] font-semibold uppercase tracking-wider text-lock">
                    Ready to Edit
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-bold text-white transition group-hover:text-lock sm:text-3xl">
                  Drop Your Video to Start Face Lock
                </h2>
                <p className="mt-1.5 text-[15px] text-white/60">
                  Instant launch: No account needed. 100% private on-device processing.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-lock px-6 py-3.5 text-[15px] font-semibold text-black shadow-lg transition group-hover:scale-105 group-hover:bg-lock/90">
                  <Mark size={18} />
                  Open Face Lock Studio
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </div>

            {/* Visual Preview Box */}
            <div className="relative mt-8 h-[260px] w-full overflow-hidden rounded-[16px] border border-white/10 bg-black/60 sm:h-[340px]">
              <Image
                src={MEDIA.hero.src}
                alt="Face lock tracking preview demonstrating locked face box"
                fill
                priority
                className="object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs text-white/70">
                <span className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] text-lock border border-white/10">
                  LIVE TRACKER · 60 FPS
                </span>
                <span className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] text-white/80 border border-white/10">
                  CLICK TO LAUNCH HOME STUDIO ↗
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ────────────────────────── Section 1: What is Face Lock Effect ── */}
      <section className="mx-auto max-w-[1280px] px-6 pt-28 sm:px-10">
        <div className="max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-lock">Creator Trends</p>
          <h2 className="h-display mt-3 text-3xl font-bold text-white sm:text-4xl">
            What is the Viral Face Lock Effect?
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-white/70">
            The <strong>face lock effect</strong> (also called the <em>lock-on effect</em> or <em>face tracking stabilization</em>)
            is an editing technique where the camera is mathematically anchored to a subject&apos;s face or nose. As the person
            dances, runs, or moves around, their face remains dead-center on screen while the background whips and rotates dynamically around them.
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-white/70">
            Made famous by TikTok dance trends, hip-hop music videos, and sports creators, this effect typically required
            either expensive desktop compositing software like Adobe After Effects or ad-riddled mobile apps. CenterFace AI
            brings full professional face locking directly to your browser for free.
          </p>
        </div>
      </section>

      {/* ────────── Section 2: After Effects vs CenterFace AI Tutorial ── */}
      <section className="mx-auto max-w-[1280px] px-6 pt-24 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* After Effects Column */}
          <div className="rounded-[22px] border border-white/10 bg-[#121214] p-7 sm:p-9">
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-red-400">
              The Hard Way: Adobe After Effects
            </span>
            <h3 className="mt-4 text-2xl font-bold text-white">How to Face Lock in After Effects</h3>
            <p className="mt-2 text-sm text-white/50">Average time: 25 to 45 minutes · Requires $35/mo subscription</p>

            <ol className="mt-6 space-y-4 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="font-mono text-red-400 font-bold">1.</span>
                <span>Import footage, create a new Composition, and select your video layer.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-red-400 font-bold">2.</span>
                <span>Open the Tracker panel (<strong>Window &gt; Tracker</strong>) and click <strong>Track Motion</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-red-400 font-bold">3.</span>
                <span>Position the tracker box carefully on the tip of the subject&apos;s nose or pupil.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-red-400 font-bold">4.</span>
                <span>Press Analyze Forward. Fix tracker drift frame-by-frame when the subject turns their head.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-red-400 font-bold">5.</span>
                <span>Create a <strong>Null Object</strong>, edit target, and apply X/Y tracking data.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-red-400 font-bold">6.</span>
                <span>Write an inverted expression on the footage anchor point or parent to invert camera motion.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-red-400 font-bold">7.</span>
                <span>Scale footage to 130%+ to hide blank black edges caused by camera compensation.</span>
              </li>
            </ol>
          </div>

          {/* CenterFace AI Column */}
          <div className="relative rounded-[22px] border border-lock/30 bg-gradient-to-b from-[#1c1c1e] to-[#0e0e10] p-7 shadow-xl sm:p-9">
            <span className="rounded-full bg-lock/15 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-lock">
              The 1-Click Way: CenterFace AI
            </span>
            <h3 className="mt-4 text-2xl font-bold text-white">How to Face Lock with CenterFace AI</h3>
            <p className="mt-2 text-sm text-white/50">Average time: 10 seconds · 100% Free in Browser</p>

            <ol className="mt-6 space-y-4 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="font-mono text-lock font-bold">1.</span>
                <span><strong>Open Studio:</strong> Drop your MP4 or WebM video right onto this page or the home page.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-lock font-bold">2.</span>
                <span><strong>Click Anchor:</strong> Click the face or nose landmark on frame 1.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-lock font-bold">3.</span>
                <span><strong>Press Track:</strong> AI computes optical flow and RANSAC trajectory in real time.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-lock font-bold">4.</span>
                <span><strong>Auto-Reframe:</strong> Toggle 9:16 vertical crop for TikTok and Reels with smart zoom.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-lock font-bold">5.</span>
                <span><strong>Instant Export:</strong> Click Export for a clean, watermark-free MP4 with audio.</span>
              </li>
            </ol>

            <div className="mt-8 pt-4 border-t border-white/10">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lock py-3 text-[14.5px] font-semibold text-black transition hover:bg-lock/90"
              >
                Launch CenterFace AI Now (Free) →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────── Adsterra Banner (728x90 / 300x250) ── */}
      <ResponsiveBanner className="my-10" />

      {/* ──────── Section 3: Tracket Motion: Video Editor Alternative ── */}
      <section className="mx-auto max-w-[1280px] px-6 pt-28 sm:px-10">
        <div className="rounded-[24px] border border-white/10 bg-[#121214] p-8 sm:p-12">
          <div className="max-w-3xl">
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-blue-400">
              Software Comparison
            </span>
            <h2 className="h-display mt-4 text-3xl font-bold text-white sm:text-4xl">
              Tracket Motion: Video Editor — Best Online &amp; PC Alternative
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-white/70">
              <strong>Tracket Motion: Video Editor</strong> is a popular mobile application on the Google Play Store and Apple App Store
              known for motion tracking and video stabilization. However, creators frequently search for a <em>web-based or PC version</em> of Tracket Motion because:
            </p>
            <ul className="mt-4 space-y-2.5 text-[15px] text-white/60">
              <li className="flex items-center gap-2.5">
                <span className="text-red-400">✕</span> Tracket Motion is restricted to mobile screens and APK downloads.
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-red-400">✕</span> Mobile apps often include intrusive ads and premium paywalls.
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-red-400">✕</span> Transferring large 4K video files from cameras to a smartphone is slow.
              </li>
            </ul>

            <p className="mt-6 text-[16px] leading-relaxed text-white/70">
              <strong>CenterFace AI</strong> is the ideal web alternative to Tracket Motion. You can open it on your Windows PC, Mac,
              Chromebook, iPad, or mobile browser without downloading any software or installing an APK.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="pb-3 font-medium">Feature</th>
                  <th className="pb-3 font-semibold text-lock">CenterFace AI (Web)</th>
                  <th className="pb-3 font-medium">Tracket Motion (App)</th>
                  <th className="pb-3 font-medium">Adobe After Effects</th>
                  <th className="pb-3 font-medium">CapCut Mobile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08] text-white/70">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 font-medium text-white">{row.feature}</td>
                    <td className="py-3.5 font-semibold text-lock">{row.centerface}</td>
                    <td className="py-3.5 text-white/60">{row.tracketMotion}</td>
                    <td className="py-3.5 text-white/60">{row.afterEffects}</td>
                    <td className="py-3.5 text-white/60">{row.capcut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ────────────────────────── Native Banner Widget ── */}
      <NativeBanner className="my-14" />

      {/* ────────────────────────── Section 4: Frequently Asked Questions ── */}
      <section className="mx-auto max-w-[1280px] px-6 pt-28 sm:px-10">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-lock">FAQ</p>
          <h2 className="h-display mt-3 text-3xl font-bold text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-white/50">
            Everything you need to know about the face lock effect and browser motion tracking.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="rounded-[18px] border border-white/10 bg-[#121214] p-6">
              <h3 className="text-[16px] font-semibold text-white">{item.q}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/60">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────── Section 5: Bottom CTA Banner ── */}
      <section className="mx-auto max-w-[1280px] px-6 py-28 sm:px-10">
        <div className="relative overflow-hidden rounded-[28px] border border-lock/30 bg-gradient-to-r from-[#171719] via-[#1f1e14] to-[#171719] p-8 text-center sm:p-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="h-display text-3xl font-bold text-white sm:text-5xl">
              Create Your Face Lock Edit Now
            </h2>
            <p className="mt-4 text-[16px] text-white/70">
              No download, no signup, no credit card, no watermark. Click below to launch the editor instantly on the home studio.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lock px-8 py-4 text-[16px] font-semibold text-black shadow-xl transition hover:scale-105 hover:bg-lock/90"
              >
                <Mark size={20} />
                Open Face Lock Editor
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-4 text-[15px] font-medium text-white transition hover:bg-white/10"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

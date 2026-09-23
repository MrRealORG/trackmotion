import Link from "next/link";
import { Mark } from "@/components/site/Mark";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-black px-6 py-24 sm:px-10">
      <div className="thirds pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-[1280px]">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="TrackWeb Motion — home">
          <Mark size={26} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">TrackWeb Motion</span>
        </Link>

        <div className="mt-16 flex items-center gap-4">
          <svg className="af-idle h-16 w-16 text-white/35" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <rect x="1.5" y="1.5" width="97" height="97" rx="3" stroke="currentColor" strokeWidth="2" strokeDasharray="6 7" />
            <path d="M50 1.5v10M50 98.5v-10M1.5 50h10M98.5 50h-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="osd rounded-[4px] bg-white/10 px-2 py-1 text-white/70">404 · No subject</span>
        </div>

        <h1 className="h-display mt-8 text-[clamp(3.2rem,10vw,8rem)]">
          Track lost.
        </h1>
        <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/55">
          This page drifted out of frame and the tracker couldn&apos;t re-acquire it. The studio is right where you left
          it.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/" className="btn-lock">
            Back to the index
          </Link>
          <Link href="/app" className="btn-ghost">
            Open the studio
          </Link>
        </div>
      </div>
    </div>
  );
}

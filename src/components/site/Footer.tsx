import Link from "next/link";
import { Mark } from "./Mark";

const TERMS = [
  "motion tracking video editor",
  "ai motion tracking",
  "face lock",
  "nose lock",
  "point tracking",
  "object tracking",
  "auto reframe 9:16",
  "sticker tracking",
  "virtual camera",
  "speed ramp",
  "freeze frame",
  "capcut alternative",
  "after effects alternative",
  "private video editor",
];

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["/app", "Studio"],
      ["/#virtual-camera", "Virtual camera"],
      ["/#features", "Features"],
      ["/#specs", "Specifications"],
    ],
  },
  {
    title: "Company",
    links: [
      ["/about", "About"],
      ["/about#faq", "FAQ"],
      ["/about#contact", "Contact"],
      ["/admin", "Admin"],
    ],
  },
];

const KEYS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← →", "Step one frame"],
  ["⇧ ← →", "Step ten frames"],
  ["Esc", "Exit placement"],
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pb-24 md:pb-0">
      <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Mark size={26} />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">CenterFace AI</span>
            </Link>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-white/50">
              Motion tracking that runs in your browser. The tracker, compositor and encoder are all local — your
              footage never leaves the device.
            </p>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <h2 className="osd text-white/35">{c.title}</h2>
              <ul className="mt-5 space-y-3 text-[14px]">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-white/70 transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="osd text-white/35">Studio shortcuts</h2>
            <dl className="mt-5 space-y-3 text-[14px]">
              {KEYS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt>
                    <kbd className="rounded-[6px] bg-white/[0.08] px-2 py-0.5 font-mono text-[11.5px] text-white/80">{k}</kbd>
                  </dt>
                  <dd className="text-white/50">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-6">
          {TERMS.map((t) => (
            <span key={t} className="osd text-white/25">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 text-[12.5px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CenterFace AI. All processing happens on your device.</span>
          <span className="osd">studio@centerface.web.app</span>
        </div>
      </div>
    </footer>
  );
}

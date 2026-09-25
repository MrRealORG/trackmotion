import Link from "next/link";
import { Mark } from "./Mark";

const TERMS = [
  "face lock effect",
  "motion tracking video editor",
  "ai motion tracking",
  "tracket motion alternative",
  "after effects face lock",
  "face lock",
  "nose lock",
  "point tracking",
  "object tracking",
  "auto reframe 9:16",
  "free face track app",
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
      ["/face-lock-effect", "Face Lock Effect (Free)"],
      ["/#virtual-camera", "Virtual camera"],
      ["/#features", "Features"],
      ["/#specs", "Specifications"],
    ],
  },
  {
    title: "Company",
    links: [
      ["/about", "About"],
      ["/about#founder", "Founder & Studio"],
      ["/about#faq", "FAQ"],
      ["/about#contact", "Contact"],
    ],
  },
  {
    title: "RealHackers",
    links: [
      ["https://realhackers.pages.dev", "Portfolio (realhackers.pages.dev) ↗"],
      ["https://realhackers.pages.dev/team", "Founder (Ahmad Raza) ↗"],
      ["https://realhackers.pages.dev/about", "Studio Story ↗"],
      ["mailto:hello@realhackers.studio", "hello@realhackers.studio"],
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
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr_1.1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Mark size={26} />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">CenterFace AI</span>
            </Link>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-white/50">
              Motion tracking that runs in your browser. The tracker, compositor and encoder are all local — your
              footage never leaves the device.
            </p>

            <div className="mt-5 flex flex-col gap-1.5 border-t border-white/10 pt-4">
              <p className="text-[13px] text-white/70">
                Crafted by{" "}
                <a
                  href="https://realhackers.pages.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-lock hover:underline"
                >
                  RealHackers
                </a>
              </p>
              <p className="text-[12.5px] text-white/50">
                Founder &amp; Architect:{" "}
                <a
                  href="https://realhackers.pages.dev/team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white/80 hover:text-white hover:underline"
                >
                  Ahmad Raza
                </a>
              </p>
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <h2 className="osd text-white/35">{c.title}</h2>
              <ul className="mt-5 space-y-3 text-[14px]">
                {c.links.map(([href, label]) => {
                  const isExt = href.startsWith("http") || href.startsWith("mailto");
                  return (
                    <li key={href}>
                      {isExt ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-white/70 transition-colors hover:text-white"
                        >
                          {label}
                        </a>
                      ) : (
                        <Link href={href} className="text-white/70 transition-colors hover:text-white">
                          {label}
                        </Link>
                      )}
                    </li>
                  );
                })}
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
          <span>
            © {new Date().getFullYear()} CenterFace AI · Made by{" "}
            <a
              href="https://realhackers.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-lock hover:underline font-medium"
            >
              RealHackers
            </a>
            {" "}· Founder:{" "}
            <a
              href="https://realhackers.pages.dev/team"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white hover:underline font-medium"
            >
              Ahmad Raza
            </a>
          </span>
          <div className="flex items-center gap-3">
            <a href="mailto:hello@realhackers.studio" className="osd text-white/45 hover:text-lock transition-colors">
              hello@realhackers.studio
            </a>
            <span>·</span>
            <a
              href="https://realhackers.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="osd text-lock hover:underline"
            >
              realhackers.pages.dev ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

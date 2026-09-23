"use client";

import { useEffect, useRef, useState } from "react";

/**
 * First-visit loader: the AE/AF square hunts, locks and flashes "AE/AF LOCK",
 * then two shutter blades open onto the page. Shown once per session; an
 * inline script in the root layout hides it instantly for returning visits.
 */
export function Loader() {
  const [phase, setPhase] = useState<"focus" | "open" | "gone">("focus");
  const tc = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (html.classList.contains("ld-skip")) {
      setPhase("gone");
      return;
    }
    const node = tc.current?.firstChild as Text | null;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const f = Math.floor(((performance.now() - t0) / 1000) * 24);
      if (node) node.data = `00:00:${String(Math.floor(f / 24)).padStart(2, "0")}:${String(f % 24).padStart(2, "0")}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const open = window.setTimeout(() => {
      setPhase("open");
      try {
        sessionStorage.setItem("twm-ld", "1");
      } catch {
        /* storage unavailable */
      }
      html.classList.remove("ld-active");
      html.classList.add("ld-done");
      window.dispatchEvent(new Event("twm:ready"));
    }, 1400);
    const gone = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      setPhase("gone");
    }, 2350);

    return () => {
      window.clearTimeout(open);
      window.clearTimeout(gone);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (phase === "gone") return null;

  const corner = "absolute h-6 w-6 border-white/60";
  return (
    <div aria-hidden="true" className={`twm-loader ${phase === "open" ? "open" : ""}`}>
      <div className="blade top" />
      <div className="blade bot" />
      <div className="ld-ui absolute inset-0">
        <span className={`${corner} left-6 top-6 rounded-tl-[4px] border-l-[1.5px] border-t-[1.5px]`} />
        <span className={`${corner} right-6 top-6 rounded-tr-[4px] border-r-[1.5px] border-t-[1.5px]`} />
        <span className={`${corner} bottom-6 left-6 rounded-bl-[4px] border-b-[1.5px] border-l-[1.5px]`} />
        <span className={`${corner} bottom-6 right-6 rounded-br-[4px] border-b-[1.5px] border-r-[1.5px]`} />

        <div className="osd absolute left-12 top-12 flex items-center gap-2 text-white/55">
          <i className="rec-dot inline-block h-2 w-2 rounded-full bg-rec" />
          CenterFace AI
        </div>
        <div className="osd absolute right-12 top-12 text-white/40">4K · 60 fps</div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center">
            <svg className="ld-sq" width="112" height="112" viewBox="0 0 100 100" fill="none">
              <rect x="1.5" y="1.5" width="97" height="97" rx="3" stroke="#FFD60A" strokeWidth="2" />
              <path d="M50 1.5v10M50 98.5v-10M1.5 50h10M98.5 50h-10" stroke="#FFD60A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="ld-badge osd mt-7 rounded-[4px] bg-lock px-2 py-1 text-black">AE/AF Lock</span>
          </div>
        </div>

        <div className="osd tnum absolute bottom-12 left-1/2 -translate-x-1/2 text-white/60">
          <span ref={tc}>00:00:00:00</span>
        </div>
      </div>
    </div>
  );
}

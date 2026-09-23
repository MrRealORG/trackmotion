"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Lock } from "./Viewfinder";
import { Timecode } from "./Motion";
import type { Pt } from "@/lib/media";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const STEPS = [
  { n: "01", t: "Track", d: "One click on the dancer. The lock holds through the whole leap." },
  { n: "02", t: "Follow", d: "The virtual camera pushes in and keeps her centred, frame after frame." },
  { n: "03", t: "Reframe", d: "A 9:16 crop is solved from the same path — ready for Shorts and Reels." },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Sticky, scroll-scrubbed demo of the virtual camera. The photo lives in a
 * cover box whose transform is written straight to the DOM every frame; the
 * lock square sits inside that box, so it stays welded to the subject.
 */
export function ScrollReframe({
  src,
  alt,
  ratio,
  subject,
}: {
  src: string;
  alt: string;
  ratio: number;
  subject: Pt;
}) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const crop = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const st = stage.current;
    const b = box.current;
    const c = crop.current;
    if (!el || !st || !b || !c) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = 1.55;
    let raf = 0;
    let cur = -1;
    let lastZ = "";
    let g = { L: 0, T: 0, bw: 0, bh: 0, cw: 0, ch: 0 };

    const measure = () => {
      g = { L: b.offsetLeft, T: b.offsetTop, bw: b.offsetWidth, bh: b.offsetHeight, cw: st.clientWidth, ch: st.clientHeight };
    };

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight);
      const p = clamp01(-r.top / total);

      const s3 = p < 0.3 ? 0 : p < 0.64 ? 1 : 2;
      if (s3 !== cur) {
        cur = s3;
        el.dataset.stage = String(s3);
      }

      const e = reduce ? 0 : ease(clamp01((p - 0.2) / 0.44));
      const sc = 1 + (S - 1) * e;
      const px = g.L + subject.x * g.bw;
      const py = g.T + subject.y * g.bh;
      const tx = (g.cw / 2 - px) * e;
      const ty = (g.ch / 2 - py) * e;
      b.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;

      const k = reduce ? (p >= 0.64 ? 1 : 0) : ease(clamp01((p - 0.64) / 0.22));
      c.style.opacity = k.toFixed(3);
      c.style.transform = `translate(-50%, -50%) scale(${(1.18 - 0.18 * k).toFixed(4)})`;

      if (bar.current) bar.current.style.transform = `scaleY(${p.toFixed(4)})`;
      const z = `${sc.toFixed(1)}×`;
      const zn = zoom.current?.firstChild as Text | null;
      if (z !== lastZ && zn) {
        lastZ = z;
        zn.data = z;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const ro = new ResizeObserver(() => {
      measure();
      update();
    });
    ro.observe(st);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          window.addEventListener("scroll", onScroll, { passive: true });
          measure();
          update();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "10% 0px 10% 0px" },
    );
    io.observe(el);
    measure();
    update();
    return () => {
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [subject.x, subject.y]);

  const boxStyle: Vars = {
    "--r": ratio,
    "--fx": subject.x,
    "--fy": subject.y,
    transformOrigin: `${subject.x * 100}% ${subject.y * 100}%`,
  };

  return (
    <section
      ref={root}
      id="reframe"
      data-stage="0"
      className="reframe relative h-[340vh]"
      aria-label="Virtual camera demonstration"
    >
      <div ref={stage} className="cq sticky top-0 h-[100svh] w-full bg-black">
        <div ref={box} className="cover will-change-transform" style={boxStyle}>
          <img src={src} alt={alt} loading="eager" decoding="async" />
          <Lock x={subject.x} y={subject.y} size={subject.s} delay={150} />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.6)_100%)]" />
        <div className="thirds pointer-events-none absolute inset-0 opacity-70" />

        {/* 9:16 auto-reframe crop */}
        <div
          ref={crop}
          className="pointer-events-none absolute left-1/2 top-1/2 aspect-[9/16] h-[min(78%,153vw)] rounded-[20px] opacity-0 shadow-[0_0_0_200vmax_rgba(0,0,0,0.68)] ring-1 ring-white/60"
        >
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-lock px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-black">
            9:16 · Auto reframe
          </span>
          <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-[20px] border-l-2 border-t-2 border-lock" />
          <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-[20px] border-r-2 border-t-2 border-lock" />
          <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-[20px] border-b-2 border-l-2 border-lock" />
          <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-[20px] border-b-2 border-r-2 border-lock" />
        </div>

        {/* OSD */}
        <div className="osd absolute left-5 top-20 flex items-center gap-2 text-white/70 sm:left-8">
          <i className="rec-dot inline-block h-2 w-2 rounded-full bg-rec" />
          REC <Timecode className="tnum text-white" />
        </div>
        <div className="osd absolute right-5 top-20 text-white/55 sm:right-8">Point track · Locked</div>

        {/* iOS zoom button */}
        <div className="glass absolute bottom-8 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full">
          <span ref={zoom} className="tnum text-[12px] font-semibold text-lock">
            1.0×
          </span>
        </div>

        {/* steps */}
        <ol className="absolute inset-x-5 bottom-24 flex flex-col gap-6 sm:inset-x-auto sm:bottom-auto sm:left-10 sm:top-1/2 sm:w-[300px] sm:-translate-y-1/2">
          <span className="absolute -left-4 top-1 hidden h-[calc(100%-0.5rem)] w-px bg-white/15 sm:block">
            <span ref={bar} className="block h-full w-px origin-top scale-y-0 bg-lock" />
          </span>
          {STEPS.map((s, i) => (
            <li key={s.n} className={`step st-${i} grid grid-cols-[2.2rem_1fr] gap-x-2`}>
              <span className="tnum pt-1 font-mono text-[12px] text-lock">{s.n}</span>
              <div>
                <h3 className="text-[22px] font-semibold tracking-[-0.03em]">{s.t}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.5] text-white/60">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Ticking SMPTE timecode. Writes to the text node directly — no re-renders. */
export function Timecode({ className = "", fps = 24 }: { className?: string; fps?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current?.firstChild as Text | null;
    if (!node) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const t0 = performance.now();
    let last = -1;
    let raf = 0;
    const tick = () => {
      const f = Math.floor(((performance.now() - t0) / 1000) * fps);
      if (f !== last) {
        last = f;
        const s = Math.floor(f / fps);
        node.data = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % fps)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fps]);
  return (
    <span ref={ref} className={className}>
      00:00:00:00
    </span>
  );
}

/** Publishes the parent's scroll progress (0 → 1 over its own height) as a CSS var. */
export function ScrollVar({ name = "--hp" }: { name?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = "";
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (el.offsetHeight || 1)));
      const v = p.toFixed(4);
      if (v !== last) {
        last = v;
        el.style.setProperty(name, v);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [name]);
  return <span ref={ref} hidden />;
}

/** Words light up one after another as the paragraph scrolls through view. */
export function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    let last = "";
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (vh * 0.5 + r.height)));
      const v = p.toFixed(4);
      if (v !== last) {
        last = v;
        el.style.setProperty("--p", v);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          window.addEventListener("scroll", onScroll, { passive: true });
          update();
        } else {
          window.removeEventListener("scroll", onScroll);
          update();
        }
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const style: Vars = { "--n": words.length };
  return (
    <p ref={ref} className={`wr ${className}`} style={style}>
      {words.map((w, i) => {
        const s: Vars = { "--i": i };
        return (
          <span key={i} style={s}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}

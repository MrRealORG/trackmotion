"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

let instance: Lenis | null = null;

function safeQuery(hash: string): HTMLElement | null {
  if (!hash || hash.length < 2) return null;
  try {
    return document.querySelector<HTMLElement>(hash);
  } catch {
    return null;
  }
}

/** Momentum scrolling (wheel only — touch keeps native iOS physics). */
export function SmoothScroll() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 0.95 });
    instance = lenis;

    const html = document.documentElement;
    const onReady = () => lenis.start();
    if (html.classList.contains("ld-active")) {
      lenis.stop();
      window.addEventListener("twm:ready", onReady, { once: true });
    }

    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href") ?? "";
      const el = safeQuery(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -16, duration: 1.3 });
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("twm:ready", onReady);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
      instance = null;
    };
  }, []);

  // Route change inside the site: land at the top (or the hash) instantly.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const l = instance;
    if (!l) return;
    const el = safeQuery(window.location.hash);
    if (el) l.scrollTo(el, { offset: -16, immediate: true, force: true });
    else l.scrollTo(0, { immediate: true, force: true });
  }, [path]);

  return null;
}

/**
 * One IntersectionObserver drives every reveal (.rv, .mask-line, .af, tiles).
 * Re-scans on route change and on DOM insertions, and waits for the loader.
 */
export function RevealInit() {
  const path = usePathname();

  useEffect(() => {
    const SEL = ".rv:not(.is-in), .mask-line:not(.is-in), .af:not(.is-in)";
    const html = document.documentElement;
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    let raf = 0;

    const scan = () => {
      raf = 0;
      if (!io) return;
      document.querySelectorAll<HTMLElement>(SEL).forEach((n) => io!.observe(n));
    };

    const start = () => {
      if (!("IntersectionObserver" in window)) {
        document.querySelectorAll<HTMLElement>(SEL).forEach((n) => n.classList.add("is-in"));
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
      );
      scan();
      mo = new MutationObserver(() => {
        if (!raf) raf = requestAnimationFrame(scan);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    };

    if (html.classList.contains("ld-active")) window.addEventListener("twm:ready", start, { once: true });
    else start();

    return () => {
      window.removeEventListener("twm:ready", start);
      io?.disconnect();
      mo?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [path]);

  return null;
}

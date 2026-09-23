"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mark } from "./Mark";

const LINKS = [
  { href: "/", label: "Index" },
  { href: "/app", label: "Studio" },
  { href: "/about", label: "About" },
];

/**
 * A floating glass pill up top (desktop) and an iOS-Camera-style mode dial
 * at the bottom (mobile). The active "mode" is yellow, just like the camera.
 */
export function Nav() {
  const path = usePathname();
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > 180 && y > last.current + 6) setHidden(true);
      else if (y < last.current - 6 || y < 180) setHidden(false);
      last.current = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const isActive = (href: string) => (href === "/" ? path === "/" || path === "/home" : path.startsWith(href));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-3 z-[100] flex justify-center px-3 transition-transform duration-500 ease-ios ${
          hidden ? "-translate-y-[150%]" : ""
        }`}
      >
        <nav aria-label="Primary" className="glass flex h-12 w-full max-w-[880px] items-center gap-2 rounded-full pl-3 pr-1.5">
          <Link href="/" className="flex items-center gap-2 pr-2" aria-label="CenterFace AI — home">
            <Mark size={24} />
            <span className="text-[14px] font-semibold tracking-[-0.02em]">CenterFace</span>
            <span className="-ml-1 hidden text-[14px] font-medium tracking-[-0.02em] text-lock sm:inline">AI</span>
          </Link>

          <ul className="mx-auto hidden items-center gap-0.5 md:flex">
            {LINKS.map((l) => {
              const a = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={a ? "page" : undefined}
                    className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
                      a ? "text-lock" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/app"
            className="ml-auto flex h-9 items-center gap-1.5 rounded-full bg-lock px-4 text-[13px] font-semibold text-black transition-transform duration-200 ease-ios hover:scale-[1.04] active:scale-[0.97] md:ml-0"
          >
            Open Studio
          </Link>
        </nav>
      </header>

      <nav
        aria-label="Sections"
        className="glass fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-0.5 rounded-full px-1.5 py-1.5 md:hidden"
      >
        {LINKS.map((l) => {
          const a = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={a ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                a ? "text-lock" : "text-white/55"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

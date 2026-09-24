"use client";

import { useEffect, useRef } from "react";

export function NativeBanner({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const targetDiv = document.createElement("div");
    targetDiv.id = "container-3a60f3eac59318ada80b03459bcb3935";

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl31482834.profitableratecpmnetwork.com/3a60f3eac59318ada80b03459bcb3935/invoke.js";

    container.appendChild(targetDiv);
    container.appendChild(script);
  }, []);

  return (
    <div className={`mx-auto my-8 w-full max-w-[1280px] px-4 sm:px-8 ${className}`}>
      <div className="mb-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/30">
        <span>Recommended Creator Tools &amp; Assets</span>
        <span>Sponsored</span>
      </div>
      <div
        ref={containerRef}
        className="min-h-[160px] w-full overflow-hidden rounded-[16px] bg-[#1c1c1e]/60 p-2 ring-1 ring-white/10"
      />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

export function NativeBanner({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "180";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    iframe.title = "Recommended Content";
    iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: transparent; color: #fff; overflow: hidden; }
    #container-3a60f3eac59318ada80b03459bcb3935 { width: 100%; }
  </style>
</head>
<body>
  <div id="container-3a60f3eac59318ada80b03459bcb3935"></div>
  <script async="async" data-cfasync="false" src="https://pl31482834.profitableratecpmnetwork.com/3a60f3eac59318ada80b03459bcb3935/invoke.js"></script>
</body>
</html>`;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(iframe);
  }, []);

  return (
    <div className={`mx-auto my-8 w-full max-w-[1280px] px-4 sm:px-8 ${className}`}>
      <div className="mb-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/30">
        <span>Recommended Creator Tools &amp; Assets</span>
        <span>Sponsored</span>
      </div>
      <div ref={containerRef} className="min-h-[160px] w-full overflow-hidden rounded-[16px] bg-[#1c1c1e]/60 p-2 ring-1 ring-white/10" />
    </div>
  );
}

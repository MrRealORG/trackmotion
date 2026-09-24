"use client";

import { useEffect, useRef } from "react";

export function Banner728x90({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const confScript = document.createElement("script");
    confScript.type = "text/javascript";
    confScript.text = `atOptions = {
      'key' : '84d02a1ffa75822720ef3ae12aea594b',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };`;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = "https://www.highrevenueformat.com/84d02a1ffa75822720ef3ae12aea594b/invoke.js";

    container.appendChild(confScript);
    container.appendChild(invokeScript);
  }, []);

  return (
    <div className={`mx-auto flex flex-col items-center justify-center ${className}`}>
      <span className="mb-1 text-[10px] font-mono uppercase tracking-wider text-white/20">Sponsored</span>
      <div
        ref={containerRef}
        className="min-h-[90px] w-full max-w-[728px] flex justify-center items-center overflow-hidden rounded-lg bg-black/30 ring-1 ring-white/5"
      />
    </div>
  );
}

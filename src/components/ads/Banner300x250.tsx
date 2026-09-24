"use client";

import { useEffect, useRef } from "react";

export function Banner300x250({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const confScript = document.createElement("script");
    confScript.type = "text/javascript";
    confScript.text = `atOptions = {
      'key' : '91a94f118b6d2e1bcada7e26153bed94',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };`;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = "https://www.highrevenueformat.com/91a94f118b6d2e1bcada7e26153bed94/invoke.js";

    container.appendChild(confScript);
    container.appendChild(invokeScript);
  }, []);

  return (
    <div className={`mx-auto flex flex-col items-center justify-center ${className}`}>
      <span className="mb-1 text-[10px] font-mono uppercase tracking-wider text-white/20">Sponsored</span>
      <div
        ref={containerRef}
        className="min-h-[250px] w-[300px] flex justify-center items-center overflow-hidden rounded-lg bg-black/30 ring-1 ring-white/5"
      />
    </div>
  );
}

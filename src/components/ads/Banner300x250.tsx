"use client";

import { useEffect, useRef } from "react";

export function Banner300x250({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const iframe = document.createElement("iframe");
    iframe.width = "300";
    iframe.height = "250";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    iframe.title = "Advertisement";
    iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '91a94f118b6d2e1bcada7e26153bed94',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/91a94f118b6d2e1bcada7e26153bed94/invoke.js"></script>
</body>
</html>`;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(iframe);
  }, []);

  return (
    <div className={`mx-auto flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <span className="mb-1 text-[10px] font-mono uppercase tracking-wider text-white/20">Sponsored</span>
      <div ref={containerRef} className="h-[250px] w-[300px] overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/5" />
    </div>
  );
}

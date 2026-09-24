"use client";

/**
 * Adsterra 300x250 medium-rectangle banner.
 * Loads via a same-domain static HTML iframe so document.write() works.
 */
export function Banner300x250({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <iframe
        src="/ads/banner300x250.html"
        width={300}
        height={250}
        style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Advertisement"
      />
    </div>
  );
}

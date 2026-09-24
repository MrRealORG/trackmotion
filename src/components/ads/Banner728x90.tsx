"use client";

/**
 * Adsterra 728x90 leaderboard banner.
 * Loads via a same-domain static HTML iframe so document.write() works.
 */
export function Banner728x90({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <iframe
        src="/ads/banner728x90.html"
        width={728}
        height={90}
        style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Advertisement"
      />
    </div>
  );
}

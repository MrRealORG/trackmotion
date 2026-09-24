"use client";

/**
 * Adsterra Native Banner (4:1 widget).
 * Loads via a same-domain static HTML iframe so the invoke.js runs in a fresh context.
 */
export function NativeBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto max-w-[1280px] px-6 sm:px-10 ${className}`}>
      <iframe
        src="/ads/native.html"
        width="100%"
        height={250}
        style={{ border: "none", overflow: "hidden" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Recommended content"
      />
    </div>
  );
}

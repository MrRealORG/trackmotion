"use client";

import { Banner728x90 } from "./Banner728x90";
import { Banner300x250 } from "./Banner300x250";

/**
 * Shows 728x90 on desktop (≥768 px), 300x250 on mobile.
 * Both are iframe-based for reliable Adsterra rendering.
 */
export function ResponsiveBanner({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="hidden md:block">
        <Banner728x90 />
      </div>
      <div className="block md:hidden">
        <Banner300x250 />
      </div>
    </div>
  );
}

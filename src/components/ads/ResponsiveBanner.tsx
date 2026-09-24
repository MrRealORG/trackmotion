"use client";

import { Banner728x90 } from "./Banner728x90";
import { Banner300x250 } from "./Banner300x250";

export function ResponsiveBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full py-6 ${className}`}>
      <div className="hidden sm:block">
        <Banner728x90 />
      </div>
      <div className="block sm:hidden">
        <Banner300x250 />
      </div>
    </div>
  );
}

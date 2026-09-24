"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SocialBarLoader() {
  const pathname = usePathname();

  useEffect(() => {
    // Keep admin console clean & distraction-free
    if (pathname && pathname.startsWith("/admin")) return;

    const script = document.createElement("script");
    script.src = "https://pl31482833.profitableratecpmnetwork.com/06/d8/d6/06d8d6965a54e6c5b090d9ab8d3cf64b.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      } catch {}
    };
  }, [pathname]);

  return null;
}

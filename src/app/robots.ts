import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://centerface.web.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/home", "/app", "/about", "/opengraph-image", "/icon.svg"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/home", "/app", "/about"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

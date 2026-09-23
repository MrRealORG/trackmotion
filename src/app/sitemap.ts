import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://centerface.web.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      images: [`${SITE_URL}/opengraph-image`, `${SITE_URL}/icon.svg`],
    },
    {
      url: `${SITE_URL}/app`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
      images: [`${SITE_URL}/opengraph-image`],
    },
    {
      url: `${SITE_URL}/home`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/face-lock-effect`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      images: [`${SITE_URL}/opengraph-image`],
    },
  ];
}

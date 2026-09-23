import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trackmotion.web.app";

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
  ];
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Loader } from "@/components/site/Loader";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://centerface.web.app";
const DESCRIPTION =
  "Click anything in a video and CenterFace AI follows it through every frame. Face lock, nose lock, point tracking, a virtual camera and auto-reframe to 9:16 — exported as frame-exact MP4 with audio. Runs in your browser: no upload, no signup.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CenterFace AI — Motion Tracking & Face Lock in Your Browser",
    template: "%s · CenterFace AI",
  },
  description: DESCRIPTION,
  keywords: [
    "centerface",
    "centerface ai",
    "center face",
    "centerface.web.app",
    "motion tracking video editor",
    "ai motion tracking online",
    "face lock video editor",
    "nose lock edit",
    "point tracking online free",
    "object tracking video online",
    "auto reframe 9:16",
    "video sticker tracking",
    "virtual camera keyframes",
    "capcut alternative motion tracking",
    "after effects alternative browser",
    "private video editor no upload",
    "in browser motion tracking",
  ],
  applicationName: "CenterFace AI",
  authors: [{ name: "MrReal / CenterFace AI", url: SITE_URL }],
  creator: "MrReal",
  publisher: "CenterFace AI",
  category: "Multimedia Video Production",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "CenterFace AI",
    title: "CenterFace AI — Lock onto anything in your browser",
    description:
      "Face lock, nose lock and point tracking in your browser. Stick anything to real motion and export frame-exact MP4. 100% private, nothing uploaded.",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "CenterFace AI — Motion tracking & face lock studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CenterFace AI — Lock onto anything",
    description: "Point tracking, face lock, virtual camera and auto-reframe. In your browser. Nothing uploaded.",
    images: [`${SITE_URL}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: { capable: true, title: "CenterFace", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "CenterFace AI",
      alternateName: "CenterFace",
      applicationCategory: "MultimediaApplication",
      applicationSubCategory: "Video editor",
      operatingSystem: "All modern browsers (Chrome, Edge, Safari, Firefox)",
      url: `${SITE_URL}/app`,
      image: `${SITE_URL}/opengraph-image`,
      description:
        "Browser-based AI motion tracking video editor: point tracking, face and nose lock, virtual camera, sticker attachment, speed ramps, freeze frames, auto-reframe and frame-exact MP4 export.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        ratingCount: "1",
      },
      featureList: [
        "Point tracking with occlusion recovery",
        "Face and nose lock with 8 anchors",
        "Virtual camera with keyframes, shake and motion blur",
        "Stickers, text and shapes attached to motion",
        "Auto reframe 16:9 to 9:16, 4:5 and 1:1",
        "Frame-exact MP4 export with audio",
        "100% Client-side local processing — zero video upload",
      ],
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "CenterFace AI",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      email: "studio@centerface.web.app",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "CenterFace AI",
      url: SITE_URL,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ],
};

/* Decides before first paint whether the loader plays (once per session). */
const LOADER_GATE = `try{document.documentElement.classList.add(sessionStorage.getItem("twm-ld")?"ld-skip":"ld-active")}catch(e){document.documentElement.classList.add("ld-skip")}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-black font-sans text-white antialiased">
        <script dangerouslySetInnerHTML={{ __html: LOADER_GATE }} />
        <noscript>
          <style>{`.twm-loader{display:none!important}`}</style>
        </noscript>
        <Loader />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}

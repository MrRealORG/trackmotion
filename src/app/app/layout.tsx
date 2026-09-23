import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — track, lock and export in your browser",
  description:
    "Open the TrackWeb Motion studio: load a clip, point-track anything, lock onto a face or nose, attach stickers to real motion, drive a virtual camera and export frame-exact MP4 with audio. Free, no signup, nothing uploaded.",
  alternates: { canonical: "/app" },
  robots: { index: true, follow: true },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin console",
  description:
    "Manage the CenterFace AI overlay library, saved projects, render history and incoming real-time reviews from one catalogue-style console.",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

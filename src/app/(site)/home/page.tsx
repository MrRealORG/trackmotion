import type { Metadata } from "next";
import HomePage from "../page";

// /home mirrors the index; the canonical points at "/" so search engines
// never see duplicate content.
export const metadata: Metadata = {
  title: { absolute: "TrackWeb Motion — Motion tracking & face lock in your browser" },
  alternates: { canonical: "/" },
};

export default HomePage;

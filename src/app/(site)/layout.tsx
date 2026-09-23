import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { RevealInit, SmoothScroll } from "@/components/site/Scroll";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-black text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-lock focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <RevealInit />
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}

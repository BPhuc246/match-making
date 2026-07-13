import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import QueueNotification from "../components/QueueNotification";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#0e1014] to-[#09090b] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Visual Overlay Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay z-0"
        style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')`,
        }}
      />

      {/* Top Navbar */}
      <Navbar />

      {/* Floating matchmaking indicator */}
      <QueueNotification />

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {children}
      </main>

      {/* Humble Glass Footer */}
      <footer className="border-t border-white/5 bg-[#121214]/40 py-6 text-center text-xs text-zinc-500 backdrop-blur-sm relative z-10">
        <div>© 2026 RPS Matchmaking Arena. Crafted with Frosted Glass.</div>
      </footer>
    </div>
  );
}

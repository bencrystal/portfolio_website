import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";

// Display face for the numbers that ARE the interface (bpm, timer) — a touch
// of engraved-faceplate character without touching body text.
const archivo = Archivo({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Practice",
  robots: { index: false, follow: false },
  manifest: "/practice.webmanifest",
  icons: { apple: "/apple-touch-icon-practice.png" },
  appleWebApp: { capable: true, title: "Practice", statusBarStyle: "black" },
};

// maximumScale keeps double-tap/pinch zoom from fighting the dial and
// stopwatch buttons on iOS.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function PracticeLayout({ children }: { children: ReactNode }) {
  return <div className={archivo.variable}>{children}</div>;
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Practice",
  robots: { index: false, follow: false },
};

// maximumScale keeps double-tap/pinch zoom from fighting the dial and
// stopwatch buttons on iOS.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function PracticeLayout({ children }: { children: ReactNode }) {
  return children;
}

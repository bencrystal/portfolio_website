import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Scribe",
  robots: { index: false, follow: false },
};

export default function ListLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ben Crystal - Creative Technologist",
  description:
    "Portfolio of Ben Crystal, XR creative technologist and electrical engineer based in Brooklyn, NY. Specializing in immersive AR/VR experiences, machine learning, and innovative interface design.",
  icons: {
    icon: "/nanobanana_logo_sphere.png",
    shortcut: "/nanobanana_logo_sphere.png",
    apple: "/nanobanana_logo_sphere.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SiteHeader />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Software Composer LP - Cursor Template",
  description: "Create stunning landing pages in minutes with just 3 prompts. Save thousands on design and development with our Cursor-powered template.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* Persistent Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo/Name */}
              <Link href="/" className="text-xl font-bold text-white hover:text-cyan-400 transition-colors">
                Ben Crystal
              </Link>
              
              {/* Navigation Links */}
              <nav className="flex items-center gap-6">
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Resume</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/ben-crystal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="hidden sm:inline">LinkedIn</span>
                  <span className="sm:hidden">Li</span>
                </a>
                <a
                  href="https://github.com/bencrystal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="hidden sm:inline">GitHub</span>
                  <span className="sm:hidden">GH</span>
                </a>
              </nav>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}

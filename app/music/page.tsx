'use client'

import Background from "@/components/Background"

export default function MusicPage() {
  return (
    <main className="min-h-screen min-h-dvh bg-zinc-950 relative">
      <Background />

      <div className="relative z-10">
        <section className="min-h-[80vh] flex items-center justify-center px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 text-transparent bg-clip-text">
                Music
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              My new single <span className="text-white font-medium">Featherbrain</span> is on the way.
              Presave it now so it lands in your library the moment it drops.
            </p>

            <a
              href="https://distrokid.com/hyperfollow/bencrystal/featherbrain"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 px-10 py-4 text-base font-medium text-white transition-all duration-300 ease-out"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-600/30 group-hover:from-cyan-500/50 group-hover:to-blue-600/50 transition-all duration-300" />
              <div className="absolute inset-0 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-300" />
              <div className="relative flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3zm12-3c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3z" />
                </svg>
                <span>Presave Featherbrain</span>
              </div>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

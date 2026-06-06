'use client'

import Background from "@/components/Background"
import { PillLink } from "@/components/ui/PillButton"

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

            <PillLink
              href="https://distrokid.com/hyperfollow/bencrystal/featherbrain"
              external
              variant="gradient"
              size="lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3zm12-3c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3z" />
              </svg>
              <span>Presave Featherbrain</span>
            </PillLink>
          </div>
        </section>
      </div>
    </main>
  )
}

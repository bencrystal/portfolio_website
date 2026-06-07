import Background from '@/components/Background'
import { ReleaseHero, ReleaseListItem } from '@/components/landing/ReleaseHero'
import { featuredRelease, releases } from '@/data/releases'

const ACCENT = '#57f1ff'

export default function MusicPage() {
  const others = releases.filter((r) => r.id !== featuredRelease.id)

  return (
    <main className="min-h-screen min-h-dvh text-white relative">
      <Background text="♪ ♫" fontSize={16} spacing={22} />

      <div className="relative z-10">
        <ReleaseHero release={featuredRelease} />

        {others.length > 0 && (
          <section className="border-b border-white/10 bg-black/40 backdrop-blur-[2px]">
            <div className="max-w-7xl mx-auto px-6 py-16">
              <div className="flex items-baseline justify-between mb-10">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase">
                  More releases<span style={{ color: ACCENT }}>.</span>
                </h2>
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {String(others.length).padStart(2, '0')} more
                </span>
              </div>
              <div className="space-y-3 max-w-3xl">
                {others.map((r) => (
                  <ReleaseListItem key={r.id} release={r} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

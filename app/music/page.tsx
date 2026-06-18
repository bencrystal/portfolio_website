import Background from '@/components/Background'
import { ReleaseHero, ReleaseListItem } from '@/components/landing/ReleaseHero'
import { featuredRelease, releases } from '@/data/releases'

const ACCENT = '#57f1ff'

export default function MusicPage() {
  const others = releases.filter((r) => r.id !== featuredRelease.id)

  return (
    <main className="min-h-screen min-h-dvh text-white relative overflow-x-hidden">
      <Background text="♪ ♫" fontSize={16} spacing={22} />

      <div className="relative z-10">
        <ReleaseHero release={featuredRelease} />

        {featuredRelease.youtubeId && (
          <section className="border-t border-white/10 bg-black/40 backdrop-blur-[2px]">
            <div className="max-w-5xl mx-auto px-6 py-16">
              <p
                className="text-xs font-bold uppercase tracking-[0.3em] mb-6"
                style={{ color: ACCENT }}
              >
                Watch
              </p>
              <div className="relative w-full aspect-video overflow-hidden border border-white/10">
                <iframe
                  src={`https://www.youtube.com/embed/${featuredRelease.youtubeId}`}
                  title={`${featuredRelease.title} — official video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </section>
        )}

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

import Background from '@/components/Background'
import { ReleaseHero, ReleaseListItem } from '@/components/landing/ReleaseHero'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { featuredRelease, releases } from '@/data/releases'

export default function MusicPage() {
  const others = releases.filter((r) => r.id !== featuredRelease.id)

  return (
    <main className="min-h-screen min-h-dvh bg-zinc-950 relative">
      <Background />

      <div className="relative z-10">
        <ReleaseHero release={featuredRelease} />

        {others.length > 0 && (
          <section className="px-6 pb-24">
            <div className="max-w-3xl mx-auto">
              <div className="mb-10">
                <SectionHeader align="left" divider={false}>
                  More releases
                </SectionHeader>
              </div>
              <div className="space-y-4">
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

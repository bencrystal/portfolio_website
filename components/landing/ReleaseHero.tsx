'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Release } from '@/types/Release'
import { PillLink } from '@/components/ui/PillButton'
import { GlassCard } from '@/components/ui/GlassCard'

const formatReleaseDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

const CoverArt = ({ release }: { release: Release }) => {
  const [errored, setErrored] = useState(false)
  const showPlaceholder = !release.cover || errored

  return (
    <div className="relative aspect-square w-full max-w-md mx-auto">
      <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-3xl blur-2xl opacity-60" />
      <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-zinc-900">
        {showPlaceholder ? (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 via-blue-600/30 to-indigo-600/40 flex items-center justify-center">
            <span className="text-zinc-100/80 text-lg font-light tracking-widest uppercase">
              {release.title}
            </span>
          </div>
        ) : (
          <Image
            src={release.cover!}
            alt={`${release.title} cover art`}
            fill
            sizes="(min-width: 768px) 28rem, 100vw"
            className="object-cover"
            onError={() => setErrored(true)}
            priority
          />
        )}
      </div>
    </div>
  )
}

export const ReleaseHero = ({ release }: { release: Release }) => {
  const upcoming = release.status === 'upcoming'

  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <CoverArt release={release} />

        <div className="text-center lg:text-left">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-4">
            {upcoming ? 'New Single' : 'Out Now'} · {formatReleaseDate(release.releaseDate)}
          </p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-4 bg-gradient-to-r from-white via-zinc-100 to-zinc-300 text-transparent bg-clip-text">
            {release.title}
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-400 font-light mb-8">{release.artist}</p>

          {release.about && (
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light mb-10 max-w-xl mx-auto lg:mx-0">
              {release.about}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
            {upcoming && release.presaveUrl && (
              <PillLink href={release.presaveUrl} external variant="gradient" size="lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3zm12-3c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3z"
                  />
                </svg>
                <span>Presave {release.title}</span>
              </PillLink>
            )}
            {release.links?.map((link) => (
              <PillLink key={link.url} href={link.url} external variant="ghost" size="md">
                {link.label}
              </PillLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Compact list item for upcoming/past releases beyond the headline track. */
export const ReleaseListItem = ({ release }: { release: Release }) => (
  <GlassCard className="p-6 flex items-center gap-5">
    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-cyan-500/30 to-blue-600/30">
      {release.cover && (
        <Image
          src={release.cover}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
        {release.status === 'upcoming' ? 'Upcoming' : 'Released'} · {formatReleaseDate(release.releaseDate)}
      </p>
      <h3 className="text-lg font-semibold text-white truncate">{release.title}</h3>
    </div>
    {release.presaveUrl && release.status === 'upcoming' && (
      <PillLink href={release.presaveUrl} external variant="ghost" size="sm">
        Presave
      </PillLink>
    )}
  </GlassCard>
)

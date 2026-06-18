'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Release } from '@/types/Release'

const ACCENT = '#57f1ff'

const formatReleaseDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

const CoverArt = ({ release }: { release: Release }) => {
  const [errored, setErrored] = useState(false)
  const showPlaceholder = !release.cover || errored

  return (
    <div className="relative aspect-square w-full max-w-md mx-auto lg:mx-0">
      <div className="relative aspect-square overflow-hidden border border-white/10 bg-zinc-950">
        {showPlaceholder ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: ACCENT }}
          >
            <span className="text-black text-2xl font-black uppercase tracking-tighter">
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
    <section className="border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <CoverArt release={release} />

        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] mb-6"
            style={{ color: ACCENT }}
          >
            {upcoming ? 'New Single' : 'Out Now'} · {formatReleaseDate(release.releaseDate)}
          </p>

          <div style={{ containerType: 'inline-size' }} className="mb-6">
            <h1
              className="font-black tracking-[-0.04em] uppercase leading-[0.85] whitespace-nowrap"
              style={{ fontSize: 'min(14cqw, 7rem)' }}
            >
              {release.title}
            </h1>
          </div>

          <p className="text-xl sm:text-2xl text-white/70 font-light mb-8">
            {release.artist}
          </p>

          {release.about && (
            <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-10 max-w-xl">
              {release.about}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {upcoming && release.presaveUrl && (
              <a
                href={release.presaveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold uppercase tracking-widest text-xs text-black transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: ACCENT }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3zm12-3c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3z"
                  />
                </svg>
                <span>Presave {release.title} →</span>
              </a>
            )}
            {release.links?.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 font-bold uppercase tracking-widest text-xs text-white border border-white/30 hover:border-white transition-colors"
              >
                {link.label} →
              </a>
            ))}
          </div>

          {release.spotifyEmbedUrl && (
            <div className="mt-10">
              <iframe
                src={release.spotifyEmbedUrl}
                width="100%"
                height="352"
                frameBorder={0}
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={`${release.title} on Spotify`}
                style={{ borderRadius: 12 }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Compact list item for upcoming/past releases beyond the headline track. */
export const ReleaseListItem = ({ release }: { release: Release }) => (
  <article className="flex items-center gap-5 p-5 border border-white/10 hover:border-white/30 transition-colors bg-zinc-950">
    <div className="relative w-16 h-16 overflow-hidden flex-shrink-0 bg-zinc-900">
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
      <p
        className="text-[11px] font-bold uppercase tracking-[0.3em] mb-1"
        style={{ color: ACCENT }}
      >
        {release.status === 'upcoming' ? 'Upcoming' : 'Released'} · {formatReleaseDate(release.releaseDate)}
      </p>
      <h3 className="text-lg font-black uppercase tracking-tight text-white truncate">
        {release.title}
      </h3>
    </div>
    {release.presaveUrl && release.status === 'upcoming' && (
      <a
        href={release.presaveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 font-bold uppercase tracking-widest text-[11px] text-black transition-transform hover:-translate-y-0.5 flex-shrink-0"
        style={{ backgroundColor: ACCENT }}
      >
        Presave →
      </a>
    )}
  </article>
)

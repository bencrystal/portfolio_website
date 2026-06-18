'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Release } from '@/types/Release'

const ACCENT = '#57f1ff'

const formatReleaseDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** Brand glyphs for streaming links, matched by label. Inherit currentColor. */
const PLATFORM_ICONS: Record<string, string> = {
  spotify:
    'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.96-.6-.122-.42.18-.84.6-.96 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
}

const PlatformIcon = ({ label }: { label: string }) => {
  const path = PLATFORM_ICONS[label.toLowerCase()]
  if (!path) return null
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d={path} />
    </svg>
  )
}

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
      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <CoverArt release={release} />

        <div>
          <div style={{ containerType: 'inline-size' }} className="mb-2 sm:mb-3">
            <h1
              className="font-black tracking-[-0.04em] uppercase leading-[0.85] whitespace-nowrap"
              style={{ fontSize: 'min(14cqw, 7rem)' }}
            >
              {release.title}
            </h1>
          </div>

          <p className="text-xl sm:text-2xl text-white/60 font-light mb-6 sm:mb-8">
            {release.artist}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {upcoming && release.presaveUrl && (
              <a
                href={release.presaveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-widest text-xs text-black transition-transform hover:-translate-y-0.5"
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
            {release.links?.map((link, i) => {
              const primary = !upcoming && i === 0
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    primary
                      ? 'inline-flex items-center justify-center gap-2.5 px-6 py-3.5 font-bold uppercase tracking-widest text-xs text-black transition-transform hover:-translate-y-0.5'
                      : 'inline-flex items-center justify-center gap-2.5 px-6 py-3.5 font-bold uppercase tracking-widest text-xs text-white border border-white/30 hover:border-white hover:text-white transition-colors'
                  }
                  style={primary ? { backgroundColor: ACCENT } : undefined}
                >
                  <PlatformIcon label={link.label} />
                  <span>{link.label}</span>
                </a>
              )
            })}
          </div>

          {release.about && (
            <p className="text-base sm:text-lg text-white/70 leading-relaxed mt-6 sm:mt-8 max-w-xl">
              {release.about}
            </p>
          )}

          {release.spotifyEmbedUrl && (
            <div className="mt-6 sm:mt-8">
              <iframe
                src={release.spotifyEmbedUrl}
                width="100%"
                height="152"
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

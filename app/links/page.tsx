import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Background from '@/components/Background'
import { linkEvents, linkEntries, type LinkEvent, type LinkEntry } from '@/data/links'

export const metadata: Metadata = {
  title: 'Links · Ben Crystal',
  description: 'Events, new music, and everything else Ben Crystal is up to.',
}

// Re-render hourly so past events drop off without a redeploy.
export const revalidate = 3600

const ACCENT = '#57f1ff'

function todayInNewYork(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

function EventCard({ event }: { event: LinkEvent }) {
  return (
    <a
      href={event.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border bg-neutral-900 p-5 shadow-2xl transition-colors hover:bg-neutral-800"
      style={{ borderColor: `${ACCENT}66` }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span
          className="text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: ACCENT }}
        >
          Happening
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
          {event.dateLabel}
        </span>
      </div>
      <p className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-[#57f1ff] transition-colors">
        {event.title}
      </p>
      <p className="mt-1 text-sm text-neutral-300">
        {event.venue}
        {event.note && <span className="text-neutral-400"> · {event.note}</span>}
      </p>
    </a>
  )
}

function LinkButton({ entry }: { entry: LinkEntry }) {
  return (
    <a
      href={entry.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl transition-colors hover:bg-neutral-800"
    >
      {entry.thumbnail && (
        <Image
          src={entry.thumbnail}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      )}
      <span className="flex flex-col gap-0.5">
        <span className="text-base sm:text-lg font-bold text-white group-hover:text-[#57f1ff] transition-colors">
          {entry.label}
        </span>
        {entry.note && <span className="text-sm text-neutral-400">{entry.note}</span>}
      </span>
    </a>
  )
}

export default function LinksPage() {
  const today = todayInNewYork()
  const upcoming = linkEvents.filter((event) => event.date >= today)

  return (
    <main className="min-h-screen min-h-dvh bg-black relative">
      <Background />
      <div className="relative z-10 mx-auto max-w-md px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">
          bencrystal.me
        </p>
        <h1 className="mt-3 text-5xl sm:text-6xl font-black tracking-tighter uppercase text-white">
          Ben Crystal
          <span style={{ color: ACCENT }}>.</span>
        </h1>
        <p className="mt-4 text-base text-neutral-300">
          Events, new music, and everything else.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          {upcoming.map((event) => (
            <EventCard key={event.href} event={event} />
          ))}
          {linkEntries.map((entry) => (
            <LinkButton key={entry.href} entry={entry} />
          ))}
        </div>

        <p className="mt-12 text-sm uppercase tracking-[0.3em] text-neutral-400">
          <Link href="/" className="hover:text-white transition-colors">
            more at bencrystal.me →
          </Link>
        </p>
      </div>
    </main>
  )
}

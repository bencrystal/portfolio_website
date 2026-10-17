import type { Metadata } from 'next'
import Link from 'next/link'
import Background from '@/components/Background'

export const metadata: Metadata = {
  title: 'All Pages · Ben Crystal',
  description: 'Personal index of every unlinked page on bencrystal.me.',
  robots: { index: false },
}

interface IndexEntry {
  href: string
  label: string
  note?: string
  external?: boolean // plain <a> for static files / HTML in /public
}

interface IndexGroup {
  title: string
  entries: IndexEntry[]
}

const GROUPS: IndexGroup[] = [
  {
    title: 'Personal tools',
    entries: [
      { href: '/list', label: '/list', note: 'Scribe — todo buckets (alias: /scribe, token via /list/<token>)' },
      { href: '/inkdrop', label: '/inkdrop', note: 'Token-gated notes (token via /inkdrop/<token>)' },
      { href: '/practice', label: '/practice', note: 'Guitar practice tools landing' },
      { href: '/practice/log', label: '/practice/log', note: 'Full practice log' },
      { href: '/practice/plan', label: '/practice/plan', note: 'Curated practice plan (Larsen / Fujita ladder)' },
      { href: '/practice/tree', label: '/practice/tree', note: 'Old skill tree (demoted, kept reachable)' },
      { href: '/define', label: '/define', note: 'Merriam-Webster + Urban Dictionary side by side' },
    ],
  },
  {
    title: 'Pages',
    entries: [
      { href: '/music', label: '/music', note: 'Music releases' },
      { href: '/mezcal', label: '/mezcal', note: "Gary's Mezcal Journey — tasting invite" },
    ],
  },
  {
    title: 'App support',
    entries: [
      { href: '/flowbot/privacy', label: '/flowbot/privacy', note: 'FlowBot App Store privacy policy' },
      { href: '/livemic/privacy', label: '/livemic/privacy', note: 'Live Mic privacy policy' },
      { href: '/livemic/support', label: '/livemic/support', note: 'Live Mic support page' },
    ],
  },
  {
    title: 'Static experiments',
    entries: [
      { href: '/waypoint/', label: '/waypoint', note: 'Waypoint AR — Citi Bike', external: true },
      { href: '/waypoint-dock/', label: '/waypoint-dock', note: 'Waypoint AR — dock variant', external: true },
      { href: '/waypoint-simple/', label: '/waypoint-simple', note: 'Waypoint AR — simple variant', external: true },
      { href: '/string-unison/demo.html', label: '/string-unison/demo.html', note: 'String unison celebration demo', external: true },
    ],
  },
  {
    title: 'Files',
    entries: [
      { href: '/resume.pdf', label: '/resume.pdf', external: true },
      { href: '/Resume_BenCrystal.pdf', label: '/Resume_BenCrystal.pdf', external: true },
      { href: '/ben-crystal-xr-resume.pdf', label: '/ben-crystal-xr-resume.pdf', note: 'XR-focused resume', external: true },
    ],
  },
]

function EntryRow({ entry }: { entry: IndexEntry }) {
  const inner = (
    <>
      <span className="font-mono text-sm text-white group-hover:text-[#57f1ff] transition-colors">
        {entry.label}
      </span>
      {entry.note && (
        <span className="text-sm text-neutral-500">{entry.note}</span>
      )}
    </>
  )
  const className =
    'group flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4 py-2.5 border-b border-white/5'

  return entry.external ? (
    <a href={entry.href} className={className}>
      {inner}
    </a>
  ) : (
    <Link href={entry.href} className={className}>
      {inner}
    </Link>
  )
}

export default function AllPagesPage() {
  return (
    <main className="min-h-screen min-h-dvh bg-black relative">
      <Background />
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-neutral-500">bencrystal.me</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">All Pages</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Every unlinked page on the site, in one place. Not indexed by search engines.
        </p>

        {GROUPS.map((group) => (
          <section key={group.title} className="mt-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
              {group.title}
            </h2>
            <div className="mt-3">
              {group.entries.map((entry) => (
                <EntryRow key={entry.href} entry={entry} />
              ))}
            </div>
          </section>
        ))}

        <p className="mt-12 text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-400 transition-colors">
            ← back home
          </Link>
        </p>
      </div>
    </main>
  )
}

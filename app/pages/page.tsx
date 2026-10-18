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
      { href: '/quizbot', label: '/quizbot', note: 'Play It By Ear channel dashboard (aliases: /audioquiz, /playitbyear)' },
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
      { href: '/quizbot/privacy', label: '/quizbot/privacy', note: 'Quizbot privacy policy (Meta / TikTok developer apps)' },
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

const ACCENT = '#57f1ff'

function EntryRow({ entry }: { entry: IndexEntry }) {
  const inner = (
    <>
      <span className="font-mono text-sm text-white group-hover:text-[#57f1ff] transition-colors">
        {entry.label}
      </span>
      {entry.note && (
        <span className="text-sm leading-snug text-neutral-500">{entry.note}</span>
      )}
    </>
  )
  const className =
    'group flex flex-col gap-0.5 px-5 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition-colors'

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

function GroupCard({ group }: { group: IndexGroup }) {
  return (
    <section className="flex flex-col border border-white/15 bg-white/[0.02]">
      <div className="flex items-baseline justify-between border-b border-white/15 px-5 py-4">
        <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white">
          {group.title}
          <span style={{ color: ACCENT }}>.</span>
        </h2>
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">
          {String(group.entries.length).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-col">
        {group.entries.map((entry) => (
          <EntryRow key={entry.href} entry={entry} />
        ))}
      </div>
    </section>
  )
}

export default function AllPagesPage() {
  return (
    <main className="min-h-screen min-h-dvh bg-black relative">
      <Background />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
          bencrystal.me
        </p>
        <h1 className="mt-3 text-5xl sm:text-7xl font-black tracking-tighter uppercase text-white">
          All Pages
          <span style={{ color: ACCENT }}>.</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm text-neutral-500">
          Every unlinked page on the site, in one place. Not indexed by search engines.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
          {GROUPS.map((group) => (
            <GroupCard key={group.title} group={group} />
          ))}
        </div>

        <p className="mt-12 text-xs uppercase tracking-[0.3em] text-neutral-600">
          <Link href="/" className="hover:text-neutral-400 transition-colors">
            ← back home
          </Link>
        </p>
      </div>
    </main>
  )
}

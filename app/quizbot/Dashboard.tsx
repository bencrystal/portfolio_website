'use client'

import { useEffect, useMemo, useState } from 'react'

// ---- data shape (written by quizbot/scripts/analytics_export.py) ----------------------------------
type Video = {
  id: string; title: string; published: string; pack: string; format: 'short' | 'long'
  variant: 'coldopen' | 'announce' | null; theme: string; duration: number; privacy: string
  views: number; likes: number; comments: number; avd: number | null; avp: number | null
  minutes: number | null; subs: number | null
}
type Day = { day: string; views: number; estimatedMinutesWatched: number; subscribersGained: number; subscribersLost: number }
type Episode = { slug: string; pack: string; title: string; theme: string; status: string; youtube_id: string | null; created_at: number }
type Comment = { video: string; title: string; author: string; text: string; likes: number; at: string }
type ExpVariantRow = { n: number; avp: number | null; views: number | null }
type Experiments = {
  config: { min_n: number; max_n: number; min_lead: number; experiments: { id: string; question: string; variants: Record<string, Record<string, unknown>> }[] }
  state: { decided: Record<string, string>; active: string | null; results?: Record<string, Record<string, ExpVariantRow>>; log: { when: string; experiment: string; winner: string; reason: string }[] }
}
type Data = {
  generated: string
  channel: { title: string; subscribers: number; views: number; videos: number; daily: Day[] }
  packs: Record<string, { display_name: string; noun: string }>
  videos: Video[]
  ledger: { episodes: Episode[]; used: Record<string, Record<string, number>> }
  comments?: Comment[]
  experiments?: Experiments
}

// Categorical palette (dark-surface steps; identity is also carried by labels, never color alone).
const PACK_COLORS: Record<string, string> = { pokemon: '#3987e5', birds: '#199e70', games: '#d95926', music: '#c98500' }
const INK = '#f0efec', INK2 = '#c3c2b7', INK3 = '#8a897f', GRID = '#2a2a2e'

const fmtInt = (n: number) => n.toLocaleString('en-US')
const fmtSecs = (s: number | null) => (s == null ? '—' : s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${Math.round(s)}s`)
const fmtPct = (p: number | null) => (p == null ? '—' : `${Math.round(p)}%`)
const mean = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }
const ago = (iso: string) => { const h = (Date.now() - new Date(iso).getTime()) / 3.6e6; return h < 1 ? 'just now' : h < 48 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} d ago` }

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fmt, setFmt] = useState<'all' | 'short' | 'long'>('all')
  const [sort, setSort] = useState<'published' | 'views' | 'avp'>('published')

  useEffect(() => {
    fetch('/api/quizbot', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then(setData)
      .catch((e) => setErr(String(e)))
  }, [])

  const videos = useMemo(() => (data?.videos ?? []).filter((v) => v.privacy === 'public' && (fmt === 'all' || v.format === fmt)), [data, fmt])

  if (err) return <Shell><p className="text-sm" style={{ color: INK2 }}>No data yet ({err}). The nightly export hasn’t landed.</p></Shell>
  if (!data) return <Shell><p className="text-sm" style={{ color: INK2 }}>Loading…</p></Shell>

  const packs = Object.keys(data.packs)
  const stuck = data.ledger.episodes.filter((e) => e.status === 'rendered')
  const failed = data.ledger.episodes.filter((e) => e.status === 'failed')
  const sorted = [...videos].sort((a, b) => sort === 'views' ? b.views - a.views : sort === 'avp' ? (b.avp ?? -1) - (a.avp ?? -1) : b.published.localeCompare(a.published))

  return (
    <Shell>
      {/* ---- headline -------------------------------------------------------------------- */}
      <header className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: '#57f1ff' }}>Play It By Ear</p>
        <h1 className="text-3xl font-semibold" style={{ color: INK }}>{data.channel.title} — dashboard</h1>
        <p className="text-sm mt-1" style={{ color: INK3 }}>Updated {ago(data.generated)} · YouTube Analytics + pipeline ledger · read-only</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat label="Subscribers" value={fmtInt(data.channel.subscribers)} />
        <Stat label="Total views" value={fmtInt(data.channel.views)} />
        <Stat label="Public videos" value={fmtInt(data.videos.filter((v) => v.privacy === 'public').length)} />
        <Stat label="Views, last 7 days" value={fmtInt(data.channel.daily.slice(-7).reduce((a, d) => a + d.views, 0))} />
      </section>

      {/* ---- daily views ----------------------------------------------------------------- */}
      <Card title="Daily views" sub="Channel-wide, all formats">
        <DailyChart days={data.channel.daily.slice(-42)} />
      </Card>

      {/* ---- packs --------------------------------------------------------------------- */}
      <Card title="Packs × formats" sub="Views per video and retention, so series can be compared on equal footing">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: INK3 }} className="text-left">
              <th className="py-2 font-medium">Pack</th><th className="font-medium">Format</th>
              <th className="font-medium text-right">Videos</th><th className="font-medium text-right">Views</th>
              <th className="font-medium text-right">Views / video</th><th className="font-medium text-right">Avg % viewed</th>
              <th className="font-medium text-right">Avg view time</th><th className="font-medium text-right">Likes / 1k</th>
            </tr>
          </thead>
          <tbody>
            {packs.flatMap((p) => (['short', 'long'] as const).map((f) => {
              const vs = data.videos.filter((v) => v.pack === p && v.format === f && v.privacy === 'public')
              if (!vs.length) return null
              const views = vs.reduce((a, v) => a + v.views, 0)
              return (
                <tr key={p + f} className="border-t" style={{ borderColor: GRID, color: INK }}>
                  <td className="py-2"><Swatch color={PACK_COLORS[p] ?? INK3} />{data.packs[p].display_name}</td>
                  <td style={{ color: INK2 }}>{f === 'short' ? 'Shorts' : 'Long form'}</td>
                  <td className="text-right">{vs.length}</td>
                  <td className="text-right">{fmtInt(views)}</td>
                  <td className="text-right">{fmtInt(Math.round(views / vs.length))}</td>
                  <td className="text-right">{fmtPct(mean(vs.map((v) => v.avp)))}</td>
                  <td className="text-right">{fmtSecs(mean(vs.map((v) => v.avd)))}</td>
                  <td className="text-right">{views ? (1000 * vs.reduce((a, v) => a + v.likes, 0) / views).toFixed(1) : '—'}</td>
                </tr>
              )
            }))}
          </tbody>
        </table>
      </Card>

      {/* ---- experiments ------------------------------------------------------------------ */}
      <Card title="Shorts experiments" sub={`One at a time; variants alternate per Short. Judged on average % viewed at ≥${data.experiments?.config.min_n ?? 4} per side (needs a ≥${Math.round((data.experiments?.config.min_lead ?? 0.1) * 100)}% lead, else runs to ${data.experiments?.config.max_n ?? 8}). Winners become the baseline.`}>
        {data.experiments ? (
          <div className="grid md:grid-cols-2 gap-6">
            {data.experiments.config.experiments.map((ex) => {
              const decided = data.experiments!.state.decided[ex.id]
              const active = !decided && data.experiments!.config.experiments.find((e) => !data.experiments!.state.decided[e.id])?.id === ex.id
              const rows = data.experiments!.state.results?.[ex.id] ?? {}
              const status = decided ? `decided: ${decided}` : active ? 'running' : 'queued'
              return (
                <div key={ex.id} className="rounded-md border p-4" style={{ borderColor: GRID, opacity: decided || active ? 1 : 0.6 }}>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="font-medium" style={{ color: INK }}>{ex.question}</p>
                    <span className="text-xs ml-3 whitespace-nowrap" style={{ color: decided ? '#199e70' : active ? '#c98500' : INK3 }}>{status}</span>
                  </div>
                  <table className="w-full text-xs mt-2">
                    <thead><tr style={{ color: INK3 }} className="text-left"><th className="font-medium">Variant</th><th className="font-medium text-right">n</th><th className="font-medium text-right">% viewed</th><th className="font-medium text-right">Views / video</th></tr></thead>
                    <tbody>
                      {Object.keys(ex.variants).map((name, i) => {
                        const r = rows[name]
                        return (
                          <tr key={name} className="border-t" style={{ borderColor: GRID, color: INK }}>
                            <td className="py-1"><Swatch color={i === 0 ? '#9085e9' : '#d55181'} />{name}{decided === name ? ' ✓' : ''}</td>
                            <td className="text-right">{r?.n ?? 0}</td>
                            <td className="text-right">{r?.avp != null ? `${Math.round(r.avp)}%` : '—'}</td>
                            <td className="text-right">{r?.views != null ? fmtInt(Math.round(r.views)) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {decided && <p className="text-xs mt-2" style={{ color: INK3 }}>{data.experiments!.state.log.find((l) => l.experiment === ex.id)?.reason}</p>}
                </div>
              )
            })}
          </div>
        ) : <p className="text-sm" style={{ color: INK2 }}>No experiment data in this export yet.</p>}
      </Card>

      {/* ---- comments --------------------------------------------------------------------- */}
      <Card title="Recent comments" sub="Top comments on the newest videos — the qualitative side of the numbers">
        {data.comments?.length ? (
          <ul className="space-y-3 text-sm">
            {data.comments.slice(0, 30).map((c, i) => (
              <li key={i} className="border-t pt-3" style={{ borderColor: GRID }}>
                <p style={{ color: INK }}>{c.text}</p>
                <p className="text-xs mt-1" style={{ color: INK3 }}>{c.author} · {c.likes} likes · <a href={`https://youtu.be/${c.video}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.title}</a> · {ago(c.at)}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm" style={{ color: INK2 }}>No comments yet.</p>}
      </Card>

      {/* ---- videos ---------------------------------------------------------------------- */}
      <Card title="Videos" sub="Public videos; click a title to open it" right={
        <div className="flex gap-2 text-xs">
          <Seg value={fmt} onChange={(v) => setFmt(v as typeof fmt)} options={[['all', 'All'], ['short', 'Shorts'], ['long', 'Long']]} />
          <Seg value={sort} onChange={(v) => setSort(v as typeof sort)} options={[['published', 'Newest'], ['views', 'Views'], ['avp', '% viewed']]} />
        </div>}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: INK3 }} className="text-left">
              <th className="py-2 font-medium">Title</th><th className="font-medium">Pack</th><th className="font-medium">Open</th>
              <th className="font-medium text-right">Views</th><th className="font-medium text-right">% viewed</th>
              <th className="font-medium text-right">View time</th><th className="font-medium text-right">Likes</th><th className="font-medium text-right">Age</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 60).map((v) => (
              <tr key={v.id} className="border-t" style={{ borderColor: GRID, color: INK }}>
                <td className="py-2 pr-3 max-w-[28rem] truncate">
                  <a href={`https://youtu.be/${v.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{v.title}</a>
                </td>
                <td><Swatch color={PACK_COLORS[v.pack] ?? INK3} /><span style={{ color: INK2 }}>{data.packs[v.pack]?.display_name ?? v.pack}</span></td>
                <td style={{ color: INK2 }}>{v.format === 'long' ? 'long' : v.variant === 'coldopen' ? 'cold' : v.variant === 'announce' ? 'announce' : '—'}</td>
                <td className="text-right">{fmtInt(v.views)}</td>
                <td className="text-right">{fmtPct(v.avp)}</td>
                <td className="text-right">{fmtSecs(v.avd)}</td>
                <td className="text-right">{fmtInt(v.likes)}</td>
                <td className="text-right" style={{ color: INK3 }}>{ago(v.published)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ---- pipeline -------------------------------------------------------------------- */}
      <Card title="Pipeline" sub="From the render ledger. 'Stuck' = rendered but not uploaded (retried on the next run).">
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <p style={{ color: INK3 }} className="mb-2">No-repeat ledger (items used)</p>
            {packs.map((p) => (
              <p key={p} style={{ color: INK }}><Swatch color={PACK_COLORS[p] ?? INK3} />{data.packs[p].display_name}: shorts {data.ledger.used[p]?.short ?? 0} · long {data.ledger.used[p]?.long ?? 0}</p>
            ))}
          </div>
          <div>
            <p style={{ color: INK3 }} className="mb-2">Stuck uploads</p>
            {stuck.length ? stuck.map((e) => <p key={e.slug} style={{ color: INK }}>{e.slug}</p>) : <p style={{ color: INK2 }}>none</p>}
          </div>
          <div>
            <p style={{ color: INK3 }} className="mb-2">Failed renders (last 400 episodes)</p>
            {failed.length ? failed.slice(0, 8).map((e) => <p key={e.slug} style={{ color: INK }}>{e.slug}</p>) : <p style={{ color: INK2 }}>none</p>}
          </div>
        </div>
      </Card>
    </Shell>
  )
}

// ---- pieces ------------------------------------------------------------------------------------
function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen text-white"><div className="max-w-6xl mx-auto px-6 py-12">{children}</div></main>
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: GRID }}>
      <p className="text-xs uppercase tracking-wider" style={{ color: INK3 }}>{label}</p>
      <p className="text-2xl font-semibold mt-1" style={{ color: INK }}>{value}</p>
    </div>
  )
}

function Card({ title, sub, right, children }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-5 mb-6 overflow-x-auto" style={{ borderColor: GRID }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: INK }}>{title}</h2>
          {sub && <p className="text-xs mt-0.5" style={{ color: INK3 }}>{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Swatch({ color }: { color: string }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle" style={{ background: color }} />
}

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="inline-flex rounded-md border overflow-hidden" style={{ borderColor: GRID }}>
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className="px-2.5 py-1"
          style={{ background: v === value ? '#2a2a2e' : 'transparent', color: v === value ? INK : INK2 }}>{label}</button>
      ))}
    </div>
  )
}

function DailyChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (!days.length) return <p className="text-sm" style={{ color: INK2 }}>No daily data yet.</p>
  const W = 900, H = 200, L = 44, R = 12, T = 12, B = 28
  const max = Math.max(1, ...days.map((d) => d.views))
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, days.length - 1)
  const y = (v: number) => T + (H - T - B) * (1 - v / max)
  const path = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.views).toFixed(1)}`).join(' ')
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f))
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Daily channel views"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          setHover(Math.max(0, Math.min(days.length - 1, Math.round(((px - L) / (W - L - R)) * (days.length - 1)))))
        }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={L - 6} y={y(t) + 4} fontSize={11} textAnchor="end" fill={INK3}>{fmtInt(t)}</text>
          </g>
        ))}
        {days.map((d, i) => (i % Math.ceil(days.length / 7) === 0 || i === days.length - 1) && (
          <text key={d.day} x={x(i)} y={H - 8} fontSize={11} textAnchor="middle" fill={INK3}>{d.day.slice(5)}</text>
        ))}
        <path d={path} fill="none" stroke="#3987e5" strokeWidth={2} strokeLinejoin="round" />
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke={INK3} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(days[hover].views)} r={4} fill="#3987e5" stroke="#1a1a19" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="absolute top-2 right-3 text-xs rounded border px-2 py-1" style={{ borderColor: GRID, background: '#1a1a19', color: INK }}>
          {days[hover].day}: {fmtInt(days[hover].views)} views · {fmtInt(Math.round(days[hover].estimatedMinutesWatched))} min · +{days[hover].subscribersGained} subs
        </div>
      )}
    </div>
  )
}

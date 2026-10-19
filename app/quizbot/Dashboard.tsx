'use client'

import { useEffect, useMemo, useState } from 'react'

// ---- data shape (written by quizbot/scripts/analytics_export.py) ----------------------------------
type Video = {
  id: string; title: string; published: string; pack: string; format: 'short' | 'long'
  variant: 'coldopen' | 'announce' | null; theme: string; duration: number; privacy: string
  views: number; likes: number; comments: number; avd: number | null; avp: number | null
  minutes: number | null; subs: number | null; tags?: string[]
  platforms?: Record<string, Record<string, number | string | undefined>>
}
type PlatformSummary = { handle?: string | null; followers?: number | null; posts?: number; views?: number; reach?: number; likes?: number; comments?: number; shares?: number; saves?: number }
type Audience = { countries?: Record<string, number | string>[]; ages?: Record<string, number | string>[]; traffic?: Record<string, number | string>[]; devices?: Record<string, number | string>[] }
type Ypp = { subscribers: number; subscribers_needed: number; watch_hours_365d: number; watch_hours_needed: number; shorts_views_90d: number; shorts_views_needed: number }
type Budget = { elevenlabs?: { tier?: string; used?: number; limit?: number; resets?: string | null; error?: string } }
type Day = { day: string; views: number; estimatedMinutesWatched: number; subscribersGained: number; subscribersLost: number }
type Episode = { slug: string; pack: string; title: string; theme: string; status: string; youtube_id: string | null; created_at: number }
type Comment = { video: string; title: string; author: string; text: string; likes: number; at: string }
type ExpVariantRow = { n: number; avp: number | null; views: number | null }
type Experiments = {
  config: { min_n: number; max_n: number; min_lead: number; experiments: { id: string; question: string; parallel?: boolean; min_n?: number; max_n?: number; min_lead?: number; variants: Record<string, Record<string, unknown>> }[] }
  state: { decided: Record<string, string>; active: string | null; results?: Record<string, Record<string, ExpVariantRow>>; log: { when: string; experiment: string; winner: string; reason: string }[] }
}
const VARIANT_COLORS = ['#9085e9', '#d55181', '#199e70', '#c98500', '#3987e5', '#d95926']
type Data = {
  generated: string
  channel: { title: string; subscribers: number; views: number; videos: number; daily: Day[] }
  packs: Record<string, { display_name: string; noun: string }>
  videos: Video[]
  ledger: { episodes: Episode[]; used: Record<string, Record<string, number>> }
  comments?: Comment[]
  experiments?: Experiments
  platform_summary?: Record<string, PlatformSummary>
  audience?: Audience
  ypp?: Ypp
  budget?: Budget
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
  const kpi = (() => {
    const d = data.channel.daily, last = d.slice(-7), prior = d.slice(-14, -7)
    const sum = (xs: Day[], k: keyof Day) => xs.reduce((a, x) => a + Number(x[k]), 0)
    const views7 = sum(last, 'views'), viewsPrior = sum(prior, 'views')
    const cut = (days: number) => new Date(Date.now() - days * 864e5).toISOString()
    const shorts = data.videos.filter((v) => v.format === 'short' && v.privacy === 'public')
    const avp7 = mean(shorts.filter((v) => v.published >= cut(7)).map((v) => v.avp))
    const avpPrior = mean(shorts.filter((v) => v.published < cut(7) && v.published >= cut(14)).map((v) => v.avp))
    return {
      views7, viewsDelta: prior.length && viewsPrior ? (100 * (views7 - viewsPrior)) / viewsPrior : null,
      subsDelta: last.length ? sum(last, 'subscribersGained') - sum(last, 'subscribersLost') : null,
      avp7, avpDelta: avp7 != null && avpPrior != null ? avp7 - avpPrior : null,
      videos7: data.videos.filter((v) => v.privacy === 'public' && v.published >= cut(7)).length,
    }
  })()
  const sorted = [...videos].sort((a, b) => sort === 'views' ? b.views - a.views : sort === 'avp' ? (b.avp ?? -1) - (a.avp ?? -1) : b.published.localeCompare(a.published))

  return (
    <Shell>
      {/* ---- headline -------------------------------------------------------------------- */}
      <header className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: '#57f1ff' }}>Play It By Ear</p>
        <h1 className="text-3xl font-semibold" style={{ color: INK }}>{data.channel.title} — dashboard</h1>
        <p className="text-sm mt-1" style={{ color: INK3 }}>Updated {ago(data.generated)} · YouTube Analytics + pipeline ledger · read-only</p>
      </header>

      <nav className="sticky top-0 z-10 -mx-6 px-6 py-2 mb-8 flex gap-4 text-xs overflow-x-auto" style={{ background: 'rgba(26,26,25,0.92)', backdropFilter: 'blur(6px)', borderBottom: `1px solid ${GRID}` }}>
        {[['overview', 'Overview'], ['growth', 'Growth'], ['content', 'Content'], ['experiments', 'Experiments'], ['viewers', 'Viewers'], ['operations', 'Operations']].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="whitespace-nowrap hover:underline" style={{ color: INK2 }}>{label}</a>
        ))}
      </nav>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Subscribers" value={fmtInt(data.channel.subscribers)} delta={kpi.subsDelta} deltaLabel="last 7 d" />
        <Stat label="Views, last 7 days" value={fmtInt(kpi.views7)} delta={kpi.viewsDelta} deltaLabel="vs prior 7 d" pct />
        <Stat label="Shorts % viewed, last 7 d" value={kpi.avp7 == null ? '—' : `${Math.round(kpi.avp7)}%`} delta={kpi.avpDelta} deltaLabel="vs prior 7 d" pts />
        <Stat label="Public videos" value={fmtInt(data.videos.filter((v) => v.privacy === 'public').length)} delta={kpi.videos7} deltaLabel="last 7 d" />
      </section>

      <SectionHead id="overview" title="Overview" sub="How the channel is doing this week" />
      {/* ---- daily views ----------------------------------------------------------------- */}
      <Card title="Daily views" sub="Channel-wide, all formats">
        <DailyChart days={data.channel.daily.slice(-42)} />
      </Card>

      {/* ---- monetisation progress -------------------------------------------------------- */}
      {data.ypp && (
        <Card title="Road to monetisation" sub="YouTube Partner Program: 1,000 subscribers plus either 4,000 long-form watch hours (365 d) or 10M Shorts views (90 d). Shorts watch time does not count toward the hours.">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <Bar label="Subscribers" value={data.ypp.subscribers} target={data.ypp.subscribers_needed} />
            <Bar label="Long-form watch hours, 365 d" value={data.ypp.watch_hours_365d} target={data.ypp.watch_hours_needed} />
            <Bar label="Shorts views, 90 d" value={data.ypp.shorts_views_90d} target={data.ypp.shorts_views_needed} />
          </div>
        </Card>
      )}

      <SectionHead id="growth" title="Growth" sub="Where viewers come from, on every platform" />
      {/* ---- platforms --------------------------------------------------------------------- */}
      <Card title="Platforms" sub="The same Shorts, cross-posted. YouTube is the source; Instagram and Facebook figures come from the Meta Graph API per post. TikTok joins when its posting API is approved.">
        {data.platform_summary ? (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: INK3 }} className="text-left">
                <th className="py-2 font-medium">Platform</th><th className="font-medium">Account</th>
                <th className="font-medium text-right">Followers</th><th className="font-medium text-right">Posts</th>
                <th className="font-medium text-right">Views</th><th className="font-medium text-right">Views / post</th>
                <th className="font-medium text-right">Reach</th><th className="font-medium text-right">Likes</th><th className="font-medium text-right">Comments</th>
              </tr>
            </thead>
            <tbody>
              {(['youtube', 'instagram', 'facebook', 'tiktok'] as const).map((p) => {
                const s = data.platform_summary![p]
                return (
                  <tr key={p} className="border-t" style={{ borderColor: GRID, color: s ? INK : INK3 }}>
                    <td className="py-2 capitalize">{p}</td>
                    <td style={{ color: INK2 }}>{s?.handle ?? (p === 'tiktok' ? 'not connected yet' : '—')}</td>
                    <td className="text-right">{s?.followers != null ? fmtInt(s.followers) : '—'}</td>
                    <td className="text-right">{s?.posts != null ? fmtInt(s.posts) : '—'}</td>
                    <td className="text-right">{s?.views != null ? fmtInt(s.views) : '—'}</td>
                    <td className="text-right">{s?.views != null && s.posts ? fmtInt(Math.round(s.views / s.posts)) : '—'}</td>
                    <td className="text-right">{s?.reach != null ? fmtInt(s.reach) : '—'}</td>
                    <td className="text-right">{s?.likes != null ? fmtInt(s.likes) : '—'}</td>
                    <td className="text-right">{s?.comments != null ? fmtInt(s.comments) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : <p className="text-sm" style={{ color: INK2 }}>No platform data in this export yet.</p>}
      </Card>

      {/* ---- audience ---------------------------------------------------------------------- */}
      {data.audience && (
        <Card title="Audience" sub="Where views come from (YouTube Analytics, since launch). Traffic source tells whether the Shorts feed is picking videos up.">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <Ranked title="Traffic sources" rows={(data.audience.traffic ?? []).map((r) => [String(r.insightTrafficSourceType).toLowerCase().replace(/_/g, ' '), Number(r.views)])} />
            <Ranked title="Countries" rows={(data.audience.countries ?? []).map((r) => [String(r.country), Number(r.views)])} />
            <Ranked title="Age × gender (% of viewers)" rows={(data.audience.ages ?? []).map((r) => [`${String(r.ageGroup).replace('age', '')} ${String(r.gender).toLowerCase()}`, Number(r.viewerPercentage)])} pct />
          </div>
        </Card>
      )}

      <SectionHead id="content" title="Content" sub="Which series and videos hold attention" />
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

      {/* ---- videos ---------------------------------------------------------------------- */}
      <Card title="Videos" sub="Public videos; click a title to open it" right={
        <div className="flex gap-2 text-xs">
          <Seg value={fmt} onChange={(v) => setFmt(v as typeof fmt)} options={[['all', 'All'], ['short', 'Shorts'], ['long', 'Long']]} />
          <Seg value={sort} onChange={(v) => setSort(v as typeof sort)} options={[['published', 'Newest'], ['views', 'Views'], ['avp', '% viewed']]} />
        </div>}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: INK3 }} className="text-left">
              <th className="py-2 font-medium">Title</th><th className="font-medium">Pack</th><th className="font-medium">Test arms</th>
              <th className="font-medium text-right">Views</th><th className="font-medium text-right">% viewed</th>
              <th className="font-medium text-right">View time</th><th className="font-medium text-right">Likes</th>
              <th className="font-medium text-right">IG</th><th className="font-medium text-right">FB</th><th className="font-medium text-right">Age</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 60).map((v) => (
              <tr key={v.id} className="border-t" style={{ borderColor: GRID, color: INK }}>
                <td className="py-2 pr-3 max-w-[28rem] truncate">
                  <a href={`https://youtu.be/${v.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{v.title}</a>
                </td>
                <td><Swatch color={PACK_COLORS[v.pack] ?? INK3} /><span style={{ color: INK2 }}>{data.packs[v.pack]?.display_name ?? v.pack}</span></td>
                <td className="text-xs" style={{ color: INK2 }}>{v.format === 'long' ? 'long' : (v.tags?.length ? v.tags.map((t) => t.replace('exp:', '')).join(' · ') : v.variant === 'coldopen' ? 'open=cold' : v.variant === 'announce' ? 'open=announce' : '—')}</td>
                <td className="text-right">{fmtInt(v.views)}</td>
                <td className="text-right">{fmtPct(v.avp)}</td>
                <td className="text-right">{fmtSecs(v.avd)}</td>
                <td className="text-right">{fmtInt(v.likes)}</td>
                <td className="text-right" style={{ color: INK2 }}>{num(v.platforms?.instagram?.views)}</td>
                <td className="text-right" style={{ color: INK2 }}>{num(v.platforms?.facebook?.blue_reels_play_count ?? v.platforms?.facebook?.total_video_views)}</td>
                <td className="text-right" style={{ color: INK3 }}>{ago(v.published)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SectionHead id="experiments" title="Experiments" sub="Automated A/B tests on Shorts, judged nightly" />
      {/* ---- experiments ------------------------------------------------------------------ */}
      <Card title="Shorts experiments" sub={`Sequential tests run one at a time, variants alternating per Short; a parallel test (voice) runs alongside, balanced against it. Judged nightly on average % viewed: at ≥${data.experiments?.config.min_n ?? 4} per side a ≥${Math.round((data.experiments?.config.min_lead ?? 0.1) * 100)}% lead decides it, else it runs to ${data.experiments?.config.max_n ?? 8} per side and the leader wins. Winners become the baseline for everything after.`}>
        {data.experiments ? (<>
          {data.budget?.elevenlabs && (
            <p className="text-xs mb-4" style={{ color: INK3 }}>
              ElevenLabs credits ({data.budget.elevenlabs.tier ?? '?'} tier): {data.budget.elevenlabs.error ? data.budget.elevenlabs.error
                : `${fmtInt(data.budget.elevenlabs.used ?? 0)} / ${fmtInt(data.budget.elevenlabs.limit ?? 0)} used${data.budget.elevenlabs.resets ? `, resets ${data.budget.elevenlabs.resets}` : ''}`}
              {' '}— when they run out the Short finishes on OpenAI and is tagged <code>fallback</code>, so it never pollutes the test.
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {data.experiments.config.experiments.map((ex) => {
              const st = data.experiments!.state
              const cfg = data.experiments!.config
              const decided = st.decided[ex.id]
              const firstSequential = cfg.experiments.find((e) => !e.parallel && !st.decided[e.id])?.id
              const active = !decided && (ex.parallel || ex.id === firstSequential)
              const rows = st.results?.[ex.id] ?? {}
              const status = decided ? `decided: ${decided}` : active ? (ex.parallel ? 'running (parallel)' : 'running') : 'queued'
              const minN = ex.min_n ?? cfg.min_n, maxN = ex.max_n ?? cfg.max_n, lead = ex.min_lead ?? cfg.min_lead
              return (
                <div key={ex.id} className="rounded-md border p-4" style={{ borderColor: GRID, opacity: decided || active ? 1 : 0.6 }}>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="font-medium" style={{ color: INK }}>{ex.question}</p>
                    <span className="text-xs ml-3 whitespace-nowrap" style={{ color: decided ? '#199e70' : active ? '#c98500' : INK3 }}>{status}</span>
                  </div>
                  <p className="text-xs" style={{ color: INK3 }}>decides at ≥{minN} per side with a ≥{Math.round(lead * 100)}% lead, or at {maxN} per side</p>
                  <table className="w-full text-xs mt-2">
                    <thead><tr style={{ color: INK3 }} className="text-left"><th className="font-medium">Variant</th><th className="font-medium text-right">n</th><th className="font-medium text-right">% viewed</th><th className="font-medium text-right">Views / video</th></tr></thead>
                    <tbody>
                      {Object.keys(ex.variants).map((name, i) => {
                        const r = rows[name]
                        return (
                          <tr key={name} className="border-t" style={{ borderColor: GRID, color: INK }}>
                            <td className="py-1"><Swatch color={VARIANT_COLORS[i % VARIANT_COLORS.length]} />{name}{decided === name ? ' ✓' : ''}</td>
                            <td className="text-right">{r?.n ?? 0}</td>
                            <td className="text-right">{r?.avp != null ? `${Math.round(r.avp)}%` : '—'}</td>
                            <td className="text-right">{r?.views != null ? fmtInt(Math.round(r.views)) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {decided && <p className="text-xs mt-2" style={{ color: INK3 }}>{st.log.find((l) => l.experiment === ex.id)?.reason}</p>}
                </div>
              )
            })}
          </div>
          <div className="mt-6">
            <p className="text-xs mb-2" style={{ color: INK3 }}>Decision log</p>
            {data.experiments.state.log.length ? (
              <ul className="text-sm space-y-1">
                {[...data.experiments.state.log].reverse().map((l, i) => (
                  <li key={i} style={{ color: INK }}><span style={{ color: INK3 }}>{l.when}</span> · {l.experiment} → <strong>{l.winner}</strong> <span style={{ color: INK2 }}>({l.reason})</span></li>
                ))}
              </ul>
            ) : <p className="text-sm" style={{ color: INK2 }}>Nothing decided yet.</p>}
          </div>
        </>) : <p className="text-sm" style={{ color: INK2 }}>No experiment data in this export yet.</p>}
      </Card>

      <SectionHead id="viewers" title="Viewers" sub="What people say in the comments" />
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

      <SectionHead id="operations" title="Operations" sub="Pipeline health from the render ledger" />
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
  return <main className="min-h-screen text-white tabular-nums"><div className="max-w-6xl mx-auto px-6 py-12">{children}</div></main>
}

function Stat({ label, value, delta, deltaLabel, pct, pts }: { label: string; value: string; delta?: number | null; deltaLabel?: string; pct?: boolean; pts?: boolean }) {
  const up = delta != null && delta > 0, down = delta != null && delta < 0
  const text = delta == null ? null : `${up ? '+' : ''}${pct ? `${Math.round(delta)}%` : pts ? `${delta.toFixed(1)} pts` : fmtInt(Math.round(delta))}`
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: GRID }}>
      <p className="text-xs uppercase tracking-wider" style={{ color: INK3 }}>{label}</p>
      <p className="text-2xl font-semibold mt-1" style={{ color: INK }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: up ? '#4cc38a' : down ? '#e5484d' : INK3 }}>{text ?? '—'}{deltaLabel && text ? ` ${deltaLabel}` : ''}</p>
    </div>
  )
}

function SectionHead({ id, title, sub }: { id: string; title: string; sub: string }) {
  return (
    <div id={id} className="mt-12 mb-4 scroll-mt-14">
      <h2 className="text-lg font-semibold" style={{ color: INK }}>{title}</h2>
      <p className="text-xs" style={{ color: INK3 }}>{sub}</p>
    </div>
  )
}

function Card({ title, sub, right, children }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-5 mb-6 overflow-x-auto [&_tbody_tr:nth-child(even)]:bg-white/[0.025] [&_th]:whitespace-nowrap" style={{ borderColor: GRID }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: INK }}>{title}</h3>
          {sub && <p className="text-xs mt-0.5" style={{ color: INK3 }}>{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

const num = (x: unknown) => (typeof x === 'number' ? fmtInt(x) : '—')

function Bar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min(100, (100 * value) / target)
  return (
    <div>
      <div className="flex justify-between mb-1"><span style={{ color: INK2 }}>{label}</span><span style={{ color: INK }}>{fmtInt(Math.round(value))} / {fmtInt(target)}</span></div>
      <div className="h-2 rounded" style={{ background: GRID }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 rounded" style={{ width: `${Math.max(pct, value > 0 ? 1 : 0)}%`, background: pct >= 100 ? '#199e70' : '#3987e5' }} />
      </div>
      <p className="text-xs mt-1" style={{ color: INK3 }}>{pct >= 100 ? 'reached' : `${pct < 1 ? pct.toFixed(2) : Math.round(pct)}%`}</p>
    </div>
  )
}

function Ranked({ title, rows, pct }: { title: string; rows: [string, number][]; pct?: boolean }) {
  const top = rows.filter(([, v]) => v > 0).slice(0, 8)
  const max = Math.max(1, ...top.map(([, v]) => v))
  return (
    <div>
      <p style={{ color: INK3 }} className="mb-2">{title}</p>
      {top.length ? top.map(([k, v]) => (
        <div key={k} className="mb-1.5">
          <div className="flex justify-between text-xs"><span style={{ color: INK }}>{k}</span><span style={{ color: INK2 }}>{pct ? `${v.toFixed(1)}%` : fmtInt(v)}</span></div>
          <div className="h-1 rounded mt-0.5" style={{ background: GRID }}><div className="h-1 rounded" style={{ width: `${(100 * v) / max}%`, background: '#3987e5' }} /></div>
        </div>
      )) : <p className="text-xs" style={{ color: INK2 }}>no data yet</p>}
    </div>
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

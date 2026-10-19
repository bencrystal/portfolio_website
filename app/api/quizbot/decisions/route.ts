import { NextResponse } from 'next/server'

// Executive decisions for the quizbot channel: pull requests labelled `decision` on the private quizbot repo.
// Password-gated so the metrics page can be shared while only Ben approves format changes.
// Env (Vercel): QUIZBOT_ADMIN_PASSWORD, QUIZBOT_GH_TOKEN (fine-grained token on bencrystal/quizbot with
// Pull requests: read & write, Contents: read, Issues: read & write). Without the token, the panel lists nothing.
const REPO = 'bencrystal/quizbot'
const API = `https://api.github.com/repos/${REPO}`

export const dynamic = 'force-dynamic'

type Body = { password?: string; action?: 'list' | 'merge' | 'close' | 'image'; number?: number; note?: string; path?: string; ref?: string }

function gh(path: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${process.env.QUIZBOT_GH_TOKEN}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  })
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Body
  const want = process.env.QUIZBOT_ADMIN_PASSWORD
  if (!want) return NextResponse.json({ error: 'decisions not configured (QUIZBOT_ADMIN_PASSWORD unset)' }, { status: 503 })
  if (!b.password || b.password !== want) return NextResponse.json({ error: 'wrong password' }, { status: 401 })
  if (!process.env.QUIZBOT_GH_TOKEN) return NextResponse.json({ error: 'QUIZBOT_GH_TOKEN unset on Vercel' }, { status: 503 })

  if (b.action === 'image' && b.path && b.ref) {
    // contact sheets committed on the PR branch under docs/decisions/<slug>/; served as a data URL
    const r = await gh(`/contents/${b.path}?ref=${encodeURIComponent(b.ref)}`, { headers: { accept: 'application/vnd.github.raw+json' } })
    if (!r.ok) return NextResponse.json({ error: `image ${r.status}` }, { status: 502 })
    const buf = Buffer.from(await r.arrayBuffer())
    return NextResponse.json({ dataUrl: `data:image/png;base64,${buf.toString('base64')}` })
  }
  if (b.action === 'merge' && b.number) {
    if (b.note) await gh(`/issues/${b.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `Approved from the dashboard. ${b.note}` }) })
    const r = await gh(`/pulls/${b.number}/merge`, { method: 'PUT', body: JSON.stringify({ merge_method: 'squash' }) })
    return NextResponse.json(await r.json(), { status: r.ok ? 200 : 502 })
  }
  if (b.action === 'close' && b.number) {
    await gh(`/issues/${b.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `Declined from the dashboard. ${b.note ?? ''}`.trim() }) })
    const r = await gh(`/pulls/${b.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed' }) })
    return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 502 })
  }
  // list: open PRs with the `decision` label (issues endpoint is the one that filters by label), plus decided ones
  const [open, closed] = await Promise.all([
    gh(`/issues?state=open&labels=decision&per_page=20`).then((r) => r.json()),
    gh(`/issues?state=closed&labels=decision&per_page=10&sort=updated`).then((r) => r.json()),
  ])
  const shape = async (i: Record<string, any>, state: 'open' | 'closed') => {
    const pr = i.pull_request ? await gh(`/pulls/${i.number}`).then((r) => r.json()) : null
    const body: string = i.body ?? ''
    const images = body.match(/docs\/decisions\/[\w./-]+\.png/g) ?? []
    return { number: i.number, title: i.title, url: i.html_url, created: i.created_at, state,
             merged: !!pr?.merged_at, ref: pr?.head?.ref ?? null, body: body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim(), images: Array.from(new Set(images)) }
  }
  const items = [...(await Promise.all((Array.isArray(open) ? open : []).map((i) => shape(i, 'open')))),
                 ...(await Promise.all((Array.isArray(closed) ? closed : []).map((i) => shape(i, 'closed'))))]
  return NextResponse.json({ items })
}

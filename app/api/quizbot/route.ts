import { NextResponse } from 'next/server'

// The quizbot pipeline pushes its nightly analytics JSON to the `quizbot-data` branch of this repo
// (never main), so the dashboard reads it from there at request time — no redeploy, no commit noise.
const SOURCE = 'https://raw.githubusercontent.com/bencrystal/portfolio_website/quizbot-data/data.json'

export const dynamic = 'force-dynamic'

export async function GET() {
  const r = await fetch(SOURCE, { cache: 'no-store' })
  if (!r.ok) return NextResponse.json({ error: `upstream ${r.status}` }, { status: 502 })
  const body = await r.text()
  return new NextResponse(body, {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' },
  })
}

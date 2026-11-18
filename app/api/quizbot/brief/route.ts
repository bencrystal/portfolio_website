import { NextResponse } from 'next/server'

// The daily brief (written each morning by a Claude scheduled task) lives next to data.json on the
// `quizbot-data` branch. 404 upstream → empty brief, never an error page.
const SOURCE = 'https://raw.githubusercontent.com/bencrystal/portfolio_website/quizbot-data/brief.json'

export const dynamic = 'force-dynamic'

export async function GET() {
  const r = await fetch(SOURCE, { cache: 'no-store' })
  if (!r.ok) return NextResponse.json(null, { headers: { 'cache-control': 'no-store' } })
  const body = await r.text()
  return new NextResponse(body, {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' },
  })
}

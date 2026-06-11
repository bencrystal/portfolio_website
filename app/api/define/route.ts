import { NextResponse } from 'next/server'
import { fetchMW } from '@/lib/define/mw'
import { fetchUD } from '@/lib/define/ud'
import { sendRateLimitAlert } from '@/lib/define/alert'
import type { DefineResponse } from '@/lib/define/types'

export const runtime = 'edge'
export const revalidate = 86400

const WORD_RE = /^[a-z][a-z0-9-]{0,49}$/

export async function GET(req: Request) {
  const url = new URL(req.url)
  const raw = url.searchParams.get('w') ?? ''
  const word = raw.trim().toLowerCase()

  if (!word || !WORD_RE.test(word)) {
    return NextResponse.json(
      { error: 'invalid word' },
      { status: 400 }
    )
  }

  const [formal, slang] = await Promise.all([fetchMW(word), fetchUD(word)])

  // Fire off an alert email the first time we see a rate-limit response today.
  // We don't await — the response shouldn't be blocked by the email send.
  if (formal.rateLimited) {
    void sendRateLimitAlert({ word, origin: url.origin })
  }

  const body: DefineResponse = { word, formal, slang }

  // Don't cache rate-limited responses — we want them to clear once the quota resets.
  const cacheControl = formal.rateLimited
    ? 'no-store'
    : 'public, s-maxage=86400, stale-while-revalidate=86400'

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  })
}

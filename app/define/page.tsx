import type { Metadata } from 'next'
import { fetchMW } from '@/lib/define/mw'
import { fetchUD } from '@/lib/define/ud'
import { DefineClient } from './DefineClient'

const BASE_TITLE = 'Define · Ben Crystal'
const BASE_DESCRIPTION =
  'Look up any English word for both a formal Merriam-Webster definition and its Urban Dictionary slang counterpart, side by side.'

const normalize = (raw: string | undefined): string =>
  (raw ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { w?: string }
}): Promise<Metadata> {
  const word = normalize(searchParams.w)
  if (!word) {
    return { title: BASE_TITLE, description: BASE_DESCRIPTION }
  }

  // Fetch both sources in parallel for the social preview. Both helpers are
  // already cached at the network level when running on Vercel; locally we
  // pay the round-trip on each share-preview crawler hit.
  const [formal, slang] = await Promise.all([fetchMW(word), fetchUD(word)])

  const formalSense = formal.entries[0]?.senses[0] ?? null
  const slangDef = slang[0]?.definition ?? null

  // Build a description that pairs the formal and slang takes when available.
  const parts: string[] = []
  if (formalSense) parts.push(`Formal: ${truncate(formalSense, 110)}`)
  if (slangDef) parts.push(`Slang: ${truncate(slangDef, 110)}`)
  const description =
    parts.length > 0
      ? parts.join(' · ')
      : `Look up "${word}" on Define — Merriam-Webster meets Urban Dictionary.`

  const title = `${word} · Define`
  const url = `https://bencrystal.com/define?w=${encodeURIComponent(word)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Ben Crystal',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: url },
  }
}

export default function DefinePage({
  searchParams,
}: {
  searchParams: { w?: string }
}) {
  const initialQuery = normalize(searchParams.w)
  return <DefineClient initialQuery={initialQuery} />
}

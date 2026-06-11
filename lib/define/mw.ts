import type { FormalEntry, FormalPanel } from './types'

const EMPTY: FormalPanel = {
  found: false,
  entries: [],
  suggestions: [],
  rateLimited: false,
}

const RATE_LIMITED: FormalPanel = { ...EMPTY, rateLimited: true }

/**
 * MW returns plain text (not JSON) when the key is invalid or daily quota is hit.
 * Typical bodies: "Invalid API key. Not subscribed for this reference." or
 * "API key over daily limit." We treat anything mentioning quota/limit as rate-limited.
 */
const looksRateLimited = (body: string): boolean =>
  /limit|quota|exceed/i.test(body)

/**
 * Expand MW's abbreviated audio filename into a full mp3 URL.
 * Rules from https://dictionaryapi.com/products/json#sec-2.prs
 */
const audioUrl = (audio: string): string => {
  const first = audio[0]
  let subdir: string
  if (audio.startsWith('bix')) subdir = 'bix'
  else if (audio.startsWith('gg')) subdir = 'gg'
  else if (/^[0-9_]/.test(first)) subdir = 'number'
  else subdir = first
  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdir}/${audio}.mp3`
}

interface MwEntry {
  fl?: string
  hwi?: {
    prs?: Array<{
      mw?: string
      sound?: { audio?: string }
    }>
  }
  shortdef?: string[]
  // The `def[].sseq[][]` structure is deeply nested; we walk it loosely.
  def?: Array<{ sseq?: unknown }>
}

/** Extract the first example sentence from the deeply-nested def/sseq tree. */
const findExample = (entry: MwEntry): string | null => {
  const walk = (node: unknown): string | null => {
    if (!node) return null
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = walk(child)
        if (found) return found
      }
      return null
    }
    if (typeof node === 'object') {
      const obj = node as Record<string, unknown>
      // vis = visual illustration (example sentences)
      if (Array.isArray(obj.vis) && obj.vis[0] && typeof (obj.vis[0] as Record<string, unknown>).t === 'string') {
        return ((obj.vis[0] as Record<string, unknown>).t as string)
          .replace(/\{[^}]+\}/g, '') // strip MW formatting tokens like {wi}…{/wi}
          .trim()
      }
      for (const value of Object.values(obj)) {
        const found = walk(value)
        if (found) return found
      }
    }
    return null
  }
  return walk(entry.def)
}

const toFormalEntry = (entry: MwEntry): FormalEntry => {
  const prs = entry.hwi?.prs?.[0]
  return {
    pos: entry.fl ?? null,
    pronunciation: prs?.mw ?? null,
    audio: prs?.sound?.audio ? audioUrl(prs.sound.audio) : null,
    senses: (entry.shortdef ?? []).slice(0, 3),
    example: findExample(entry),
  }
}

/**
 * Decide whether two MW entries are distinct enough to show side-by-side.
 * Same POS + same first sense is redundant (MW often lists tiny variants);
 * different POS (noun vs verb) is the case we actually want to surface.
 */
const isMeaningfullyDistinct = (a: FormalEntry, b: FormalEntry): boolean => {
  if (a.pos !== b.pos) return true
  return (a.senses[0] ?? '') !== (b.senses[0] ?? '')
}

export const fetchMW = async (word: string): Promise<FormalPanel> => {
  const key = process.env.MW_API_KEY
  if (!key) return EMPTY

  try {
    const res = await fetch(
      `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${key}`,
      { signal: AbortSignal.timeout(5000) }
    )

    // HTTP 429 is the canonical rate-limit code; some MW responses use 403 or
    // even 200 with a text body, so we also sniff the body below.
    if (res.status === 429 || res.status === 403) return RATE_LIMITED

    const text = await res.text()

    if (!res.ok) {
      return looksRateLimited(text) ? RATE_LIMITED : EMPTY
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      // MW returned non-JSON (typically a quota/key error message in plain text)
      return looksRateLimited(text) ? RATE_LIMITED : EMPTY
    }

    if (!Array.isArray(data) || data.length === 0) return EMPTY

    // Suggestion array: API returns string[] when word isn't found
    if (typeof data[0] === 'string') {
      return { ...EMPTY, suggestions: (data as string[]).slice(0, 6) }
    }

    // Build up to 3 distinct entries.
    const entries: FormalEntry[] = []
    for (const raw of data as MwEntry[]) {
      const candidate = toFormalEntry(raw)
      if (candidate.senses.length === 0) continue
      const isDuplicate = entries.some((e) => !isMeaningfullyDistinct(e, candidate))
      if (!isDuplicate) entries.push(candidate)
      if (entries.length === 3) break
    }

    if (entries.length === 0) return EMPTY

    return {
      found: true,
      entries,
      suggestions: [],
      rateLimited: false,
    }
  } catch {
    return EMPTY
  }
}

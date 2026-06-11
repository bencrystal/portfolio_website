import type { SlangEntry } from './types'

interface UdItem {
  definition?: string
  example?: string
  permalink?: string
}

interface UdResponse {
  list?: UdItem[]
}

const stripBrackets = (s: string) => s.replace(/\[([^\]]+)\]/g, '$1').trim()

/**
 * Urban Dictionary's public API no longer exposes thumbs_up / thumbs_down
 * (always returns 0), so we can't rank client-side. The API does, however,
 * return results pre-sorted by UD's own internal popularity score — the
 * first item matches the top definition shown on urbandictionary.com.
 * Taking the first 3 = UD's own "top 3."
 */
export const fetchUD = async (word: string): Promise<SlangEntry[]> => {
  try {
    const res = await fetch(
      `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return []
    const data = (await res.json()) as UdResponse
    const list = data.list ?? []

    return list.slice(0, 3).map((item) => ({
      definition: stripBrackets(item.definition ?? ''),
      example: stripBrackets(item.example ?? ''),
      permalink: item.permalink ?? '',
    }))
  } catch {
    return []
  }
}

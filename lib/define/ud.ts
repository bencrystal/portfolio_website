import type { SlangEntry } from './types'

interface UdItem {
  definition?: string
  example?: string
  thumbs_up?: number
  thumbs_down?: number
  permalink?: string
}

interface UdResponse {
  list?: UdItem[]
}

const stripBrackets = (s: string) => s.replace(/\[([^\]]+)\]/g, '$1').trim()

export const fetchUD = async (word: string): Promise<SlangEntry[]> => {
  try {
    const res = await fetch(
      `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return []
    const data = (await res.json()) as UdResponse
    const list = data.list ?? []

    return list
      .slice()
      .sort((a, b) => (b.thumbs_up ?? 0) - (a.thumbs_up ?? 0))
      .slice(0, 3)
      .map((item) => ({
        definition: stripBrackets(item.definition ?? ''),
        example: stripBrackets(item.example ?? ''),
        up: item.thumbs_up ?? 0,
        down: item.thumbs_down ?? 0,
        permalink: item.permalink ?? '',
      }))
  } catch {
    return []
  }
}

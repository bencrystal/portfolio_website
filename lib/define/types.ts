export interface FormalPanel {
  found: boolean
  pos: string | null
  pronunciation: string | null
  audio: string | null
  senses: string[]
  example: string | null
  suggestions: string[]
  /** True when Merriam-Webster has rejected the request due to quota/rate limit. */
  rateLimited: boolean
}

export interface SlangEntry {
  definition: string
  example: string
  up: number
  down: number
  permalink: string
}

export interface DefineResponse {
  word: string
  formal: FormalPanel
  slang: SlangEntry[]
}

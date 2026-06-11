/** One Merriam-Webster headword entry (e.g. "run" has noun and verb entries). */
export interface FormalEntry {
  pos: string | null
  pronunciation: string | null
  audio: string | null
  senses: string[]
  example: string | null
  /** Origin/etymology line, MW formatting stripped. Null when MW doesn't provide one. */
  etymology: string | null
}

export interface FormalPanel {
  found: boolean
  /** Up to 3 distinct MW entries for the word (different parts of speech, etc.). */
  entries: FormalEntry[]
  suggestions: string[]
  /** True when Merriam-Webster has rejected the request due to quota/rate limit. */
  rateLimited: boolean
}

export interface SlangEntry {
  definition: string
  example: string
  permalink: string
}

export interface DefineResponse {
  word: string
  formal: FormalPanel
  slang: SlangEntry[]
}

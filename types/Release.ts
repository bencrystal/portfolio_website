export interface Release {
  id: string
  title: string
  artist: string
  /** Cover art in public/. Use a placeholder gradient if missing. */
  cover?: string
  /** ISO date string. If in the future and presaveUrl is set, treated as upcoming. */
  releaseDate: string
  status: 'upcoming' | 'released'
  presaveUrl?: string
  /** Streaming or release URLs once live. */
  links?: { label: string; url: string }[]
  /** Long-form description / liner notes. Plain text. */
  about?: string
}

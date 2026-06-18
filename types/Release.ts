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
  /** Spotify embed URL (https://open.spotify.com/embed/track/...) — renders inline player. */
  spotifyEmbedUrl?: string
  /** YouTube video ID — renders a full-width 16:9 embed below the hero. */
  youtubeId?: string
  /** Long-form description / liner notes. Plain text. */
  about?: string
}

export interface LinkEvent {
  title: string
  venue: string
  /** Last day the event shows, in America/New_York ('YYYY-MM-DD'). Hidden after this date. */
  date: string
  dateLabel: string
  href: string
  note?: string
}

export interface LinkEntry {
  label: string
  href: string
  note?: string
  /** Path under /public for a square thumbnail. */
  thumbnail?: string
}

export const linkEvents: LinkEvent[] = [
  {
    title: 'My first DJ set at Elsewhere!!!',
    venue: 'Elsewhere, Brooklyn',
    date: '2026-11-21',
    dateLabel: 'Sat, Nov 21',
    href: 'https://partiful.com/e/vw8ILGUJs0hhDb0flPKN',
    note: 'Your Shot NYC Showcase — come vote for me',
  },
]

export const linkEntries: LinkEntry[] = [
  {
    label: 'Featherbrain on Spotify',
    href: 'https://open.spotify.com/track/74evtzOHAHVgfLy4UyTX8V',
    note: 'New single — out now',
    thumbnail: '/featherbrain_albumart_3k.jpg',
  },
  {
    label: 'Featherbrain on YouTube',
    href: 'https://youtu.be/61Qabs2Gr3E',
    note: 'Official video',
    thumbnail: '/featherbrain_albumart_3k.jpg',
  },
]

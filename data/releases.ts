import type { Release } from '@/types/Release'

export const releases: Release[] = [
  {
    id: 'featherbrain',
    title: 'Featherbrain',
    artist: 'Ben Crystal',
    cover: '/featherbrain_albumart_3k.jpg',
    releaseDate: '2026-06-19',
    status: 'released',
    spotifyEmbedUrl:
      'https://open.spotify.com/embed/track/74evtzOHAHVgfLy4UyTX8V?utm_source=generator',
    youtubeId: '61Qabs2Gr3E',
    links: [
      {
        label: 'Spotify',
        url: 'https://open.spotify.com/track/74evtzOHAHVgfLy4UyTX8V',
      },
      {
        label: 'YouTube',
        url: 'https://youtu.be/61Qabs2Gr3E',
      },
    ],
    about:
      'A new single from Ben Crystal. Out now on Spotify and YouTube.',
  },
]

export const featuredRelease = releases[0]

import type { Release } from '@/types/Release'

export const releases: Release[] = [
  {
    id: 'featherbrain',
    title: 'Featherbrain',
    artist: 'Ben Crystal',
    // To replace the gradient placeholder, drop a square image at
    // public/music/featherbrain.jpg and uncomment the line below.
    // cover: '/music/featherbrain.jpg',
    releaseDate: '2026-06-19',
    status: 'upcoming',
    presaveUrl: 'https://distrokid.com/hyperfollow/bencrystal/featherbrain',
    about:
      'A new single from Ben Crystal. Presave it now so it lands in your library the moment it drops.',
  },
]

export const featuredRelease = releases[0]

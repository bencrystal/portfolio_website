import type { MezcalContent } from '@/types/Mezcal'

// Placeholder copy + image paths. Drop real photos into /public/mezcal/ using
// these filenames (or update the paths here) and they'll appear automatically.
// Until then, each slot shows a linen/agave gradient placeholder.

export const mezcal: MezcalContent = {
  hero: {
    eyebrow: 'A mezcal flight tasting',
    title: "Gary's Mezcal Journey",
    subtitle:
      'An intimate, guided flight through the smoke and soul of agave — classy, unhurried, and built around good conversation.',
    image: '/mezcal/hero.jpg',
  },

  about: {
    heading: 'The experience',
    paragraphs: [
      'Gather around a single table for a curated flight of small-batch mezcals, each poured and introduced by Gary. No rush, no pretense — just honest spirits, a little history, and the stories behind every bottle.',
      'We pour from espadín to wild-harvested varietals, pacing the evening so each agave has room to breathe. Expect citrus, salt, fruit, and a slow campfire finish, served alongside orange, sal de gusano, and seasonal bites.',
      'Whether you are mezcal-curious or already chasing tobalá, the journey meets you where you are — relaxed enough for a weeknight, polished enough to celebrate.',
    ],
    image: '/nanobananagarymezcaltasting.png',
  },

  gallery: [
    { src: '/nanobananagarymezcaltasting.png', alt: 'Gary sharing a mezcal flight tasting' },
    { src: '/mezcal/gallery-02.jpg', alt: 'Pouring mezcal at the tasting table' },
    { src: '/mezcal/gallery-03.jpg', alt: 'Orange slices with sal de gusano' },
    { src: '/mezcal/gallery-04.jpg', alt: 'Agave hearts and bottles on linen' },
    { src: '/mezcal/gallery-05.jpg', alt: 'Guests gathered for the tasting' },
  ],

  mezcals: [
    {
      id: 'espadin',
      name: 'Espadín',
      region: 'Oaxaca · Santiago Matatlán',
      agave: 'Espadín',
      species: 'espadin',
      notes: 'green apple, white pepper, soft smoke',
      description:
        'The welcoming pour — bright and approachable, with the long, sword-like leaves that give espadín its name. It sets the baseline for the smoke and minerality to come.',
    },
    {
      id: 'tobala',
      name: 'Tobalá',
      region: 'Oaxaca · San Luis del Río',
      agave: 'Wild Tobalá',
      species: 'tobala',
      notes: 'tropical fruit, honey, floral',
      description:
        'A small, round wild agave that takes more than a decade to mature, giving a delicate, fruit-forward elegance — the so-called king of agaves.',
    },
    {
      id: 'tepeztate',
      name: 'Tepeztate',
      region: 'Oaxaca · Miahuatlán',
      agave: 'Tepeztate',
      species: 'tepeztate',
      notes: 'herbaceous, green pepper, citrus zest',
      description:
        'Harvested after 25+ years, this cliffside agave fans out in wide, wavy leaves. Vivid and vegetal — the conversation piece of the flight.',
    },
    {
      id: 'arroqueno',
      name: 'Arroqueño',
      region: 'Oaxaca · Sola de Vega',
      agave: 'Arroqueño',
      species: 'arroqueno',
      notes: 'roasted earth, dark chocolate, leather',
      description:
        'A towering, broad-leafed ancestor of espadín, slow-roasted to a deep, savory finish — a powerful place to end the journey.',
    },
  ],

  pricing: [
    {
      id: 'classic',
      name: 'The Classic Flight',
      price: '$65',
      unit: 'per guest',
      duration: '~75 minutes',
      groupSize: '2–8 guests',
      includes: [
        'Four guided pours',
        'Orange, sal de gusano & seasonal bites',
        "Gary's tasting notes to take home",
      ],
      featured: true,
    },
    {
      id: 'private',
      name: 'Private Journey',
      price: '$95',
      unit: 'per guest',
      duration: '~2 hours',
      groupSize: '6–14 guests',
      includes: [
        'Six pours incl. a rare wild varietal',
        'Full pairing board',
        'Hosted at your home or venue',
        'Custom flight curated to your group',
      ],
    },
  ],

  instagram: {
    handle: '@garysmezcaljourney',
    url: 'https://www.instagram.com/garysmezcaljourney/',
    // Paste a Behold.so / SnapWidget embed snippet here to show the live reel.
    embedHtml: '',
  },

  booking: {
    heading: 'Reserve a flight',
    blurb:
      'Tastings run by reservation for small groups. Tell us your date, group size, and vibe — Gary will take it from there.',
    email: 'hello@garysmezcaljourney.com',
    reserveUrl: '',
  },
}

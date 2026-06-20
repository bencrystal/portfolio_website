/** Drives the agave silhouette that the rosette morphs into for each pour. */
export type AgaveSpecies =
  | 'espadin'
  | 'tobala'
  | 'tepeztate'
  | 'arroqueno'
  | 'ensamble'

export interface Mezcal {
  id: string
  name: string
  /** State / town of origin, e.g. "Oaxaca · San Baltazar" */
  region: string
  /** Agave varietal, e.g. "Espadín" or "Tobalá" */
  agave: string
  /** Botanical silhouette used by the rotating agave animation */
  species: AgaveSpecies
  /** Short tasting notes, comma separated */
  notes: string
  /** A sentence about the pour and why it's in the flight */
  description: string
}

export interface PricingTier {
  id: string
  name: string
  /** Display price, e.g. "$65" */
  price: string
  /** e.g. "per guest" */
  unit: string
  duration: string
  groupSize: string
  includes: string[]
  /** When true, the card is visually highlighted as the recommended option */
  featured?: boolean
}

export interface GalleryImage {
  /** Path under /public, e.g. "/mezcal/pour-01.jpg" */
  src: string
  alt: string
}

export interface MezcalContent {
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    /** Background photo path under /public */
    image: string
  }
  about: {
    heading: string
    paragraphs: string[]
    /** A side photo for the about section */
    image: string
  }
  gallery: GalleryImage[]
  mezcals: Mezcal[]
  pricing: PricingTier[]
  instagram: {
    handle: string
    url: string
    /**
     * Embed snippet from a third-party widget (Behold.so, SnapWidget, etc.).
     * Paste the <div>/<script> markup here, or leave empty to show a fallback.
     */
    embedHtml?: string
  }
  booking: {
    heading: string
    blurb: string
    email: string
    /** Optional booking/reservation link (Tock, Resy, Calendly, etc.) */
    reserveUrl?: string
  }
}

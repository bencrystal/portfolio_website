import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import { MezcalCarousel } from '@/components/mezcal/MezcalCarousel'
import { InstagramReel } from '@/components/mezcal/InstagramReel'
import { AgaveFlight } from '@/components/mezcal/AgaveFlight'
import { ParallaxBg } from '@/components/mezcal/ParallaxBg'
import { Reveal } from '@/components/mezcal/Reveal'
import { mezcal } from '@/data/mezcal'

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: "Gary's Mezcal Journey | A Mezcal Tasting",
  description:
    'An intimate, guided mezcal flight tasting hosted by Gary. Classy, casual, and built around small-batch agave spirits and good conversation.',
}

const LINEN = '#F4EFE6'
const INK = '#2B2B26'
const AGAVE = '#4A5D3A'
const TERRA = '#C06B4A'
const MUTED = '#9A8F78'

// Fluid type scales: smooth from mobile to desktop.
const FLUID_HERO = 'clamp(2.75rem, 7vw, 5.5rem)'
const FLUID_H2 = 'clamp(2rem, 4.5vw, 3.25rem)'

// Inline SVG film grain: subtle tactile texture over the whole page.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export default function MezcalPage() {
  const { hero, about, gallery, mezcals, pricing, instagram, booking } = mezcal

  // Stopgap until a real booking form lands: pre-fill the subject and body so a
  // warm lead just fills in the blanks instead of composing a cold email.
  const reserveMailto = `mailto:${booking.email}?subject=${encodeURIComponent(
    'Mezcal flight reservation'
  )}&body=${encodeURIComponent(
    [
      'Hi Gary,',
      '',
      "I'd love to book a mezcal flight. Details:",
      '',
      'Preferred date(s): ',
      'Group size: ',
      'Flight (Classic / Private): ',
      'Location (your place or mine): ',
      'Occasion (optional): ',
      'Anything else: ',
      '',
      'Thanks!',
    ].join('\n')
  )}`

  return (
    <main
      className={`${serif.variable} relative min-h-screen min-h-dvh`}
      style={{ backgroundColor: LINEN, color: INK }}
    >
      {/* Film grain overlay: viewport-sized fixed GPU layer (no blend mode, so no
          per-frame compositing of the page beneath; cheap to keep on screen). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundImage: GRAIN,
          opacity: 0.05,
        }}
      />

      {/* ---------------- Hero (parallax) ---------------- */}
      <section className="relative flex min-h-screen min-h-dvh items-center justify-center overflow-hidden">
        {/* Layer order (top to bottom): warm smoky scrim for legibility, the
            atmospheric photo, then a warm dark gradient as a fallback if the
            photo is missing. The scrim is semi-transparent so the photo, not a
            flat gradient, carries the mood. */}
        <ParallaxBg
          speed={0.2}
          backgroundImage={`linear-gradient(to bottom, rgba(26,20,15,0.40) 0%, rgba(26,20,15,0.55) 55%, rgba(20,15,11,0.82) 100%), url('${hero.image}'), linear-gradient(135deg, #3A2A1F 0%, #241A12 100%)`}
        />

        {/* Warm candlelight glow that slowly breathes behind the headline */}
        <div
          aria-hidden
          className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(192,107,74,0.32) 0%, rgba(192,107,74,0.10) 40%, transparent 70%)',
          }}
        />

        {/* Faint agave rosette, slowly rotating, to break the flat field */}
        <svg
          aria-hidden
          viewBox="-200 -200 400 400"
          className="hero-agave pointer-events-none absolute left-1/2 top-1/2 h-[150vmin] w-[150vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: 0.06 }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <path
              key={i}
              transform={`rotate(${i * (360 / 16)}) scale(1.1 0.5)`}
              d="M30 0 C90 -28 150 -20 188 0 C150 20 90 28 30 0 Z"
              fill="none"
              stroke={LINEN}
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Content sits a touch above center so the lower third reads as
            atmosphere + scroll cue rather than dead space. */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 pb-16 text-center">
          <p
            className="text-[11px] uppercase tracking-[0.42em]"
            style={{ color: 'rgba(231,223,205,0.72)' }}
          >
            {hero.eyebrow}
          </p>
          {/* Small terracotta mark to anchor the eye and break the flat field */}
          <span
            aria-hidden
            className="mx-auto mt-5 mb-6 block h-px w-10"
            style={{ backgroundColor: TERRA }}
          />
          <h1
            className="font-[family-name:var(--font-serif)] font-medium leading-[1.02] tracking-[-0.01em] text-[#F7F3EA] text-balance"
            style={{ fontSize: FLUID_HERO }}
          >
            {hero.title}
          </h1>
          <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-[#EEE7D8] text-balance">
            {hero.subtitle}
          </p>
          <a
            href="#reserve"
            className="mt-10 inline-block rounded-full px-10 py-4 text-sm font-semibold uppercase tracking-[0.25em] shadow-[0_16px_34px_-14px_rgba(0,0,0,0.7)] transition-transform transition-shadow duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-14px_rgba(0,0,0,0.75)]"
            style={{ backgroundColor: TERRA, color: LINEN }}
          >
            Reserve a flight
          </a>
          <a
            href="#tastings"
            className="mt-6 block text-xs uppercase tracking-[0.28em] text-[#EEE7D8]/75 transition-colors hover:text-[#F7F3EA]"
          >
            See the flights ↓
          </a>
        </div>
        {/* Subtle scroll cue so the empty lower third reads as intentional */}
        <a
          href="#tastings"
          aria-label="Scroll to the flights"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <span
            aria-hidden
            className="block h-10 w-px animate-pulse"
            style={{ backgroundColor: 'rgba(231,223,205,0.5)' }}
          />
        </a>
      </section>

      {/* ---------------- About ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: TERRA }}
            >
              {about.heading}
            </p>
            <h2
              className="font-[family-name:var(--font-serif)] font-medium leading-[1.08] tracking-[-0.01em]"
              style={{ fontSize: FLUID_H2 }}
            >
              Smoke, agave, and good company.
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed" style={{ color: '#48443B' }}>
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-[0_30px_60px_-30px_rgba(47,58,36,0.5)]"
              style={{
                background: 'linear-gradient(135deg, #8A9A6B 0%, #4A5D3A 60%, #2F3A24 100%)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={about.image}
                alt="The mezcal tasting table"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Parallax divider ---------------- */}
      <section className="relative h-72 overflow-hidden">
        <ParallaxBg
          speed={0.25}
          backgroundImage={`linear-gradient(rgba(47,58,36,0.55), rgba(47,58,36,0.55)), linear-gradient(135deg, #4A5D3A, #2F3A24), url('${gallery[3]?.src ?? hero.image}')`}
        />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <p
            className="font-[family-name:var(--font-serif)] max-w-2xl text-center italic text-[#F4EFE6] text-balance"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
          >
            “Every mezcal carries a place, a maker, and a season. We taste all
            three.”
          </p>
        </div>
      </section>

      {/* ---------------- Gallery carousel ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <div className="mb-10">
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: TERRA }}
            >
              Moments
            </p>
            <h2
              className="font-[family-name:var(--font-serif)] font-medium tracking-[-0.01em]"
              style={{ fontSize: FLUID_H2 }}
            >
              From the table.
            </h2>
          </div>
          <MezcalCarousel images={gallery} />
        </Reveal>
      </section>

      {/* ---------------- The mezcals (rotating agave flight) ---------------- */}
      <AgaveFlight mezcals={mezcals} />

      {/* ---------------- Pricing ---------------- */}
      <section id="tastings" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: TERRA }}
          >
            Tastings
          </p>
          <h2
            className="font-[family-name:var(--font-serif)] mb-12 font-medium tracking-[-0.01em]"
            style={{ fontSize: FLUID_H2 }}
          >
            Pick your flight.
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {pricing.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 100}>
              <div
                className="flex h-full flex-col rounded-3xl border p-8 transition-transform duration-500 hover:-translate-y-1"
                style={{
                  borderColor: tier.featured ? AGAVE : '#D8CEB8',
                  backgroundColor: tier.featured ? '#FBF8F1' : 'transparent',
                }}
              >
                {tier.featured && (
                  <span
                    className="mb-4 self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{ backgroundColor: TERRA, color: LINEN }}
                  >
                    Most popular
                  </span>
                )}
                <h3
                  className="font-[family-name:var(--font-serif)] font-semibold"
                  style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)' }}
                >
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold" style={{ color: AGAVE }}>
                    {tier.price}
                  </span>
                  <span className="text-sm" style={{ color: MUTED }}>
                    {tier.unit}
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: MUTED }}>
                  {tier.duration} · {tier.groupSize}
                </p>
                <ul className="mt-6 space-y-3 text-sm" style={{ color: '#48443B' }}>
                  {tier.includes.map((item, j) => (
                    <li key={j} className="flex gap-3">
                      <span style={{ color: TERRA }}>·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#reserve"
                  className="mt-8 inline-block rounded-full px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] transition-transform hover:scale-[1.03]"
                  style={{
                    backgroundColor: tier.featured ? TERRA : 'transparent',
                    color: tier.featured ? LINEN : AGAVE,
                    border: tier.featured ? 'none' : `1px solid ${AGAVE}`,
                  }}
                >
                  Reserve
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Instagram reel ---------------- */}
      <section style={{ backgroundColor: '#EDE5D5' }}>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <Reveal>
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: TERRA }}
            >
              Latest pours
            </p>
            <h2
              className="font-[family-name:var(--font-serif)] mb-10 font-medium tracking-[-0.01em]"
              style={{ fontSize: FLUID_H2 }}
            >
              On Instagram.
            </h2>
            <InstagramReel
              handle={instagram.handle}
              url={instagram.url}
              embedHtml={instagram.embedHtml}
            />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Booking CTA ---------------- */}
      <section id="reserve" style={{ backgroundColor: '#2F3A24', color: LINEN }}>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <Reveal>
            <h2
              className="font-[family-name:var(--font-serif)] font-medium tracking-[-0.01em]"
              style={{ fontSize: FLUID_H2 }}
            >
              {booking.heading}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#D9E0CC] text-balance">
              {booking.blurb}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {booking.reserveUrl ? (
                <>
                  <a
                    href={booking.reserveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.03]"
                    style={{ backgroundColor: TERRA, color: LINEN }}
                  >
                    Book online
                  </a>
                  <a
                    href={reserveMailto}
                    className="rounded-full border px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] transition-colors hover:bg-[#F4EFE6] hover:text-[#2F3A24]"
                    style={{ borderColor: '#F4EFE6' }}
                  >
                    Reserve by email
                  </a>
                </>
              ) : (
                <a
                  href={reserveMailto}
                  className="rounded-full px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.03]"
                  style={{ backgroundColor: TERRA, color: LINEN }}
                >
                  Reserve by email
                </a>
              )}
            </div>
            <p className="mt-5 text-sm text-[#9FA98A]">
              or write us directly at{' '}
              <a href={`mailto:${booking.email}`} className="underline underline-offset-2 hover:text-[#D9E0CC]">
                {booking.email}
              </a>
            </p>
            <p className="mt-12 text-xs uppercase tracking-[0.3em] text-[#9FA98A]">
              Please sip responsibly · 21+
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  )
}

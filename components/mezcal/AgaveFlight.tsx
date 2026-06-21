'use client'

import { useEffect, useRef, useState } from 'react'
import type { AgaveSpecies, Mezcal } from '@/types/Mezcal'
// Map muted for now. Restore this import and the two <MexicoMap> blocks below to re-enable.
// import { MexicoMap } from './MexicoMap'

const LINEN = '#F4EFE6'
const INK = '#2B2B26'
const AGAVE = '#4A5D3A'
const TERRA = '#C06B4A'
const MUTED = '#9A8F78'

const TOTAL_LEAVES = 12

// Per-species leaf silhouette: scaleX = length along the leaf, scaleY = width.
const SHAPES: Record<AgaveSpecies, { sx: number; sy: number }> = {
  espadin: { sx: 1.2, sy: 0.5 }, // long, narrow swords
  tobala: { sx: 0.8, sy: 1.22 }, // small, round, broad
  tepeztate: { sx: 1.12, sy: 1.0 }, // long, wide, sprawling
  arroqueno: { sx: 1.32, sy: 1.26 }, // huge, broad
  ensamble: { sx: 1.0, sy: 1.0 }, // neutral blend
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

interface LeafProps {
  angle: number
  sx: number
  sy: number
  scale?: number
  active?: boolean
  dim?: boolean
}

function Leaf({ angle, sx, sy, scale = 1, active = false, dim = false }: LeafProps) {
  return (
    <g transform={`rotate(${angle}) scale(${sx * scale} ${sy * scale})`} opacity={dim ? 0.4 : 1}>
      <path
        d="M30 0 C80 -26 130 -18 165 0 C130 18 80 26 30 0 Z"
        fill={active ? 'url(#leafActive)' : 'url(#leafGrad)'}
        stroke={active ? TERRA : 'rgba(47,58,36,0.25)'}
        strokeWidth={active ? 2.5 : 1}
        style={{ transition: 'fill 0.4s ease, stroke 0.4s ease' }}
      />
      <path d="M40 0 L156 0" stroke="rgba(244,239,230,0.35)" strokeWidth={1.5} />
      <path d="M165 0 l 13 0" stroke={active ? TERRA : '#3B4A2E'} strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

interface AgaveFlightProps {
  mezcals: Mezcal[]
}

export function AgaveFlight({ mezcals }: AgaveFlightProps) {
  const steps = Math.max(mezcals.length, 1)
  const sectionRef = useRef<HTMLDivElement>(null)
  const rotorRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [reduce, setReduce] = useState(false)
  // Below lg the absolute crossfade clips long descriptions, so the active
  // card renders in normal flow (auto height) while the agave still rotates.
  const [compact, setCompact] = useState(false)

  const initialShape = SHAPES[mezcals[0]?.species ?? 'ensamble']
  const [morph, setMorph] = useState(initialShape)
  const morphRef = useRef(initialShape)
  const activeRef = useRef(0)

  // Detect reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Detect narrow viewports (below the lg breakpoint = 1024px).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setCompact(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Scroll → rotation (applied imperatively to avoid per-frame React renders).
  useEffect(() => {
    if (reduce) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = sectionRef.current
        if (!el) return
        const track = el.offsetHeight - window.innerHeight
        const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), track)
        const progress = track > 0 ? scrolled / track : 0
        // Snap to one of `steps` discrete stops rather than rotating
        // continuously, so the agave settles on a position per mezcal.
        const next = Math.round(progress * (steps - 1))
        const rotation = -next * (360 / steps)
        if (rotorRef.current) {
          rotorRef.current.style.transform = `rotate(${rotation}deg)`
        }
        if (next !== activeRef.current) {
          activeRef.current = next
          setActive(next)
          // Light tactile "tick" on devices that support it (mostly mobile).
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(8)
          }
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [reduce, steps])

  // Active change → ease the leaf silhouette toward the new species.
  useEffect(() => {
    const target = SHAPES[mezcals[active]?.species ?? 'ensamble']
    if (reduce) {
      morphRef.current = target
      setMorph(target)
      return
    }
    const start = morphRef.current
    const t0 = performance.now()
    const duration = 520
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const e = easeOutCubic(p)
      const shape = {
        sx: start.sx + (target.sx - start.sx) * e,
        sy: start.sy + (target.sy - start.sy) * e,
      }
      morphRef.current = shape
      setMorph(shape)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduce, mezcals])

  const contentEvery = Math.max(Math.round(TOTAL_LEAVES / steps), 1)
  const leaves = Array.from({ length: TOTAL_LEAVES }, (_, i) => {
    const isContent = i % contentEvery === 0 && i / contentEvery < steps
    return { angle: i * (360 / TOTAL_LEAVES), isContent, contentIdx: i / contentEvery }
  })

  const Agave = (
    <svg viewBox="-260 -260 520 520" className="h-full w-full overflow-visible" role="img" aria-label="Agave rosette">
      <defs>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5C7049" />
          <stop offset="100%" stopColor="#8DA06E" />
        </linearGradient>
        <linearGradient id="leafActive" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7E9460" />
          <stop offset="100%" stopColor="#B7C593" />
        </linearGradient>
      </defs>
      <g>
        {leaves.map((l, i) => (
          <Leaf
            key={`in-${i}`}
            angle={l.angle + 360 / TOTAL_LEAVES / 2}
            sx={morph.sx}
            sy={morph.sy}
            scale={0.5}
            dim
          />
        ))}
        {leaves.map((l, i) => (
          <Leaf
            key={`out-${i}`}
            angle={l.angle}
            sx={morph.sx}
            sy={morph.sy}
            active={!reduce && l.isContent && l.contentIdx === active}
          />
        ))}
        <circle r="20" fill="#3B4A2E" />
        <circle r="9" fill="#5C7049" />
      </g>
    </svg>
  )

  const cardInner = (m: Mezcal, i: number) => (
    <>
      <span
        className="font-[family-name:var(--font-serif)] leading-none tabular-nums"
        style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', color: '#CDBFA3' }}
      >
        {String(i + 1).padStart(2, '0')}
      </span>
      <h3
        className="font-[family-name:var(--font-serif)] mt-2 font-semibold leading-tight"
        style={{ fontSize: 'clamp(1.75rem,3vw,2.5rem)', color: INK }}
      >
        {m.name}
      </h3>
      <p className="mt-1 text-sm uppercase tracking-[0.2em]" style={{ color: AGAVE }}>
        {m.region} · {m.agave}
      </p>
      <p className="mt-4 max-w-md text-base leading-relaxed lg:text-lg" style={{ color: '#48443B' }}>
        {m.description}
      </p>
      <p className="mt-4 text-sm italic" style={{ color: MUTED }}>
        {m.notes}
      </p>
    </>
  )

  // -------- Reduced motion fallback: static plant + stacked list --------
  if (reduce) {
    return (
      <section style={{ backgroundColor: '#EDE5D5' }}>
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: TERRA }}>
            The flight
          </p>
          <h2
            className="font-[family-name:var(--font-serif)] mb-12 font-medium tracking-[-0.01em]"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}
          >
            What you&apos;ll taste.
          </h2>
          <div className="mx-auto mb-12 h-48 w-48 opacity-80">{Agave}</div>
          {/* Map muted for now:
          <div className="mx-auto mb-12 max-w-md">
            <MexicoMap mezcals={mezcals} active={0} />
          </div>
          */}
          <div>
            {mezcals.map((m, i) => (
              <div
                key={m.id}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2 border-t py-8 sm:grid-cols-[auto_1fr_auto] sm:gap-x-10"
                style={{ borderColor: '#D8CEB8' }}
              >
                <span
                  className="font-[family-name:var(--font-serif)] leading-none tabular-nums"
                  style={{ fontSize: 'clamp(2rem,5vw,3rem)', color: '#CDBFA3' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="col-start-2">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold">{m.name}</h3>
                    <span className="text-sm" style={{ color: MUTED }}>{m.region}</span>
                  </div>
                  <p className="mt-2 max-w-2xl leading-relaxed" style={{ color: '#48443B' }}>{m.description}</p>
                </div>
                <div className="col-start-2 sm:col-start-3 sm:text-right">
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: AGAVE }}>{m.agave}</p>
                  <p className="mt-1 text-sm italic" style={{ color: MUTED }}>{m.notes}</p>
                </div>
              </div>
            ))}
            <div className="border-t" style={{ borderColor: '#D8CEB8' }} />
          </div>
        </div>
      </section>
    )
  }

  // -------- Interactive pinned scroll-rotate --------
  return (
    <section
      ref={sectionRef}
      style={{ backgroundColor: '#EDE5D5', height: `${steps * 55}vh` }}
      aria-label="The mezcal flight"
    >
      <div className="sticky top-0 flex min-h-screen flex-col justify-center overflow-hidden py-12 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: TERRA }}>
            The flight
          </p>
          <h2
            className="font-[family-name:var(--font-serif)] mb-6 font-medium tracking-[-0.01em] sm:mb-10"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}
          >
            What you&apos;ll taste.
          </h2>

          <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="relative mx-auto aspect-square w-[min(44vw,13rem)] sm:w-[min(42vw,20rem)] lg:w-[min(48vw,30rem)]">
              <div
                ref={rotorRef}
                className="h-full w-full"
                style={{ willChange: 'transform', transition: 'transform 0.85s cubic-bezier(0.34, 1.32, 0.5, 1)' }}
              >
                <div key={active} className="agave-pop h-full w-full">
                  {Agave}
                </div>
              </div>
              <div className="absolute -right-1 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
                {mezcals.map((_, i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full transition-all"
                    style={{
                      backgroundColor: i === active ? TERRA : '#C9BFA9',
                      transform: i === active ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="relative lg:min-h-[16rem]">
                {compact
                  ? mezcals[active] && (
                      // Mobile: only the active card, in normal flow so its full
                      // notes are never clipped. Keyed by index so it re-mounts
                      // and the fade-in animation replays on each step.
                      <div key={active} className="fade-in flex flex-col">
                        {cardInner(mezcals[active], active)}
                      </div>
                    )
                  : mezcals.map((m, i) => (
                      // Desktop: absolute crossfade between cards.
                      <div
                        key={m.id}
                        aria-hidden={i !== active}
                        className="absolute inset-0 flex flex-col justify-center"
                        style={{
                          opacity: i === active ? 1 : 0,
                          transform: i === active ? 'translateY(0)' : 'translateY(12px)',
                          transition: 'opacity 0.5s ease, transform 0.5s ease',
                          pointerEvents: i === active ? 'auto' : 'none',
                        }}
                      >
                        {cardInner(m, i)}
                      </div>
                    ))}
              </div>

              {/* Map muted for now:
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
                  style={{ color: TERRA }}
                >
                  Where it&apos;s from
                </p>
                <MexicoMap mezcals={mezcals} active={active} />
              </div>
              */}
            </div>
          </div>

          <p className="mt-10 text-center text-xs uppercase tracking-[0.3em] lg:text-left" style={{ color: MUTED }}>
            Scroll to rotate the agave
          </p>
        </div>
      </div>
    </section>
  )
}

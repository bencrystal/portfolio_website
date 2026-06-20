'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { GalleryImage } from '@/types/Mezcal'

interface MezcalCarouselProps {
  images: GalleryImage[]
}

/**
 * Lightweight, dependency-free carousel built on CSS scroll-snap.
 * Each slide shows an agave gradient placeholder that the photo fades over,
 * so missing images degrade gracefully until real photos are added.
 */
export function MezcalCarousel({ images }: MezcalCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(index, images.length - 1))
    const slide = track.children[clamped] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [images.length])

  // Track which slide is centered as the user scrolls/swipes.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2
        let closest = 0
        let closestDist = Infinity
        Array.from(track.children).forEach((child, i) => {
          const el = child as HTMLElement
          const elCenter = el.offsetLeft + el.clientWidth / 2
          const dist = Math.abs(elCenter - center)
          if (dist < closestDist) {
            closestDist = dist
            closest = i
          }
        })
        setActive(closest)
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <figure
            key={img.src + i}
            className="relative snap-center shrink-0 w-[80%] sm:w-[60%] lg:w-[46%] aspect-[4/3] overflow-hidden rounded-2xl"
            style={{
              background:
                'linear-gradient(135deg, #8A9A6B 0%, #4A5D3A 55%, #2F3A24 100%)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.opacity = '0'
              }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-4 text-sm text-[#F4EFE6]">
              {img.alt}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: active === i ? 28 : 8,
                backgroundColor: active === i ? '#C06B4A' : '#C9BFA9',
              }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollTo(active - 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#4A5D3A]/30 text-[#4A5D3A] transition-colors hover:bg-[#4A5D3A] hover:text-[#F4EFE6]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollTo(active + 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#4A5D3A]/30 text-[#4A5D3A] transition-colors hover:bg-[#4A5D3A] hover:text-[#F4EFE6]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

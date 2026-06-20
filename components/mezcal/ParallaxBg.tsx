'use client'

import { useEffect, useRef } from 'react'

interface ParallaxBgProps {
  /** Full CSS background-image value (gradients + url) */
  backgroundImage: string
  /** Parallax intensity; higher = more travel. 0 disables motion. */
  speed?: number
  className?: string
}

/**
 * GPU-friendly parallax layer. Instead of `background-attachment: fixed`
 * (which forces a full repaint every scroll frame), this translates an
 * oversized absolutely-positioned layer via `transform` in a rAF loop,
 * mutating the DOM directly so React never re-renders on scroll.
 */
export function ParallaxBg({ backgroundImage, speed = 0.18, className }: ParallaxBgProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || speed === 0) return

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const parent = el.parentElement
        if (!parent) return
        const top = parent.getBoundingClientRect().top
        el.style.transform = `translate3d(0, ${(-top * speed).toFixed(2)}px, 0)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [speed])

  return (
    <div
      aria-hidden
      ref={ref}
      className={`pointer-events-none absolute left-0 right-0 bg-cover bg-center ${className ?? ''}`}
      style={{ top: '-30%', height: '160%', backgroundImage, willChange: 'transform' }}
    />
  )
}

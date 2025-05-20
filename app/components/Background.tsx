'use client'

import { useEffect, useRef } from 'react'
import type p5Types from 'p5'
import type { Color } from 'p5'

interface BackgroundProps {
  text?: string;
  fontSize?: number;
  spacing?: number;
}

const Background = ({ text = "^ ◡ ^", fontSize = 10, spacing = 14 }: BackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Instance = useRef<any>(null)

  useEffect(() => {
    const loadP5 = async () => {
      // Clear any existing instance first
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }

      try {
        const p5Module = await import('p5/lib/p5')
        const p5 = p5Module.default
        
        if (!containerRef.current) return

        const sketch = (p: p5Types) => {
          // Copy existing sketch implementation from:
          ```typescript:components/Background.tsx
          startLine: 28
          endLine: 230
          ```
        }

        p5Instance.current = new p5(sketch, containerRef.current)
      } catch (error) {
        console.error('Error loading p5:', error)
      }
    }

    loadP5()

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }
    }
  }, [text, fontSize, spacing])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0"
      style={{ 
        zIndex: 0,
        background: 'rgb(9, 9, 11)',
        pointerEvents: 'none'
      }}
    />
  )
}

export default Background 
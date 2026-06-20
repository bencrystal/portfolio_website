'use client'

import { useEffect, useRef } from 'react'
import { Instagram } from 'lucide-react'

interface InstagramReelProps {
  handle: string
  url: string
  /** Embed snippet from Behold.so / SnapWidget / etc. */
  embedHtml?: string
}

/**
 * Renders a third-party Instagram feed widget. Most widgets ship as markup plus
 * a <script> tag; injected scripts don't auto-run, so we re-create them here.
 * If no embed is configured yet, we show a tasteful "follow" fallback card.
 */
export function InstagramReel({ handle, url, embedHtml }: InstagramReelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !embedHtml) return
    container.innerHTML = embedHtml
    // Re-create script nodes so the widget actually executes.
    container.querySelectorAll('script').forEach((oldScript) => {
      const script = document.createElement('script')
      Array.from(oldScript.attributes).forEach((attr) =>
        script.setAttribute(attr.name, attr.value)
      )
      script.text = oldScript.text
      oldScript.replaceWith(script)
    })
  }, [embedHtml])

  if (embedHtml) {
    return <div ref={containerRef} className="w-full" />
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#4A5D3A]/20 bg-white/40 px-8 py-16 text-center transition-colors hover:bg-white/70"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#4A5D3A] text-[#F4EFE6] transition-transform group-hover:scale-105">
        <Instagram className="h-7 w-7" />
      </span>
      <span className="font-medium text-[#2B2B26]">Follow the journey</span>
      <span className="text-lg text-[#4A5D3A]">{handle}</span>
      <span className="text-xs uppercase tracking-[0.25em] text-[#9A8F78]">
        Live feed coming soon
      </span>
    </a>
  )
}

import type { ReactNode } from 'react'

/**
 * Parses inline markdown links `[text](url)` in a string and returns mixed
 * text/anchor nodes. Anchors open in a new tab with safe rel.
 */
export function parseMarkdownLinks(text: string): ReactNode[] {
  const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\))/g)

  return parts.map((part, index) => {
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      const [, linkText, url] = linkMatch
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300/50 underline-offset-4 transition-all duration-300 font-medium"
        >
          {linkText}
        </a>
      )
    }
    return part
  })
}

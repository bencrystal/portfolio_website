'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n'

interface ShareButtonProps {
  word: string
}

export const ShareButton = ({ word }: ShareButtonProps) => {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}/define?w=${encodeURIComponent(word)}`
    const title = `${word} · Define`

    // Prefer the native share sheet (mobile), fall back to clipboard.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User dismissed the sheet or the API rejected — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Last-ditch fallback for ancient browsers / insecure contexts.
      window.prompt(title, url)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase tracking-[0.3em] text-white/60 hover:text-[#57f1ff] border border-white/20 hover:border-[#57f1ff] transition-colors"
      aria-label={t('share')}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      <span>{copied ? t('share_copied') : t('share')}</span>
    </button>
  )
}

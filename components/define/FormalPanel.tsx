'use client'

import { useRef } from 'react'
import type { FormalPanel as FormalPanelData } from '@/lib/define/types'
import { useLocale } from '@/lib/i18n'

const ACCENT = '#57f1ff'

interface FormalPanelProps {
  data: FormalPanelData
  onSuggestionClick: (word: string) => void
}

export const FormalPanel = ({ data, onSuggestionClick }: FormalPanelProps) => {
  const { t } = useLocale()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playAudio = () => {
    if (!data.audio) return
    if (!audioRef.current) audioRef.current = new Audio(data.audio)
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  // MW daily quota exhausted — surface a subtle notice in place of definitions.
  if (data.rateLimited) {
    return (
      <div className="border border-white/20 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 mb-2">
          {t('formal_label')}
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          {t('mw_rate_limited')}
        </p>
      </div>
    )
  }

  // Suggestion / "did you mean" state
  if (!data.found && data.suggestions.length > 0) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 mb-4">
          {t('did_you_mean')}
        </p>
        <div className="flex flex-wrap gap-2">
          {data.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestionClick(s)}
              className="px-3 py-1.5 border border-white/20 text-sm font-medium hover:border-[#57f1ff] hover:text-[#57f1ff] transition-colors"
              style={{ color: ACCENT }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!data.found) {
    return <p className="text-sm text-white/50 italic">{t('no_formal')}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        {data.pos && (
          <span
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: ACCENT }}
          >
            {data.pos}
          </span>
        )}
        {data.pronunciation && (
          <span className="text-base text-white/70 font-mono">
            \{data.pronunciation}\
          </span>
        )}
        {data.audio && (
          <button
            onClick={playAudio}
            aria-label={t('play_audio')}
            className="inline-flex items-center justify-center w-7 h-7 border border-white/20 hover:border-[#57f1ff] hover:text-[#57f1ff] transition-colors"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      <ol className="space-y-3 list-decimal list-inside marker:text-white/30 marker:font-bold">
        {data.senses.map((sense, i) => (
          <li key={i} className="text-lg text-white/90 leading-relaxed pl-2">
            {sense}
          </li>
        ))}
      </ol>

      {data.example && (
        <div className="border-l-2 pl-4 py-1" style={{ borderColor: ACCENT }}>
          <p className="text-sm text-white/70 italic leading-relaxed">
            &ldquo;{data.example}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}

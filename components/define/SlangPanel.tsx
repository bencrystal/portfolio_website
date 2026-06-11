'use client'

import type { SlangEntry } from '@/lib/define/types'
import { useLocale } from '@/lib/i18n'

const ACCENT = '#57f1ff'

interface SlangPanelProps {
  data: SlangEntry[]
}

export const SlangPanel = ({ data }: SlangPanelProps) => {
  const { t } = useLocale()

  if (data.length === 0) {
    return <p className="text-sm text-white/50 italic">{t('no_slang')}</p>
  }

  return (
    <div className="space-y-8">
      {data.map((entry, i) => (
        <article key={i} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className="text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: ACCENT }}
            >
              ▲ {entry.up.toLocaleString()}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
              ▼ {entry.down.toLocaleString()}
            </span>
          </div>

          <p className="text-base text-white/90 leading-relaxed whitespace-pre-line">
            {entry.definition}
          </p>

          {entry.example && (
            <div className="border-l-2 border-white/20 pl-4 py-1">
              <p className="text-sm text-white/60 italic leading-relaxed whitespace-pre-line">
                {entry.example}
              </p>
            </div>
          )}

          {entry.permalink && (
            <a
              href={entry.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-[#57f1ff] transition-colors"
            >
              {t('open_on_ud')} →
            </a>
          )}
        </article>
      ))}
    </div>
  )
}

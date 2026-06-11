'use client'

import { useCallback, useEffect, useState } from 'react'
import { SearchInput } from '@/components/define/SearchInput'
import { FormalPanel } from '@/components/define/FormalPanel'
import { SlangPanel } from '@/components/define/SlangPanel'
import { PanelSkeleton } from '@/components/define/PanelSkeleton'
import { NsfwNotice } from '@/components/define/NsfwNotice'
import { LocaleSelect } from '@/components/define/LocaleSelect'
import { ShareButton } from '@/components/define/ShareButton'
import { LocaleProvider, useLocale } from '@/lib/i18n'
import type { DefineResponse } from '@/lib/define/types'

const ACCENT = '#57f1ff'

interface DefineClientProps {
  initialQuery: string
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

export const DefineClient = ({ initialQuery }: DefineClientProps) => {
  return (
    <LocaleProvider>
      <DefineInner initialQuery={initialQuery} />
    </LocaleProvider>
  )
}

const DefineInner = ({ initialQuery }: DefineClientProps) => {
  const { t, locale } = useLocale()
  const dir: 'ltr' | 'rtl' = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr'
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState<Status>(initialQuery ? 'loading' : 'idle')
  const [data, setData] = useState<DefineResponse | null>(null)

  const search = useCallback(async (word: string) => {
    setQuery(word)
    setStatus('loading')

    // Update URL without polluting history.
    if (typeof window !== 'undefined') {
      const next = `/define?w=${encodeURIComponent(word)}`
      window.history.replaceState(null, '', next)
    }

    try {
      const res = await fetch(`/api/define?w=${encodeURIComponent(word)}`)
      if (!res.ok) throw new Error(`bad status ${res.status}`)
      const json = (await res.json()) as DefineResponse
      setData(json)
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [])

  // Kick off the initial query if one was provided via ?w=.
  useEffect(() => {
    if (initialQuery) search(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showPanels = status === 'loading' || status === 'ok'

  return (
    <main
      dir={dir}
      className="min-h-screen min-h-dvh bg-black text-white relative overflow-x-hidden"
    >
      {/* Hero header — title sits inline with the controls to reclaim vertical space. */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1 className="font-black tracking-[-0.04em] uppercase leading-none text-4xl sm:text-5xl lg:text-6xl">
              Define<span style={{ color: ACCENT }}>.</span>
            </h1>
            <div className="flex items-center gap-3">
              {query && status === 'ok' && <ShareButton word={query} />}
              <LocaleSelect />
            </div>
          </div>

          <SearchInput
            initialValue={query}
            placeholder={t('placeholder')}
            onSubmit={search}
          />
        </div>
      </section>

      {/* Results */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          {status === 'idle' && (
            <p className="text-white/40 italic">{t('search_prompt')}</p>
          )}

          {status === 'error' && (
            <p className="text-white/70">{t('error')}</p>
          )}

          {showPanels && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              <div>
                <p
                  className="text-sm sm:text-base font-bold uppercase tracking-[0.3em] mb-6 pb-3 border-b border-white/10"
                  style={{ color: ACCENT }}
                >
                  {t('formal_label')}
                </p>
                {status === 'loading' || !data ? (
                  <PanelSkeleton />
                ) : (
                  <FormalPanel data={data.formal} onSuggestionClick={search} />
                )}
              </div>

              <div>
                <p
                  className="text-sm sm:text-base font-bold uppercase tracking-[0.3em] mb-6 pb-3 border-b border-white/10"
                  style={{ color: ACCENT }}
                >
                  {t('slang_label')}
                </p>
                {status === 'loading' || !data ? (
                  <PanelSkeleton />
                ) : (
                  <SlangPanel data={data.slang} />
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 leading-relaxed">
          {t('definitions_in_english')}
        </p>
      </footer>

      <NsfwNotice />
    </main>
  )
}

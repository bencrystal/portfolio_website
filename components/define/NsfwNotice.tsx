'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n'

const STORAGE_KEY = 'define_nsfw_ack'

export const NsfwNotice = () => {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true)
  }, [])

  const dismiss = () => {
    setOpen(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1')
    }
  }

  if (!open) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 bg-black border border-white/20 p-5 flex items-start gap-4">
      <p className="text-sm text-white/80 leading-relaxed flex-1">
        {t('nsfw_notice')}
      </p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 px-3 py-1.5 font-bold uppercase tracking-widest text-[11px] text-black transition-transform hover:-translate-y-0.5"
        style={{ backgroundColor: '#57f1ff' }}
      >
        {t('nsfw_dismiss')}
      </button>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { dictionaries, LOCALES, type Locale, type DictKey } from './dictionaries'

const STORAGE_KEY = 'define_locale'

const isLocale = (v: string): v is Locale =>
  LOCALES.some((l) => l.code === v)

const detectInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && isLocale(stored)) return stored
  const nav = window.navigator.language?.slice(0, 2).toLowerCase() ?? 'en'
  return isLocale(nav) ? nav : 'en'
}

export const useLocale = () => {
  // Always start with 'en' on first render so server and client agree.
  // After hydration, switch to the detected locale.
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(detectInitialLocale())
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const t = useCallback(
    (key: DictKey) => dictionaries[locale][key] ?? dictionaries.en[key],
    [locale]
  )

  return { locale, setLocale, t }
}

export { LOCALES }
export type { Locale, DictKey }

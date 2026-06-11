'use client'

import { useLocale, LOCALES, type Locale } from '@/lib/i18n'

export const LocaleSelect = () => {
  const { locale, setLocale, t } = useLocale()

  return (
    <label className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-white/60">
      <span className="sr-only sm:not-sr-only">{t('language')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-black border border-white/20 px-2 py-1 text-xs font-bold uppercase tracking-[0.3em] text-white focus:border-[#57f1ff] outline-none"
        aria-label={t('language')}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-black">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}

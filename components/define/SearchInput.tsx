'use client'

import { useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 400

interface SearchInputProps {
  initialValue: string
  placeholder: string
  onSubmit: (word: string) => void
}

export const SearchInput = ({
  initialValue,
  placeholder,
  onSubmit,
}: SearchInputProps) => {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSubmittedRef = useRef(initialValue)

  // Autofocus on mount.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keep input in sync when parent changes initialValue (e.g. "did you mean" chip).
  useEffect(() => {
    setValue(initialValue)
    lastSubmittedRef.current = initialValue
  }, [initialValue])

  // Debounced auto-submit.
  useEffect(() => {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed || trimmed === lastSubmittedRef.current) return
    const t = setTimeout(() => {
      lastSubmittedRef.current = trimmed
      onSubmit(trimmed)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [value, onSubmit])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = value.trim().toLowerCase()
        if (!trimmed) return
        lastSubmittedRef.current = trimmed
        onSubmit(trimmed)
      }}
      className="w-full"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#57f1ff] outline-none text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter py-4 placeholder:text-white/20 caret-[#57f1ff] transition-colors"
      />
    </form>
  )
}

import { DefineClient } from './DefineClient'

export const metadata = {
  title: 'Define · Ben Crystal',
  description:
    'Look up any English word for both a formal Merriam-Webster definition and its Urban Dictionary slang counterpart, side by side.',
}

export default function DefinePage({
  searchParams,
}: {
  searchParams: { w?: string }
}) {
  const initialQuery = (searchParams.w ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  return <DefineClient initialQuery={initialQuery} />
}

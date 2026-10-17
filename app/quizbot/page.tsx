import type { Metadata } from 'next'
import Dashboard from './Dashboard'

export const metadata: Metadata = {
  title: 'Play It By Ear — quizbot dashboard',
  description: 'Analytics for the automated audio-quiz YouTube channel: packs, formats, cold-open A/B, pipeline health.',
  robots: { index: false, follow: false },
}

// /quizbot (also /audioquiz and /playitbyear via redirects). Read-only analytics. Data comes from
// /api/quizbot, which proxies the JSON the quizbot pipeline pushes nightly to this repo's `quizbot-data` branch.
export default function QuizbotPage() {
  return <Dashboard />
}

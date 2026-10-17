import type { Metadata } from 'next'
import Dashboard from './Dashboard'

export const metadata: Metadata = {
  title: 'Play It By Ear — quizbot dashboard',
  description: 'Analytics for the automated audio-quiz YouTube channel: packs, formats, cold-open A/B, pipeline health.',
  robots: { index: false, follow: false },
}

// /quizbot (also /audioquiz and /playitbyear via redirects). Read-only analytics; the data file is
// committed nightly by the quizbot repo's analytics workflow to public/quizbot/data.json.
export default function QuizbotPage() {
  return <Dashboard />
}

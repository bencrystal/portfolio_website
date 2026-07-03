import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FlowBot Privacy Policy · Ben Crystal',
  description:
    'Privacy policy for FlowBot, the iOS freestyle rap training app. Recordings and transcripts stay on your device — no accounts, no analytics, no tracking.',
  robots: { index: false },
}

const LAST_UPDATED = 'July 2, 2026'

export default function FlowBotPrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-neutral-300">
      <h1 className="text-3xl font-semibold text-white">FlowBot Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <p className="mt-8">
        FlowBot is a freestyle rap training app for iOS. It is built so that your
        practice stays private: everything you record and everything the app learns
        about your sessions lives on your device.
      </p>

      <h2 className="mt-10 text-xl font-medium text-white">What stays on your device</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6">
        <li>
          <strong className="text-neutral-100">Audio recordings</strong> of your
          sessions are stored only on your iPhone and are never uploaded anywhere.
        </li>
        <li>
          <strong className="text-neutral-100">Transcripts</strong> are generated with
          Apple&apos;s on-device speech recognition. Your voice audio never leaves the
          device for transcription.
        </li>
        <li>
          <strong className="text-neutral-100">Feedback and rhyme analysis</strong> run
          entirely on-device using Apple Intelligence.
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-medium text-white">
        No accounts, no analytics, no tracking
      </h2>
      <p className="mt-4">
        FlowBot has no user accounts, no sign-in, no third-party analytics, no
        advertising SDKs, and no tracking of any kind. We do not collect, sell, or
        share personal data.
      </p>

      <h2 className="mt-10 text-xl font-medium text-white">Themed prompt generation</h2>
      <p className="mt-4">
        If you use the premium themed-prompts feature, the app sends only your chosen
        theme and difficulty level to our server, which returns generated word prompts.
        No audio, transcripts, or personal information are sent. Requests are
        authorized using an anonymous Apple subscription token, which is also used for
        rate limiting; we cannot identify you from it.
      </p>

      <h2 className="mt-10 text-xl font-medium text-white">iCloud sync (premium)</h2>
      <p className="mt-4">
        If you subscribe to premium, session summaries (scores, hit rates, and
        timestamps — never audio or transcripts) sync through your own private iCloud
        database. This data is stored in your personal iCloud account under Apple&apos;s
        terms, and we have no access to it.
      </p>

      <h2 className="mt-10 text-xl font-medium text-white">Subscriptions</h2>
      <p className="mt-4">
        Subscriptions are processed entirely by Apple through the App Store. We never
        see or store your payment information. You can manage or cancel your
        subscription in your App Store account settings.
      </p>

      <h2 className="mt-10 text-xl font-medium text-white">Changes to this policy</h2>
      <p className="mt-4">
        If this policy changes, we will update this page and the date at the top.
      </p>

      <h2 className="mt-10 text-xl font-medium text-white">Contact</h2>
      <p className="mt-4">
        Questions? Email{' '}
        <a
          href="mailto:benjamincrystal8@gmail.com"
          className="text-white underline underline-offset-2"
        >
          benjamincrystal8@gmail.com
        </a>
        .
      </p>
    </main>
  )
}

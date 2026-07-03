import type { Metadata } from 'next'
import Background from '@/components/Background'

export const metadata: Metadata = {
  title: 'FlowBot Privacy Policy · Ben Crystal',
  description:
    'Privacy policy for FlowBot, the iOS freestyle rap training app. Recordings and transcripts stay on your device — no accounts, no analytics, no tracking.',
  robots: { index: false },
}

const LAST_UPDATED = 'July 2, 2026'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-medium text-white">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  )
}

export default function FlowBotPrivacyPage() {
  return (
    <>
      <Background text="🎤" fontSize={14} spacing={26} />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-neutral-300">
        <p className="text-sm uppercase tracking-widest text-neutral-500">FlowBot</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

        <p className="mt-8 border-l-2 border-neutral-700 pl-4 leading-relaxed">
          FlowBot is a freestyle rap training app for iOS. It is built so that your
          practice stays private: everything you record and everything the app learns
          about your sessions lives on your device.
        </p>

        <Section title="What stays on your device">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-neutral-100">Audio recordings</strong> of your
              sessions are stored only on your iPhone and are never uploaded anywhere.
            </li>
            <li>
              <strong className="text-neutral-100">Transcripts</strong> are generated
              with Apple&apos;s on-device speech recognition. Your voice audio never
              leaves the device for transcription.
            </li>
            <li>
              <strong className="text-neutral-100">Feedback and rhyme analysis</strong>{' '}
              run entirely on-device using Apple Intelligence.
            </li>
          </ul>
        </Section>

        <Section title="No accounts, no analytics, no tracking">
          <p>
            FlowBot has no user accounts, no sign-in, no third-party analytics, no
            advertising SDKs, and no tracking of any kind. We do not collect, sell, or
            share personal data.
          </p>
        </Section>

        <Section title="Themed prompt generation">
          <p>
            If you use the premium themed-prompts feature, the app sends only your
            chosen theme and difficulty level to our server, which returns generated
            word prompts. No audio, transcripts, or personal information are sent. The
            theme and difficulty are processed by a third-party AI provider (Anthropic)
            to generate the words; they receive no personal data. Requests are
            authorized using an anonymous Apple subscription token, which is also used
            for rate limiting; we cannot identify you from it.
          </p>
        </Section>

        <Section title="iCloud sync (premium)">
          <p>
            If you subscribe to premium, session summaries (scores, hit rates, and
            timestamps — never audio or transcripts) sync through your own private
            iCloud database. This data is stored in your personal iCloud account under
            Apple&apos;s terms, and we have no access to it.
          </p>
        </Section>

        <Section title="Subscriptions">
          <p>
            Subscriptions are processed entirely by Apple through the App Store. We
            never see or store your payment information. You can manage or cancel your
            subscription in your App Store account settings.
          </p>
        </Section>

        <Section title="Data deletion">
          <p>
            Delete the app to delete all data. Because everything is stored locally,
            removing FlowBot from your device removes your recordings, transcripts, and
            session history with it. Premium session summaries in your private iCloud
            database can be removed via iOS Settings &gt; iCloud &gt; Manage Storage.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>If this policy changes, we will update this page and the date at the top.</p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email{' '}
            <a
              href="mailto:benjamincrystal8@gmail.com"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              benjamincrystal8@gmail.com
            </a>
            .
          </p>
        </Section>
      </main>
    </>
  )
}

import type { Metadata } from 'next'
import Background from '@/components/Background'

export const metadata: Metadata = {
  title: 'Live Mic Privacy Policy · Ben Crystal',
  description:
    'Privacy policy for Live Mic, the iOS real-time autotune karaoke microphone app. Your voice never leaves your device — no recording, no accounts, no tracking.',
  robots: { index: false },
}

const LAST_UPDATED = 'September 20, 2026'

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

export default function LiveMicPrivacyPage() {
  return (
    <>
      <Background text="🎙️" fontSize={14} spacing={26} />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-neutral-300">
        <p className="text-sm uppercase tracking-widest text-neutral-500">Live Mic</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

        <p className="mt-8 border-l-2 border-neutral-700 pl-4 leading-relaxed">
          Live Mic is a real-time autotune karaoke microphone app for iOS. It is
          built so that your singing stays private: your voice is processed live on
          your device and is never recorded, stored, or transmitted.
        </p>

        <Section title="Your voice never leaves your phone">
          <p>
            The microphone audio is tuned and played back to your headphones in real
            time, entirely on-device. Live Mic does not record, store, upload, or
            analyze your audio anywhere else. When you stop the session, the audio is
            gone — there is nothing saved to keep or delete.
          </p>
        </Section>

        <Section title="No accounts, no ads, no tracking">
          <p>
            Live Mic has no user accounts, no sign-in, no analytics SDKs, no
            advertising, and does not track you across other apps or websites. We do
            not collect, sell, or share any personal data.
          </p>
        </Section>

        <Section title="What stays on your device">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-neutral-100">Settings</strong> like your key,
              effect choices, and app mode are stored only in the app&apos;s local
              storage.
            </li>
            <li>
              <strong className="text-neutral-100">Singing stats</strong> (total
              time and streaks) are stored locally and, if you use iCloud, in your
              personal iCloud key-value storage so they survive reinstalls. This data
            never includes audio and we have no access to it.
            </li>
          </ul>
        </Section>

        <Section title="Purchases">
          <p>
            The one-time unlock is processed entirely by Apple through the App
            Store. We never see or store your payment information.
          </p>
        </Section>

        <Section title="Data deletion">
          <p>
            Delete the app to delete everything it stores on your device. iCloud
            stat backups can be removed via iOS Settings &gt; iCloud &gt; Manage
            Storage.
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

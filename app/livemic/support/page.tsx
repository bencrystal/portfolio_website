import type { Metadata } from 'next'
import Background from '@/components/Background'

export const metadata: Metadata = {
  title: 'Live Mic Support · Ben Crystal',
  description:
    'Support for Live Mic, the iOS real-time autotune karaoke microphone app.',
  robots: { index: false },
}

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

export default function LiveMicSupportPage() {
  return (
    <>
      <Background text="🎙️" fontSize={14} spacing={26} />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-neutral-300">
        <p className="text-sm uppercase tracking-widest text-neutral-500">Live Mic</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Support</h1>

        <p className="mt-8 border-l-2 border-neutral-700 pl-4 leading-relaxed">
          Live Mic turns your iPhone into a real-time autotune karaoke microphone.
          Plug in wired headphones, play music from any app, and hear your voice
          tuned live as you sing.
        </p>

        <Section title="Quick answers">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-neutral-100">I can&apos;t hear the effect.</strong>{' '}
              Use wired headphones. On the phone speaker the output is deliberately
              limited to prevent feedback, and Bluetooth adds a noticeable delay.
            </li>
            <li>
              <strong className="text-neutral-100">How does it find my key?</strong>{' '}
              Go live and hum or sing along with your song for about ten seconds —
              Live Mic detects the key and tunes you to it automatically. Tap
              &ldquo;new song&rdquo; when you change tracks.
            </li>
            <li>
              <strong className="text-neutral-100">It stopped tuning mid-session.</strong>{' '}
              The free tier includes 10 minutes of tuned singing per day; after that
              the mic keeps working untuned until tomorrow. The one-time unlock
              removes the limit — no subscription.
            </li>
            <li>
              <strong className="text-neutral-100">Can I use my AirPods?</strong>{' '}
              AirPods work for listening, but Bluetooth audio adds delay that makes
              live monitoring feel late. Wired headphones give the real experience.
            </li>
            <li>
              <strong className="text-neutral-100">Restoring your purchase.</strong>{' '}
              Tap the unlock banner, then &ldquo;restore purchase&rdquo; on the
              unlock screen.
            </li>
          </ul>
        </Section>

        <Section title="Privacy">
          <p>
            Nothing you sing leaves your phone — no recording, no accounts, no ads.
            See the{' '}
            <a
              href="/livemic/privacy"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              privacy policy
            </a>
            .
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Found a bug or have a feature request? Email{' '}
            <a
              href="mailto:benjamincrystal8@gmail.com"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              benjamincrystal8@gmail.com
            </a>{' '}
            and I&apos;ll get back to you.
          </p>
        </Section>
      </main>
    </>
  )
}

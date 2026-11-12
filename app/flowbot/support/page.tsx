import type { Metadata } from 'next'
import Background from '@/components/Background'

export const metadata: Metadata = {
  title: 'FlowBot Support · Ben Crystal',
  description:
    'Support for FlowBot, the iOS freestyle rap training app — subscriptions, difficulty levels, rhyme scoring, and offline use.',
  robots: { index: false },
}

const LINK = 'text-white underline underline-offset-2 hover:text-neutral-300'

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

export default function FlowBotSupportPage() {
  return (
    <>
      <Background text="🎤" fontSize={14} spacing={26} />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-neutral-300">
        <p className="text-sm uppercase tracking-widest text-neutral-500">FlowBot</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Support</h1>

        <p className="mt-8 border-l-2 border-neutral-700 pl-4 leading-relaxed">
          FlowBot is a freestyle rap training app for iOS. Pick a beat, rhyme with the
          prompt words as they land, and review your bars afterwards.
        </p>

        <Section title="Subscription">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-neutral-100">How do I cancel?</strong> In FlowBot,
              open Settings and tap &ldquo;manage&rdquo; on the subscription card. Or on
              your iPhone go to Settings &gt; your name &gt; Subscriptions &gt; FlowBot
              Premium &gt; Cancel Subscription, or open{' '}
              <a href="https://apps.apple.com/account/subscriptions" className={LINK}>
                your App Store subscriptions
              </a>
              . Cancel at least 24 hours before the renewal date; premium stays active
              until the end of the period you&apos;ve paid for. Deleting the app does
              not cancel a subscription.
            </li>
            <li>
              <strong className="text-neutral-100">Can I get a refund?</strong> Apple
              handles all billing, so refunds are requested from Apple at{' '}
              <a href="https://reportaproblem.apple.com" className={LINK}>
                reportaproblem.apple.com
              </a>
              .
            </li>
            <li>
              <strong className="text-neutral-100">
                I subscribed but premium isn&apos;t unlocked.
              </strong>{' '}
              Open Settings in FlowBot and tap &ldquo;restore previous purchase&rdquo;
              (or &ldquo;restore&rdquo; on the upgrade screen). Make sure you&apos;re
              signed in with the Apple Account that bought it. With Ask to Buy, premium
              unlocks automatically once the purchase is approved.
            </li>
            <li>
              <strong className="text-neutral-100">What&apos;s free?</strong> Unlimited
              sessions on easy and medium, two beats plus a metronome pulse, and one
              premium beat free each day. Premium adds every beat, importing your own,
              themed prompts, hard difficulty, bar-by-bar feedback, and deeper stats.
            </li>
          </ul>
        </Section>

        <Section title="Difficulty levels">
          <p>
            Difficulty changes the prompt words you&apos;re given — not the tempo or how
            many prompts you get.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-neutral-100">Easy</strong> — short, very common
              words that are easy to rhyme, like &ldquo;fire&rdquo; or
              &ldquo;gold&rdquo;.
            </li>
            <li>
              <strong className="text-neutral-100">Medium</strong> — longer words and
              short phrases, like &ldquo;break the code&rdquo;.
            </li>
            <li>
              <strong className="text-neutral-100">Hard</strong> (premium) — less common
              words, longer phrases, and odd rhymes.
            </li>
          </ul>
          <p>
            Pacing is a separate setting: phrase length. Standard (16 beats) asks for two
            rhymes per phrase and extended (32 beats) asks for four; the prompt word
            counts as one.
          </p>
        </Section>

        <Section title="How rhyme scoring works">
          <p>
            After a session, FlowBot transcribes your recording on your iPhone and
            compares how your words sound — not how they&apos;re spelled — against each
            prompt word, using a pronunciation dictionary. Dropped g&apos;s count, so
            &ldquo;runnin&apos;&rdquo; is the same as &ldquo;running&rdquo;.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-neutral-100">Rhyme grades.</strong> Each rhyme is
              graded perfect, near, or family (a loose slant rhyme). Perfect and near
              count as hits; family doesn&apos;t. Repeating the prompt word isn&apos;t a
              rhyme with itself.
            </li>
            <li>
              <strong className="text-neutral-100">Phrase grades.</strong> Each phrase is
              split into four-beat bars. Rhyme in at least half of them for
              &ldquo;good&rdquo;, all of them for &ldquo;great&rdquo;, and add extra
              rhymes for &ldquo;on fire&rdquo;.
            </li>
            <li>
              <strong className="text-neutral-100">Score out of 100.</strong> Mostly your
              phrase grades, plus credit for avoiding filler words, minus a little for
              skipping the prompt word. A phrase cut off when the beat ends isn&apos;t
              scored.
            </li>
          </ul>
          <p>
            Scoring currently understands English only. On iPhones with Apple
            Intelligence you also get short written coaching notes; scores and grades
            work the same without it.
          </p>
        </Section>

        <Section title="Does it work offline?">
          <p>
            Yes. Beats, prompts, recording, transcription, scoring, and stats all run
            on your iPhone, with no connection needed. Two things use the internet:
            themed prompts (premium), which fall back to the built-in word list when
            you&apos;re offline, and buying or restoring a subscription.
          </p>
        </Section>

        <Section title="Quick answers">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-neutral-100">
                My session won&apos;t start, or my bars are missing.
              </strong>{' '}
              FlowBot needs the microphone. Check iPhone Settings &gt; Apps &gt; FlowBot
              and turn on Microphone and Speech Recognition.
            </li>
            <li>
              <strong className="text-neutral-100">Should I use headphones?</strong> Yes.
              On the phone speaker the beat bleeds into the mic and muddies the
              transcript. Wired headphones keep the tightest timing; Bluetooth adds
              delay.
            </li>
            <li>
              <strong className="text-neutral-100">Importing your own beats.</strong>{' '}
              With premium, open the beat picker and tap &ldquo;add your own beat&rdquo;
              to import an audio file (up to 10 minutes long, up to 50 beats). Remove
              them in Settings under &ldquo;your beats&rdquo;.
            </li>
            <li>
              <strong className="text-neutral-100">Where are my recordings?</strong> Only
              on your iPhone. FlowBot keeps audio for your ten most recent sessions and
              keeps scores and stats for all of them. Deleting the app deletes
              everything.
            </li>
            <li>
              <strong className="text-neutral-100">Which iPhones are supported?</strong>{' '}
              FlowBot needs iOS 26 or later.
            </li>
          </ul>
        </Section>

        <Section title="Privacy">
          <p>
            Your recordings and transcripts stay on your device — no accounts, no ads.
            See the{' '}
            <a href="/flowbot/privacy" className={LINK}>
              privacy policy
            </a>
            .
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or feedback? Email{' '}
            <a href="mailto:benjamincrystal8@gmail.com" className={LINK}>
              benjamincrystal8@gmail.com
            </a>
            .
          </p>
        </Section>
      </main>
    </>
  )
}

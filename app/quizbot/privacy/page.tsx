import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play It By Ear — Privacy Policy',
  description: 'Privacy policy for the Play It By Ear audio-quiz channel and its publishing tools.',
}

// Required by Meta/TikTok developer apps. The quizbot app publishes the channel's own videos to accounts
// it owns and reads their analytics; it never collects data from viewers.
export default function QuizbotPrivacyPage() {
  return (
    <main className="min-h-screen text-white">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-[15px] leading-relaxed" style={{ color: '#c3c2b7' }}>
        <h1 className="text-3xl font-semibold" style={{ color: '#f0efec' }}>Play It By Ear — Privacy Policy</h1>
        <p style={{ color: '#8a897f' }}>Last updated: October 18, 2026</p>

        <p>
          Play It By Ear is an audio-quiz video series published by Ben Crystal LLC on YouTube, Instagram,
          Facebook and TikTok. The software behind it (&ldquo;quizbot&rdquo;) is an automated publishing tool used only
          by Ben Crystal LLC to post the series&rsquo; own videos to accounts it owns and to read the analytics those
          platforms provide about those posts.
        </p>

        <h2 className="text-xl font-semibold pt-2" style={{ color: '#f0efec' }}>What the tool accesses</h2>
        <p>
          Through each platform&rsquo;s official API, and only with permissions granted by the account owner, quizbot
          can publish videos and captions to the Play It By Ear accounts, organise them into playlists, and read
          aggregate performance metrics for those videos (views, watch time, likes, shares, comments counts). It
          may read public comments on its own videos to display them on an internal dashboard.
        </p>

        <h2 className="text-xl font-semibold pt-2" style={{ color: '#f0efec' }}>What it does not do</h2>
        <p>
          quizbot does not collect, store or process personal information from viewers or from any user other than
          the account owner. It has no sign-up, no tracking, no advertising identifiers and no third-party data
          sharing. Platform access tokens are stored privately and used solely to operate the accounts above.
        </p>

        <h2 className="text-xl font-semibold pt-2" style={{ color: '#f0efec' }}>Data retention and deletion</h2>
        <p>
          Aggregate analytics are kept to improve the series. Access can be revoked at any time from the
          respective platform&rsquo;s app settings, after which the tool can no longer access that account. To request
          deletion of any data associated with you, or for any question about this policy, email{' '}
          <a href="mailto:benjamincrystal8@gmail.com" className="underline">benjamincrystal8@gmail.com</a>.
        </p>

        <h2 className="text-xl font-semibold pt-2" style={{ color: '#f0efec' }}>Contact</h2>
        <p>Ben Crystal LLC, Brooklyn, NY — benjamincrystal8@gmail.com</p>
      </div>
    </main>
  )
}

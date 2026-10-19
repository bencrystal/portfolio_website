import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play It By Ear — Terms of Service',
  description: 'Terms of service for the Play It By Ear publishing tool (quizbot).',
}

// Required by the TikTok developer app review alongside /quizbot/privacy.
export default function QuizbotTermsPage() {
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-semibold pt-2" style={{ color: '#f0efec' }}>{children}</h2>
  return (
    <main className="min-h-screen text-white">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-[15px] leading-relaxed" style={{ color: '#c3c2b7' }}>
        <h1 className="text-3xl font-semibold" style={{ color: '#f0efec' }}>Play It By Ear — Terms of Service</h1>
        <p style={{ color: '#8a897f' }}>Last updated: October 18, 2026</p>
        <p>
          &ldquo;quizbot&rdquo; is a private, single-operator publishing tool built and used by Ben Crystal LLC to post the
          Play It By Ear audio-quiz series to social accounts the company owns (YouTube, Instagram, Facebook and
          TikTok) and to read the performance analytics those platforms provide for its own posts.
        </p>
        <H>Who may use it</H>
        <p>The tool is not offered to the public. The only user is the account owner, Ben Crystal LLC. No one else can sign up, log in, or have content published on their behalf.</p>
        <H>Content</H>
        <p>Every video it publishes is produced by Ben Crystal LLC. Third-party material (for example Creative Commons bird recordings) is used under its licence and credited in the video description.</p>
        <H>Platform rules</H>
        <p>Use of each platform&rsquo;s API is subject to that platform&rsquo;s own terms, and the tool follows them: it posts only to accounts that authorised it, honours rate limits, and stops when access is revoked.</p>
        <H>Liability</H>
        <p>The tool is provided as is, for the company&rsquo;s own use, with no warranty to any third party.</p>
        <H>Contact</H>
        <p>Questions: benjamincrystal8@gmail.com. See also the <a href="/quizbot/privacy" className="underline">privacy policy</a>.</p>
      </div>
    </main>
  )
}

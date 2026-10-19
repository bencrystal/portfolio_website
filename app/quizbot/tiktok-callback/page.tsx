'use client'

import { useEffect, useState } from 'react'

// OAuth redirect target for the TikTok developer app (and any future platform). TikTok requires the redirect
// domain to be one the developer owns, so it lives here rather than on github.com. It only shows the code the
// platform appended to the URL so the owner can paste it into the exchange workflow; nothing is stored or sent.
export default function TikTokCallbackPage() {
  const [params, setParams] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    setParams(Object.fromEntries(new URLSearchParams(window.location.search).entries()))
  }, [])
  const code = params.code
  return (
    <main className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-5 text-[15px]" style={{ color: '#c3c2b7' }}>
        <h1 className="text-2xl font-semibold" style={{ color: '#f0efec' }}>Play It By Ear — authorization received</h1>
        {code ? (
          <>
            <p>Paste this whole URL (or just the code) into the chat with Claude, or into the <code>tiktok_auth</code> workflow&rsquo;s <code>code</code> input. It expires within minutes.</p>
            <pre className="rounded border p-3 overflow-x-auto text-xs" style={{ borderColor: '#2a2a2e', color: '#f0efec' }}>{code}</pre>
            <button className="rounded border px-3 py-1.5 text-sm" style={{ borderColor: '#2a2a2e', color: '#f0efec' }}
              onClick={() => { navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true)) }}>
              {copied ? 'Copied the full URL' : 'Copy the full URL'}
            </button>
          </>
        ) : params.error ? (
          <p>The platform returned an error: <code>{params.error}</code> {params.error_description ? `— ${params.error_description}` : ''}</p>
        ) : (
          <p>Nothing to see here: this page only shows an authorization code when a platform redirects to it.</p>
        )}
      </div>
    </main>
  )
}

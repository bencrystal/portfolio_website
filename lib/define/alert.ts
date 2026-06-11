/**
 * Sends an email alert (via Resend) when Merriam-Webster's daily quota
 * is exhausted. Deduplicated to at most one send per UTC day per instance —
 * Vercel edge instances are short-lived, so worst case is a handful of alerts
 * per day, which is acceptable.
 */

let lastAlertDate: string | null = null

const todayUtc = (): string => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

interface AlertContext {
  word: string
  origin: string
}

export const sendRateLimitAlert = async ({ word, origin }: AlertContext): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.DEFINE_ALERT_TO || 'benjamincrystal8@gmail.com'

  if (!apiKey) return // silently skip if not configured

  const today = todayUtc()
  if (lastAlertDate === today) return
  lastAlertDate = today

  const timestamp = new Date().toISOString()

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Define Alerts <onboarding@resend.dev>',
        to: [to],
        subject: `[bencrystal.com/define] Merriam-Webster daily limit reached`,
        text: [
          `Merriam-Webster returned a quota/limit response.`,
          ``,
          `Timestamp (UTC): ${timestamp}`,
          `Triggering word: ${word}`,
          `Origin:          ${origin}`,
          ``,
          `The /define page is now showing users a "limit reached" notice on the formal panel.`,
          `Quota resets at midnight ET (per MW Collegiate terms).`,
        ].join('\n'),
      }),
      signal: AbortSignal.timeout(5000),
    })

    // If Resend rejects (bad key, quota, etc.), allow a retry tomorrow rather
    // than re-trying immediately.
    if (!res.ok) lastAlertDate = null
  } catch {
    lastAlertDate = null
  }
}

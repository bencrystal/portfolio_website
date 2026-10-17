import crypto from "crypto";

// Google Calendar hook for the Scribe "calendar" bucket: when a capture
// routes there, the raw text goes to the Calendar API's quickAdd, which
// does its own natural-language date parsing ("dinner with Sam thursday
// at 7pm"), and the created event's link is stored on the todo.
//
// Auth is a service account (no OAuth flow): the account's email must be
// granted "Make changes to events" on the target calendar in Google
// Calendar's sharing settings. Env vars:
//   GCAL_SA_EMAIL       service account email
//   GCAL_SA_PRIVATE_KEY service account private key (PEM; \n escapes ok)
//   GCAL_CALENDAR_ID    target calendar, usually the gmail address
//   GCAL_BUCKET_NAME    bucket that triggers events (default "calendar")

type NamedBucket = { id: string; name: string };

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// quickAdd resolves a bare weekday against the current calendar week, so
// "monday at 3pm" captured on a Friday lands on the Monday four days ago.
// Rewrite every weekday mention (with or without a "this"/"next"/"on"
// qualifier) to its next upcoming date so the event always goes forward.
// Today's weekday counts as upcoming, so "friday" said on a Friday is today.
export function pinWeekdaysToUpcoming(text: string, now = new Date()): string {
  const tz = process.env.GCAL_TIMEZONE ?? "America/New_York";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const todayIdx = WEEKDAYS.indexOf(parts.weekday.toLowerCase());
  // A pure calendar date in the user's timezone; UTC math from here on is
  // safe because no hours are involved.
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));

  return text.replace(
    /\b(?:(?:this|next)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi,
    (_, day: string) => {
      const offset = (WEEKDAYS.indexOf(day.toLowerCase()) - todayIdx + 7) % 7;
      const target = new Date(today + offset * 86_400_000);
      const name = day[0].toUpperCase() + day.slice(1).toLowerCase();
      return `${name} ${MONTHS[target.getUTCMonth()]} ${target.getUTCDate()} ${target.getUTCFullYear()}`;
    },
  );
}

export function calendarBucketId(buckets: NamedBucket[]): string | null {
  const wanted = (process.env.GCAL_BUCKET_NAME ?? "calendar").trim().toLowerCase();
  return buckets.find((b) => b.name.trim().toLowerCase() === wanted)?.id ?? null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const email = process.env.GCAL_SA_EMAIL;
  // Vercel env vars hold the PEM with literal \n sequences.
  const key = process.env.GCAL_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("GCAL_SA_EMAIL / GCAL_SA_PRIVATE_KEY not set");

  const now = Math.floor(Date.now() / 1000);
  const b64 = (s: string) => Buffer.from(s).toString("base64url");
  const unsigned =
    b64(JSON.stringify({ alg: "RS256", typ: "JWT" })) +
    "." +
    b64(
      JSON.stringify({
        iss: email,
        scope: "https://www.googleapis.com/auth/calendar.events",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    );
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${await res.text()}`);
  const { access_token, expires_in } = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = { token: access_token, expiresAt: Date.now() + expires_in * 1000 };
  return access_token;
}

// Returns the created event's htmlLink, or null when the todo is not
// bound for the calendar bucket or event creation fails. Failures only
// log: a capture must never be lost over a calendar hiccup.
export async function maybeCreateCalendarEvent(
  text: string,
  bucketId: string | null,
  buckets: NamedBucket[],
): Promise<string | null> {
  if (!bucketId || bucketId !== calendarBucketId(buckets)) return null;
  const calendarId = process.env.GCAL_CALENDAR_ID;
  if (!calendarId) {
    console.error("scribe calendar event skipped: GCAL_CALENDAR_ID not set");
    return null;
  }
  try {
    const token = await accessToken();
    const pinned = pinWeekdaysToUpcoming(text);
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}` +
      `/events/quickAdd?text=${encodeURIComponent(pinned)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`quickAdd failed: ${await res.text()}`);
    const event = (await res.json()) as { htmlLink?: string };
    return event.htmlLink ?? null;
  } catch (err) {
    console.error("scribe calendar event failed:", err);
    return null;
  }
}

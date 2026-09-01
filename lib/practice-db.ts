import { scribeDb } from "@/lib/scribe-db";

// Multi-user "spaces": each password in practice_spaces names one person's
// private set of exercises/sessions, doubling as identity and edit rights.
// The env PRACTICE_TOKEN keeps working as the default (owner's) password so
// already-saved devices don't break.

export async function spaceForToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  if (process.env.PRACTICE_TOKEN && token === process.env.PRACTICE_TOKEN) return defaultSpaceId();
  const { data } = await scribeDb.from("practice_spaces").select("id").eq("password", token).maybeSingle();
  return data?.id ?? null;
}

// The space shown to visitors without a password (the site owner's).
export async function defaultSpaceId(): Promise<string | null> {
  const { data } = await scribeDb.from("practice_spaces").select("id").eq("is_default", true).maybeSingle();
  return data?.id ?? null;
}

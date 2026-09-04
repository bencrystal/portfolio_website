// Keyword auto-routing: file a new capture into a bucket from its words.
//
// Rules (in order):
// 1. Leading trigger: if the text starts with a bucket's alias, file it
//    there and strip the alias from the saved text ("lyric love is a
//    landline" -> "love is a landline" in the lyrics bucket).
// 2. Alias anywhere: otherwise, if exactly one bucket's alias appears
//    anywhere in the text, file it there (text untouched).
// In both passes, if two different buckets match, the capture stays in
// Unsorted rather than guessing; a misfile into a quiet bucket would
// vanish from the All view silently.
//
// Aliases are a comma-separated per-bucket list; when unset, the bucket
// name is the only alias. Matching is case-insensitive on word
// boundaries, so "live mic" and "livemic" can both point at one bucket.

type RoutableBucket = { id: string; name: string; aliases?: string | null };

function aliasesOf(b: RoutableBucket): string[] {
  const raw = b.aliases?.trim() ? b.aliases : b.name;
  return raw
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BOUNDARY = "[^\\p{L}\\p{N}]";

export function routeCapture(
  text: string,
  buckets: RoutableBucket[],
): { text: string; bucketId: string | null } {
  // Leading trigger pass: longest matching alias per bucket, so "live mic"
  // beats "live" when both are aliases of the same bucket.
  const leading: { id: string; alias: string }[] = [];
  for (const b of buckets) {
    let best: string | null = null;
    for (const alias of aliasesOf(b)) {
      const re = new RegExp(`^${escapeRegex(alias)}(?=${BOUNDARY}|$)`, "iu");
      if (re.test(text) && (!best || alias.length > best.length)) best = alias;
    }
    if (best) leading.push({ id: b.id, alias: best });
  }
  if (leading.length === 1) {
    const stripped = text.slice(leading[0].alias.length).replace(/^[\s,.:;!-]+/, "");
    // A capture that was only the trigger word keeps its text.
    return { text: stripped || text, bucketId: leading[0].id };
  }
  if (leading.length > 1) return { text, bucketId: null };

  // Alias-anywhere pass: no stripping, and only when the match is unique.
  const anywhere = buckets.filter((b) =>
    aliasesOf(b).some((alias) =>
      new RegExp(`(^|${BOUNDARY})${escapeRegex(alias)}(?=${BOUNDARY}|$)`, "iu").test(text),
    ),
  );
  return { text, bucketId: anywhere.length === 1 ? anywhere[0].id : null };
}

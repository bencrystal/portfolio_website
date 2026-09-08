import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { scribeDb, validListToken } from "@/lib/scribe-db";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// The same fallback the router uses: no aliases means the bucket name.
function wordsOf(b: { name: string; aliases?: string | null }): string[] {
  return (b.aliases?.trim() ? b.aliases : b.name)
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

// POST { bucketId } -> { words: string[] }
// Asks Haiku for extra routing keywords that point exclusively at this
// bucket; the client then offers each word for one-tap acceptance.
export async function POST(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }
  const { bucketId } = await req.json();
  if (!bucketId) return NextResponse.json({ error: "missing bucketId" }, { status: 400 });

  const [bucketsRes, tasksRes] = await Promise.all([
    scribeDb.from("buckets").select("id, name, aliases"),
    scribeDb
      .from("todos")
      .select("text")
      .eq("bucket_id", bucketId)
      .is("deleted_at", null)
      .order("position", { ascending: false })
      .limit(30),
  ]);
  const buckets = bucketsRes.data ?? [];
  const target = buckets.find((b) => b.id === bucketId);
  if (!target) return NextResponse.json({ error: "bucket not found" }, { status: 404 });

  const others = buckets
    .filter((b) => b.id !== bucketId)
    .map((b) => `${b.name}: ${wordsOf(b).join(", ")}`)
    .join("\n");
  const samples = (tasksRes.data ?? []).map((t) => `- ${t.text}`).join("\n");

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system:
      "You suggest routing keywords for a personal note-capture app. A routing keyword files a new note into a category when it appears in the note. Good keywords are words someone would naturally say or type when a note belongs to the target category, and would essentially never appear in notes belonging to any other category. Respond with ONLY a JSON array of 4 to 8 lowercase single words or two-word phrases. No prose, no code fences.",
    messages: [
      {
        role: "user",
        content: `Target category: "${target.name}"\nIts current keywords: ${wordsOf(target).join(", ")}\n\nOther categories and their keywords (suggestions must NOT overlap with these or plausibly belong to them):\n${others || "(none)"}\n\nRecent notes filed in the target category:\n${samples || "(none yet)"}`,
      },
    ],
  });

  const raw = response.content.find((b) => b.type === "text")?.text ?? "[]";
  let words: string[] = [];
  try {
    // Tolerate stray text around the array.
    const match = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : raw);
    if (Array.isArray(parsed)) words = parsed.filter((w): w is string => typeof w === "string");
  } catch {
    return NextResponse.json({ words: [] });
  }

  // Drop anything a bucket already claims; those would conflict or be moot.
  const claimed = new Set(buckets.flatMap(wordsOf));
  words = Array.from(new Set(words.map((w) => w.trim().toLowerCase()))).filter((w) => w && !claimed.has(w));

  return NextResponse.json({ words });
}

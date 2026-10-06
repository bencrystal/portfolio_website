import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// "crosspoint-reader" and "Crosspoint Reader" should compare equal.
function normalize(s: string) {
  return s.toLowerCase().replace(/[-_]+/g, " ").trim();
}

// A repo auto-files into a bucket only when exactly one bucket's name or
// routing word matches the repo name; ambiguity (VAW vs VAW DEMO) stays
// unassigned so Ben can pick from the web dropdown.
async function matchBucket(repo: string): Promise<string | null> {
  const { data: buckets } = await scribeDb.from("buckets").select("id, name, aliases");
  if (!buckets) return null;
  const target = normalize(repo);
  const hits = buckets.filter((b) => {
    if (normalize(b.name) === target) return true;
    const words: string[] = (b.aliases ?? "").split(",").map((w: string) => normalize(w)).filter(Boolean);
    return words.includes(target);
  });
  return hits.length === 1 ? hits[0].id : null;
}

// All methods require ?token=<LIST_TOKEN>

// GET -> { repos } (newest activity first)
export async function GET(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { data, error } = await scribeDb
    .from("repo_notes")
    .select("repo, bucket_id, summary, last_commit, dirty, updated_at")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ repos: data });
}

// POST { repo, summary, last_commit, dirty } from the Mac scanner.
// Known repos keep their bucket assignment; new repos get auto-matched.
export async function POST(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { repo, summary, last_commit, dirty } = await req.json();
  if (!repo?.trim()) return NextResponse.json({ error: "missing repo" }, { status: 400 });

  const fields = {
    summary: summary ?? null,
    last_commit: last_commit ?? null,
    dirty: dirty ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await scribeDb.from("repo_notes").select("repo").eq("repo", repo).maybeSingle();
  const row = existing
    ? fields
    : { repo, bucket_id: await matchBucket(repo), ...fields };

  const query = existing
    ? scribeDb.from("repo_notes").update(row).eq("repo", repo)
    : scribeDb.from("repo_notes").insert(row);
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH { repo, bucket_id } (uuid or null) -> assign/unassign a bucket.
export async function PATCH(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { repo, bucket_id } = await req.json();
  if (!repo) return NextResponse.json({ error: "missing repo" }, { status: 400 });
  const { error } = await scribeDb
    .from("repo_notes")
    .update({ bucket_id: bucket_id ?? null })
    .eq("repo", repo);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE { repo } -> drop a repo's recap (e.g., archived project).
export async function DELETE(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { repo } = await req.json();
  if (!repo) return NextResponse.json({ error: "missing repo" }, { status: 400 });
  const { error } = await scribeDb.from("repo_notes").delete().eq("repo", repo);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { scribeDb } from "@/lib/scribe-db";
import { spaceForToken } from "@/lib/practice-db";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "practice";
const MAX_BYTES = 10 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

// POST multipart/form-data { file, exercise_id } with ?token=<PRACTICE_TOKEN>.
// Stores the file in a public bucket and points the exercise's ref_url at it.
export async function POST(req: NextRequest) {
  const space = await spaceForToken(req.nextUrl.searchParams.get("token"));
  if (!space) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const exerciseId = form.get("exercise_id");
  if (!(file instanceof File) || typeof exerciseId !== "string" || !exerciseId) {
    return NextResponse.json({ error: "missing file or exercise_id" }, { status: 400 });
  }
  const ext = EXT_BY_MIME[file.type];
  if (!ext) return NextResponse.json({ error: "only images or PDF" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large (10MB max)" }, { status: 400 });

  const path = `refs/${exerciseId}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  let { error: upErr } = await scribeDb.storage.from(BUCKET).upload(path, bytes, { contentType: file.type });
  if (upErr && /bucket not found/i.test(upErr.message)) {
    // First ever upload: create the public bucket, then retry.
    await scribeDb.storage.createBucket(BUCKET, { public: true });
    ({ error: upErr } = await scribeDb.storage.from(BUCKET).upload(path, bytes, { contentType: file.type }));
  }
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = scribeDb.storage.from(BUCKET).getPublicUrl(path);
  const { data: exercise, error } = await scribeDb
    .from("practice_exercises")
    .update({ ref_url: pub.publicUrl })
    .eq("id", exerciseId)
    .eq("space_id", space)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise });
}

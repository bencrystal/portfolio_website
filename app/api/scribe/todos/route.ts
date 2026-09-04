import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";
import { routeCapture } from "@/lib/scribe-routing";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// New items get position = seconds since epoch, so higher position = newer.
// Reordering assigns fractional positions between neighbors.
function nowPosition() {
  return Date.now() / 1000;
}

// All methods require ?token=<LIST_TOKEN>

// GET            -> { todos, buckets } (non-deleted todos)
// GET ?deleted=1 -> { todos } (recently deleted, newest first)
export async function GET(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();

  // Lazy purge: anything soft-deleted more than 30 days ago is gone for good.
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  await scribeDb.from("todos").delete().not("deleted_at", "is", null).lt("deleted_at", cutoff);

  if (req.nextUrl.searchParams.get("deleted") === "1") {
    const { data, error } = await scribeDb
      .from("todos")
      .select("id, created_at, text, done, bucket_id, position, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ todos: data });
  }

  const [todosRes, bucketsRes] = await Promise.all([
    scribeDb
      .from("todos")
      .select("id, created_at, text, done, bucket_id, position, all_position")
      .is("deleted_at", null)
      .order("position", { ascending: false }),
    scribeDb
      .from("buckets")
      .select("id, name, position, hidden, quiet, color")
      .order("position", { ascending: true }),
  ]);
  if (todosRes.error) return NextResponse.json({ error: todosRes.error.message }, { status: 500 });
  if (bucketsRes.error) return NextResponse.json({ error: bucketsRes.error.message }, { status: 500 });
  return NextResponse.json({ todos: todosRes.data, buckets: bucketsRes.data });
}

export async function POST(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { text, bucket_id } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "missing text" }, { status: 400 });
  // Unsorted adds (voice or typed, any client) run through keyword routing;
  // adds made from inside a bucket keep their explicit bucket.
  let finalText = text.trim();
  let finalBucket: string | null = bucket_id ?? null;
  if (!finalBucket) {
    const { data: routable } = await scribeDb.from("buckets").select("id, name, aliases");
    ({ text: finalText, bucketId: finalBucket } = routeCapture(finalText, routable ?? []));
  }
  const { data, error } = await scribeDb
    .from("todos")
    .insert({ text: finalText, bucket_id: finalBucket, position: nowPosition(), all_position: nowPosition() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ todo: data });
}

// PATCH { id, done? , text?, bucket_id? (uuid or null), position?, restore? }
export async function PATCH(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id, ...fields } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof fields.done === "boolean") updates.done = fields.done;
  if (typeof fields.text === "string" && fields.text.trim()) updates.text = fields.text.trim();
  if ("bucket_id" in fields) updates.bucket_id = fields.bucket_id ?? null;
  if (typeof fields.position === "number") updates.position = fields.position;
  if (typeof fields.all_position === "number") updates.all_position = fields.all_position;
  if (fields.restore === true) updates.deleted_at = null;
  if (!id || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "missing id or fields" }, { status: 400 });
  }
  const { data, error } = await scribeDb.from("todos").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ todo: data });
}

// DELETE is a soft delete; items are restorable for 30 days via PATCH restore.
export async function DELETE(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await scribeDb
    .from("todos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

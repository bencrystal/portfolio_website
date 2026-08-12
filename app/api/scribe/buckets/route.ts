import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// All methods require ?token=<LIST_TOKEN>

export async function GET(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { data, error } = await scribeDb
    .from("buckets")
    .select("id, name, position, hidden")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ buckets: data });
}

export async function POST(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "missing name" }, { status: 400 });
  const { data, error } = await scribeDb
    .from("buckets")
    .insert({ name: name.trim(), position: Date.now() / 1000 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bucket: data });
}

// PATCH { id, name?, position?, hidden? }
export async function PATCH(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id, ...fields } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof fields.name === "string" && fields.name.trim()) updates.name = fields.name.trim();
  if (typeof fields.position === "number") updates.position = fields.position;
  if (typeof fields.hidden === "boolean") updates.hidden = fields.hidden;
  if (!id || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "missing id or fields" }, { status: 400 });
  }
  const { data, error } = await scribeDb.from("buckets").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bucket: data });
}

// DELETE { id }: items in the bucket go back to Unsorted (FK on delete set null).
export async function DELETE(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await scribeDb.from("buckets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

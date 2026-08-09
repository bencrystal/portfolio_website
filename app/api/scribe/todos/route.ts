import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// All methods require ?token=<LIST_TOKEN>

export async function GET(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { data, error } = await scribeDb
    .from("todos")
    .select("id, created_at, text, done")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ todos: data });
}

export async function POST(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "missing text" }, { status: 400 });
  const { data, error } = await scribeDb.from("todos").insert({ text: text.trim() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ todo: data });
}

export async function PATCH(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id, ...fields } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof fields.done === "boolean") updates.done = fields.done;
  if (typeof fields.text === "string" && fields.text.trim()) updates.text = fields.text.trim();
  if (!id || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "missing id or fields" }, { status: 400 });
  }
  const { data, error } = await scribeDb.from("todos").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ todo: data });
}

export async function DELETE(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await scribeDb.from("todos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

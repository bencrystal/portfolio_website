import { NextRequest, NextResponse } from "next/server";
import { scribeDb } from "@/lib/scribe-db";
import { validPracticeToken } from "@/lib/practice-db";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// Reading is public; mutations require ?token=<PRACTICE_TOKEN>.

export async function GET() {
  const { data, error } = await scribeDb
    .from("practice_sessions")
    .select("id, exercise_id, date, bpm, seconds, note, variant, created_at")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

// POST { exercise_id, date "yyyy-mm-dd", bpm?, seconds?, note?, variant? "down"|"up" }
export async function POST(req: NextRequest) {
  if (!validPracticeToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { exercise_id, date, bpm, seconds, note, variant } = await req.json();
  if (!exercise_id || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
    return NextResponse.json({ error: "missing exercise_id or date" }, { status: 400 });
  }
  const row = {
    exercise_id,
    date,
    bpm: typeof bpm === "number" ? Math.round(bpm) : null,
    seconds: typeof seconds === "number" ? Math.round(seconds) : null,
    note: typeof note === "string" && note.trim() ? note.trim() : null,
    variant: variant === "down" || variant === "up" ? variant : null,
  };
  const { data, error } = await scribeDb.from("practice_sessions").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

// PATCH { id, date?, bpm?, seconds?, note?, variant? } — null clears optional fields.
export async function PATCH(req: NextRequest) {
  if (!validPracticeToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id, ...fields } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof fields.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fields.date)) updates.date = fields.date;
  if ("bpm" in fields) updates.bpm = typeof fields.bpm === "number" ? Math.round(fields.bpm) : null;
  if ("seconds" in fields) updates.seconds = typeof fields.seconds === "number" ? Math.round(fields.seconds) : null;
  if ("note" in fields) {
    updates.note = typeof fields.note === "string" && fields.note.trim() ? fields.note.trim() : null;
  }
  if ("variant" in fields) {
    updates.variant = fields.variant === "down" || fields.variant === "up" ? fields.variant : null;
  }
  if (!id || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "missing id or fields" }, { status: 400 });
  }
  const { data, error } = await scribeDb
    .from("practice_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

export async function DELETE(req: NextRequest) {
  if (!validPracticeToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await scribeDb.from("practice_sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

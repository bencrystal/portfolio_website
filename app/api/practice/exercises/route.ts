import { NextRequest, NextResponse } from "next/server";
import { scribeDb } from "@/lib/scribe-db";
import { defaultSpaceId, spaceForToken } from "@/lib/practice-db";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// Reads show the token's space (or the default space without a token);
// mutations require ?token=<space password> and are scoped to that space.

async function readSpace(req: NextRequest): Promise<string | null | "bad-token"> {
  const token = req.nextUrl.searchParams.get("token");
  if (token) return (await spaceForToken(token)) ?? "bad-token";
  return defaultSpaceId();
}

export async function GET(req: NextRequest) {
  const space = await readSpace(req);
  if (space === "bad-token") return unauthorized();
  if (!space) return NextResponse.json({ exercises: [] });
  const { data, error } = await scribeDb
    .from("practice_exercises")
    .select("id, name, position, archived, ref_url, track_variants, description, target_bpm")
    .eq("space_id", space)
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercises: data });
}

export async function POST(req: NextRequest) {
  const space = await spaceForToken(req.nextUrl.searchParams.get("token"));
  if (!space) return unauthorized();
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "missing name" }, { status: 400 });
  const { data, error } = await scribeDb
    .from("practice_exercises")
    .insert({ name: name.trim(), position: Date.now() / 1000, space_id: space })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data });
}

// PATCH { id, name?, position?, archived?, track_variants?, description?, ref_url? (null clears) }
export async function PATCH(req: NextRequest) {
  const space = await spaceForToken(req.nextUrl.searchParams.get("token"));
  if (!space) return unauthorized();
  const { id, ...fields } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof fields.name === "string" && fields.name.trim()) updates.name = fields.name.trim();
  if (typeof fields.position === "number") updates.position = fields.position;
  if (typeof fields.archived === "boolean") updates.archived = fields.archived;
  if (typeof fields.track_variants === "boolean") updates.track_variants = fields.track_variants;
  if ("description" in fields) {
    updates.description =
      typeof fields.description === "string" && fields.description.trim() ? fields.description.trim() : null;
  }
  if ("target_bpm" in fields) {
    updates.target_bpm =
      typeof fields.target_bpm === "number" && fields.target_bpm > 0 ? Math.round(fields.target_bpm) : null;
  }
  if ("ref_url" in fields) {
    updates.ref_url =
      typeof fields.ref_url === "string" && /^https?:\/\//.test(fields.ref_url.trim())
        ? fields.ref_url.trim()
        : null;
  }
  if (!id || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "missing id or fields" }, { status: 400 });
  }
  const { data, error } = await scribeDb
    .from("practice_exercises")
    .update(updates)
    .eq("id", id)
    .eq("space_id", space)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data });
}

// DELETE { id }: sessions for the exercise are removed too (FK cascade).
export async function DELETE(req: NextRequest) {
  const space = await spaceForToken(req.nextUrl.searchParams.get("token"));
  if (!space) return unauthorized();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await scribeDb.from("practice_exercises").delete().eq("id", id).eq("space_id", space);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

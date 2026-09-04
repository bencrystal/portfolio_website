import { NextRequest, NextResponse } from "next/server";
import { scribeDb } from "@/lib/scribe-db";
import { defaultSpaceId, spaceForToken } from "@/lib/practice-db";

// Skill tree: a shared catalog of nodes (space_id null) plus personal grafts
// (space_id set), and per-space progress. Starting a node spawns a normal
// practice_exercises row so all existing logging/chart machinery applies.

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

async function readSpace(req: NextRequest): Promise<string | null | "bad-token"> {
  const token = req.nextUrl.searchParams.get("token");
  if (token) return (await spaceForToken(token)) ?? "bad-token";
  return defaultSpaceId();
}

export async function GET(req: NextRequest) {
  const space = await readSpace(req);
  if (space === "bad-token") return unauthorized();
  if (!space) return NextResponse.json({ nodes: [], progress: [] });
  const [nodes, progress] = await Promise.all([
    scribeDb
      .from("practice_tree_nodes")
      .select("id, branch, position, parent_node_id, name, description, gate_type, gate_value, space_id, tier, ref_url")
      .or(`space_id.is.null,space_id.eq.${space}`)
      .order("branch", { ascending: true })
      .order("position", { ascending: true }),
    scribeDb
      .from("practice_tree_progress")
      .select("node_id, exercise_id, status, started_at, evolved_at")
      .eq("space_id", space),
  ]);
  if (nodes.error || progress.error) {
    return NextResponse.json({ error: nodes.error?.message ?? progress.error?.message }, { status: 500 });
  }
  return NextResponse.json({ nodes: nodes.data, progress: progress.data });
}

// POST { node_id } — start a node (spawns an exercise, records progress).
// POST { action: "add", branch, name, gate_type, gate_value? } — personal graft
// appended to the end of a branch.
export async function POST(req: NextRequest) {
  const space = await spaceForToken(req.nextUrl.searchParams.get("token"));
  if (!space) return unauthorized();
  const body = await req.json();

  if (body.action === "add") {
    const { branch, name, gate_type } = body;
    if (typeof branch !== "string" || !name?.trim() || !["bpm", "time", "self"].includes(gate_type)) {
      return NextResponse.json({ error: "missing branch, name, or gate" }, { status: 400 });
    }
    const gateValue = typeof body.gate_value === "number" && body.gate_value > 0 ? Math.round(body.gate_value) : null;
    const { data: last } = await scribeDb
      .from("practice_tree_nodes")
      .select("position")
      .eq("branch", branch)
      .or(`space_id.is.null,space_id.eq.${space}`)
      .order("position", { ascending: false })
      .limit(1);
    const { data, error } = await scribeDb
      .from("practice_tree_nodes")
      .insert({
        branch,
        name: name.trim(),
        gate_type,
        gate_value: gate_type === "self" ? null : gateValue,
        position: (last?.[0]?.position ?? 0) + 1,
        space_id: space,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ node: data });
  }

  const { node_id } = body;
  if (!node_id) return NextResponse.json({ error: "missing node_id" }, { status: 400 });
  const { data: node, error: nodeErr } = await scribeDb
    .from("practice_tree_nodes")
    .select("*")
    .eq("id", node_id)
    .or(`space_id.is.null,space_id.eq.${space}`)
    .single();
  if (nodeErr || !node) return NextResponse.json({ error: "node not found" }, { status: 404 });

  const { data: exercise, error: exErr } = await scribeDb
    .from("practice_exercises")
    .insert({
      name: node.name,
      description: node.description,
      ref_url: node.ref_url ?? null,
      target_bpm: node.gate_type === "bpm" ? node.gate_value : null,
      position: Date.now() / 1000,
      space_id: space,
    })
    .select()
    .single();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  const { data: progress, error: prErr } = await scribeDb
    .from("practice_tree_progress")
    .insert({ space_id: space, node_id, exercise_id: exercise.id, status: "active" })
    .select()
    .single();
  if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 });
  return NextResponse.json({ progress, exercise });
}

// DELETE { node_id } — un-start a node: progress row goes away and the linked
// exercise is archived (not deleted) so any logged sessions survive.
export async function DELETE(req: NextRequest) {
  const space = await spaceForToken(req.nextUrl.searchParams.get("token"));
  if (!space) return unauthorized();
  const { node_id } = await req.json();
  if (!node_id) return NextResponse.json({ error: "missing node_id" }, { status: 400 });
  const { data: prog, error } = await scribeDb
    .from("practice_tree_progress")
    .delete()
    .eq("space_id", space)
    .eq("node_id", node_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (prog?.exercise_id) {
    await scribeDb
      .from("practice_exercises")
      .update({ archived: true })
      .eq("id", prog.exercise_id)
      .eq("space_id", space);
  }
  return NextResponse.json({ ok: true });
}

// PATCH { node_id, status: "evolved" | "active" } — evolve (or undo).
export async function PATCH(req: NextRequest) {
  const space = await spaceForToken(req.nextUrl.searchParams.get("token"));
  if (!space) return unauthorized();
  const { node_id, status } = await req.json();
  if (!node_id || !["evolved", "active"].includes(status)) {
    return NextResponse.json({ error: "missing node_id or status" }, { status: 400 });
  }
  const { data, error } = await scribeDb
    .from("practice_tree_progress")
    .update({ status, evolved_at: status === "evolved" ? new Date().toISOString() : null })
    .eq("space_id", space)
    .eq("node_id", node_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}

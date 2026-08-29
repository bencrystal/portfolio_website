import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";

export const runtime = "nodejs";

// DELETE /api/inkdrop/<id>?token=
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: item, error } = await scribeDb
    .from("inkdrop_items")
    .select("filename")
    .eq("id", params.id)
    .single();
  if (error || !item) return NextResponse.json({ error: "not found" }, { status: 404 });

  await scribeDb.storage.from("inkdrop").remove([item.filename]);
  const { error: delErr } = await scribeDb.from("inkdrop_items").delete().eq("id", params.id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/inkdrop/file/<id>?token= — proxies the EPUB from Supabase Storage
// so the e-reader gets a plain 200 with Content-Length (no signed-URL hops).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: item, error } = await scribeDb
    .from("inkdrop_items")
    .select("filename")
    .eq("id", params.id)
    .single();
  if (error || !item) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: blob, error: dlErr } = await scribeDb.storage.from("inkdrop").download(item.filename);
  if (dlErr || !blob) return NextResponse.json({ error: "download failed" }, { status: 502 });

  return new Response(blob, {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Length": String(blob.size),
      "Content-Disposition": `attachment; filename="${item.filename}"`,
    },
  });
}
